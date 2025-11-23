import express from "express";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

const router = express.Router();

export default function (db) {
  router.post("/", async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      //     Validate required fields
      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ success: false, message: "All fields are required" });
      }

      //     Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid email format" });
      }

      //     Password validation
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters long",
        });
      }

      //     Check for existing user
      const existingUser = await db.collection("User").findOne({ email });
      if (existingUser) {
        return res
          .status(409)
          .json({ success: false, message: "Email already exists" });
      }

      //     Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      //     Validate and set role
      const allowedRoles = [ "user"];
      const userRole = allowedRoles.includes(role) ? role : "user";

      //     Create a string-based ID (instead of ObjectId)
      const stringId = new ObjectId().toString(); // converts ObjectId to plain string

      //     Insert user with string _id
      await db.collection("User").insertOne({
        _id: stringId, // 👈 store _id as string
        name,
        email,
        passwordHash: hashedPassword,
        role: userRole,
        createdAt: new Date().toISOString(),
        wishlist: [],
      });

      console.log("🆕 New user created:", stringId, userRole);

      res.json({
        success: true,
        message: "Signup successful!",
        role: userRole,
        userId: stringId, // Return the string ID as well
      });
    } catch (error) {
      console.error("    Signup failed:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  return router;
}
