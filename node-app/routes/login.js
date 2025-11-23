import express from "express";
import bcrypt from "bcrypt";

const router = express.Router();

export default function (db) {
  router.post("/", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate
      if (!email || !password) {
        return res
          .status(400)
          .json({ success: false, message: "All fields are required" });
      }

      // Find user by email
      const user = await db.collection("User").findOne({ email });
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      // Check if user is suspended
      if (user.status === "Suspended") {
        console.log("🚫 Suspended user attempted login:", user.email);
        return res.status(403).json({
          success: false,
          message: "Account suspended",
          user: {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role || "buyer",
            status: user.status,
            location: user.location || "",
            profileImage: user.profileImage || "",
            rating: user.rating || null,
            joinedAt: user.createdAt || user.joinedAt || "",
            suspendedAt: user.suspendedAt || null,
            suspensionReason: user.suspensionReason || "Unusual activities detected"
          }
        });
      }

      // Verify password (use passwordHash field)
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      // Success — send string _id and user data
      console.log("✅ Login success:", user.email);

      res.json({
        success: true,
        message: "Login successful!",
        user: {
          _id: user._id.toString(), // ensure _id is string
          name: user.name,
          email: user.email,
          role: user.role || "buyer",
          location: user.location || "",
          profileImage: user.profileImage || "",
          rating: user.rating || null,
          joinedAt: user.createdAt || user.joinedAt || "",
          status: user.status || "Active" // Include status for consistency
        },
      });
    } catch (error) {
      console.error("❌ Login failed:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  return router;
}