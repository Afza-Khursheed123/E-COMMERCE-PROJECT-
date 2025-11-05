import express from "express";
import { ObjectId } from "mongodb";
const router = express.Router();

export default function (db) {
  // ✅ 1. GET — Fetch all payments from Payments collection
  router.get("/", async (req, res) => {
    try {
      // Fetch directly from Payments collection
      const result = await db.collection("Payments").find({}).toArray();

      // Format the response
      const formattedResult = result.map(payment => ({
        orderId: payment.orderId || payment._id.toString(),
        sellerName: payment.sellerName || "",
        buyerName: payment.buyerName || "",
        totalAmount: parseFloat(payment.totalAmount) || 0,
        status: payment.status || "Pending",
        createdAt: payment.createdAt || new Date().toISOString()
      }));

      res.json(formattedResult);
    } catch (err) {
      console.error("❌ Error fetching payments:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ✅ 2. POST — Add a new payment manually
  router.post("/sync", async (req, res) => {
    try {
      const { orderId, sellerName, buyerName, totalAmount, status, createdAt } = req.body;

      // Validate required fields
      if (!orderId || !sellerName || !buyerName || !totalAmount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newPayment = {
        orderId,
        sellerName,
        buyerName,
        totalAmount: parseFloat(totalAmount),
        status: status || "Pending",
        createdAt: createdAt || new Date().toISOString()
      };

      const result = await db.collection("Payments").insertOne(newPayment);

      // Return the inserted document with _id
      const insertedPayment = {
        _id: result.insertedId,
        ...newPayment
      };

      res.status(201).json(insertedPayment);
    } catch (err) {
      console.error("❌ Error adding payment:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ✅ 3. POST — Sync all orders into Payments collection (bulk sync)
  router.post("/sync-all", async (req, res) => {
    try {
      await db.collection("Payments").deleteMany({}); // optional reset

      await db.collection("Orders").aggregate([
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
            price: "$productInfo.price",
            sellerName: "$productInfo.userName",
            buyerName: "$buyerInfo.name",
            totalAmount: "$totalAmount",
            status: 1,
            createdAt: 1
          }
        },
        {
          $merge: {
            into: "Payments",
            whenMatched: "replace",
            whenNotMatched: "insert"
          }
        }
      ]).toArray();

      res.json({ message: "✅ Payments synced successfully!" });
    } catch (err) {
      console.error("❌ Error syncing payments:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ✅ 4. PATCH — Update a single payment record
  router.patch("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updated = await db
        .collection("Payments")
        .updateOne({ orderId: id }, { $set: updateData });

      if (updated.matchedCount === 0) {
        return res.status(404).json({ message: "❌ Payment not found" });
      }

      res.json({ message: "✅ Payment updated successfully" });
    } catch (err) {
      console.error("❌ Error updating payment:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ✅ 5. DELETE — Remove a payment record
  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Try to delete by orderId first (string)
      let deleted = await db
        .collection("Payments")
        .deleteOne({ orderId: id });

      // If not found, try with ObjectId (in case orderId is stored as ObjectId)
      if (deleted.deletedCount === 0 && ObjectId.isValid(id)) {
        deleted = await db
          .collection("Payments")
          .deleteOne({ orderId: new ObjectId(id) });
      }

      // Also try deleting by _id field
      if (deleted.deletedCount === 0 && ObjectId.isValid(id)) {
        deleted = await db
          .collection("Payments")
          .deleteOne({ _id: new ObjectId(id) });
      }

      if (deleted.deletedCount === 0) {
        return res.status(404).json({ message: "❌ Payment not found" });
      }

      res.status(200).json({ message: "✅ Payment deleted successfully" });
    } catch (err) {
      console.error("❌ Error deleting payment:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}