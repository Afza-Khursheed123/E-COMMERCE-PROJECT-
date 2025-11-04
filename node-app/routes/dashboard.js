import express from "express";
import { ObjectId } from "mongodb";

export default function dashboardRoute(db) {
  const router = express.Router();

  //   1️⃣ Get currently authenticated user
  router.get("/auth/me", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] || req.query.userId || req.body.userId;

      if (!userId) {
        return res.status(400).json({ success: false, message: "Missing user ID" });
      }

      const user = await db.collection("User").findOne({ _id: userId.toString() });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({
        success: true,
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          location: user.location || "",
          rating: user.rating || 0,
          profileImage: user.profileImage || "",
          joinedAt: user.joinedAt || null,
          role: user.role || "buyer",
        },
      });
    } catch (error) {
      console.error("  Auth check failed:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  //   2️⃣ Main Dashboard Route (Updated with new logic)
  router.get("/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId || userId === "undefined" || userId === "null") {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      //   Find user
      const user = await db.collection("User").findOne({ _id: userId.toString() });
      if (!user) return res.status(404).json({ message: "User not found" });

      //   Fetch user's products
      const userProducts = await db
        .collection("Products")
        .find({ userId: userId.toString() })
        .sort({ createdAt: -1 })
        .toArray();

      //   NEW LOGIC: Fetch all products to find embedded bids
      const allProducts = await db.collection("Products").find({}).toArray();

      // 🧩 Bids placed BY this user (from Products collection)
      const userBidsFromProducts = allProducts.flatMap((product) =>
        (product.activeBids || [])
          .filter((b) => b.bidderId === userId.toString())
          .map((b) => ({
            ...b,
            productId: product._id.toString(),
            productName: product.name,
            productImage: product.images?.[0],
            sellerId: product.userId,
            status: b.bidStatus || "active",
          }))
      );

      // 🧩 Bids placed ON this user's products (for notifications)
      const bidsOnMyProducts = allProducts.flatMap((product) =>
        (product.activeBids || [])
          .filter((b) => product.userId === userId.toString())
          .map((b) => ({
            ...b,
            productId: product._id.toString(),
            productName: product.name,
            bidderName: b.bidderName,
            amount: b.amount,
            date: b.placedAt || new Date(),
          }))
      );

      //   Fetch from Bids collection (for comprehensive data)
      const [userBidsFromCollection, userOrders, userNotifications, userReviews] = await Promise.all([
        db.collection("Bids")
          .find({ bidderId: userId.toString() })
          .sort({ placedAt: -1 })
          .toArray(),
        db.collection("Orders")
          .find({ buyerId: userId.toString() })
          .sort({ orderDate: -1 })
          .toArray(),
        db.collection("Notification")
          .find({ userId: userId.toString() })
          .sort({ createdAt: -1 })
          .limit(10)
          .toArray(),
        db.collection("Reviews")
          .find({ userId: userId.toString() })
          .sort({ createdAt: -1 })
          .toArray(),
      ]);

      // Combine bids from both sources (prioritize collection data)
      const allUserBids = [...userBidsFromCollection, ...userBidsFromProducts];
      const uniqueBids = allUserBids.filter((bid, index, self) => 
        index === self.findIndex(b => 
          b.productId === bid.productId && b.amount === bid.amount
        )
      );

      //   Find products user has bid on
      const bidProductIds = [...new Set(uniqueBids.map((b) => b.productId?.toString()))];
      const bidProducts = bidProductIds.length
        ? await db.collection("Products").find({ _id: { $in: bidProductIds } }).toArray()
        : [];

      // 🗺️ Map product IDs for quick lookups
      const productMap = Object.fromEntries(userProducts.map(p => [p._id.toString(), p]));

      //   Dynamic notifications for new bids on user's products
      const dynamicBidNotifications = bidsOnMyProducts.map(bid => ({
        _id: bid._id || `bid-${Date.now()}`,
        type: "bid",
        productId: bid.productId,
        productName: productMap[bid.productId]?.name || "Unknown product",
        bidderName: bid.bidderName || "Unknown user",
        bidAmount: bid.amount,
        createdAt: bid.date || new Date(),
      }));

      //   Sold products
      const soldProducts = userProducts.filter(p => p.available === false);

      //   Stats summary (enhanced with combined bid data)
      const stats = {
        totalListings: userProducts.length,
        activeListings: userProducts.filter((p) => p.available).length,
        soldListings: soldProducts.length,
        totalBids: uniqueBids.length, // Combined from both sources
        activeBids: uniqueBids.filter((b) => (b.bidStatus || b.status) === "active").length,
        totalPurchases: userOrders.length,
        totalReviews: userReviews.length,
        averageRating: user.rating || 0,
        bidsOnMyProducts: bidsOnMyProducts.length,
        totalEarnings: userProducts
          .filter((p) => !p.available)
          .reduce((sum, p) => sum + (p.price || 0), 0),
      };

      //   Final dashboard structure
      const dashboardData = {
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          location: user.location || "",
          rating: user.rating || 0,
          profileImage: user.profileImage || "",
          joinedAt: user.joinedAt || null,
          role: user.role || "buyer",
        },
        products: userProducts,
        bids: uniqueBids.map((bid) => ({
          ...bid,
          product: bidProducts.find((p) => p._id.toString() === bid.productId) || null,
        })),
        soldProducts,
        orders: userOrders,
        notifications: [
          ...dynamicBidNotifications.slice(0, 5), // Top 5 new bids
          ...userNotifications, // Previous stored notifications
        ].slice(0, 10), // Limit to 10
        reviews: userReviews,
        stats,
      };

      res.json(dashboardData);
    } catch (error) {
      console.error("  Dashboard route error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  //   3️⃣ User Products
  router.get("/:userId/products", async (req, res) => {
    try {
      const { userId } = req.params;
      const products = await db
        .collection("Products")
        .find({ userId: userId.toString() })
        .sort({ createdAt: -1 })
        .toArray();

      res.json(products);
    } catch (err) {
      console.error("  Error fetching user products:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  //   4️⃣ User Bids (Updated with combined logic)
  router.get("/:userId/bids", async (req, res) => {
    try {
      const { userId } = req.params;

      // Fetch from both sources
      const [bidsFromCollection, allProducts] = await Promise.all([
        db.collection("Bids")
          .find({ bidderId: userId.toString() })
          .sort({ placedAt: -1 })
          .toArray(),
        db.collection("Products").find({}).toArray()
      ]);

      // Bids from products collection
      const bidsFromProducts = allProducts.flatMap((product) =>
        (product.activeBids || [])
          .filter((b) => b.bidderId === userId.toString())
          .map((b) => ({
            ...b,
            productId: product._id.toString(),
            productName: product.name,
            productImage: product.images?.[0],
          }))
      );

      // Combine and deduplicate
      const allBids = [...bidsFromCollection, ...bidsFromProducts];
      const uniqueBids = allBids.filter((bid, index, self) => 
        index === self.findIndex(b => 
          b.productId === bid.productId && b.amount === bid.amount
        )
      );

      // Fetch product details
      const bidsWithProducts = await Promise.all(
        uniqueBids.map(async (bid) => {
          const product = await db.collection("Products").findOne({ 
            _id: bid.productId?.toString() 
          });
          return { ...bid, product: product || null };
        })
      );

      res.json(bidsWithProducts);
    } catch (err) {
      console.error("  Error fetching user bids:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  //   5️⃣ User Orders
  router.get("/:userId/orders", async (req, res) => {
    try {
      const { userId } = req.params;
      const userOrders = await db
        .collection("Orders")
        .find({ buyerId: userId.toString() })
        .sort({ orderDate: -1 })
        .toArray();

      res.json(userOrders);
    } catch (err) {
      console.error("  Error fetching user orders:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  //   6️⃣ Update User Profile
  router.put("/:userId/profile", async (req, res) => {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      const result = await db
        .collection("User")
        .updateOne({ _id: userId.toString() }, { $set: updateData });

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await db.collection("User").findOne({ _id: userId.toString() });
      res.json(updatedUser);
    } catch (err) {
      console.error("  Error updating user profile:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  //   7️⃣ Stats Only (Updated with combined logic)
  router.get("/:userId/stats", async (req, res) => {
    try {
      const { userId } = req.params;

      const [userProducts, bidsFromCollection, allProducts, userOrders, userReviews] = await Promise.all([
        db.collection("Products").find({ userId: userId.toString() }).toArray(),
        db.collection("Bids").find({ bidderId: userId.toString() }).toArray(),
        db.collection("Products").find({}).toArray(),
        db.collection("Orders").find({ buyerId: userId.toString() }).toArray(),
        db.collection("Reviews").find({ userId: userId.toString() }).toArray(),
      ]);

      // Bids from products collection
      const bidsFromProducts = allProducts.flatMap((product) =>
        (product.activeBids || [])
          .filter((b) => b.bidderId === userId.toString())
      );

      // Combine bids
      const totalBids = [...bidsFromCollection, ...bidsFromProducts];
      const uniqueBids = totalBids.filter((bid, index, self) => 
        index === self.findIndex(b => 
          b.productId === bid.productId && b.amount === bid.amount
        )
      );

      // Bids on user's products
      const bidsOnMyProducts = allProducts.flatMap((product) =>
        (product.activeBids || [])
          .filter((b) => product.userId === userId.toString())
      );

      const stats = {
        totalListings: userProducts.length,
        activeListings: userProducts.filter((p) => p.available).length,
        soldListings: userProducts.filter((p) => !p.available).length,
        totalBids: uniqueBids.length,
        activeBids: uniqueBids.filter((b) => (b.bidStatus || b.status) === "active").length,
        wonBids: uniqueBids.filter((b) => (b.bidStatus || b.status) === "won").length,
        totalPurchases: userOrders.length,
        totalReviews: userReviews.length,
        totalEarnings: userProducts
          .filter((p) => !p.available)
          .reduce((sum, p) => sum + (p.price || 0), 0),
        bidsOnMyProducts: bidsOnMyProducts.length,
      };

      res.json(stats);
    } catch (err) {
      console.error("  Error fetching dashboard stats:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  return router;
}