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
const app = express();
const port = 3000;

//     Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // also parse form-encoded data

//     Debug Middleware — to check incoming requests
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  console.log("📦 Body:", req.body);
  next();
});

async function startServer() {
   try {
    const db = await connectToDatabase();
    console.log("    Connected to MongoDB Atlas");

    //     Attach routes and pass the db instance to them
  

     app.use("/home", homeRoute(db));
 app.use("/products", productRoute(db));
app.use("/category", categoryRoute(db));
    app.use("/login", loginRoute(db));
    app.use("/dashboard", dashboardRoute(db));
    app.use("/signup", signupRoute(db));
    app.use("/productlisting", productListingRoute(db));
    app.use("/bids", bidRoute(db));

    app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
  } catch (err) {
    console.error("    Failed to start server:", err);
  }

}
startServer();
