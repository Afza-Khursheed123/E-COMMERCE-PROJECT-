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

  // Get a product by string ID - UPDATED to include accepted offers
// In product.js - Update the get product route to show all bids to product owners
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
    
    // ✅ ENHANCED: Handle bids filtering - Product owners see ALL bids
    if (userId) {
      // Check if current user is the product owner
      const isProductOwner = userId === product.userId;
      
      if (isProductOwner) {
        // ✅ OWNER: Show ALL bids on their product
        filteredProduct.activeBids = product.activeBids || [];
        console.log(`👑 Product owner ${userId} sees ALL ${filteredProduct.activeBids.length} bids`);
      } else {
        // ✅ REGULAR USER: Show only their own bids
        if (filteredProduct.activeBids && filteredProduct.activeBids.length > 0) {
          filteredProduct.activeBids = filteredProduct.activeBids.filter(
            bid => bid.bidderId === userId.toString()
          );
          console.log(`👤 Regular user ${userId} sees only their ${filteredProduct.activeBids.length} bids`);
        } else {
          filteredProduct.activeBids = [];
        }
      }

      // Check if user has an accepted offer for this product
      if (product.acceptedOffer && product.acceptedOffer.bidderId === userId.toString()) {
        filteredProduct.userAcceptedOffer = product.acceptedOffer;
        console.log(`✅ User ${userId} has accepted offer: $${product.acceptedOffer.acceptedAmount}`);
      }

      // Handle user-specific data (likes, ratings)
      filteredProduct.userRating = product.ratings?.find(r => r.userId === userId)?.rating || null;
      filteredProduct.liked = product.likes?.includes(userId) || false;
      
      // ✅ ADD: Check if user is product owner
      filteredProduct.isOwner = isProductOwner;
    } else {
      filteredProduct.activeBids = [];
      filteredProduct.userRating = null;
      filteredProduct.liked = false;
      filteredProduct.isOwner = false;
    }

    // Calculate average rating
    if (product.ratings && product.ratings.length > 0) {
      const total = product.ratings.reduce((sum, r) => sum + r.rating, 0);
      filteredProduct.averageRating = total / product.ratings.length;
    } else {
      filteredProduct.averageRating = 0;
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
        bidStatus: currentBidStatus,
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
        bidStatus: currentBidStatus,
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
              isRead: false
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

  // ✅ NEW: Accept Bid and Store Accepted Offer
  router.post("/:id/acceptBid", async (req, res) => {
    console.log("🎯 POST /:id/acceptBid triggered:", req.params.id);

    try {
      const { id } = req.params;
      const { bidId, bidderId, acceptedAmount } = req.body;

      if (!id || typeof id !== "string") {
        return res.status(400).json({ message: "Invalid product ID format" });
      }

      if (!bidId || !bidderId || !acceptedAmount) {
        return res.status(400).json({ 
          message: "Missing required fields: bidId, bidderId, acceptedAmount" 
        });
      }

      // Find the product
      const product = await products.findOne({ _id: id });
      if (!product) return res.status(404).json({ message: "Product not found" });

      // Update the bid status to accepted
      await bids.updateOne(
        { _id: bidId },
        { 
          $set: { 
            bidStatus: "accepted",
            updatedAt: new Date().toISOString()
          } 
        }
      );

      // Update product's activeBids to mark this bid as accepted and reject others
      const updatedActiveBids = (product.activeBids || []).map(bid => {
        if (bid.bidId === bidId) {
          return { ...bid, bidStatus: "accepted" };
        }
        // Reject all other bids for this product
        if (bid.bidId !== bidId && bid.bidStatus === "pending") {
          return { ...bid, bidStatus: "rejected" };
        }
        return bid;
      });

      // Store accepted offer information for this specific user
      const acceptedOffer = {
        bidderId: String(bidderId),
        acceptedAmount: parseFloat(acceptedAmount),
        acceptedAt: new Date().toISOString(),
        bidId: bidId,
        originalPrice: product.price
      };

      // Update product with accepted bid status and store accepted offer
      await products.updateOne(
        { _id: id },
        {
          $set: {
            activeBids: updatedActiveBids,
            acceptedOffer: acceptedOffer, // Store the accepted offer for specific user
            isAvailable: false, // Mark as sold
            soldTo: bidderId,
            soldPrice: parseFloat(acceptedAmount),
            soldAt: new Date().toISOString()
          }
        }
      );

      // Create notification for the bidder
      const bidderNotification = {
        userId: bidderId,
        type: "bid_accepted",
        title: "🎉 Offer Accepted!",
        message: `Your offer of $${acceptedAmount} for "${product.name}" has been accepted! You can now purchase it at this special price.`,
        relatedProductId: id,
        relatedBidId: bidId,
        productName: product.name,
        bidAmount: parseFloat(acceptedAmount),
        status: "ACCEPTED",
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      await notifications.insertOne(bidderNotification);

      console.log(`✅ Bid ${bidId} accepted for user ${bidderId} at $${acceptedAmount}`);

      res.status(200).json({
        message: "✅ Offer accepted successfully!",
        acceptedOffer: acceptedOffer
      });
    } catch (err) {
      console.error("Error accepting bid:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  });

  // LIKE PRODUCT
  router.patch("/:id/like", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const product = await products.findOne({ _id: id });
      if (!product) return res.status(404).json({ message: "Product not found" });

      const alreadyLiked = product.likes?.includes(userId) || false;

      if (alreadyLiked) {
        // Remove like
        await products.updateOne(
          { _id: id },
          { $pull: { likes: userId } }
        );
      } else {
        // Add like
        await products.updateOne(
          { _id: id },
          { 
            $addToSet: { likes: userId },
            $setOnInsert: { likes: [userId] }
          },
          { upsert: true }
        );
      }

      const updatedProduct = await products.findOne({ _id: id });
      res.json({ 
        likes: updatedProduct.likes?.length || 0, 
        liked: !alreadyLiked 
      });

    } catch (err) {
      console.error("LIKE PRODUCT ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // RATE PRODUCT
  router.post("/:id/rate", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, rating } = req.body;

      const product = await products.findOne({ _id: id });
      if (!product) return res.status(404).json({ message: "Product not found" });

      const ratingValue = parseInt(rating);
      if (ratingValue < 1 || ratingValue > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      // Update or add rating
      const existingRatingIndex = product.ratings?.findIndex(r => r.userId === userId) || -1;
      
      if (existingRatingIndex >= 0) {
        // Update existing rating
        await products.updateOne(
          { _id: id, "ratings.userId": userId },
          { $set: { "ratings.$.rating": ratingValue } }
        );
      } else {
        // Add new rating
        await products.updateOne(
          { _id: id },
          { 
            $push: { 
              ratings: { 
                userId, 
                rating: ratingValue,
                createdAt: new Date().toISOString()
              } 
            } 
          }
        );
      }

      // Calculate new average rating
      const updatedProduct = await products.findOne({ _id: id });
      const ratings = updatedProduct.ratings || [];
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      res.json({
        averageRating: averageRating,
        userRating: ratingValue,
      });

    } catch (err) {
      console.error("RATE PRODUCT ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // COMMENT PRODUCT
  router.post("/:id/comment", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, text, userName } = req.body;

      const product = await products.findOne({ _id: id });
      if (!product) return res.status(404).json({ message: "Product not found" });

      const newComment = {
        _id: `${id}-${Date.now()}-${userId}`,
        userId,
        userName: userName || "Anonymous",
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };

      await products.updateOne(
        { _id: id },
        { 
          $push: { 
            comments: newComment 
          } 
        }
      );

      const updatedProduct = await products.findOne({ _id: id });
      res.json(updatedProduct.comments || []);

    } catch (err) {
      console.error("COMMENT PRODUCT ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  return router;
}