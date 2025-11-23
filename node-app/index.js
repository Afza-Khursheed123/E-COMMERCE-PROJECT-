import express from "express";
import cors from "cors";
import { connectToDatabase } from "./connect.js";
import loginRoute from "./routes/login.js";
import signupRoute from "./routes/signup.js";
import homeRoute from "./routes/home.js";
import categoryRoute from "./routes/category.js";
import productRoute from "./routes/product.js";
import productListingRoute from "./routes/productListing.js";
import dashboardRoute from "./routes/dashboard.js";
import bidRoute from "./routes/bids.js";
import complainRoute from "./routes/complainRoute.js";
import userMgtRoute from "./routes/userMgtRoute.js";
import paymentRoute from "./routes/paymentRoute.js";
import orderMgtRoute from "./routes/orderMgtRoute.js";
import AdminDashboardRoute from "./routes/AdminDashboardRoute.js";
import cartRoute from "./routes/cartRoute.js";
import favoritesRoute from "./routes/favoritesRoute.js";
import stripeRoutes from "./routes/stripeRoute.js";
import orderRoute from "./routes/orders.js";
import contactRoute from "./routes/contactRoute.js";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Add this to your server.js or create a test route
app.get('/api/debug/stripe', (req, res) => {
  const stripeConfig = {
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    stripeKeyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...' : 'MISSING',
    frontendUrl: process.env.FRONTEND_URL,
    nodeEnv: process.env.NODE_ENV
  };
  
  console.log("🔧 Stripe Debug Info:", stripeConfig);
  
  res.json({
    success: true,
    message: "Stripe configuration debug",
    config: stripeConfig
  });
});

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    next(); // Skip JSON parsing for webhook
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// ✅ FIXED: Static file serving with correct path
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Debug Middleware — to check incoming requests
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  if (req.method !== 'GET') {
    console.log("📦 Body:", req.body);
  }
  next();
});

async function startServer() {
  try {
    const db = await connectToDatabase();
    console.log("✅ Connected to MongoDB Atlas");

    try {
      await db.collection('StripePaymentInfo').createIndex({ sessionId: 1 }, { unique: true });
      await db.collection('StripePaymentInfo').createIndex({ userId: 1 });
      await db.collection('orders').createIndex({ userId: 1 });
      await db.collection('orders').createIndex({ sessionId: 1 });
      console.log("✅ Database indexes created");
    } catch (indexError) {
      console.log("ℹ️ Indexes already exist or error:", indexError.message);
    }

    // Attach routes and pass the db instance to them
    app.use("/home", homeRoute(db));
    app.use("/products", productRoute(db));
    app.use("/category", categoryRoute(db));
    app.use("/login", loginRoute(db));
    app.use("/dashboard", dashboardRoute(db));
    app.use("/orders", orderRoute(db));
    app.use("/signup", signupRoute(db));
    app.use("/productlisting", productListingRoute(db));
    app.use("/bids", bidRoute(db));
    app.use("/admin/complain", complainRoute(db));
    app.use("/admin/users", userMgtRoute(db));
    app.use("/admin/payment", paymentRoute(db));
    app.use("/admin/orders", orderMgtRoute(db));
    app.use("/admin/dashboard", AdminDashboardRoute(db));
    app.use("/cart", cartRoute(db));
    app.use("/favorites", favoritesRoute(db));
    app.use("/api/stripe", stripeRoutes(db));
    app.use("/contact", contactRoute(db));

    // ✅ ADDED: Test route to verify static file serving
    app.get('/test-upload', (req, res) => {
      const uploadsPath = path.join(__dirname, '../uploads');
      res.json({
        message: "Test upload route",
        uploadsPath: uploadsPath,
        exists: require('fs').existsSync(uploadsPath)
      });
    });

    // ✅ ADDED: Debug route for uploads
    app.get('/debug-uploads', (req, res) => {
      const uploadsDir = path.join(__dirname, '../uploads');
      const profileImagesDir = path.join(uploadsDir, 'profile-images');
      
      try {
        const uploadsExists = require('fs').existsSync(uploadsDir);
        const profileImagesExists = require('fs').existsSync(profileImagesDir);
        
        let files = [];
        if (profileImagesExists) {
          files = require('fs').readdirSync(profileImagesDir);
        }
        
        res.json({
          uploadsDir,
          profileImagesDir,
          uploadsExists,
          profileImagesExists,
          files: files.slice(0, 10) // Show first 10 files
        });
      } catch (error) {
        res.json({
          error: error.message,
          uploadsDir,
          profileImagesDir
        });
      }
    });

    app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
}

startServer();