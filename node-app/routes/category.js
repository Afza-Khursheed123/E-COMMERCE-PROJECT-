import express from "express";
const fetchCategoryData = async () => {
  try {
    const res = await axios.get(`http://localhost:3000/category/${categoryName}`);
    console.log("📦 Category data received:", res.data);
    setData(res.data);
  } catch (error) {
    console.error("❌ Category fetch error:", error);
  }
};

export default function categoryRoute(db) {
  const router = express.Router();

  // GET /api/category/:categoryName
  router.get("/:categoryName", async (req, res) => {
    try {
      fetchCategoryData();
      const { categoryName } = req.params;
      const categories = db.collection("Categories");
      const products = db.collection("Products");

      // Find the category first
      const category = await categories.findOne({ name: categoryName });

      if (!category) {
        return res.status(404).json({ message: "Category not found." });
      }

      // Then get products matching its ID
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
