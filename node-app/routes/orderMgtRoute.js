import express from "express";
import { ObjectId } from "mongodb";
const router = express.Router();

export default function (db) {
  // ✅ 1. GET — Fetch all orders with joined data from Orders, Products, and User collections
  router.get("/", async (req, res) => {
    try {
      const result = await db.collection("Orders").aggregate([
        {
          $lookup: {
            from: "Products",
            localField: "productId",
            foreignField: "_id",
            as: "productInfo"
          }
        },
        { $unwind: "$productInfo" },
        {
          $lookup: {
            from: "User",
            localField: "userId",
            foreignField: "_id",
            as: "buyerInfo"
          }
        },
        { $unwind: "$buyerInfo" },
        {
          $project: {
            _id: 0,
            orderId: "$_id",
            productName: "$productInfo.name",
            sellerName: "$productInfo.userName",
            buyerName: "$buyerInfo.name",
            amount: "$totalAmount",
            status: 1,
            date: "$createdAt"
          }
        }
      ]).toArray();

      res.json(result);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ✅ 2. PATCH — Update order status
  router.patch("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updated = await db
        .collection("Orders")
        .updateOne({ _id: id }, { $set: updateData });

      if (updated.matchedCount === 0) {
        return res.status(404).json({ message: "❌ Order not found" });
      }

      res.json({ message: "✅ Order updated successfully" });
    } catch (err) {
      console.error("❌ Error updating order:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ✅ 3. DELETE — Remove an order
  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Try to delete by _id first (string)
      let deleted = await db
        .collection("Orders")
        .deleteOne({ _id: id });

      // If not found, try with ObjectId
      if (deleted.deletedCount === 0 && ObjectId.isValid(id)) {
        deleted = await db
          .collection("Orders")
          .deleteOne({ _id: new ObjectId(id) });
      }

      if (deleted.deletedCount === 0) {
        return res.status(404).json({ message: "❌ Order not found" });
      }

      res.status(200).json({ message: "✅ Order deleted successfully" });
    } catch (err) {
      console.error("❌ Error deleting order:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}