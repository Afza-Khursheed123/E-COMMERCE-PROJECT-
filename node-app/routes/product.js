import express from "express";

export default function productRoute(db) {
  const router = express.Router();
  const products = db.collection("Products");
  const bids = db.collection("Bids");
  const notifications = db.collection("Notification");

  // Get all products
  router.get("/", async (req, res) => {
    try {
      const allProducts = await products.find({}).toArray();
      res.json(allProducts);
    } catch (err) {
      console.error("Products route error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get a product by string ID - UPDATED to show all bids to owner
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.query;

      console.log("🔍 Fetching product with ID:", id, "for user:", userId);

      if (!id || typeof id !== "string") {
        return res.status(400).json({ message: "Invalid product ID format" });
      }

      const product = await products.findOne({ _id: id });
      if (!product) {
        console.warn("⚠️ Product not found for ID:", id);
        return res.status(404).json({ message: "Product not found" });
      }

      let filteredProduct = { ...product };
      
      if (userId) {
        // ✅ FIX: If user is the owner, show ALL bids. Otherwise, show only user's bids
        if (userId === product.userId) {
          // Owner sees all bids
          filteredProduct.activeBids = product.activeBids || [];
        } else {
          // Regular user sees only their own bids
          if (filteredProduct.activeBids && filteredProduct.activeBids.length > 0) {
            filteredProduct.activeBids = filteredProduct.activeBids.filter(
              bid => bid.bidderId === userId.toString()
            );
          } else {
            filteredProduct.activeBids = [];
          }
        }
      } else {
        filteredProduct.activeBids = [];
      }

      res.json(filteredProduct);
    } catch (err) {
      console.error("Product fetch error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  // ✅ FIXED: Place/Update offer - UPDATED to sync bid status
  router.post("/:id/placeBid", async (req, res) => {
    console.log("🚀 POST /:id/placeBid triggered:", req.params.id);

    try {
      const { id } = req.params;
      const { amount, bidderId, bidderName } = req.body;

      if (!id || typeof id !== "string") {
        return res.status(400).json({ message: "Invalid product ID format" });
      }

      if (!amount || !bidderId || !bidderName) {
        return res
          .status(400)
          .json({ message: "Missing required fields: amount, bidderId, bidderName" });
      }

      // Find the product
      const product = await products.findOne({ _id: id });
      if (!product) return res.status(404).json({ message: "Product not found" });
      if (product.isAvailable === false)
        return res.status(400).json({ message: "Product not available for offers" });

      const existingBids = product.activeBids || [];
      const existingUserBid = existingBids.find(bid => bid.bidderId === String(bidderId));
      
      const isUpdate = !!existingUserBid;
      const previousAmount = existingUserBid ? existingUserBid.amount : null;

      // ✅ FIX: Use consistent bidId for the same user+product combination
      const bidId = existingUserBid?.bidId || `${id}-${bidderId}`;

      // ✅ FIX: Preserve existing bid status if updating
      const currentBidStatus = existingUserBid?.bidStatus || "pending";

      const bidData = {
        _id: bidId,
        productId: id,
        productName: product.name,
        productOwnerId: product.userId,
        bidderId: String(bidderId),
        bidderName,
        bidAmount: parseFloat(amount),
        bidStatus: currentBidStatus, // ✅ Preserve status when updating amount
        placedAt: existingUserBid?.placedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isUpdate: isUpdate,
        previousAmount: previousAmount
      };

      // ✅ Upsert bid in Bids collection
      await bids.updateOne(
        { _id: bidId },
        { $set: bidData },
        { upsert: true }
      );

      console.log(`💾 ${isUpdate ? 'Updated' : 'Created'} bid in Bids collection:`, bidData);

      // Update product with the offer
      const activeBidEntry = {
        bidId: bidId,
        bidderId: String(bidderId),
        bidderName,
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        bidStatus: currentBidStatus, // ✅ Preserve status
        isUpdate: isUpdate,
        previousAmount: previousAmount,
        placedAt: existingUserBid?.placedAt || new Date().toISOString()
      };

      // ✅ Remove any existing bid from this user and add new one
      const otherBids = existingBids.filter(bid => bid.bidderId !== String(bidderId));
      const updatedBids = [...otherBids, activeBidEntry];

      // ✅ Create appropriate notification message
      let notificationMsg;
      let notificationTitle;
      
      if (isUpdate && previousAmount) {
        notificationMsg = `💰 ${bidderName} updated their offer from $${previousAmount} to $${amount} on "${product.name}"`;
        notificationTitle = "Offer Updated";
      } else {
        notificationMsg = `💰 New offer of $${amount} placed by ${bidderName} on "${product.name}"`;
        notificationTitle = "New Offer Received";
      }

      // Update product document
      await products.updateOne(
        { _id: id },
        {
          $set: {
            activeBids: updatedBids,
          },
        }
      );

      console.log(`🧩 Product updated with ${isUpdate ? 'updated' : 'new'} offer.`);

      // ✅ FIXED: Update existing notification instead of creating new one
      const existingNotification = await notifications.findOne({
        relatedBidId: bidId,
        userId: product.userId,
        type: "bid"
      });

      if (existingNotification) {
        // Update existing notification
        await notifications.updateOne(
          { 
            _id: existingNotification._id 
          },
          { 
            $set: { 
              title: notificationTitle,
              message: notificationMsg,
              updatedAt: new Date().toISOString(),
              isRead: false // Mark as unread since it's updated
            } 
          }
        );
        console.log("🔔 Updated existing notification for product owner");
      } else {
        // Create new notification for the product owner
        const sellerNotification = {
          userId: product.userId,
          type: "bid",
          title: notificationTitle,
          message: notificationMsg,
          relatedProductId: id,
          relatedBidId: bidId,
          productName: product.name,
          bidderName: bidderName,
          bidAmount: parseFloat(amount),
          status: "PENDING",
          isRead: false,
          createdAt: new Date().toISOString(),
        };

        await notifications.insertOne(sellerNotification);
        console.log("🔔 New seller notification created for user:", product.userId);
      }

      // Return the updated product (with filtered bids)
      const updatedProduct = await products.findOne({ _id: id });
      
      // ✅ FIX: Filter bids based on user role
      let filteredBids;
      if (bidderId === updatedProduct.userId) {
        // Owner sees all bids
        filteredBids = updatedProduct.activeBids || [];
      } else {
        // Regular user sees only their own bids
        filteredBids = (updatedProduct.activeBids || []).filter(
          bid => bid.bidderId === String(bidderId)
        );
      }

      const filteredProduct = {
        ...updatedProduct,
        activeBids: filteredBids
      };

      res.status(200).json({
        message: isUpdate ? "✅ Offer updated successfully!" : "✅ Offer placed successfully!",
        product: filteredProduct,
        bid: bidData,
        isUpdate: isUpdate
      });
    } catch (err) {
      console.error("Error placing/updating offer:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  });

  return router;
}