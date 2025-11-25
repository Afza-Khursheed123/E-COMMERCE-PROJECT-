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

  // 🔥 ULTIMATE UNIVERSAL ID HANDLER - Works for ALL ID types
  const createQuery = (id, collectionName = "User") => {
    if (!id || id === "undefined" || id === "null") {
      console.log('❌ Invalid ID:', id);
      return null;
    }

    console.log(`🔍 Processing ${collectionName} ID:`, id, 'Type:', typeof id);
    
    // Handle ObjectId objects (from MongoDB)
    if (id instanceof ObjectId) {
      console.log('✅ Using existing ObjectId object');
      return { _id: id };
    }
    
    // Handle objects with _id property
    if (typeof id === 'object' && id._id) {
      console.log('✅ Using object with _id property');
      return createQuery(id._id, collectionName);
    }
    
    // Convert to string for consistent handling
    const idString = String(id);
    
    // Try ObjectId if it's a valid 24-character hex string
    if (/^[0-9a-fA-F]{24}$/.test(idString)) {
      try {
        const objectId = new ObjectId(idString);
        console.log('✅ Using ObjectId query (24-char hex)');
        return { _id: objectId };
      } catch (error) {
        console.log('⚠️ ObjectId creation failed, using string');
      }
    }
    
    // Handle numeric strings
    if (/^\d+$/.test(idString)) {
      console.log('✅ Using numeric string ID');
      return { _id: idString };
    }
    
    // Handle custom string IDs (like "user_zain_001", "6922fc93aa49b9ca53718105-user_zain_001")
    if (idString.includes('_') || idString.includes('-')) {
      console.log('✅ Using custom string ID');
      return { _id: idString };
    }
    
    // Final fallback: use as string
    console.log('✅ Using fallback string ID');
    return { _id: idString };
  };

  // 🔥 ENHANCED: Universal finder with multiple fallback strategies
  const findDocumentWithFallbacks = async (id, collectionName) => {
    if (!id) return null;
    
    console.log(`🔄 Finding ${collectionName} with fallbacks for:`, id);
    
    // Strategy 1: Primary query
    const primaryQuery = createQuery(id, collectionName);
    if (primaryQuery) {
      let document = await db.collection(collectionName).findOne(primaryQuery);
      if (document) {
        console.log(`✅ ${collectionName} found with primary query`);
        return { document, query: primaryQuery };
      }
    }
    
    // Strategy 2: Try as string
    console.log('🔄 Trying string ID lookup...');
    let document = await db.collection(collectionName).findOne({ _id: String(id) });
    if (document) {
      console.log(`✅ ${collectionName} found with string ID`);
      return { document, query: { _id: String(id) } };
    }
    
    // Strategy 3: For Products, try alternative queries
    if (collectionName === "Products") {
      console.log('🔄 Trying alternative product queries...');
      
      // Try by name or other fields if needed
      document = await db.collection("Products").findOne({ 
        $or: [
          { _id: String(id) },
          { name: String(id) } // Fallback by name (unlikely but safe)
        ]
      });
      if (document) {
        console.log('✅ Product found with alternative query');
        return { document, query: { _id: document._id } };
      }
    }
    
    console.log(`❌ ${collectionName} not found with any strategy`);
    return null;
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

  const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 }
  });

  // 🔥 FIXED: Upload profile image route
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

      const userResult = await findDocumentWithFallbacks(userId, "User");
      if (!userResult) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      const imageUrl = `/uploads/profile-images/${req.file.filename}`;

      const result = await db.collection("User").updateOne(
        userResult.query,
        { 
          $set: { 
            profileImage: imageUrl,
            updatedAt: new Date()
          } 
        }
      );

      if (result.matchedCount === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ 
          success: false,
          message: 'User not found during update' 
        });
      }

      const updatedUser = await db.collection("User").findOne(userResult.query);

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

      const userResult = await findDocumentWithFallbacks(userId, "User");
      if (!userResult) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      // Delete old image file
      if (userResult.document.profileImage) {
        let oldImagePath;
        if (userResult.document.profileImage.startsWith('/uploads/')) {
          oldImagePath = path.join(__dirname, '../../', userResult.document.profileImage);
        } else if (userResult.document.profileImage.includes('uploads/profile-images')) {
          const filename = userResult.document.profileImage.split('/').pop();
          oldImagePath = path.join(__dirname, '../../uploads/profile-images', filename);
        }
        
        if (oldImagePath && fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('✅ Old profile image deleted');
        }
      }

      const result = await db.collection("User").updateOne(
        userResult.query,
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

  // 🔥 FIXED: Get authenticated user
  router.get("/auth/me", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] || req.query.userId || req.body.userId;
      if (!userId) {
        return res.status(400).json({ success: false, message: "Missing user ID" });
      }

      const userResult = await findDocumentWithFallbacks(userId, "User");
      if (!userResult) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({
        success: true,
        user: {
          _id: userResult.document._id.toString(),
          name: userResult.document.name,
          email: userResult.document.email,
          phone: userResult.document.phone || "",
          location: userResult.document.location || "",
          rating: userResult.document.rating || 0,
          profileImage: userResult.document.profileImage || "",
          joinedAt: userResult.document.joinedAt || null,
          role: userResult.document.role || "buyer",
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

      const userResult = await findDocumentWithFallbacks(userId, "User");
      if (!userResult) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
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

      const result = await db.collection("User").updateOne(
        userResult.query,
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

      const updatedUser = await db.collection("User").findOne(userResult.query);

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

  // 🔥 FIXED: Enhanced Delete Product Route - WORKS WITH STRING IDs
  router.delete("/product/:productId", async (req, res) => {
    try {
      const { productId } = req.params;

      console.log('🗑️ Deleting product:', productId);
      console.log('🔍 Product ID type:', typeof productId);

      // Use the universal finder for products
      const productResult = await findDocumentWithFallbacks(productId, "Products");
      
      if (!productResult) {
        return res.status(404).json({ 
          success: false,
          message: 'Product not found' 
        });
      }

      const product = productResult.document;
      console.log('🔍 Product found for deletion:', product.name);

      // Convert productId to string for consistent related data queries
      const productIdString = productId.toString();

      // Delete related data
      const [bidsDeleteResult, notificationsDeleteResult, reviewsDeleteResult] = await Promise.all([
        db.collection("Bids").deleteMany({
          productId: productIdString
        }),
        
        db.collection("Notification").deleteMany({
          $or: [
            { relatedProductId: productIdString },
            { "product._id": productIdString }
          ]
        }),
        
        db.collection("Reviews").deleteMany({
          productId: productIdString
        })
      ]);

      console.log(`🗑️ Cleanup: ${bidsDeleteResult.deletedCount} bids, ${notificationsDeleteResult.deletedCount} notifications, ${reviewsDeleteResult.deletedCount} reviews`);

      // Remove from user wishlists and carts
      const [wishlistUpdateResult, cartUpdateResult] = await Promise.all([
        db.collection("User").updateMany(
          { "wishlist.productId": productIdString },
          { $pull: { wishlist: { productId: productIdString } } }
        ),
        db.collection("User").updateMany(
          { "cart.items.productId": productIdString },
          { $pull: { "cart.items": { productId: productIdString } } }
        )
      ]);

      console.log(`🗑️ Cleanup: ${wishlistUpdateResult.modifiedCount} wishlist entries, ${cartUpdateResult.modifiedCount} cart entries`);

      // FINALLY: Delete the product using the correct query
      const deleteResult = await db.collection("Products").deleteOne(productResult.query);

      if (deleteResult.deletedCount === 0) {
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

  // 🔥 FIXED: Main Dashboard Route - Enhanced with proper product names
  router.get("/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log('📊 Fetching dashboard for user:', userId, 'Type:', typeof userId);

      const userResult = await findDocumentWithFallbacks(userId, "User");
      if (!userResult) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = userResult.document;
      console.log('✅ User found:', user.name, 'ID Type:', typeof user._id);

      // Convert user ID to string for consistent handling
      const userStringId = user._id.toString();
      console.log('🔧 Using string ID for queries:', userStringId);

      // Fetch all user products with multiple query strategies
      const userProducts = await db.collection("Products").find({
        $or: [
          { userId: userStringId },
          { userId: user._id },
          { "user.userId": userStringId },
          { "user.userId": user._id }
        ]
      })
      .project({ 
        name: 1, price: 1, condition: 1, available: 1, 
        images: 1, createdAt: 1, biddingEnabled: 1, swappable: 1
      })
      .sort({ createdAt: -1 })
      .toArray();

      console.log(`📈 Products fetched: ${userProducts.length}`);

      // Fetch other data
      const [
        userBids,
        bidsOnMyProducts,
        userOrders,
        userNotifications,
        userReviews
      ] = await Promise.all([
        db.collection("Bids")
          .find({ bidderId: userStringId })
          .project({
            bidAmount: 1, bidStatus: 1, productId: 1, 
            placedAt: 1, productName: 1, productOwnerId: 1
          })
          .sort({ placedAt: -1 })
          .toArray(),
        
        db.collection("Bids")
          .find({ productOwnerId: userStringId })
          .project({
            bidAmount: 1, bidStatus: 1, productId: 1, 
            bidderId: 1, placedAt: 1, bidderName: 1
          })
          .sort({ placedAt: -1 })
          .toArray(),
        
        db.collection("Orders")
          .find({ $or: [{ buyerId: userStringId }, { sellerId: userStringId }] })
          .project({
            totalAmount: 1, status: 1, orderDate: 1, items: 1
          })
          .sort({ orderDate: -1 })
          .toArray(),
        
        db.collection("Notification")
          .find({ userId: userStringId })
          .project({
            type: 1, title: 1, message: 1, relatedProductId: 1, 
            relatedBidId: 1, productName: 1, bidAmount: 1, 
            status: 1, isRead: 1, createdAt: 1, bidderName: 1,
            product: 1, sellerName: 1
          })
          .sort({ createdAt: -1 })
          .limit(20)
          .toArray(),
        
        db.collection("Reviews")
          .find({ userId: userStringId })
          .project({
            rating: 1, comment: 1, createdAt: 1, reviewerName: 1
          })
          .sort({ createdAt: -1 })
          .toArray()
      ]);

      console.log(`📈 Data fetched - Products: ${userProducts.length}, Bids: ${userBids.length}, Notifications: ${userNotifications.length}`);

      // 🔥 FIXED: Enhanced notifications with guaranteed product names
      const enhancedNotifications = await Promise.all(
        userNotifications.map(async (notif) => {
          let productName = notif.productName;
          let productDetails = notif.product;
          
          // If we don't have product name, try to get it from the product ID
          if ((!productName || productName === 'Unknown Product') && notif.relatedProductId) {
            try {
              const productResult = await findDocumentWithFallbacks(notif.relatedProductId, "Products");
              if (productResult) {
                productName = productResult.document.name;
                productDetails = {
                  _id: productResult.document._id.toString(),
                  name: productResult.document.name,
                  image: productResult.document.images?.[0],
                  price: productResult.document.price
                };
                console.log(`✅ Found product name for notification: ${productName}`);
              } else {
                console.log(`❌ Product not found for notification: ${notif.relatedProductId}`);
              }
            } catch (error) {
              console.error('Error enhancing notification:', error);
            }
          }
          
          return {
            ...notif,
            _id: notif._id?.toString(),
            productName: productName || 'Unknown Product',
            product: productDetails,
            // Ensure message has proper product name
            message: notif.message?.replace('Unknown Product', productName) || notif.message
          };
        })
      );

      // Calculate stats
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
        totalPurchases: userOrders.filter(o => o.buyerId === userStringId).length,
        totalSales: userOrders.filter(o => o.sellerId === userStringId).length,
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
        products: userProducts.map(p => ({
          ...p,
          _id: p._id.toString() // Ensure product IDs are strings for frontend
        })),
        bids: userBids.map(b => ({
          ...b,
          _id: b._id?.toString()
        })),
        soldProducts: soldProducts.map(p => ({
          ...p,
          _id: p._id.toString()
        })),
        orders: userOrders.map(o => ({
          ...o,
          _id: o._id?.toString()
        })),
        notifications: enhancedNotifications,
        reviews: userReviews.map(r => ({
          ...r,
          _id: r._id?.toString()
        })),
        stats,
      };

      console.log('✅ Dashboard data prepared successfully for:', user.name);
      res.json(dashboardData);
    } catch (error) {
      console.error("Dashboard route error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  // 🔥 FIXED: Update Offer Status - COMPLETELY FIXED 400 ERROR
// In dashboard.js - Update the bid status route to NOT mark product as sold immediately
router.put("/bids/:bidId/status", async (req, res) => {
  try {
    const { bidId } = req.params;
    const { status, acceptedAmount } = req.body;

    console.log("🔄 Updating bid status:", { bidId, status, acceptedAmount });

    // Validate status
    if (!status || !["accepted", "rejected", "active"].includes(status.toLowerCase())) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status. Must be 'accepted', 'rejected', or 'active'" 
      });
    }

    const bidResult = await findDocumentWithFallbacks(bidId, "Bids");
    if (!bidResult) {
      return res.status(404).json({ success: false, message: "Bid not found" });
    }

    const bid = bidResult.document;

    // ✅ FIX: Handle acceptedAmount properly - use bid amount if not provided
    let finalAcceptedAmount = acceptedAmount;
    
    if (status.toLowerCase() === "accepted") {
      if (!finalAcceptedAmount) {
        // Use the bid amount from the bid document if not provided
        finalAcceptedAmount = bid.bidAmount || bid.amount;
        console.log(`ℹ️ Using bid amount from document: $${finalAcceptedAmount}`);
      }
      
      // Validate that we have an amount
      if (!finalAcceptedAmount || isNaN(parseFloat(finalAcceptedAmount))) {
        return res.status(400).json({ 
          success: false, 
          message: "Valid accepted amount is required when accepting a bid" 
        });
      }
      
      finalAcceptedAmount = parseFloat(finalAcceptedAmount);
    }

    // Update bid status
    await db.collection("Bids").updateOne(
      bidResult.query,
      { $set: { bidStatus: status.toLowerCase(), updatedAt: new Date() } }
    );

    // Handle accepted bid - STORE ACCEPTED OFFER
    if (status.toLowerCase() === "accepted") {
      const productResult = await findDocumentWithFallbacks(bid.productId, "Products");
      const product = productResult?.document;
      
      if (product) {
        // ✅ STORE ACCEPTED OFFER for this specific user
        const acceptedOffer = {
          bidderId: bid.bidderId,
          acceptedAmount: finalAcceptedAmount,
          acceptedAt: new Date().toISOString(),
          bidId: bidId,
          originalPrice: product.price
        };

        // ✅ FIX: DO NOT mark product as sold immediately - let the winning bidder purchase it
        await db.collection("Products").updateOne(
          productResult.query,
          { 
            $set: { 
              acceptedOffer: acceptedOffer, // Store accepted offer for specific user
              // ❌ REMOVED: isAvailable: false, - Keep product available for winning bidder
              // ❌ REMOVED: soldTo: bid.bidderId, - Only set when actually purchased
              // ❌ REMOVED: soldPrice: finalAcceptedAmount, - Only set when actually purchased
              // ❌ REMOVED: soldAt: new Date() - Only set when actually purchased
            } 
          }
        );

        // ✅ UPDATE the winning bidder's cart item (if present) so stored cart price matches accepted offer
        try {
          const cartUpdate = await db.collection("Cart").updateOne(
            { userId: bid.bidderId, "items.productId": bid.productId },
            { $set: { "items.$.price": finalAcceptedAmount, "items.$.isAcceptedOffer": true } }
          );
          if (cartUpdate.modifiedCount > 0) {
            console.log(`✅ Updated cart for bidder ${bid.bidderId} with accepted price $${finalAcceptedAmount}`);
          }
        } catch (cartErr) {
          console.error("⚠️ Failed to update bidder's cart with accepted offer:", cartErr);
        }

        console.log(`✅ Accepted offer stored for user ${bid.bidderId}: $${finalAcceptedAmount}`);
      }

      // Reject all other bids on this product
      await db.collection("Bids").updateMany(
        { 
          productId: bid.productId, 
          _id: { $ne: bidResult.query._id }
        },
        { 
          $set: { 
            bidStatus: "rejected",
            updatedAt: new Date()
          } 
        }
      );
    }

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

    // Create notification for bidder with GUARANTEED product name
    if (status.toLowerCase() === "accepted" || status.toLowerCase() === "rejected") {
      const productResult = await findDocumentWithFallbacks(bid.productId, "Products");
      const product = productResult?.document;
      const sellerResult = await findDocumentWithFallbacks(bid.productOwnerId, "User");
      
      const productName = product?.name || bid.productName || 'the product';
      const sellerName = sellerResult?.document.name || 'the seller';
      
      const bidAmountToShow = status.toLowerCase() === 'accepted' ? finalAcceptedAmount : (bid.bidAmount || bid.amount);
      
      const bidderNotification = {
        userId: bid.bidderId,
        type: "bid_status",
        title: status.toLowerCase() === 'accepted' ? 'Offer Accepted! 🎉' : 'Offer Declined',
        message: status.toLowerCase() === 'accepted' 
          ? `Congratulations! Your offer of $${bidAmountToShow} on "${productName}" was accepted by ${sellerName}. You can now purchase it at this special price!`
          : `Your offer of $${bidAmountToShow} on "${productName}" was not accepted by ${sellerName}.`,
        relatedProductId: bid.productId,
        relatedBidId: bidId,
        productName: productName,
        bidAmount: bidAmountToShow,
        status: status.toUpperCase(),
        isRead: false,
        createdAt: new Date(),
        product: product ? {
          _id: product._id.toString(),
          name: product.name,
          image: product.images?.[0],
          price: status.toLowerCase() === 'accepted' ? finalAcceptedAmount : product.price
        } : null
      };
      
      await db.collection("Notification").insertOne(bidderNotification);
      console.log(`✅ Notification created for bidder: ${bid.bidderId}`);
    }

    // If bid is rejected, remove any existing accepted offer
    if (status.toLowerCase() === "rejected") {
      const productResult = await findDocumentWithFallbacks(bid.productId, "Products");
      if (productResult) {
        await db.collection("Products").updateOne(
          productResult.query,
          { 
            $unset: { acceptedOffer: "" }
            // ❌ REMOVED: Reset sold status since we're not using it anymore
          }
        );
        console.log(`✅ Removed accepted offer for product ${bid.productId}`);
      }
    }

    return res.json({ 
      success: true, 
      message: `Offer ${status.toLowerCase()} successfully!`,
      updatedStatus: status.toLowerCase(),
      acceptedAmount: finalAcceptedAmount
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
      const notificationResult = await findDocumentWithFallbacks(notificationId, "Notification");
      
      if (!notificationResult) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid notification ID format" 
        });
      }

      const result = await db.collection("Notification").deleteOne(notificationResult.query);

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
      const notificationResult = await findDocumentWithFallbacks(notificationId, "Notification");
      
      if (!notificationResult) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid notification ID format" 
        });
      }

      const result = await db.collection("Notification").updateOne(
        notificationResult.query,
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