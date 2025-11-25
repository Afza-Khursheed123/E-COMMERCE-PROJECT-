import express from "express";
import { ObjectId } from "mongodb"; // used for flexible ID handling

export default function productListingRoute(db) {
  const router = express.Router();
  const products = db.collection("Products");

  // Helper to create a query that works with either string IDs or ObjectId stored IDs
  const createIdQuery = (id) => {
    if (!id) return null;
    // If id is a 24-hex string matching ObjectId, query by ObjectId
    if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
      return { _id: new ObjectId(id) };
    }
    // Otherwise try string match
    return { _id: id };
  };

  //     Get all products
  router.get("/", async (req, res) => {
    try {
      const allProducts = await products.find({}).toArray();
      res.json(allProducts);
    } catch (err) {
      console.error("    Products route error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  //     Get product by ID (supports string or ObjectId)
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const query = createIdQuery(id);
      if (!query) return res.status(400).json({ message: "Invalid ID format" });

      const product = await products.findOne(query);
      if (!product) return res.status(404).json({ message: "Product not found" });

      res.json(product);
    } catch (err) {
      console.error("    Product fetch error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  //     Create new product listing (linked to logged-in user)
  router.post("/", async (req, res) => {
    try {
      const data = req.body;

      //     Extract user (from middleware or body)
      const user = req.user || data.user || null;
      if (!user || !user._id) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      //     Validate fields
      if (
        !data.name ||
        !data.description ||
        !data.price ||
        !data.condition ||
        !data.categoryId
      ) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      //     Generate string-based _id
      const newId = new ObjectId().toString();

      const newProduct = {
        _id: newId,
        ...data,
        userId: String(user._id),
        userName: user.name,
        userEmail: user.email,
        userLocation: user.location || "Unknown",
        userPhone: user.phone || "",
        userRating: user.rating || 0,
        price: parseFloat(data.price),
        originalPrice: parseFloat(data.originalPrice || data.price),
        discount:
          data.discount ||
          Math.round(
            ((data.originalPrice - data.price) / data.originalPrice) * 100
          ),
        available: true,
        isAvailable: true,
        reviewsCount: 0,
        createdAt: new Date().toISOString(),
        activeBids: [],
        soldTo: null,
        notifications: [],
      };

      await products.insertOne(newProduct);

      //     Update category count (categoryId is also string)
      const categories = db.collection("Categories");
      await categories.updateOne(
        { _id: data.categoryId },
        { $inc: { itemsCount: 1 } }
      );

      res.status(201).json({
        message: "Product listed successfully!",
        _id: newProduct._id,
      });
    } catch (err) {
      console.error("    Error creating product:", err);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  //     Place a bid (string-based ID)
  router.post("/:id/placeBid", async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, bidderId, bidderName } = req.body;
      const productQuery = createIdQuery(id);
      if (!productQuery) return res.status(400).json({ message: "Invalid ID format" });

      const product = await products.findOne(productQuery);
      if (!product)
        return res.status(404).json({ message: "Product not found" });

      const newBid = {
        bidderId: String(bidderId),
        bidderName,
        amount: parseFloat(amount),
        date: new Date().toISOString(),
      };

      await products.updateOne(
        productQuery,
        {
          $push: {
            activeBids: newBid,
            notifications: {
              message: `New bid of $${amount} by ${bidderName}`,
              date: new Date().toISOString(),
            },
          },
        }
      );

      const updated = await products.findOne({ _id: id });
      res.json(updated);
    } catch (err) {
      console.error("    Bid error:", err);
      res.status(500).json({ message: "Failed to place bid" });
    }
  });

  //     Update product by string ID
  router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const productQuery = createIdQuery(id);
      if (!productQuery) return res.status(400).json({ message: "Invalid ID format" });

      const result = await products.updateOne(productQuery, { $set: updateData });
      if (!result.matchedCount)
        return res.status(404).json({ message: "Product not found" });

      const updated = await products.findOne(productQuery);
      res.json(updated);
    } catch (err) {
      console.error("    Update error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  //     Delete product by string ID
  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const productQuery = createIdQuery(id);
      if (!productQuery) return res.status(400).json({ message: "Invalid ID format" });

      // Find product using flexible query
      const product = await products.findOne(productQuery);
      if (!product) return res.status(404).json({ message: "Product not found" });

      // Delete by the same query to ensure correct type used
      const delResult = await products.deleteOne(productQuery);
      if (delResult.deletedCount === 0) {
        // As a fallback, try deleting by string _id and ObjectId
        if (ObjectId.isValid(id)) {
          const alt = await products.deleteOne({ _id: new ObjectId(id) });
          if (alt.deletedCount === 0) return res.status(500).json({ message: 'Failed to delete product' });
        } else {
          const alt = await products.deleteOne({ _id: id });
          if (alt.deletedCount === 0) return res.status(500).json({ message: 'Failed to delete product' });
        }
      }

      //     Decrease category count
      const categories = db.collection("Categories");
      await categories.updateOne(
        { _id: product.categoryId },
        { $inc: { itemsCount: -1 } }
      );

      res.json({ message: "Product deleted successfully" });
    } catch (err) {
      console.error("    Delete error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  return router;
}
