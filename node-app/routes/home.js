import express from "express";

export default function homeRoute(db) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const products = db.collection("Products");
      const categories = db.collection("Categories");

      const featured = await products.find({}).limit(4).toArray();
      const recentlyAdded = await products.find({})
        .sort({ createdAt: -1 }) // safer than 'posted'
        .limit(4)
        .toArray();
      const categoryList = await categories.find({}).toArray();

      res.json({
        categories: categoryList,
        featured,
        recentlyAdded
      });
    } catch (err) {
      console.error("❌ Home route error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  return router;
}
