import express from "express";
import { ObjectId } from "mongodb";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function dashboardRoute(db) {
  const router = express.Router();

  // ✅ ADDED: Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, '../../uploads/profile-images');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExtension = path.extname(file.originalname);
      cb(null, 'profile-' + uniqueSuffix + fileExtension);
    }
  });

  // ✅ ADDED: File filter for images only
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  };

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

  // ✅ ADDED: Upload profile image route
  router.post("/user/:userId/upload-image", upload.single('profileImage'), async (req, res) => {
    try {
      const { userId } = req.params;

      console.log('🖼️ Uploading profile image for user:', userId);

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "No image file provided" 
        });
      }

      // Validate userId
      if (!userId || userId === "undefined" || userId === "null") {
        // Delete the uploaded file since user ID is invalid
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }

      // Convert string ID to ObjectId
      let userQuery;
      try {
        userQuery = { _id: new ObjectId(userId) };
      } catch (error) {
        // Delete the uploaded file since user ID is invalid
        fs.unlinkSync(req.file.path);
        console.error('❌ Invalid ObjectId format:', userId);
        return res.status(400).json({ 
          success: false,
          message: 'Invalid user ID format' 
        });
      }

      // Construct the image URL
      const imageUrl = `/uploads/profile-images/${req.file.filename}`;

      // Update user in database with new profile image
      const result = await db.collection("User").findOneAndUpdate(
        userQuery,
        { 
          $set: { 
            profileImage: imageUrl,
            updatedAt: new Date()
          } 
        },
        { 
          returnDocument: 'after'
        }
      );

      if (!result.value) {
        // Delete the uploaded file since user was not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      console.log('✅ Profile image uploaded successfully for:', userId);

      res.json({ 
        success: true, 
        imageUrl: imageUrl,
        message: 'Profile image uploaded successfully'
      });

    } catch (error) {
      console.error('❌ Error uploading profile image:', error);
      
      // Delete the uploaded file in case of error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Server error while uploading image',
        error: error.message 
      });
    }
  });

  // ✅ ADDED: Remove profile image route
  router.delete("/user/:userId/remove-image", async (req, res) => {
    try {
      const { userId } = req.params;

      console.log('🗑️ Removing profile image for user:', userId);

      // Validate userId
      if (!userId || userId === "undefined" || userId === "null") {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }

      // Convert string ID to ObjectId
      let userQuery;
      try {
        userQuery = { _id: new ObjectId(userId) };
      } catch (error) {
        console.error('❌ Invalid ObjectId format:', userId);
        return res.status(400).json({ 
          success: false,
          message: 'Invalid user ID format' 
        });
      }

      // Get current user to find existing image path
      const currentUser = await db.collection("User").findOne(userQuery);
      
      if (!currentUser) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      // Delete the old image file from server if it exists
      if (currentUser.profileImage && currentUser.profileImage.startsWith('/uploads/profile-images/')) {
        const oldImagePath = path.join(__dirname, '../../', currentUser.profileImage);
        
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('✅ Old profile image deleted:', oldImagePath);
        }
      }

      // Update user in database to remove profile image
      const result = await db.collection("User").findOneAndUpdate(
        userQuery,
        { 
          $set: { 
            profileImage: "",
            updatedAt: new Date()
          } 
        },
        { 
          returnDocument: 'after'
        }
      );

      console.log('✅ Profile image removed successfully for:', userId);

      res.json({ 
        success: true,
        message: 'Profile image removed successfully'
      });

    } catch (error) {
      console.error('❌ Error removing profile image:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while removing image',
        error: error.message 
      });
    }
  });

  // 1️⃣ Get authenticated user - FIXED ObjectId handling
  router.get("/auth/me", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] || req.query.userId || req.body.userId;
      if (!userId) {
        return res.status(400).json({ success: false, message: "Missing user ID" });
      }

      // ✅ FIXED: Convert to ObjectId
      let userQuery;
      try {
        userQuery = { _id: new ObjectId(userId) };
      } catch (error) {
        return res.status(400).json({ success: false, message: "Invalid user ID format" });
      }

      const user = await db.collection("User").findOne(userQuery);
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

  // ✅ UPDATED: Update User Profile Route - FIXED ObjectId handling
  router.put("/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;

      console.log('🔄 Profile update request for:', userId);
      console.log('📝 Update data:', updates);

      // Validate userId
      if (!userId || userId === "undefined" || userId === "null") {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }

      // Allowed fields to update
      const allowedUpdates = ['name', 'email', 'phone', 'location', 'profileImage'];
      const updateData = {};
      
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });

      console.log('📤 Fields to update:', updateData);

      // ✅ FIXED: Convert string ID to ObjectId for MongoDB query
      let userQuery;
      try {
        userQuery = { _id: new ObjectId(userId) };
      } catch (error) {
        console.error('❌ Invalid ObjectId format:', userId);
        return res.status(400).json({ 
          success: false,
          message: 'Invalid user ID format' 
        });
      }

      // Update user in MongoDB - FIXED: Use ObjectId
      const result = await db.collection("User").findOneAndUpdate(
        userQuery,
        { 
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        },
        { 
          returnDocument: 'after'
        }
      );

      if (!result.value) {
        console.log('❌ User not found with ID:', userId);
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      console.log('✅ Profile updated successfully for:', userId);

      res.json({ 
        success: true, 
        user: {
          _id: result.value._id.toString(),
          name: result.value.name,
          email: result.value.email,
          phone: result.value.phone || "",
          location: result.value.location || "",
          rating: result.value.rating || 0,
          profileImage: result.value.profileImage || "",
          joinedAt: result.value.joinedAt || null,
          role: result.value.role || "buyer",
        },
        message: 'Profile updated successfully'
      });

    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while updating profile',
        error: error.message 
      });
    }
  });

  // ✅ ADDED: Delete Product Route - FIXED ObjectId handling
  router.delete("/product/:productId", async (req, res) => {
    try {
      const { productId } = req.params;

      console.log('🗑️ Deleting product:', productId);

      // ✅ FIXED: Convert to ObjectId
      let productQuery;
      try {
        productQuery = { _id: new ObjectId(productId) };
      } catch (error) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid product ID format' 
        });
      }

      // Delete product from database
      const result = await db.collection("Products").deleteOne(productQuery);

      if (result.deletedCount === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Product not found' 
        });
      }

      console.log('✅ Product deleted successfully:', productId);

      res.json({ 
        success: true,
        message: 'Product deleted successfully'
      });

    } catch (error) {
      console.error('❌ Error deleting product:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while deleting product',
        error: error.message 
      });
    }
  });

  // 2️⃣ Main Dashboard Route - FIXED ObjectId handling
  router.get("/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId || userId === "undefined" || userId === "null") {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // ✅ FIXED: Convert to ObjectId
      let userQuery;
      try {
        userQuery = { _id: new ObjectId(userId) };
      } catch (error) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }

      // Find user
      const user = await db.collection("User").findOne(userQuery);
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
              _id: new ObjectId(notif.relatedProductId) 
            });
          }
          
          if (notif.relatedBidId) {
            bid = await db.collection("Bids").findOne({ 
              _id: new ObjectId(notif.relatedBidId) 
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

  // 3️⃣ Update Offer Status - FIXED ObjectId handling
  router.put("/bids/:bidId/status", async (req, res) => {
    try {
      const { bidId } = req.params;
      const { status } = req.body;

      console.log("🔄 Updating bid status:", { bidId, status });

      if (!["accepted", "rejected", "active"].includes(status?.toLowerCase())) {
        return res.status(400).json({ success: false, message: "Invalid status. Use: accepted, rejected, or active" });
      }

      // ✅ FIXED: Convert to ObjectId
      let bidQuery;
      try {
        bidQuery = { _id: new ObjectId(bidId) };
      } catch (error) {
        return res.status(400).json({ success: false, message: "Invalid bid ID format" });
      }

      const bidsCollection = db.collection("Bids");
      const bid = await bidsCollection.findOne(bidQuery);
      
      if (!bid) {
        return res.status(404).json({ success: false, message: "Bid not found" });
      }

      // Update bid status in Bids collection
      const result = await bidsCollection.updateOne(
        bidQuery,
        { $set: { bidStatus: status.toLowerCase(), updatedAt: new Date() } }
      );

      console.log("📊 Bid update result:", result);

      // Get product and user details for notifications
      const product = await db.collection("Products").findOne({ _id: new ObjectId(bid.productId) });
      const seller = await db.collection("User").findOne({ _id: new ObjectId(bid.productOwnerId) });
      const bidder = await db.collection("User").findOne({ _id: new ObjectId(bid.bidderId) });

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
            { _id: new ObjectId(bid.productId) },
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
            bidQuery,
            { $set: { bidStatus: "accepted" } }
          );

          // Set all other bids for this product to rejected
          await bidsCollection.updateMany(
            { 
              productId: bid.productId, 
              _id: { $ne: new ObjectId(bidId) }
            },
            { 
              $set: { 
                bidStatus: "rejected",
                updatedAt: new Date()
              } 
            }
          );

          // ✅ FIXED: Update product's activeBids array to reflect new statuses
          const productWithBids = await db.collection("Products").findOne({ _id: new ObjectId(bid.productId) });
          if (productWithBids && productWithBids.activeBids) {
            const updatedActiveBids = productWithBids.activeBids.map(productBid => {
              if (productBid.bidderId === bid.bidderId) {
                return { ...productBid, bidStatus: "accepted" };
              } else {
                return { ...productBid, bidStatus: "rejected" };
              }
            });

            await db.collection("Products").updateOne(
              { _id: new ObjectId(bid.productId) },
              { $set: { activeBids: updatedActiveBids } }
            );
          }

          // ✅ FIXED: Notify ALL other bidders that the item is sold
          const otherBids = await bidsCollection.find({ 
            productId: bid.productId, 
            _id: { $ne: new ObjectId(bidId) }
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
        const productWithBids = await db.collection("Products").findOne({ _id: new ObjectId(bid.productId) });
        if (productWithBids && productWithBids.activeBids) {
          const updatedActiveBids = productWithBids.activeBids.map(productBid => {
            if (productBid.bidderId === bid.bidderId) {
              return { ...productBid, bidStatus: "rejected" };
            }
            return productBid;
          });

          await db.collection("Products").updateOne(
            { _id: new ObjectId(bid.productId) },
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

  // 4️⃣ Delete Notification - FIXED ObjectId handling
  router.delete("/notifications/:notificationId", async (req, res) => {
    try {
      const { notificationId } = req.params;
      
      console.log("Deleting notification:", notificationId);

      // ✅ FIXED: Convert to ObjectId
      let notificationQuery;
      try {
        notificationQuery = { _id: new ObjectId(notificationId) };
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid notification ID format" 
        });
      }

      const result = await db.collection("Notification").deleteOne(notificationQuery);

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

  // 5️⃣ Mark Notification as Read - FIXED ObjectId handling
  router.put("/notifications/:notificationId/read", async (req, res) => {
    try {
      const { notificationId } = req.params;
      
      // ✅ FIXED: Convert to ObjectId
      let notificationQuery;
      try {
        notificationQuery = { _id: new ObjectId(notificationId) };
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid notification ID format" 
        });
      }

      const result = await db.collection("Notification").updateOne(
        notificationQuery,
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