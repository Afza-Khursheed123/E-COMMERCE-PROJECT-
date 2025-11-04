import express from "express";

export default function categoryRoute(db) {
  const router = express.Router();
  const categories = db.collection("Categories");
  const products = db.collection("Products");

  // all categories
  router.get("/", async (req, res) => {
    try {
      const allCategories = await categories.find({}).toArray();
      res.json(allCategories);
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get specific category by name
  router.get("/:categoryName", async (req, res) => {
    try {
      const { categoryName } = req.params;

      const category = await categories.findOne({ name: categoryName });
      if (!category) {
        return res.status(404).json({ message: "Category not found." });
      }

      const categoryProducts = await products
        .find({ categoryId: category._id })
        .toArray();

      res.json({
        category: category.name,
        description: category.description,
        image: category.image,
        results: categoryProducts,
      });
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
