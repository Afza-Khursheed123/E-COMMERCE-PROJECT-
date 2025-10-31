import express from "express";
import { ObjectId } from "mongodb";

export default function productRoute(db) {
  const router = express.Router();
  const products = db.collection("Products");

  // ✅ Get all products
  router.get("/", async (req, res) => {
    try {
      const allProducts = await products.find({}).toArray();
      res.json(allProducts);
    } catch (err) {
      console.error("❌ Products route error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ Get product by ID (with full error logging)
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;

      console.log("🔍 Product fetch request received for ID:", id);

      let query;
      if (!isNaN(id)) {
        query = { _id: Number(id) };
      } else if (ObjectId.isValid(id)) {
        query = { _id: new ObjectId(id) };
      } else {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      console.log("🧾 MongoDB query:", query);

      const product = await products.findOne(query);

      if (!product) {
        console.log("⚠️ Product not found for:", query);
        return res.status(404).json({ message: "Product not found" });
      }

      console.log("✅ Product found:", product.name);
      res.json(product);

    } catch (err) {
      console.error("❌ Product route error (detailed):", err);
      res.status(500).json({ message: err.message, stack: err.stack });
    }
  });

  return router;
}
