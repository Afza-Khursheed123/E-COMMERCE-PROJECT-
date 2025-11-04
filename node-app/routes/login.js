import express from "express";
import bcrypt from "bcrypt";

const router = express.Router();

export default function (db) {
  router.post("/", async (req, res) => {
    try {
      const { email, password } = req.body;

      //     Validate
      if (!email || !password) {
        return res
          .status(400)
          .json({ success: false, message: "All fields are required" });
      }

      //     Find user by email
      const user = await db.collection("User").findOne({ email });
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      //     Verify password (use passwordHash field)
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      //     Success — send string _id and user data
      console.log("    Login success:", user.email);

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
        },
      });
    } catch (error) {
      console.error(" Login failed:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  return router;
}
