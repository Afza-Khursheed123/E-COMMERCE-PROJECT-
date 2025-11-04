import express from "express";
import { v4 as uuidv4 } from "uuid";
const router = express.Router();

export default function (db) {
  // GET all complaints with order info
  router.get("/", async (req, res) => {
    try {
      const complains = await db
        .collection("Complains")
        .aggregate([
          {
            $lookup: {
              from: "Orders",
              localField: "orderId", // string
              foreignField: "_id",   // Orders _id still ObjectId
              as: "orderInfo",
            },
          },
          { $unwind: { path: "$orderInfo", preserveNullAndEmptyArrays: true } },
        ])
        .toArray();

      res.json({ success: true, complains });
    } catch (error) {
      console.error("Error fetching complains:", error);
      res.status(500).json({ success: false, message: "Failed to fetch complains" });
    }
  });

  // POST a new complaint
  router.post("/", async (req, res) => {
    try {
      // Generate string _id for complains
      const newComplain = {
        _id: uuidv4(), // now _id is string
        ...req.body,
        orderId: req.body.orderId, // string matching Orders _id string
        date: new Date().toISOString().split("T")[0],
      };

      await db.collection("Complains").insertOne(newComplain);
      res.status(201).json({ success: true, message: "Complain added successfully" });
    } catch (error) {
      console.error("Error adding complain:", error);
      res.status(500).json({ success: false, message: "Failed to add complain" });
    }
  });

  // PATCH to update complaint
  router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
      const result = await db.collection("Complains").updateOne(
        { _id: id }, // string now
        { $set: updates }
      );

      if (result.modifiedCount === 1) {
        res.json({ success: true, message: "Complaint updated successfully" });
      } else {
        res.status(404).json({ success: false, message: "Complaint not found" });
      }
    } catch (error) {
      console.error("Error updating complaint:", error);
      res.status(500).json({ success: false, message: "Failed to update complaint" });
    }
  });

  return router;
}