// Location: backend/server.js
// Only add these lines to your existing server.js

import express from "express";
import cors from "cors";
import { connectToDatabase } from "./connect.js";
import loginRoute from "./routes/login.js";
import signupRoute from "./routes/signup.js";
import complainRoute from "./routes/complainRoute.js";
import userMgtRoute from "./routes/userMgtRoute.js";
import paymentRoute from "./routes/paymentRoute.js";
import orderMgtRoute from "./routes/orderMgtRoute.js";
import dashboardRoute from "./routes/dashboardRoute.js";

// ✅ ADD THIS: Import Stripe routes
import stripeRoutes, { setStripeDatabase } from "./routes/stripeRoute.js";

const app = express();
const port = 3000;

// ✅ Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// ✅ IMPORTANT: Parse JSON EXCEPT for Stripe webhook route
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    next(); // Skip JSON parsing for webhook
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// ✅ Debug Middleware
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  if (req.method === 'POST' && req.url !== '/api/stripe/webhook') {
    console.log("📦 Body:", req.body);
  }
  next();
});

async function startServer() {
  try {
    const db = await connectToDatabase();
    console.log("✅ Connected to MongoDB Atlas");

    // ✅ ADD THIS: Set database for Stripe
    setStripeDatabase(db);

    // ✅ ADD THIS: Create indexes (optional but recommended)
    try {
      await db.collection('StripePaymentInfo').createIndex({ sessionId: 1 }, { unique: true });
      await db.collection('StripePaymentInfo').createIndex({ userId: 1 });
      console.log("✅ Database indexes created");
    } catch (indexError) {
      console.log("ℹ️ Indexes already exist");
    }

    // ✅ Existing routes
    app.use("/login", loginRoute(db));
    app.use("/signup", signupRoute(db));
    app.use("/admin/complain", complainRoute(db));
    app.use("/admin/users", userMgtRoute(db));
    app.use("/admin/payment", paymentRoute(db));
    app.use("/admin/orders", orderMgtRoute(db));
    app.use("/admin/dashboard", dashboardRoute(db));

    // ✅ ADD THIS: Stripe routes
    app.use("/api/stripe", stripeRoutes);

    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log(`📍 Stripe routes: http://localhost:${port}/api/stripe`);
    });

  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
}

startServer();