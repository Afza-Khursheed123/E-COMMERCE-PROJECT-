import express from "express";

export default function cartRoute(db) {
  const router = express.Router();
  const cart = db.collection("Cart");
  const products = db.collection("Products");

  // Get cart for a user - UPDATED to include accepted offer prices
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

      // 🔥 ENHANCE: Fetch latest product data to check for accepted offers
      const enhancedItems = await Promise.all(
        cartDoc.items.map(async (item) => {
          const product = await products.findOne({ _id: item.productId });
          let finalPrice = item.price;
          let isAcceptedOffer = item.isAcceptedOffer || false;
          
          // Check if user has an accepted offer for this product
          if (product && product.acceptedOffer && product.acceptedOffer.bidderId === userId) {
            finalPrice = product.acceptedOffer.acceptedAmount;
            isAcceptedOffer = true;
          }
          
          return {
            ...item,
            price: finalPrice,
            isAcceptedOffer: isAcceptedOffer,
            productName: product?.name || item.productName,
            image: product?.images?.[0] || item.image
          };
        })
      );

      // Recalculate totals with potential accepted offer prices
      const total = enhancedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = enhancedItems.reduce((total, item) => total + item.quantity, 0);

      const enhancedCart = {
        ...cartDoc,
        items: enhancedItems,
        total: total,
        itemCount: itemCount
      };
      
      res.json(enhancedCart);
    } catch (err) {
      console.error("Cart fetch error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Add item to cart - UPDATED to check for accepted offers
  router.post("/add", async (req, res) => {
    try {
      const { userId, productId, quantity = 1 } = req.body;
      
      if (!userId || !productId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Fetch product details to check for accepted offers
      const product = await products.findOne({ _id: productId });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      let cartDoc = await cart.findOne({ userId });
      
      if (!cartDoc) {
        cartDoc = {
          userId,
          items: [],
          total: 0,
          itemCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      // Check if user has an accepted offer for this product
      let finalPrice = product.price;
      let isAcceptedOffer = false;
      
      if (product.acceptedOffer && product.acceptedOffer.bidderId === String(userId)) {
        finalPrice = product.acceptedOffer.acceptedAmount;
        isAcceptedOffer = true;
        console.log(`💰 Using accepted offer price: $${finalPrice} for user ${userId}`);
      }

      // Check if product already in cart
      const existingItemIndex = cartDoc.items.findIndex(item => item.productId === productId);
      
      if (existingItemIndex >= 0) {
        // Update quantity and price if already exists
        cartDoc.items[existingItemIndex].quantity += quantity;
        cartDoc.items[existingItemIndex].price = finalPrice;
        cartDoc.items[existingItemIndex].isAcceptedOffer = isAcceptedOffer;
      } else {
        // Add new item with potential accepted offer price
        cartDoc.items.push({
          productId,
          quantity,
          price: finalPrice,
          originalPrice: product.price,
          isAcceptedOffer: isAcceptedOffer,
          productName: product.name,
          image: product.images?.[0] || null,
          addedAt: new Date().toISOString()
        });
      }

      // Update totals
      cartDoc.itemCount = cartDoc.items.reduce((total, item) => total + item.quantity, 0);
      cartDoc.total = cartDoc.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      cartDoc.updatedAt = new Date().toISOString();

      // Save to database
      await cart.updateOne(
        { userId },
        { $set: cartDoc },
        { upsert: true }
      );

      res.json({ 
        message: "Item added to cart", 
        cart: cartDoc,
        usedAcceptedOffer: isAcceptedOffer
      });
    } catch (err) {
      console.error("Add to cart error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update cart item quantity - UPDATED to maintain accepted offer prices
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
      cartDoc.total = cartDoc.items.reduce((total, item) => total + (item.price * item.quantity), 0);
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
      cartDoc.total = cartDoc.items.reduce((total, item) => total + (item.price * item.quantity), 0);
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