import express from "express";
import bcrypt from "bcrypt";

const router = express.Router();

export default function (db) {
  router.post("/", async (req, res) => {
    const { email, password } = req.body;
    console.log("✅ Received:", email, password);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    // ✅ find user only by email (not password)
    const user = await db.collection("User").findOne({ email });
    console.log("🔎 User found in DB:", user);

    if (!user) {
      console.log("❌ No user found for:", email);
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // ✅ Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🧩 Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // ✅ Success response
    res.json({
      success: true,
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  });

  return router;
}
