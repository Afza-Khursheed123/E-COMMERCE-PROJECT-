import express from "express";

export default function productRoute(db) {
  const router = express.Router();
  const products = db.collection("Products");
  const bids = db.collection("Bids");
  const notifications = db.collection("Notification");

  //     Get all products
  router.get("/", async (req, res) => {
    try {
      const allProducts = await products.find({}).toArray();
      res.json(allProducts);
    } catch (err) {
      console.error("    Products route error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  //     Get a product by string ID
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("🔍 Fetching product with ID:", id);

      if (!id || typeof id !== "string") {
        return res.status(400).json({ message: "Invalid product ID format" });
      }

      const product = await products.findOne({ _id: id });
      if (!product) {
        console.warn("⚠️ Product not found for ID:", id);
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (err) {
      console.error("    Product fetch error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  //     Place a bid (updates Products + inserts into Bids + creates Notification)
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

      //     Find the product
      const product = await products.findOne({ _id: id });
      if (!product) return res.status(404).json({ message: "Product not found" });
      if (product.isAvailable === false)
        return res.status(400).json({ message: "Product not available for bidding" });

      //     Create a unique bid record
      const bidId = `${Date.now()}-${bidderId}`;
      const newBid = {
        _id: bidId,
        productId: id,
        productName: product.name,
        productOwnerId: product.userId,
        bidderId: String(bidderId),
        bidderName,
        bidAmount: parseFloat(amount),
        bidStatus: "active",
        placedAt: new Date().toISOString(),
      };

      //     Insert bid into the Bids collection
      await bids.insertOne(newBid);
      console.log("💾 Bid inserted into Bids collection:", newBid);

      //     Update product with new bid
      const activeBidEntry = {
        bidderId: String(bidderId),
        bidderName,
        amount: parseFloat(amount),
        date: new Date().toISOString(),
      };

      const updatedBids = product.activeBids
        ? [...product.activeBids, activeBidEntry]
        : [activeBidEntry];

      const notificationMsg = `💰 New bid of $${amount} placed by ${bidderName} on "${product.name}"`;

      const productNotification = {
        message: notificationMsg,
        date: new Date().toISOString(),
      };

      const updatedNotifications = product.notifications
        ? [...product.notifications, productNotification]
        : [productNotification];

      //     Update product document
      await products.updateOne(
        { _id: id },
        {
          $set: {
            activeBids: updatedBids,
            notifications: updatedNotifications,
          },
        }
      );

      console.log("🧩 Product updated with new bid and notification.");

      //     Add a notification for the seller
      const sellerNotification = {
        userId: product.userId, // product owner
        type: "bid",
        title: "New Bid Received",
        message: notificationMsg,
        relatedProductId: id,
        relatedBidId: bidId,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      await notifications.insertOne(sellerNotification);
      console.log("🔔 Seller notification created for user:", product.userId);

      //     Return the updated product
      const updatedProduct = await products.findOne({ _id: id });
      res.status(200).json({
        message: "    Bid placed successfully!",
        product: updatedProduct,
        bid: newBid,
      });
    } catch (err) {
      console.error("    Error placing bid:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  });

  return router;
}
