import express from "express";
const router = express.Router();

export default function (db) {
  // ✅ 0. POST — Create a new payment record
  router.post("/", async (req, res) => {
    try {
      const { orderId, status, totalAmount, paymentMethod, customerEmail, productName, buyerName, sellerName, price } = req.body;

      if (!orderId) {
        return res.status(400).json({ error: "Order ID is required" });
      }

      const paymentData = {
        orderId: orderId,
        status: status || "Pending",
        totalAmount: totalAmount || 0,
        paymentMethod: paymentMethod || "cod",
        customerEmail: customerEmail || "unknown@example.com",
        productName: productName || "Product",
        buyerName: buyerName || "Customer",
        sellerName: sellerName || "Seller",
        price: price || totalAmount || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log("💰 Creating payment record:", paymentData);

      const result = await db.collection("Payments").insertOne(paymentData);
      
      console.log("✅ Payment record created:", result.insertedId);

      res.status(201).json({
        message: "✅ Payment record created successfully",
        paymentId: result.insertedId,
        payment: paymentData
      });
    } catch (err) {
      console.error("❌ Error creating payment record:", err);
      res.status(500).json({ error: "Internal server error", message: err.message });
    }
  });

  // ✅ 1. GET — Fetch all payments with order details
  router.get("/", async (req, res) => {
    try {
      // Map orders to payment format with user and product details
      const orders = await db.collection("Orders").find().toArray();
      const users = await db.collection("User").find().toArray();
      const products = await db.collection("Products").find().toArray();
      const payments = await db.collection("Payments").find().toArray();

      const paymentData = orders.map(order => {
        const orderIdStr = order._id?.toString();
        const buyer = users.find(u => u._id?.toString() === order.userId?.toString());
        const product = products.find(p => p._id?.toString() === order.productId?.toString());
        const seller = users.find(u => u._id?.toString() === product?.userId?.toString());
        
        // Find existing payment record for this order
        const existingPayment = payments.find(p => p.orderId === orderIdStr);

        return {
          orderId: orderIdStr,
          sellerName: seller?.name || product?.userName || "Unknown Seller",
          buyerName: buyer?.name || "Unknown Buyer",
          productName: product?.name || "Unknown Product",
          totalAmount: parseFloat(order.totalAmount) || 0,
          // Use payment status if exists, otherwise default to Pending
          status: existingPayment?.status || "Pending",
          createdAt: order.createdAt || new Date().toISOString()
        };
      });

      console.log("Payment data prepared:", paymentData.length);
      res.json(paymentData);
    } catch (err) {
      console.error("❌ Error fetching payments:", err);
      res.status(500).json({ 
        error: "Internal server error",
        message: err.message,
        stack: err.stack
      });
    }
  });



  

  // ✅ 2. PATCH — Update payment status (not order status)
  router.patch("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      // Check if payment record exists
      const existingPayment = await db.collection("Payments").findOne({ 
        orderId: id 
      });

      if (existingPayment) {
        // Update existing payment record
        await db.collection("Payments").updateOne(
          { orderId: id },
          { $set: { status: status, updatedAt: new Date().toISOString() } }
        );
      } else {
        // Create new payment record
        await db.collection("Payments").insertOne({
          orderId: id,
          status: status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      res.json({ 
        message: "✅ Payment status updated successfully",
        status: status
      });
    } catch (err) {
      console.error("❌ Error updating payment status:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ✅ 3. DELETE — Delete a payment record (not the order)
  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Only delete from Payments collection, not Orders
      const result = await db.collection("Payments").deleteOne({ 
        orderId: id 
      });

      // Even if no payment record exists, return success
      // since we just want to remove the payment tracking
      res.status(200).json({ 
        message: "✅ Payment record deleted successfully",
        deletedCount: result.deletedCount 
      });
    } catch (err) {
      console.error("❌ Error deleting payment:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });



  // In product.js - Add this new route for accepting bids
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

    // Update product's activeBids to mark this bid as accepted
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
      bidId: bidId
    };

    // Update product with accepted bid status and store accepted offer
    await products.updateOne(
      { _id: id },
      {
        $set: {
          activeBids: updatedActiveBids,
          acceptedOffer: acceptedOffer, // Store the accepted offer
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
      message: `Your offer of $${acceptedAmount} for "${product.name}" has been accepted! You can now purchase it at this price.`,
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

  return router;
}