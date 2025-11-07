import express from "express";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

export default function (db) {
  // ✅ GET all users
  router.get("/", async (req, res) => {
    try {
      const users = await db.collection("User").find().toArray();
      res.json({ success: true, users });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
  });


  // ✅ POST a new user
  router.post("/", async (req, res) => {
    try {
      const { name, email, phone, role, status, location, rating, profileImage } = req.body;

      // ✅ Only check for required fields
      if (!name || !email || !phone || !role || !status) {
        return res.status(400).json({
          success: false,
          message: "Name, email, phone, role, and status are required",
        });
      }

      const newUser = {
        _id: uuidv4(), // unique string ID
        name,
        email,
        phone,
        role,
        status,
        location: location || "",
        rating: rating || 0,
        profileImage: profileImage || "",
        joinedAt: new Date().toISOString(), // stored as joinedAt
        wishlist: [],
      };

      await db.collection("User").insertOne(newUser);

      res.status(201).json({
        success: true,
        message: "User added successfully",
        user: newUser,
      });
    } catch (error) {
      console.error("❌ Error adding user:", error);
      res.status(500).json({ success: false, message: "Failed to add user" });
    }
  });


  // ✅ PATCH to toggle user status
  router.patch("/status/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const user = await db.collection("User").findOne({ _id: id });
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      const updatedStatus = user.status === "Active" ? "Suspended" : "Active";

      await db.collection("User").updateOne({ _id: id }, { $set: { status: updatedStatus } });
      res.json({ success: true, message: "User status updated", status: updatedStatus });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ success: false, message: "Failed to update status" });
    }
  });

  // ✅ DELETE a user
  router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.collection("User").deleteOne({ _id: id });
      if (result.deletedCount === 1) {
        res.json({ success: true, message: "User deleted successfully" });
      } else {
        res.status(404).json({ success: false, message: "User not found" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ success: false, message: "Failed to delete user" });
    }
  });

  return router;
}
