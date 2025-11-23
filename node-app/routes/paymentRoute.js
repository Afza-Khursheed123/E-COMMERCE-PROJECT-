import express from "express";
const router = express.Router();

export default function (db) {
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

  return router;
}