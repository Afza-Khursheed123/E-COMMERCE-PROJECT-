import express from "express";
import { ObjectId } from "mongodb";

export default function dashboardRoute(db) {
  const router = express.Router();

  // 1️⃣ Get authenticated user
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
      console.error("Auth check failed:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 2️⃣ Main Dashboard Route - SIMPLIFIED
  router.get("/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId || userId === "undefined" || userId === "null") {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Find user
      const user = await db.collection("User").findOne({ _id: userId.toString() });
      if (!user) return res.status(404).json({ message: "User not found" });

      // Parallel data fetching
      const [
        userProducts,
        userBids,
        bidsOnMyProducts,
        userOrders,
        userNotifications,
        userReviews
      ] = await Promise.all([
        // User's products
        db.collection("Products")
          .find({ userId: userId.toString() })
          .sort({ createdAt: -1 })
          .toArray(),
        
        // Bids placed by user
        db.collection("Bids")
          .find({ bidderId: userId.toString() })
          .sort({ placedAt: -1 })
          .toArray(),
        
        // Bids on user's products
        db.collection("Bids")
          .find({ productOwnerId: userId.toString() })
          .sort({ placedAt: -1 })
          .toArray(),
        
        // User's orders
        db.collection("Orders")
          .find({ buyerId: userId.toString() })
          .sort({ orderDate: -1 })
          .toArray(),
        
        // Notifications
        db.collection("Notification")
          .find({ userId: userId.toString() })
          .sort({ createdAt: -1 })
          .limit(20)
          .toArray(),
        
        // Reviews
        db.collection("Reviews")
          .find({ userId: userId.toString() })
          .sort({ createdAt: -1 })
          .toArray()
      ]);

      // Enhanced notifications with proper data
      const enhancedNotifications = await Promise.all(
        userNotifications.map(async (notif) => {
          let product = null;
          let bid = null;
          
          if (notif.relatedProductId) {
            product = await db.collection("Products").findOne({ 
              _id: notif.relatedProductId 
            });
          }
          
          if (notif.relatedBidId) {
            bid = await db.collection("Bids").findOne({ 
              _id: notif.relatedBidId 
            });
          }

          return {
            ...notif,
            _id: notif._id?.toString(),
            product: product ? {
              _id: product._id,
              name: product.name,
              image: product.images?.[0]
            } : null,
            bid: bid ? {
              amount: bid.bidAmount,
              status: bid.bidStatus
            } : null
          };
        })
      );

      // Clean stats calculation
      const activeListings = userProducts.filter(p => p.available);
      const soldProducts = userProducts.filter(p => !p.available);
      
      const stats = {
        totalListings: userProducts.length,
        activeListings: activeListings.length,
        soldListings: soldProducts.length,
        totalBids: userBids.length,
        pendingBids: userBids.filter(b => b.bidStatus === "pending").length,
        acceptedBids: userBids.filter(b => b.bidStatus === "accepted").length,
        rejectedBids: userBids.filter(b => b.bidStatus === "rejected").length,
        totalPurchases: userOrders.length,
        totalReviews: userReviews.length,
        averageRating: user.rating || 0,
        bidsOnMyProducts: bidsOnMyProducts.length,
        pendingOffers: bidsOnMyProducts.filter(b => b.bidStatus === "pending").length,
        totalEarnings: soldProducts.reduce((sum, p) => sum + (p.price || 0), 0),
      };

      // Final dashboard data
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
        bids: userBids,
        soldProducts,
        orders: userOrders,
        notifications: enhancedNotifications,
        reviews: userReviews,
        stats,
      };

      res.json(dashboardData);
    } catch (error) {
      console.error("Dashboard route error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  // 3️⃣ Update Offer Status - SIMPLIFIED LOGIC
 // ✅ FIXED: Update bid status (Accept / Reject) - COMPLETE LOGIC
router.put("/bids/:bidId/status", async (req, res) => {
  try {
    const { bidId } = req.params;
    const { status } = req.body;

    console.log("🔄 Updating bid status:", { bidId, status });

    if (!["accepted", "rejected", "active"].includes(status?.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Invalid status. Use: accepted, rejected, or active" });
    }

    const bidsCollection = db.collection("Bids");
    const bid = await bidsCollection.findOne({ _id: bidId });
    
    if (!bid) {
      return res.status(404).json({ success: false, message: "Bid not found" });
    }

    // Update bid status in Bids collection
    const result = await bidsCollection.updateOne(
      { _id: bidId },
      { $set: { bidStatus: status.toLowerCase(), updatedAt: new Date() } }
    );

    console.log("📊 Bid update result:", result);

    // Get product and user details for notifications
    const product = await db.collection("Products").findOne({ _id: bid.productId });
    const seller = await db.collection("User").findOne({ _id: bid.productOwnerId });
    const bidder = await db.collection("User").findOne({ _id: bid.bidderId });

    // Update existing notification for seller (mark as read or update status)
    await db.collection("Notification").updateOne(
      { relatedBidId: bidId, userId: bid.productOwnerId },
      { 
        $set: { 
          status: status.toUpperCase(),
          isRead: true,
          updatedAt: new Date()
        } 
      }
    );

    // ✅ CREATE BETTER NOTIFICATION FOR BIDDER when bid is accepted or rejected
    if (status.toLowerCase() === "accepted" || status.toLowerCase() === "rejected") {
      const bidderNotification = {
        userId: bid.bidderId,
        type: "bid_status",
        title: status.toLowerCase() === 'accepted' ? 'Offer Accepted! 🎉' : 'Offer Declined',
        message: status.toLowerCase() === 'accepted' 
          ? `Congratulations! Your offer of $${bid.bidAmount} on "${product?.name || 'the product'}" was accepted by ${seller?.name || 'the seller'}. The item is now yours!`
          : `Your offer of $${bid.bidAmount} on "${product?.name || 'the product'}" was not accepted by ${seller?.name || 'the seller'}.`,
        relatedProductId: bid.productId,
        relatedBidId: bidId,
        productName: product?.name,
        bidAmount: bid.bidAmount,
        status: status.toUpperCase(),
        isRead: false,
        createdAt: new Date()
      };
      
      await db.collection("Notification").insertOne(bidderNotification);
      console.log(`✅ Notification created for bidder: ${bid.bidderId}`);
    }

    // ✅ FIXED: If bid is accepted, mark product as sold and update ALL related data
    if (status.toLowerCase() === "accepted") {
      if (bid && bid.productId) {
        // Mark product as sold
        await db.collection("Products").updateOne(
          { _id: bid.productId },
          { 
            $set: { 
              available: false,
              isAvailable: false,
              soldTo: bid.bidderId,
              soldAt: new Date(),
              soldPrice: bid.bidAmount
            } 
          }
        );

        // ✅ FIXED: Update ALL bids for this product to reflect final status
        // Set accepted bid to accepted
        await bidsCollection.updateOne(
          { _id: bidId },
          { $set: { bidStatus: "accepted" } }
        );

        // Set all other bids for this product to rejected
        await bidsCollection.updateMany(
          { 
            productId: bid.productId, 
            _id: { $ne: bidId }
          },
          { 
            $set: { 
              bidStatus: "rejected",
              updatedAt: new Date()
            } 
          }
        );

        // ✅ FIXED: Update product's activeBids array to reflect new statuses
        const productWithBids = await db.collection("Products").findOne({ _id: bid.productId });
        if (productWithBids && productWithBids.activeBids) {
          const updatedActiveBids = productWithBids.activeBids.map(productBid => {
            if (productBid.bidderId === bid.bidderId) {
              return { ...productBid, bidStatus: "accepted" };
            } else {
              return { ...productBid, bidStatus: "rejected" };
            }
          });

          await db.collection("Products").updateOne(
            { _id: bid.productId },
            { $set: { activeBids: updatedActiveBids } }
          );
        }

        // ✅ FIXED: Notify ALL other bidders that the item is sold
        const otherBids = await bidsCollection.find({ 
          productId: bid.productId, 
          _id: { $ne: bidId }
        }).toArray();

        for (const otherBid of otherBids) {
          const otherBidderNotification = {
            userId: otherBid.bidderId,
            type: "item_sold",
            title: "Item Sold to Another Buyer",
            message: `The item "${product?.name || 'you made an offer on'}" has been sold to another buyer.`,
            relatedProductId: bid.productId,
            relatedBidId: otherBid._id,
            productName: product?.name,
            isRead: false,
            createdAt: new Date()
          };
          await db.collection("Notification").insertOne(otherBidderNotification);
        }

        console.log(`✅ Product ${bid.productId} marked as sold to ${bid.bidderId}`);
        console.log(`✅ Notified ${otherBids.length} other bidders`);
      }
    }

    // ✅ FIXED: If bid is rejected, just update that bid's status
    if (status.toLowerCase() === "rejected") {
      // Update the bid status in product's activeBids array
      const productWithBids = await db.collection("Products").findOne({ _id: bid.productId });
      if (productWithBids && productWithBids.activeBids) {
        const updatedActiveBids = productWithBids.activeBids.map(productBid => {
          if (productBid.bidderId === bid.bidderId) {
            return { ...productBid, bidStatus: "rejected" };
          }
          return productBid;
        });

        await db.collection("Products").updateOne(
          { _id: bid.productId },
          { $set: { activeBids: updatedActiveBids } }
        );
      }
    }

    return res.json({ 
      success: true, 
      message: `Offer ${status.toLowerCase()} successfully!`,
      updatedStatus: status.toLowerCase()
    });
  } catch (err) {
    console.error("❌ Error updating bid status:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
  // 4️⃣ Delete Notification - FIXED
  router.delete("/notifications/:notificationId", async (req, res) => {
    try {
      const { notificationId } = req.params;
      
      console.log("Deleting notification:", notificationId);

      const result = await db.collection("Notification").deleteOne({ 
        _id: new ObjectId(notificationId) 
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "Notification not found" 
        });
      }

      res.json({ 
        success: true, 
        message: "Notification deleted successfully" 
      });
    } catch (err) {
      console.error("Error deleting notification:", err);
      res.status(500).json({ 
        success: false, 
        message: "Failed to delete notification" 
      });
    }
  });

  // 5️⃣ Mark Notification as Read
  router.put("/notifications/:notificationId/read", async (req, res) => {
    try {
      const { notificationId } = req.params;
      
      const result = await db.collection("Notification").updateOne(
        { _id: new ObjectId(notificationId) },
        { $set: { isRead: true, readAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "Notification not found" 
        });
      }

      res.json({ 
        success: true, 
        message: "Notification marked as read" 
      });
    } catch (err) {
      console.error("Error marking notification as read:", err);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update notification" 
      });
    }
  });

  return router;
}