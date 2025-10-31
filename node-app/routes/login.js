// routes/login.js
import express from "express";
import bcrypt from "bcrypt";

const router = express.Router();

export default function (db) {
  router.post("/", async (req, res) => {
    try {
      const { email, password } = req.body;

      // ✅ Check required fields
      if (!email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
      }

      // ✅ Find user
      const user = await db.collection("User").findOne({ email });
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      // ✅ Compare hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      // ✅ Successful login
      console.log("✅ Login success:", user.email, "Role:", user.role);

      res.json({
        success: true,
        message: "Login successful!",
        user: {
          name: user.name,
          email: user.email,
          role: user.role || "buyer", // fallback if missing
        },
      });
    } catch (error) {
      console.error("❌ Login failed:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  return router;
}
