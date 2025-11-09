import express from "express";

export default function bidRoute(Bid, Product, User, Notification) {
  const router = express.Router();

  // 📦 Create a new bid
  router.post("/", async (req, res) => {
    try {
      const { productId, bidderId, amount } = req.body;

      if (!productId || !bidderId || !amount) {
        return res.status(400).json({ success: false, message: "Missing fields" });
      }

      // Check product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      // Create bid
      const bid = await Bid.create({
        product: productId,
        bidder: bidderId,
        seller: product.seller,
        amount,
        status: "PENDING",
        createdAt: new Date(),
      });

      // Create notification for seller
      await Notification.create({
        user: product.seller,
        type: "NEW_BID",
        message: `New bid of $${amount} placed on "${product.name}"`,
        relatedBid: bid._id,
        relatedProduct: productId,
        relatedUser: bidderId,
        status: "UNREAD",
        createdAt: new Date(),
      });

      res.json({ success: true, bid });
    } catch (err) {
      console.error("❌ Error creating bid:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 📋 Get all bids of a user (for dashboard)
  router.get("/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      // Bids made by the user
      const userBids = await Bid.find({ bidder: userId })
        .populate("product", "name images price")
        .populate("seller", "name email");

      // Bids on the user's own products
      const bidsOnMyProducts = await Bid.find({ seller: userId })
        .populate("product", "name images price")
        .populate("bidder", "name email");

      res.json({
        success: true,
        userBids,
        bidsOnMyProducts,
      });
    } catch (err) {
      console.error("❌ Error fetching user bids:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 🔄 Accept or reject a bid
  // PUT /bids/:bidId/status
router.put("/bids/:bidId/status", async (req, res) => {
  try {
    const { bidId } = req.params;
    const { status } = req.body;

    if (!["ACCEPTED", "REJECTED", "PENDING"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    // ✅ Update bid status
    const result = await db.collection("Bids").updateOne(
      { _id: new ObjectId(bidId) },
      { $set: { bidStatus: status } }
    );

    // ✅ Optionally also update related notification (if exists)
    await db.collection("Notification").updateOne(
      { relatedBidId: new ObjectId(bidId) },
      { $set: { status } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: "Bid not found" });
    }

    res.json({ success: true, message: `Bid ${status.toLowerCase()} successfully` });
  } catch (err) {
    console.error("Error updating bid status:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


  return router;
}
