import express from "express";
import { v4 as uuidv4 } from "uuid";
import { ObjectId } from "mongodb";

const router = express.Router();

export default function (db) {
  // ================================
  // GET ALL COMPLAINTS + ORDER INFO
  // ================================
  router.get("/", async (req, res) => {
    try {
      const complains = await db
        .collection("Complains")
        .aggregate([
          {
            $lookup: {
              from: "Orders",
              localField: "orderId",  // string in Complains
              foreignField: "_id",    // Orders _id must also be string
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

  // ================================
  // ADD NEW COMPLAINT
  // ================================
  router.post("/", async (req, res) => {
    try {
      const newComplain = {
        _id: uuidv4(), // string uuid
        ...req.body,
        orderId: req.body.orderId, // must be string
        date: new Date().toISOString().split("T")[0],
      };

      await db.collection("Complains").insertOne(newComplain);

      res.status(201).json({
        success: true,
        message: "Complain added successfully",
      });
    } catch (error) {
      console.error("Error adding complain:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add complain",
      });
    }
  });

  // ================================
  // UPDATE COMPLAINT
  // ================================
  router.patch("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      let query;

      // Detect if ObjectId or string UUID
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        query = { _id: new ObjectId(id) };
      } else {
        query = { _id: id };
      }

      const result = await db.collection("Complains").updateOne(query, {
        $set: updates,
      });

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Complaint not found",
        });
      }

      res.json({
        success: true,
        message: "Complaint updated successfully",
      });
    } catch (error) {
      console.error("Error updating complaint:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update complaint",
      });
    }
  });

  return router;
}
