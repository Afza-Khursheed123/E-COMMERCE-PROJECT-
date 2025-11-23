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

  // 🔥 FIXED: Enhanced query functions to handle all ID types
  const createUserQuery = (userId) => {
    console.log('🔍 Processing user ID:', userId, 'Type:', typeof userId);
    
    // Handle null/undefined
    if (!userId || userId === "undefined" || userId === "null") {
      return null;
    }
    
    // Handle ObjectId (24 character hex string)
    if (ObjectId.isValid(userId) && String(new ObjectId(userId)) === userId) {
      console.log('✅ Using ObjectId query');
      return { _id: new ObjectId(userId) };
    }
    
    // Handle custom string IDs (like "user_zeenu_001")
    if (typeof userId === 'string' && (userId.startsWith('user_') || userId.includes('_'))) {
      console.log('✅ Using string ID query for custom ID');
      return { _id: userId };
    }
    
    // Handle numeric string IDs
    if (typeof userId === 'string' && /^\d+$/.test(userId)) {
      console.log('✅ Using string ID query for numeric ID');
      return { _id: userId };
    }
    
    // Fallback: try as string
    console.log('⚠️ Using fallback string query');
    return { _id: userId.toString() };
  };

  const createProductQuery = (productId) => {
    if (!productId) return null;
    
    if (ObjectId.isValid(productId) && String(new ObjectId(productId)) === productId) {
      return { _id: new ObjectId(productId) };
    }
    
    // Fallback to string
    return { _id: productId.toString() };
  };

  const createBidQuery = (bidId) => {
    if (!bidId) return null;
    
    if (ObjectId.isValid(bidId) && String(new ObjectId(bidId)) === bidId) {
      return { _id: new ObjectId(bidId) };
    }
    
    // Fallback to string
    return { _id: bidId.toString() };
  };

  const createNotificationQuery = (notificationId) => {
    if (!notificationId) return null;
    
    if (ObjectId.isValid(notificationId) && String(new ObjectId(notificationId)) === notificationId) {
      return { _id: new ObjectId(notificationId) };
    }
    
    // Fallback to string
    return { _id: notificationId.toString() };
  };

  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, '../../uploads/profile-images');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExtension = path.extname(file.originalname);
      cb(null, 'profile-' + uniqueSuffix + fileExtension);
    }
  });

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
      fileSize: 5 * 1024 * 1024
    }
  });

  // 🔥 FIXED: Upload profile image route - CORRECT IMAGE URL
  router.post("/user/:userId/upload-image", upload.single('profileImage'), async (req, res) => {
    try {
      const { userId } = req.params;

      console.log('🖼️ Uploading profile image for user:', userId);
      console.log('📁 File received:', req.file);

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "No image file provided" 
        });
      }

      if (!userId || userId === "undefined" || userId === "null") {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }

      const userQuery = createUserQuery(userId);
      console.log('🔍 User query:', userQuery);

      if (!userQuery) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID format" 
        });
      }

      // ✅ FIXED: Use relative path for better compatibility
      const imageUrl = `/uploads/profile-images/${req.file.filename}`;

      // First check if user exists
      const userExists = await db.collection("User").findOne(userQuery);
      if (!userExists) {
        fs.unlinkSync(req.file.path);
        console.log('❌ User not found:', userId);
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      console.log('✅ User found, updating profile image...');

      const result = await db.collection("User").updateOne(
        userQuery,
        { 
          $set: { 
            profileImage: imageUrl,
            updatedAt: new Date()
          } 
        }
      );

      console.log('📊 Update result:', result);

      if (result.matchedCount === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ 
          success: false,
          message: 'User not found during update' 
        });
      }

      // Get updated user
      const updatedUser = await db.collection("User").findOne(userQuery);

      console.log('✅ Profile image uploaded successfully for:', userId);

      res.json({ 
        success: true, 
        imageUrl: imageUrl,
        user: {
          _id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email,
          profileImage: updatedUser.profileImage
        },
        message: 'Profile image uploaded successfully'
      });

    } catch (error) {
      console.error('❌ Error uploading profile image:', error);
      
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Server error while uploading image',
        error: error.message 
      });
    }
  });

  // 🔥 FIXED: Remove profile image route
  router.delete("/user/:userId/remove-image", async (req, res) => {
    try {
      const { userId } = req.params;

      console.log('🗑️ Removing profile image for user:', userId);

      if (!userId || userId === "undefined" || userId === "null") {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }

      const userQuery = createUserQuery(userId);
      
      if (!userQuery) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID format" 
        });
      }

      const currentUser = await db.collection("User").findOne(userQuery);
      
      if (!currentUser) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      // Delete the old image file from server if it exists
      if (currentUser.profileImage) {
        let oldImagePath;
        
        // Handle both relative and absolute paths
        if (currentUser.profileImage.startsWith('/uploads/')) {
          oldImagePath = path.join(__dirname, '../../', currentUser.profileImage);
        } else if (currentUser.profileImage.includes('uploads/profile-images')) {
          // Extract filename from full URL
          const filename = currentUser.profileImage.split('/').pop();
          oldImagePath = path.join(__dirname, '../../uploads/profile-images', filename);
        }
        
        if (oldImagePath && fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('✅ Old profile image deleted:', oldImagePath);
        }
      }

      const result = await db.collection("User").updateOne(
        userQuery,
        { 
          $set: { 
            profileImage: "",
            updatedAt: new Date()
          } 
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found during update' 
        });
      }

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

  // Get authenticated user
  router.get("/auth/me", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] || req.query.userId || req.body.userId;
      if (!userId) {
        return res.status(400).json({ success: false, message: "Missing user ID" });
      }

      console.log('🔍 Auth check for user:', userId);

      const userQuery = createUserQuery(userId);
      
      if (!userQuery) {
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

  // 🔥 FIXED: Update User Profile Route
  router.put("/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;

      console.log('🔄 Profile update request for:', userId);
      console.log('📝 Update data:', updates);

      if (!userId || userId === "undefined" || userId === "null") {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }

      const userQuery = createUserQuery(userId);
      
      if (!userQuery) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID format" 
        });
      }

      const allowedUpdates = ['name', 'email', 'phone', 'location', 'profileImage'];
      const updateData = {};
      
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });

      console.log('📤 Fields to update:', updateData);

      // First check if user exists
      const userExists = await db.collection("User").findOne(userQuery);
      if (!userExists) {
        console.log('❌ User not found with ID:', userId);
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      console.log('✅ User found, updating profile...');

      const result = await db.collection("User").updateOne(
        userQuery,
        { 
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        }
      );

      console.log('📊 Update result:', result);

      if (result.matchedCount === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found during update' 
        });
      }

      // Get updated user
      const updatedUser = await db.collection("User").findOne(userQuery);

      console.log('✅ Profile updated successfully for:', userId);

      res.json({ 
        success: true, 
        user: {
          _id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone || "",
          location: updatedUser.location || "",
          rating: updatedUser.rating || 0,
          profileImage: updatedUser.profileImage || "",
          joinedAt: updatedUser.joinedAt || null,
          role: updatedUser.role || "buyer",
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

  // 🔥 FIXED: Enhanced Delete Product Route with Proper Cleanup
  router.delete("/product/:productId", async (req, res) => {
    try {
      const { productId } = req.params;

      console.log('🗑️ Deleting product:', productId);

      const productQuery = createProductQuery(productId);
      
      if (!productQuery) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid product ID format' 
        });
      }

      // First, get the product to check if it exists and get its details
      const product = await db.collection("Products").findOne(productQuery);
      
      if (!product) {
        return res.status(404).json({ 
          success: false,
          message: 'Product not found' 
        });
      }

      console.log('🔍 Product found for deletion:', product.name);

      // 🔥 FIXED: Delete related data first to maintain database integrity
      
      // 1. Delete all bids associated with this product
      const bidsDeleteResult = await db.collection("Bids").deleteMany({
        productId: productId.toString()
      });
      console.log(`🗑️ Deleted ${bidsDeleteResult.deletedCount} bids for product ${productId}`);

      // 2. Delete all notifications related to this product
      const notificationsDeleteResult = await db.collection("Notification").deleteMany({
        $or: [
          { relatedProductId: productId.toString() },
          { "product._id": productId.toString() }
        ]
      });
      console.log(`🗑️ Deleted ${notificationsDeleteResult.deletedCount} notifications for product ${productId}`);

      // 3. Remove from favorites/wishlists of all users
      const wishlistUpdateResult = await db.collection("User").updateMany(
        { "wishlist.productId": productId.toString() },
        { $pull: { wishlist: { productId: productId.toString() } } }
      );
      console.log(`🗑️ Removed product from ${wishlistUpdateResult.modifiedCount} user wishlists`);

      // 4. Remove from cart items of all users
      const cartUpdateResult = await db.collection("User").updateMany(
        { "cart.items.productId": productId.toString() },
        { $pull: { "cart.items": { productId: productId.toString() } } }
      );
      console.log(`🗑️ Removed product from ${cartUpdateResult.modifiedCount} user carts`);

      // 5. Delete any reviews for this product
      const reviewsDeleteResult = await db.collection("Reviews").deleteMany({
        productId: productId.toString()
      });
      console.log(`🗑️ Deleted ${reviewsDeleteResult.deletedCount} reviews for product ${productId}`);

      // 6. Finally delete the product itself
      const result = await db.collection("Products").deleteOne(productQuery);

      if (result.deletedCount === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Product not found during deletion' 
        });
      }

      console.log('✅ Product deleted successfully:', productId, '-', product.name);

      res.json({ 
        success: true,
        message: 'Product and all related data deleted successfully',
        deletedProduct: {
          id: productId,
          name: product.name,
          relatedDataDeleted: {
            bids: bidsDeleteResult.deletedCount,
            notifications: notificationsDeleteResult.deletedCount,
            wishlistEntries: wishlistUpdateResult.modifiedCount,
            cartEntries: cartUpdateResult.modifiedCount,
            reviews: reviewsDeleteResult.deletedCount
          }
        }
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

  // ✅ ADDED: Debug route for image serving
  router.get("/debug/image/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const imagePath = path.join(__dirname, '../../uploads/profile-images', filename);
      
      console.log('🔍 Debug image path:', imagePath);
      console.log('📁 File exists:', fs.existsSync(imagePath));
      
      if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
      } else {
        res.status(404).json({ 
          success: false, 
          message: 'Image file not found',
          path: imagePath 
        });
      }
    } catch (error) {
      console.error('❌ Debug image error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Debug error',
        error: error.message 
      });
    }
  });

  // 🔥 FIXED: Main Dashboard Route - Enhanced ID handling
  router.get("/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      console.log('📊 Fetching dashboard for user:', userId, 'Type:', typeof userId);

      if (!userId || userId === "undefined" || userId === "null") {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const userQuery = createUserQuery(userId);
      
      if (!userQuery) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }

      console.log('🔍 Final user query:', userQuery);

      // Find user with multiple fallback strategies
      let user = await db.collection("User").findOne(userQuery);
      
      // If not found with primary query, try alternative approaches
      if (!user) {
        console.log('⚠️ User not found with primary query, trying alternatives...');
        
        // Try finding by email as fallback (if userId might be email)
        if (userId.includes('@')) {
          user = await db.collection("User").findOne({ email: userId });
          console.log('🔍 Trying email lookup:', userId, 'Found:', !!user);
        }
        
        // Try as plain string if not found yet
        if (!user) {
          user = await db.collection("User").findOne({ _id: userId });
          console.log('🔍 Trying direct string ID:', userId, 'Found:', !!user);
        }
      }

      if (!user) {
        console.log('❌ User not found after all attempts:', userId);
        return res.status(404).json({ message: "User not found" });
      }

      console.log('✅ User found:', user.name, 'ID Type:', typeof user._id);

      // Convert user ID to string for consistent handling
      const userStringId = user._id.toString();
      console.log('🔧 Using string ID for queries:', userStringId);

      // Parallel data fetching with consistent ID
      const [
        userProducts,
        userBids,
        bidsOnMyProducts,
        userOrders,
        userNotifications,
        userReviews
      ] = await Promise.all([
        db.collection("Products")
          .find({ userId: userStringId })
          .sort({ createdAt: -1 })
          .toArray(),
        
        db.collection("Bids")
          .find({ bidderId: userStringId })
          .sort({ placedAt: -1 })
          .toArray(),
        
        db.collection("Bids")
          .find({ productOwnerId: userStringId })
          .sort({ placedAt: -1 })
          .toArray(),
        
        db.collection("Orders")
          .find({ buyerId: userStringId })
          .sort({ orderDate: -1 })
          .toArray(),
        
        db.collection("Notification")
          .find({ userId: userStringId })
          .sort({ createdAt: -1 })
          .limit(20)
          .toArray(),
        
        db.collection("Reviews")
          .find({ userId: userStringId })
          .sort({ createdAt: -1 })
          .toArray()
      ]);

      console.log(`📈 Data fetched - Products: ${userProducts.length}, Bids: ${userBids.length}, Notifications: ${userNotifications.length}`);

      // 🔥 FIXED: Enhanced notifications with proper product names
      const enhancedNotifications = await Promise.all(
        userNotifications.map(async (notif) => {
          let product = null;
          let bid = null;
          
          if (notif.relatedProductId) {
            const productQuery = createProductQuery(notif.relatedProductId);
            product = await db.collection("Products").findOne(productQuery);
          }
          
          if (notif.relatedBidId) {
            const bidQuery = createBidQuery(notif.relatedBidId);
            bid = await db.collection("Bids").findOne(bidQuery);
          }

          // 🔥 FIXED: Ensure product name is always available
          const productName = notif.productName || (product ? product.name : 'Unknown Product');

          return {
            ...notif,
            _id: notif._id?.toString(),
            productName: productName, // Always include product name
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

      // Stats calculation
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
          _id: user._id.toString(), // Ensure ID is string
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

      console.log('✅ Dashboard data prepared successfully for:', user.name);
      res.json(dashboardData);
    } catch (error) {
      console.error("Dashboard route error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  // 🔥 FIXED: Update Offer Status - FIXED PRODUCT NAMES
  router.put("/bids/:bidId/status", async (req, res) => {
    try {
      const { bidId } = req.params;
      const { status } = req.body;

      console.log("🔄 Updating bid status:", { bidId, status });

      if (!["accepted", "rejected", "active"].includes(status?.toLowerCase())) {
        return res.status(400).json({ success: false, message: "Invalid status. Use: accepted, rejected, or active" });
      }

      const bidQuery = createBidQuery(bidId);
      
      if (!bidQuery) {
        return res.status(400).json({ success: false, message: "Invalid bid ID format" });
      }

      const bidsCollection = db.collection("Bids");
      const bid = await bidsCollection.findOne(bidQuery);
      
      if (!bid) {
        return res.status(404).json({ success: false, message: "Bid not found" });
      }

      // 🔥 FIXED: Get product details BEFORE any updates
      const productQuery = createProductQuery(bid.productId);
      const product = await db.collection("Products").findOne(productQuery);
      
      const sellerQuery = createUserQuery(bid.productOwnerId);
      const seller = await db.collection("User").findOne(sellerQuery);
      
      const bidderQuery = createUserQuery(bid.bidderId);
      const bidder = await db.collection("User").findOne(bidderQuery);

      console.log("📦 Product details for notification:", {
        productId: bid.productId,
        productName: product?.name,
        sellerName: seller?.name,
        bidderName: bidder?.name
      });

      const result = await bidsCollection.updateOne(
        bidQuery,
        { $set: { bidStatus: status.toLowerCase(), updatedAt: new Date() } }
      );

      console.log("📊 Bid update result:", result);

      // Update existing notification for seller
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

      // Create notification for bidder - FIXED PRODUCT NAME
      if (status.toLowerCase() === "accepted" || status.toLowerCase() === "rejected") {
        const bidderNotification = {
          userId: bid.bidderId,
          type: "bid_status",
          title: status.toLowerCase() === 'accepted' ? 'Offer Accepted! 🎉' : 'Offer Declined',
          message: status.toLowerCase() === 'accepted' 
            ? `Congratulations! Your offer of $${bid.bidAmount} on "${product?.name || 'Unknown Product'}" was accepted by ${seller?.name || 'the seller'}. The item is now yours!`
            : `Your offer of $${bid.bidAmount} on "${product?.name || 'Unknown Product'}" was not accepted by ${seller?.name || 'the seller'}.`,
          relatedProductId: bid.productId,
          relatedBidId: bidId,
          productName: product?.name || 'Unknown Product', // 🔥 FIXED: Always include product name
          bidAmount: bid.bidAmount,
          status: status.toUpperCase(),
          isRead: false,
          createdAt: new Date()
        };
        
        await db.collection("Notification").insertOne(bidderNotification);
        console.log(`✅ Notification created for bidder: ${bid.bidderId}`);
      }

      // If bid is accepted, mark product as sold - FIXED: Ensure product exists
      if (status.toLowerCase() === "accepted") {
        if (bid && bid.productId && product) {
          await db.collection("Products").updateOne(
            productQuery,
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

          await bidsCollection.updateOne(
            bidQuery,
            { $set: { bidStatus: "accepted" } }
          );

          // Reject all other bids on this product
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

          // Update activeBids in product
          const productWithBids = await db.collection("Products").findOne(productQuery);
          if (productWithBids && productWithBids.activeBids) {
            const updatedActiveBids = productWithBids.activeBids.map(productBid => {
              if (productBid.bidderId === bid.bidderId) {
                return { ...productBid, bidStatus: "accepted" };
              } else {
                return { ...productBid, bidStatus: "rejected" };
              }
            });

            await db.collection("Products").updateOne(
              productQuery,
              { $set: { activeBids: updatedActiveBids } }
            );
          }

          // Notify other bidders - FIXED PRODUCT NAME
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
              productName: product?.name || 'Unknown Product', // 🔥 FIXED
              isRead: false,
              createdAt: new Date()
            };
            await db.collection("Notification").insertOne(otherBidderNotification);
          }

          console.log(`✅ Product ${bid.productId} marked as sold to ${bid.bidderId}`);
        } else {
          console.log("❌ Product not found for marking as sold:", bid.productId);
        }
      }

      // If bid is rejected
      if (status.toLowerCase() === "rejected") {
        const productQuery = createProductQuery(bid.productId);
        const productWithBids = await db.collection("Products").findOne(productQuery);
        if (productWithBids && productWithBids.activeBids) {
          const updatedActiveBids = productWithBids.activeBids.map(productBid => {
            if (productBid.bidderId === bid.bidderId) {
              return { ...productBid, bidStatus: "rejected" };
            }
            return productBid;
          });

          await db.collection("Products").updateOne(
            productQuery,
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

  // Delete Notification
  router.delete("/notifications/:notificationId", async (req, res) => {
    try {
      const { notificationId } = req.params;
      
      console.log("Deleting notification:", notificationId);

      const notificationQuery = createNotificationQuery(notificationId);
      
      if (!notificationQuery) {
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

  // Mark Notification as Read
  router.put("/notifications/:notificationId/read", async (req, res) => {
    try {
      const { notificationId } = req.params;
      
      const notificationQuery = createNotificationQuery(notificationId);
      
      if (!notificationQuery) {
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