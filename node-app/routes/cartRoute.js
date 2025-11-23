import express from "express";

export default function cartRoute(db) {
  const router = express.Router();
  const cart = db.collection("Cart");

  // Get cart for a user
  router.get("/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      let cartDoc = await cart.findOne({ userId });
      
      if (!cartDoc) {
        // Create empty cart if doesn't exist
        cartDoc = {
          userId,
          items: [],
          total: 0,
          itemCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await cart.insertOne(cartDoc);
      }
      
      res.json(cartDoc);
    } catch (err) {
      console.error("Cart fetch error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Add item to cart
  router.post("/add", async (req, res) => {
    try {
      const { userId, productId, quantity = 1 } = req.body;
      
      if (!userId || !productId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      let cartDoc = await cart.findOne({ userId });
      
      if (!cartDoc) {
        // Create new cart
        cartDoc = {
          userId,
          items: [],
          total: 0,
          itemCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      // Check if product already in cart
      const existingItemIndex = cartDoc.items.findIndex(item => item.productId === productId);
      
      if (existingItemIndex >= 0) {
        // Update quantity if already exists
        cartDoc.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        cartDoc.items.push({
          productId,
          quantity,
          addedAt: new Date().toISOString()
        });
      }

      // Update totals
      cartDoc.itemCount = cartDoc.items.reduce((total, item) => total + item.quantity, 0);
      cartDoc.updatedAt = new Date().toISOString();

      // Save to database
      await cart.updateOne(
        { userId },
        { $set: cartDoc },
        { upsert: true }
      );

      res.json({ 
        message: "Item added to cart", 
        cart: cartDoc 
      });
    } catch (err) {
      console.error("Add to cart error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update cart item quantity
  router.post("/update", async (req, res) => {
    try {
      const { userId, productId, quantity } = req.body;
      
      if (!userId || !productId || quantity === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const cartDoc = await cart.findOne({ userId });
      
      if (!cartDoc) {
        return res.status(404).json({ message: "Cart not found" });
      }

      const itemIndex = cartDoc.items.findIndex(item => item.productId === productId);
      
      if (itemIndex >= 0) {
        if (quantity > 0) {
          cartDoc.items[itemIndex].quantity = quantity;
        } else {
          // Remove item if quantity is 0 or less
          cartDoc.items.splice(itemIndex, 1);
        }
      }

      // Update totals
      cartDoc.itemCount = cartDoc.items.reduce((total, item) => total + item.quantity, 0);
      cartDoc.updatedAt = new Date().toISOString();

      await cart.updateOne(
        { userId },
        { $set: cartDoc }
      );

      res.json({ 
        message: "Cart updated", 
        cart: cartDoc 
      });
    } catch (err) {
      console.error("Update cart error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Remove item from cart
  router.post("/remove", async (req, res) => {
    try {
      const { userId, productId } = req.body;
      
      if (!userId || !productId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const cartDoc = await cart.findOne({ userId });
      
      if (!cartDoc) {
        return res.status(404).json({ message: "Cart not found" });
      }

      cartDoc.items = cartDoc.items.filter(item => item.productId !== productId);
      
      // Update totals
      cartDoc.itemCount = cartDoc.items.reduce((total, item) => total + item.quantity, 0);
      cartDoc.updatedAt = new Date().toISOString();

      await cart.updateOne(
        { userId },
        { $set: cartDoc }
      );

      res.json({ 
        message: "Item removed from cart", 
        cart: cartDoc 
      });
    } catch (err) {
      console.error("Remove from cart error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  return router;
}