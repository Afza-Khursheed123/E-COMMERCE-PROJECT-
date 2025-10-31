// routes/signup.js
import express from "express";
import bcrypt from "bcrypt";

const router = express.Router();

export default function (db) {
  router.post("/", async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      // ✅ Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
      }

      // ✅ Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }

      // ✅ Password validation
      if (password.length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
      }

      // ✅ Check for existing user
      const existingUser = await db.collection("User").findOne({ email });
      if (existingUser) {
        return res.status(409).json({ success: false, message: "Email already exists" });
      }

      // ✅ Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ Validate and set role
      const allowedRoles = ["admin", "seller", "buyer", "user"];
      const userRole = allowedRoles.includes(role) ? role : "user";

      const result = await db.collection("User").insertOne({
        name,
        email,
        password: hashedPassword,
        role: userRole,
        createdAt: new Date(),
      });

      console.log("🆕 New user created:", result.insertedId, userRole);

      res.json({
        success: true,
        message: "Signup successful!",
        role: userRole,
      });
    } catch (error) {
      console.error("❌ Signup failed:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  return router;
}
