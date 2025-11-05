import express from "express";
import cors from "cors";
import { connectToDatabase } from "./connect.js";
import loginRoute from "./routes/login.js";
import signupRoute from "./routes/signup.js";
import complainRoute from "./routes/complainRoute.js";
import userMgtRoute from "./routes/userMgtRoute.js";
import paymentRoute from "./routes/paymentRoute.js";


const app = express();
const port = 3000;


// ✅ Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // also parse form-encoded data

// ✅ Debug Middleware — to check incoming requests
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  console.log("📦 Body:", req.body);
  next();
});

async function startServer() {
  try {
    const db = await connectToDatabase();
    console.log("✅ Connected to MongoDB Atlas");
    
    // ✅ Attach routes and pass the db instance to them
    app.use("/login", loginRoute(db));
    app.use("/signup", signupRoute(db));
    app.use("/admin/complain", complainRoute(db));
    app.use("/admin/users", userMgtRoute(db));
    app.use("/admin/payment", paymentRoute(db));

    app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }

}
startServer();
