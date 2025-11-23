import express from "express";

export default function favoritesRoute(db) {
  const router = express.Router();
  const favorites = db.collection("Favorites");

  // Get user's favorites
  router.get("/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      let favoritesDoc = await favorites.findOne({ userId });
      
      if (!favoritesDoc) {
        favoritesDoc = {
          userId,
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await favorites.insertOne(favoritesDoc);
      }
      
      res.json(favoritesDoc);
    } catch (err) {
      console.error("Favorites fetch error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Add to favorites
  router.post("/add", async (req, res) => {
    try {
      const { userId, productId } = req.body;
      
      if (!userId || !productId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      let favoritesDoc = await favorites.findOne({ userId });
      
      if (!favoritesDoc) {
        favoritesDoc = {
          userId,
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      // Check if already in favorites
      const existingItem = favoritesDoc.items.find(item => item.productId === productId);
      
      if (!existingItem) {
        favoritesDoc.items.push({
          productId,
          addedAt: new Date().toISOString()
        });
        
        favoritesDoc.updatedAt = new Date().toISOString();

        await favorites.updateOne(
          { userId },
          { $set: favoritesDoc },
          { upsert: true }
        );
      }

      res.json({ 
        message: "Added to favorites", 
        favorites: favoritesDoc 
      });
    } catch (err) {
      console.error("Add to favorites error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Remove from favorites
  router.post("/remove", async (req, res) => {
    try {
      const { userId, productId } = req.body;
      
      if (!userId || !productId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const favoritesDoc = await favorites.findOne({ userId });
      
      if (!favoritesDoc) {
        return res.status(404).json({ message: "Favorites not found" });
      }

      favoritesDoc.items = favoritesDoc.items.filter(item => item.productId !== productId);
      favoritesDoc.updatedAt = new Date().toISOString();

      await favorites.updateOne(
        { userId },
        { $set: favoritesDoc }
      );

      res.json({ 
        message: "Removed from favorites", 
        favorites: favoritesDoc 
      });
    } catch (err) {
      console.error("Remove from favorites error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  return router;
}