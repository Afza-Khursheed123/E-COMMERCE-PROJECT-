// routes/signup.js
import express from "express";
import bcrypt from "bcrypt";

const router = express.Router();

export default function (db) {
  router.post("/", async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
      }

      const existingUser = await db.collection("User").findOne({ email });
      if (existingUser) {
        return res.status(409).json({ success: false, message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await db.collection("User").insertOne({
        name,
        email,
        password: hashedPassword,
        role: "user",
        createdAt: new Date(),
      });

      console.log("🆕 New user created:", result.insertedId);
      res.json({ success: true, message: "Signup successful!" });
    } catch (error) {
      console.error("❌ Signup failed:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  return router;
}
