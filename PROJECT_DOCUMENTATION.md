# 📚 THRIFTIFYY - Complete Project Documentation

**A Thrift/Second-Hand E-Commerce Platform with Bidding System**

---

## 📖 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Project Flow](#project-flow)
5. [Key Features](#key-features)
6. [How Everything Works (User Journey)](#how-everything-works)
7. [Backend Routes & Functions](#backend-routes--functions)
8. [Frontend Pages & Components](#frontend-pages--components)
9. [Database Collections](#database-collections)
10. [File Structure & Explanations](#file-structure--explanations)

---

## 🎯 Project Overview

**What is Thriftifyy?**

Thriftifyy is an **e-commerce platform for buying and selling second-hand (thrift) items**. Instead of fixed prices, this platform uses a **bidding system** where:

- **Sellers** list items for sale
- **Buyers** place bids (offers) on items they want
- **Sellers** can accept the best bid or negotiate
- Once a bid is accepted, the buyer can purchase at that negotiated price

**Real-World Example:**
- A seller lists a vintage jacket for ₹2,500
- Buyer 1 bids ₹2,000
- Buyer 2 bids ₹2,200
- Seller accepts Buyer 2's bid at ₹2,200
- Buyer 2 now can purchase the jacket at ₹2,200 (not the original ₹2,500)

---

## 🛠️ Technology Stack

### **Backend (Node.js Express Server)**
```
Framework: Express.js (v5.1.0)
Database: MongoDB Atlas (Cloud Database)
Payment: Stripe API (Credit Card Payments)
Authentication: bcrypt (Password Hashing)
File Upload: Multer (Image Upload)
Port: 3000
```

### **Frontend (React + Vite)**
```
Framework: React (v18.3.1)
Build Tool: Vite (Fast bundler)
Styling: Tailwind CSS + Bootstrap
UI Library: React Bootstrap
Routing: React Router DOM
HTTP Client: Axios
Charts: Recharts (for Admin Dashboard)
Port: 5173
```

### **Database: MongoDB**
```
Cloud Service: MongoDB Atlas
Collections: 
  - User (accounts)
  - Products (items for sale)
  - Bids (offers/bids)
  - Orders (completed purchases)
  - Cart (shopping cart)
  - Favorites (wishlist)
  - Notifications
  - StripePaymentInfo (payment records)
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    THRIFTIFYY PLATFORM                          │
└─────────────────────────────────────────────────────────────────┘

                              ↓

┌──────────────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • HomePage: Browse & Search Products                       │ │
│  │ • ProductPage: View Details & Place Bids                   │ │
│  │ • Checkout: Complete Purchase                              │ │
│  │ • Dashboard: Track Orders & Bids                           │ │
│  │ • Profile: User Information & Settings                     │ │
│  │ • Admin Dashboard: Manage Users & Orders                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                         (Port 5173)                               │
└──────────────────────────────────────────────────────────────────┘

                    ↕ (HTTP REST API)

┌──────────────────────────────────────────────────────────────────┐
│                  BACKEND (Express.js Server)                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • 20+ Routes for Different Features                        │ │
│  │ • Authentication (Login/Signup)                            │ │
│  │ • Product Management                                        │ │
│  │ • Bidding System                                            │ │
│  │ • Payment Processing (Stripe)                              │ │
│  │ • Cart & Favorites Management                              │ │
│  │ • Order Management                                          │ │
│  │ • Admin Features                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                         (Port 3000)                               │
└──────────────────────────────────────────────────────────────────┘

                            ↕

┌──────────────────────────────────────────────────────────────────┐
│              DATABASE (MongoDB Atlas Cloud)                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • User Collection                                           │ │
│  │ • Products Collection                                       │ │
│  │ • Bids Collection                                           │ │
│  │ • Orders Collection                                         │ │
│  │ • Cart Collection                                           │ │
│  │ • Favorites Collection                                      │ │
│  │ • Notifications Collection                                  │ │
│  │ • Stripe Payment Info                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘

                            ↕

┌──────────────────────────────────────────────────────────────────┐
│            EXTERNAL SERVICES                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Stripe API: Payment Processing                           │ │
│  │ • File System: Store Uploaded Images                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Project Flow (How Everything Connects)

### **1. User Registration & Login**

```
User Opens Website
    ↓
Homepage Loads (No Login Required)
    ↓
User Clicks "Sign Up"
    ↓
Fills Name, Email, Password
    ↓
Frontend Sends Data → Backend (POST /signup)
    ↓
Backend Validates & Hashes Password with bcrypt
    ↓
Saves to MongoDB User Collection
    ↓
Returns Success Message
    ↓
User Gets Unique ID (stored in localStorage)
    ↓
User Can Now Login
```

### **2. Product Browsing & Selection**

```
User Views Homepage
    ↓
Backend Returns:
  • Featured Products (4 items)
  • Recently Added Items (4 items)
  • All Categories
    ↓
User Clicks on Product
    ↓
Frontend Fetches Product Details (GET /products/:id)
    ↓
Shows:
  • Product Images
  • Description & Details
  • Current Bids (if any)
  • User's Previous Bid (if logged in)
  • Add to Cart / Add to Favorites options
```

### **3. Bidding System (Main Feature)**

```
User Views Product → Wants to Buy
    ↓
Places a BID (offer) → "I'll pay $100"
    ↓
Frontend Sends → POST /products/:id/placeBid
    ↓
Backend:
  1. Validates bid amount
  2. Creates/Updates bid in Bids Collection
  3. Adds bid to Product's activeBids array
  4. Creates Notification for Product Owner
    ↓
Product Owner Gets Notification:
  "New bid of $100 on your [Product Name]"
    ↓
Product Owner Reviews Bids:
  • Bid 1: $95
  • Bid 2: $105 ← HIGHEST
  • Bid 3: $100
    ↓
Owner Clicks "Accept" on Bid 2 ($105)
    ↓
Backend:
  1. Updates Bid Status to "Accepted"
  2. Rejects All Other Bids
  3. Marks Product as "Sold"
  4. Stores Accepted Offer Info
    ↓
Buyer 2 Gets Notification:
  "Your offer has been ACCEPTED! Pay now at $105"
    ↓
Buyer 2 Can Now:
  • Add to Cart at Special Price ($105)
  • Complete Payment
```

### **4. Shopping Cart & Checkout**

```
User Clicks "Add to Cart"
    ↓
Frontend Sends → POST /cart/add
    ↓
Backend:
  1. Finds User's Cart
  2. Adds Product with Price
  3. If Accepted Bid Exists → Uses Bid Price
  4. Otherwise → Uses Regular Price
    ↓
Cart Updated in MongoDB
    ↓
User Views Cart → Shows All Items with Total
    ↓
User Clicks "Checkout"
    ↓
Frontend Sends → POST /api/stripe/create-checkout-session
    ↓
Backend:
  1. Validates Cart Items
  2. Calculates Tax (8%)
  3. Creates Stripe Session
  4. Returns Stripe URL
    ↓
User Redirected to Stripe Payment Page
    ↓
User Enters Card Details
    ↓
Payment Successful ✓
    ↓
Stripe Webhook Triggers
    ↓
Backend:
  1. Updates Payment Status
  2. Creates Order in Orders Collection
  3. Clears Cart
  4. Updates Product as Sold
    ↓
User Gets Order Confirmation
    ↓
Order Appears in User's Dashboard
```

### **5. Admin Management**

```
Admin Logs In
    ↓
Views Admin Dashboard
    ↓
See Metrics:
  • Total Users
  • Total Revenue
  • Active Orders
  • Complaints
    ↓
Can Manage:
  1. USERS:
     - View All Users
     - Suspend/Activate Accounts
     - View User Details

  2. ORDERS:
     - View All Orders
     - Track Status
     - See Revenue per Order

  3. PAYMENTS:
     - View Payment Records
     - Track Commission
     - See Pending Payouts

  4. COMPLAINTS:
     - View User Complaints
     - Resolve Issues
     - Track Resolution
```

---

## ✨ Key Features

### **For Buyers:**
1. ✅ Browse Products by Category
2. ✅ Search & Filter Products
3. ✅ Place Bids (Offers) on Items
4. ✅ Track Bid Status (Pending/Accepted/Rejected)
5. ✅ Add Items to Wishlist/Favorites
6. ✅ Add to Cart & Checkout
7. ✅ Make Secure Payment via Stripe
8. ✅ Track Orders & Delivery Status
9. ✅ Rate & Review Products
10. ✅ File Complaints

### **For Sellers:**
1. ✅ Upload & List Products
2. ✅ Set Starting Price (can be negotiated)
3. ✅ Receive Notifications for New Bids
4. ✅ View All Bids on Their Products
5. ✅ Accept Best Bid or Counter-Offer
6. ✅ Track Sales & Revenue
7. ✅ Manage Inventory
8. ✅ View Dashboard with Analytics

### **For Admins:**
1. ✅ Complete Dashboard with Analytics
2. ✅ User Management (Suspend/Activate)
3. ✅ Order Management & Tracking
4. ✅ Revenue Reports
5. ✅ Complaint Resolution
6. ✅ Payment Management
7. ✅ View Platform Statistics

---

## 🚀 How Everything Works (User Journey)

### **Journey 1: Buyer's Path**

```
STEP 1: Sign Up / Login
├─ Create Account or Login with Credentials
├─ Get User ID stored in localStorage
└─ Now User is Authenticated

STEP 2: Browse Products
├─ Visit Homepage
├─ See Featured & Recently Added Items
├─ Click on Categories
└─ Search or Filter Products

STEP 3: View Product Details
├─ Click on Product Card
├─ See Images, Description, Specs
├─ See Current Bids (if any)
├─ See Product Owner Info
└─ Option to Like/Unlike Product

STEP 4: Place a Bid
├─ Enter Your Offer Amount
├─ Click "Place Bid"
├─ Bid Submitted to Backend
├─ Get Confirmation
└─ See Your Bid in List

STEP 5: Wait for Acceptance
├─ See Bid Status: "Pending"
├─ Product Owner Reviews All Bids
├─ Owner Accepts/Rejects Your Bid
├─ If Accepted → Get Notification
└─ Can Now Purchase at Bid Price

STEP 6: Add to Cart
├─ Click "Add to Cart"
├─ Product Added with Special Bid Price
└─ Can Modify Quantity

STEP 7: Checkout
├─ Go to Cart
├─ Review Items & Total
├─ Click "Checkout"
└─ Taken to Payment Page

STEP 8: Payment
├─ Redirected to Stripe
├─ Enter Card Details
├─ Authorize Payment
├─ Return to Website
└─ Get Confirmation

STEP 9: Order Confirmation
├─ See Order ID
├─ Get Email Confirmation
├─ View in Dashboard → Orders
├─ Track Shipping Status
└─ Rate Product When Received

STEP 10: Favorites & Wishlist
├─ Can Save Products to Favorites
├─ View Favorites Later
├─ Get Notifications on Price Changes
└─ Quick Add to Cart from Favorites
```

### **Journey 2: Seller's Path**

```
STEP 1: Upload Product
├─ Go to Dashboard → My Products
├─ Click "Add New Product"
├─ Fill Details:
│  ├─ Product Name & Description
│  ├─ Category
│  ├─ Starting Price
│  ├─ Upload Images
│  └─ Condition (New/Like New/Good/Fair)
└─ Submit

STEP 2: Product Listed
├─ Product Goes Live
├─ Appears in Search & Categories
├─ Available for Buyers to Bid
└─ Seller Can Edit/Delete

STEP 3: Receive Bids
├─ Buyer Places Bid
├─ Seller Gets Real-time Notification
├─ See Bid Details:
│  ├─ Buyer Name
│  ├─ Offered Amount
│  └─ Bid Date
└─ Can See All Previous Bids

STEP 4: Review & Accept Bid
├─ View All Bids on Product
├─ Compare Amounts
├─ Click "Accept" on Best Bid
├─ Other Bids Auto-Rejected
└─ Buyer Gets Notification

STEP 5: Get Paid
├─ Buyer Completes Payment via Stripe
├─ Money Transferred to Seller Account
├─ Can See in Dashboard
└─ Track Commission Deducted

STEP 6: Track Sales
├─ Dashboard Shows:
│  ├─ Revenue This Month
│  ├─ Items Sold
│  ├─ Pending Orders
│  └─ Total Rating
└─ Can View Analytics

STEP 7: Handle Issues
├─ If Buyer Files Complaint
├─ Seller Gets Notification
├─ Can Respond to Complaint
└─ Admin Resolves if Needed
```

---

## 🔗 Backend Routes & Functions

### **Authentication Routes** (`/login`, `/signup`)

#### **POST /login** - User Login
```
Input:
  • email: user@example.com
  • password: password123

Process:
  1. Find User by Email in Database
  2. Compare Password using bcrypt
  3. Check if Account is Suspended

Output (Success):
  • User ID
  • Name, Email, Role
  • Profile Image
  • Status (Active/Suspended)
  • Joined Date

Output (Error):
  • Invalid credentials
  • Account suspended
  • Server error
```

#### **POST /signup** - User Registration
```
Input:
  • name: John Doe
  • email: john@example.com
  • password: password123 (min 8 chars)
  • role: buyer (or seller)

Process:
  1. Validate Email Format
  2. Validate Password Length (≥8)
  3. Check if Email Already Exists
  4. Hash Password with bcrypt (10 rounds)
  5. Create New User with String ID
  6. Initialize Empty Wishlist

Output:
  • Success Message
  • User ID
  • Role Confirmation
```

---

### **Product Routes** (`/products`)

#### **GET /products** - Get All Products
```
Process:
  1. Fetch All Products from Database
  2. Return Product Array

Output:
  [
    {
      _id: "product123",
      name: "Vintage Jacket",
      price: 2500,
      images: ["url1", "url2"],
      category: "Clothing",
      description: "Nice vintage jacket",
      userId: "seller123",
      activeBids: [{...}, {...}],
      ratings: [{...}],
      likes: 45,
      isAvailable: true
    },
    ...
  ]
```

#### **GET /products/:id** - Get Single Product Details
```
Input:
  • id: product123 (product ID)
  • userId: buyer123 (optional, for personalization)

Process:
  1. Find Product by ID
  2. If User is Owner → Show ALL Bids
  3. If Regular User → Show Only Their Own Bids
  4. Check for Accepted Offer for This User
  5. Calculate Average Rating
  6. Return Customized Product Data

Output:
  {
    _id: "product123",
    name: "Vintage Jacket",
    price: 2500,
    images: [...],
    activeBids: [...],
    acceptedOffer: {if user won the bid},
    userRating: 4.5,
    liked: true,
    isOwner: false,
    averageRating: 4.2
  }
```

#### **POST /products/:id/placeBid** - Place or Update Bid
```
Input:
  • id: product123
  • amount: 2200 (offer price)
  • bidderId: buyer123
  • bidderName: John Doe

Process:
  1. Validate Product Exists & Available
  2. Check if User Already Bid on This Product
  3. If Yes → Update Bid Amount (isUpdate = true)
  4. If No → Create New Bid (isUpdate = false)
  5. Save to Bids Collection
  6. Update Product's activeBids Array
  7. Create/Update Notification for Product Owner
  8. Log the action

Output:
  {
    message: "Bid placed/updated successfully",
    product: {...updated product...},
    bid: {...bid details...},
    isUpdate: true/false
  }

Notification Sent to Seller:
  "💰 New offer of $2200 placed by John Doe on Vintage Jacket"
  or
  "💰 John Doe updated their offer from $2100 to $2200"
```

#### **POST /products/:id/acceptBid** - Accept a Bid
```
Input:
  • id: product123
  • bidId: bidId123
  • bidderId: buyer123
  • acceptedAmount: 2200

Process:
  1. Find Product
  2. Update Bid Status → "accepted"
  3. Reject All Other Bids for This Product
  4. Store Accepted Offer Information
  5. Mark Product as Sold (isAvailable: false)
  6. Create Notification for Buyer
  7. Update Product Owner Info

Output:
  {
    message: "Offer accepted successfully",
    acceptedOffer: {
      bidderId: "buyer123",
      acceptedAmount: 2200,
      bidId: "bidId123",
      acceptedAt: "2024-11-26T..."
    }
  }

Notification Sent to Buyer:
  "🎉 Your offer of $2200 for Vintage Jacket has been accepted!"
```

#### **PATCH /products/:id/like** - Like/Unlike Product
```
Input:
  • id: product123
  • userId: buyer123 (in body)

Process:
  1. Find Product
  2. Check if User Already Liked
  3. If Yes → Remove from likes Array
  4. If No → Add to likes Array
  5. Update Database

Output:
  {
    likes: 46,
    liked: true (current status)
  }
```

#### **POST /products/:id/rate** - Rate Product (1-5 stars)
```
Input:
  • id: product123
  • userId: buyer123
  • rating: 4 (1-5)

Process:
  1. Validate Rating (1-5)
  2. Check if User Already Rated
  3. If Yes → Update Rating
  4. If No → Add New Rating
  5. Recalculate Average Rating
  6. Update Product

Output:
  {
    averageRating: 4.2,
    userRating: 4
  }
```

#### **POST /products/:id/comment** - Comment on Product
```
Input:
  • id: product123
  • userId: buyer123
  • text: "Great quality!"
  • userName: "John Doe"

Process:
  1. Create Comment Object with Timestamp
  2. Add to Product's Comments Array
  3. Update Database

Output:
  [
    {
      _id: "comment123",
      userId: "buyer123",
      userName: "John Doe",
      text: "Great quality!",
      createdAt: "2024-11-26T..."
    },
    ...
  ]
```

---

### **Cart Routes** (`/cart`)

#### **GET /cart/user/:userId** - Get User's Cart
```
Input:
  • userId: user123

Process:
  1. Find Cart for User
  2. If Not Exists → Create Empty Cart
  3. For Each Item:
     - Fetch Latest Product Info
     - Check for Accepted Bids (use special price)
     - Update Price if Bid Accepted
  4. Recalculate Total
  5. Recalculate Item Count

Output:
  {
    userId: "user123",
    items: [
      {
        productId: "prod1",
        quantity: 2,
        price: 2200, ← Special price if bid accepted
        isAcceptedOffer: true,
        productName: "Vintage Jacket",
        image: "url"
      }
    ],
    total: 4400,
    itemCount: 2,
    updatedAt: "2024-11-26T..."
  }
```

#### **POST /cart/add** - Add Item to Cart
```
Input:
  • userId: user123
  • productId: prod1
  • quantity: 1 (optional, default 1)

Process:
  1. Fetch Product Details
  2. Check for Accepted Bid (use bid price if exists)
  3. Find User's Cart
  4. If Item Already in Cart → Increase Quantity
  5. If New Item → Add to Items Array
  6. Recalculate Totals
  7. Save to Database

Output:
  {
    message: "Item added to cart",
    cart: {...updated cart...},
    usedAcceptedOffer: true/false
  }
```

#### **POST /cart/update** - Update Cart Item Quantity
```
Input:
  • userId: user123
  • productId: prod1
  • quantity: 3

Process:
  1. Find Cart Item
  2. Update Quantity
  3. If Quantity ≤ 0 → Remove Item
  4. Recalculate Totals
  5. Save to Database

Output:
  {
    message: "Cart updated",
    cart: {...}
  }
```

#### **POST /cart/remove** - Remove Item from Cart
```
Input:
  • userId: user123
  • productId: prod1

Process:
  1. Find Cart
  2. Remove Product from Items
  3. Recalculate Totals
  4. Update Database

Output:
  {
    message: "Item removed from cart",
    cart: {...}
  }
```

---

### **Favorites Routes** (`/favorites`)

#### **GET /favorites/user/:userId** - Get User's Favorites
```
Process:
  1. Find Favorites for User
  2. If Not Exists → Create Empty Favorites
  3. Return Items Array

Output:
  {
    userId: "user123",
    items: [
      {
        productId: "prod1",
        addedAt: "2024-11-26T..."
      }
    ]
  }
```

#### **POST /favorites/add** - Add to Favorites
```
Input:
  • userId: user123
  • productId: prod1

Process:
  1. Check if Already in Favorites
  2. If No → Add New Item
  3. If Yes → Do Nothing (duplicate prevention)
  4. Update Database

Output:
  {
    message: "Added to favorites",
    favorites: {...}
  }
```

#### **POST /favorites/remove** - Remove from Favorites
```
Input:
  • userId: user123
  • productId: prod1

Process:
  1. Find Favorites
  2. Remove Product from Items
  3. Update Database

Output:
  {
    message: "Removed from favorites",
    favorites: {...}
  }
```

---

### **Orders Routes** (`/orders`)

#### **GET /orders/user/:userId** - Get User's Orders
```
Input:
  • userId: user123

Process:
  1. Find All Orders for User
  2. Sort by Date (Newest First)
  3. Transform Order Data
  4. Include Products Array
  5. Return All Orders

Output:
  [
    {
      _id: "order123",
      orderId: "order123",
      userId: "user123",
      status: "Delivered",
      totalAmount: 4400,
      subtotal: 4074.08,
      tax: 325.92,
      paymentMethod: "stripe",
      shippingAddress: {...},
      customerEmail: "user@example.com",
      products: [
        {
          productId: "prod1",
          quantity: 2,
          price: 2200
        }
      ],
      createdAt: "2024-11-26T..."
    }
  ]
```

---

### **Payment Routes** (`/api/stripe`)

#### **POST /api/stripe/create-checkout-session** - Create Stripe Session
```
Input:
  • customerEmail: user@example.com
  • userId: user123
  • products: [
      {
        productId: "prod1",
        name: "Vintage Jacket",
        price: 2200,
        quantity: 2,
        images: ["url"]
      }
    ]
  • shippingAddress: {...}

Process:
  1. Validate Email & Products
  2. Calculate Subtotal
  3. Calculate Tax (8%)
  4. Calculate Total
  5. Create Line Items for Stripe
  6. Create Stripe Session
  7. Store Session Info in Database
  8. Return Checkout URL

Output:
  {
    sessionUrl: "https://checkout.stripe.com/...",
    sessionId: "cs_test_..."
  }

User Redirected to:
  Stripe Checkout Page → Enter Card Details → Payment
```

#### **POST /api/stripe/webhook** - Handle Stripe Webhook
```
Triggered When:
  • Payment Successful
  • Payment Failed
  • Session Completed

Process (On Payment Success):
  1. Verify Webhook Signature
  2. Extract Order Info from Session
  3. Create Order Record in Database
  4. Update Product Status (sold)
  5. Clear User's Cart
  6. Send Confirmation Email
  7. Create Notification for User

Output:
  {
    success: true,
    orderId: "order123",
    message: "Payment processed successfully"
  }
```

---

### **Admin Routes** (`/admin/...`)

#### **GET /admin/dashboard** - Admin Dashboard Data
```
Output:
  {
    totalUsers: 150,
    userGrowth: 12,
    totalRevenue: 45000,
    revenueGrowth: 8.5,
    activeOrders: 32,
    ordersGrowth: 5,
    openComplaints: 3,
    complaintsGrowth: -2,
    recentOrders: [...],
    commission: {
      totalEarned: 4500,
      pendingPayouts: 800,
      rate: 10
    }
  }
```

#### **GET /admin/users** - Get All Users
```
Output:
  {
    success: true,
    users: [
      {
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
        role: "buyer",
        status: "Active",
        joinedAt: "2024-11-01T..."
      }
    ]
  }
```

#### **PATCH /admin/users/status/:id** - Suspend/Activate User
```
Input:
  • id: user123
  • Action: Toggle Status

Process:
  1. Find User
  2. Toggle Status (Active ↔ Suspended)
  3. If Suspended → User Cannot Login
  4. Update Database

Output:
  {
    success: true,
    status: "Suspended"
  }
```

#### **GET /admin/orders** - Get All Orders
```
Output:
  [
    {
      _id: "order123",
      status: "Processing",
      totalAmount: 4400,
      user: {...},
      createdAt: "2024-11-26T..."
    }
  ]
```

#### **GET /admin/complain** - Get All Complaints
```
Output:
  [
    {
      _id: "complaint123",
      userId: "user123",
      title: "Item Quality Issue",
      description: "Item damaged on arrival",
      status: "Open",
      createdAt: "2024-11-26T..."
    }
  ]
```

---

## 🎨 Frontend Pages & Components

### **Page Structure**

```
src/pages/
├── HomePage.jsx
│   Purpose: Display featured products, categories, "How It Works"
│   Shows: Featured items, Recently added items, Call-to-action
│
├── ProductListing.jsx
│   Purpose: Show all products with filters
│   Shows: Grid of products, Search/Filter options, Pagination
│
├── ProductPage.jsx
│   Purpose: Single product details with bidding
│   Shows: Images, Description, Bid form, Comments, Ratings
│   Features: Place bid, Add to cart, Add to favorites
│
├── login.jsx
│   Purpose: User login form
│   Shows: Email, Password inputs
│   Logic: Validates, Hashes password, Stores user token
│
├── signup.jsx
│   Purpose: User registration form
│   Shows: Name, Email, Password, Role selection
│   Logic: Validates, Creates account, Redirects to login
│
├── Checkout.jsx
│   Purpose: Cart review and payment
│   Shows: Cart items, Shipping address, Stripe payment
│
├── profile/profile.jsx
│   Purpose: User profile management
│   Shows: User info, Bought orders, Sold orders, Uploaded items
│   Features: Edit profile, View history, Manage preferences
│
├── profile/DashboardPage.jsx
│   Purpose: Seller/Buyer dashboard
│   Shows: Order status, Revenue, Active listings
│
├── profile/complaint.jsx
│   Purpose: File and track complaints
│   Shows: Complaint history, Status updates
│
├── categories/categories.jsx
│   Purpose: Browse by category
│   Shows: All categories, Products in each category
│
├── OrderMgt.jsx
│   Purpose: Admin order management
│   Shows: All orders, Order details, Status updates
│
├── UserMgt.jsx
│   Purpose: Admin user management
│   Shows: All users, User actions (suspend/activate)
│
├── PaymentMgt.jsx
│   Purpose: Admin payment management
│   Shows: Payments, Revenue, Commission tracking
│
└── Dashboard.jsx
    Purpose: Admin main dashboard
    Shows: Statistics, Charts, Quick actions
```

### **Component Structure**

```
src/components/
├── ProductCard.jsx
│   Purpose: Display product in grid/list
│   Shows: Image, Name, Price, Rating, Like button
│   Input: product (object)
│
├── CategoryCard.jsx
│   Purpose: Display category tile
│   Shows: Category name, Icon, Item count
│
├── SearchBar.jsx
│   Purpose: Search/Filter products
│   Shows: Input field, Filter options
│
├── Loader.jsx
│   Purpose: Loading spinner
│   Shows: Animation while data loads
│
└── adminComp/
    ├── Sidebar.jsx
    │   Purpose: Admin navigation menu
    │   Shows: Dashboard, Users, Orders, Payments, Complaints
    │
    └── StatCard.jsx
        Purpose: Display metric card
        Shows: Stat name, Value, Growth percentage
```

### **Key Frontend Files Explained**

#### **HomePage.jsx** - Landing Page
```jsx
FUNCTION: Display attractive landing page with:
├─ Hero Section: 
│  ├─ "Give Items a Second Chance" headline
│  ├─ "Explore Now" button
│  └─ Gradient background
├─ Featured Products Section:
│  ├─ Shows 8 featured products
│  └─ Product cards in grid
├─ How It Works Section:
│  ├─ 5 step process
│  └─ Visual explanation
└─ Recently Added Section:
   ├─ Shows latest items
   └─ Newest first

DATA FLOW:
1. Component Mounts
2. useEffect Triggers
3. Fetch from /home endpoint
4. Backend Returns:
   - categories
   - featured (4 items)
   - recentlyAdded (4 items)
5. Display on Page
```

#### **ProductPage.jsx** - Product Details & Bidding
```jsx
MAIN PURPOSE: 
  Show single product with full details and bidding system

WHAT IT DISPLAYS:
├─ Product Images (Carousel)
├─ Product Description & Details
├─ Current Price
├─ Active Bids (if product owner)
├─ User's Own Bid (if buyer)
├─ Accepted Offer Status (if buyer won)
├─ Comments & Ratings
├─ Product Owner Info
├─ Action Buttons:
│  ├─ Place Bid
│  ├─ Add to Cart
│  ├─ Add to Favorites
│  └─ Like Product

KEY FUNCTIONS:
1. fetchProduct()
   - Get product details
   - Check if user is owner
   - Load user's previous bid
   - Check cart status

2. handlePlaceBid()
   - Validate bid amount
   - Send to backend (POST /products/:id/placeBid)
   - Update local state
   - Show notification

3. handleAcceptBid() ← SELLER ONLY
   - Send to backend (POST /products/:id/acceptBid)
   - Update bid status
   - Notify buyer

4. handleAddToCart()
   - Send to backend (POST /cart/add)
   - Show confirmation

5. handleToggleFavorite()
   - Add/Remove from favorites
   - Send to backend

STATE MANAGEMENT:
├─ product: Current product data
├─ loading: Is data loading?
├─ userOffer: User's bid on this product
├─ isInCart: Is product in user's cart?
├─ isFavorite: Is product favorited?
├─ offerAmount: Current bid input value
└─ selectedImage: Currently displayed image

LOGIC FLOW:
1. Component loads
2. Fetch product from backend
3. If user logged in:
   - Get user ID from localStorage
   - Fetch user's bid status
   - Fetch cart status
   - Fetch favorites status
4. Display product with user-specific data
5. User can interact with bid/cart/favorite buttons
6. On action → Send to backend → Update state
```

#### **Checkout.jsx** - Cart Review & Payment
```jsx
MAIN PURPOSE:
  Display cart items and facilitate Stripe payment

WHAT IT DISPLAYS:
├─ Cart Items with:
│  ├─ Product Name
│  ├─ Quantity
│  ├─ Unit Price
│  └─ Total Price
├─ Subtotal, Tax, Total
├─ Shipping Address Form
└─ Stripe Payment Button

KEY FUNCTIONS:
1. fetchCartItems()
   - Get cart from backend (GET /cart/user/:userId)
   - Display all items with prices

2. handleCheckout()
   - Validate shipping address
   - Validate cart not empty
   - Send to backend (POST /api/stripe/create-checkout-session)
   - Get Stripe URL
   - Redirect to Stripe payment page

3. onStripeSuccess()
   - Called after payment succeeds
   - Clear cart in backend
   - Redirect to order confirmation
   - Show success message

FLOW:
1. User navigates to Checkout
2. Cart items loaded
3. User enters/confirms shipping address
4. User clicks "Pay Now"
5. Redirected to Stripe
6. User enters payment info
7. Stripe processes payment
8. If Success → Backend creates order
9. User redirected to confirmation page
```

---

## 💾 Database Collections

### **User Collection**
```javascript
{
  _id: "string_id_123",              // Unique user ID
  name: "John Doe",                  // Full name
  email: "john@example.com",         // Email (unique)
  passwordHash: "bcrypt_hash",       // Hashed password
  role: "buyer",                     // Role: buyer, seller, admin
  status: "Active",                  // Active or Suspended
  location: "Karachi, Pakistan",     // User location
  profileImage: "url_to_image",      // Profile photo URL
  rating: 4.5,                       // User rating (average)
  joinedAt: "2024-11-01T...",        // Account creation date
  wishlist: [],                      // Array of favorited product IDs
  createdAt: "2024-11-01T..."        // Timestamp
}
```

### **Products Collection**
```javascript
{
  _id: "product_id_123",             // Unique product ID
  name: "Vintage Jacket",            // Product name
  description: "Nice jacket...",     // Description
  price: 2500,                       // Starting price
  category: "Clothing",              // Product category
  condition: "Good",                 // Condition: New, Like New, Good, Fair
  images: ["url1", "url2", ...],    // Array of image URLs
  userId: "seller_id",               // ID of seller
  isAvailable: true,                 // Available for bidding?
  activeBids: [                      // Current bids on product
    {
      bidId: "bid123",
      bidderId: "buyer_id",
      bidderName: "Jane",
      amount: 2200,
      bidStatus: "pending",
      date: "2024-11-26T..."
    }
  ],
  acceptedOffer: {                   // Accepted bid details
    bidderId: "buyer_id",
    acceptedAmount: 2200,
    acceptedAt: "2024-11-26T...",
    bidId: "bid123"
  },
  ratings: [                         // Product ratings
    {
      userId: "buyer_id",
      rating: 5,
      createdAt: "2024-11-26T..."
    }
  ],
  likes: ["user_id_1", "user_id_2"],// Users who liked
  comments: [                        // Product comments
    {
      userId: "user_id",
      userName: "John",
      text: "Great product!",
      createdAt: "2024-11-26T..."
    }
  ],
  soldTo: "buyer_id",               // ID of buyer (after sold)
  soldPrice: 2200,                  // Final selling price
  soldAt: "2024-11-26T...",         // Sale date
  createdAt: "2024-11-26T..."       // Creation date
}
```

### **Bids Collection**
```javascript
{
  _id: "prod_id-buyer_id",          // Unique bid ID
  productId: "product_id",          // Product being bid on
  productName: "Vintage Jacket",    // Product name (denorm)
  productOwnerId: "seller_id",      // Seller's ID
  bidderId: "buyer_id",             // Buyer's ID
  bidderName: "Jane",               // Buyer's name
  bidAmount: 2200,                  // Bid amount
  bidStatus: "pending",             // pending, accepted, rejected
  placedAt: "2024-11-26T...",       // When bid was placed
  updatedAt: "2024-11-26T..."       // Last update
}
```

### **Orders Collection**
```javascript
{
  _id: "order_id_123",              // Unique order ID
  userId: "buyer_id",               // Buyer's ID
  products: [                        // Items ordered
    {
      productId: "prod_id",
      productName: "Vintage Jacket",
      quantity: 2,
      price: 2200,                  // Price per unit
      image: "url"
    }
  ],
  subtotal: 4400,                   // Before tax
  tax: 352,                         // Tax amount (8%)
  totalAmount: 4752,                // Total including tax
  paymentMethod: "stripe",          // Payment method
  paymentStatus: "succeeded",       // Payment status
  shippingAddress: {                // Delivery address
    fullName: "John Doe",
    address: "123 Main St",
    city: "Karachi",
    state: "Sindh",
    zipCode: "75500",
    country: "Pakistan"
  },
  customerEmail: "john@example.com",// Email confirmation
  status: "Processing",             // Order status
  sessionId: "stripe_session_id",   // Stripe session ID
  createdAt: "2024-11-26T...",      // Order date
  updatedAt: "2024-11-26T..."       // Last update
}
```

### **Cart Collection**
```javascript
{
  _id: "ObjectId",                  // MongoDB auto ID
  userId: "user_id",                // User's ID
  items: [                          // Items in cart
    {
      productId: "prod_id",
      productName: "Vintage Jacket",
      quantity: 2,
      price: 2200,                  // Could be bid price
      originalPrice: 2500,          // Original asking price
      isAcceptedOffer: true,        // Is bid accepted?
      image: "url",
      addedAt: "2024-11-26T..."
    }
  ],
  total: 4400,                      // Cart total
  itemCount: 2,                     // Number of items
  createdAt: "2024-11-26T...",
  updatedAt: "2024-11-26T..."
}
```

### **Favorites Collection**
```javascript
{
  _id: "ObjectId",
  userId: "user_id",                // User's ID
  items: [                          // Favorited products
    {
      productId: "prod_id",
      addedAt: "2024-11-26T..."
    }
  ],
  createdAt: "2024-11-26T...",
  updatedAt: "2024-11-26T..."
}
```

### **Notifications Collection**
```javascript
{
  _id: "notification_id",           // Unique ID
  userId: "user_id",                // Recipient
  type: "bid",                      // Type: bid, bid_accepted, order, complaint
  title: "New Offer Received",      // Notification title
  message: "Jane bid $2200 on...",  // Notification message
  relatedProductId: "prod_id",      // Related product
  relatedBidId: "bid_id",           // Related bid
  productName: "Vintage Jacket",    // Product name
  bidderName: "Jane",               // Bidder name
  bidAmount: 2200,                  // Bid amount
  status: "PENDING",                // Notification status
  isRead: false,                    // Has user read it?
  createdAt: "2024-11-26T..."
}
```

### **StripePaymentInfo Collection**
```javascript
{
  _id: "ObjectId",
  sessionId: "stripe_session_id",   // Stripe session ID (unique)
  userId: "user_id",                // User's ID
  customerEmail: "user@email.com",  // Customer email
  amount: 4752,                     // Total amount
  currency: "USD",
  status: "succeeded",              // succeeded, failed, pending
  products: [...],                  // Products in session
  shippingAddress: {...},           // Shipping details
  createdAt: "2024-11-26T...",
  updatedAt: "2024-11-26T..."
}
```

---

## 📁 File Structure & Explanations

### **Project Root Structure**

```
EC-PROJECT/
├── node-app/                       ← BACKEND (Node.js + Express)
│   ├── index.js                    ← Main server file
│   ├── connect.js                  ← MongoDB connection setup
│   ├── package.json                ← Dependencies
│   └── routes/                     ← All API endpoints
│       ├── login.js                ✓ User login logic
│       ├── signup.js               ✓ User registration logic
│       ├── home.js                 ✓ Homepage data (featured items)
│       ├── product.js              ✓ Product management & bidding
│       ├── productListing.js       ✓ Get all products with filtering
│       ├── category.js             ✓ Category management
│       ├── dashboard.js            ✓ User dashboard data
│       ├── orders.js               ✓ Order management
│       ├── cartRoute.js            ✓ Shopping cart operations
│       ├── favoritesRoute.js       ✓ Wishlist/Favorites
│       ├── bids.js                 ✓ Bid management
│       ├── stripeRoute.js          ✓ Stripe payment integration
│       ├── paymentRoute.js         ✓ Payment records
│       ├── AdminDashboardRoute.js  ✓ Admin dashboard data
│       ├── userMgtRoute.js         ✓ Admin user management
│       ├── orderMgtRoute.js        ✓ Admin order management
│       ├── complainRoute.js        ✓ Complaint management
│       ├── contactRoute.js         ✓ Contact form submissions
│       └── ...
│
├── thriftifyy/                     ← FRONTEND (React + Vite)
│   ├── src/
│   │   ├── main.jsx                ← App entry point
│   │   ├── App.jsx                 ← Main routes/navigation
│   │   ├── api.js                  ← Axios configuration
│   │   ├── theme.js                ← Color theme constants
│   │   ├── index.css               ← Global styles
│   │   │
│   │   ├── pages/                  ← Full pages
│   │   │   ├── HomePage.jsx        ✓ Landing page
│   │   │   ├── ProductListing.jsx  ✓ Browse products
│   │   │   ├── ProductPage.jsx     ✓ Product details & bidding
│   │   │   ├── Checkout.jsx        ✓ Cart & payment
│   │   │   ├── login.jsx           ✓ Login page
│   │   │   ├── signup.jsx          ✓ Registration page
│   │   │   ├── Dashboard.jsx       ✓ Admin dashboard
│   │   │   ├── OrderMgt.jsx        ✓ Admin order management
│   │   │   ├── UserMgt.jsx         ✓ Admin user management
│   │   │   ├── PaymentMgt.jsx      ✓ Admin payment management
│   │   │   ├── ComplaintMgt.jsx    ✓ Admin complaint management
│   │   │   ├── StripePayment.jsx   ✓ Stripe integration
│   │   │   ├── about/
│   │   │   │   └── about.jsx       ✓ About page
│   │   │   ├── categories/
│   │   │   │   └── categories.jsx  ✓ Browse by category
│   │   │   ├── contact/
│   │   │   │   └── contact.jsx     ✓ Contact form
│   │   │   ├── home page/
│   │   │   │   ├── hero.jsx        ✓ Hero section
│   │   │   │   ├── faqs.jsx        ✓ FAQ section
│   │   │   │   ├── working.jsx     ✓ How it works
│   │   │   │   └── ...             
│   │   │   ├── navbar/
│   │   │   │   ├── header.jsx      ✓ Top navigation
│   │   │   │   ├── footer.jsx      ✓ Footer
│   │   │   │   ├── layout.jsx      ✓ Main layout wrapper
│   │   │   │   ├── addToCart.jsx   ✓ Cart drawer/modal
│   │   │   │   ├── Favorites.jsx   ✓ Favorites drawer
│   │   │   │   ├── orders.jsx      ✓ Orders drawer
│   │   │   │   └── notifications.jsx ✓ Notifications
│   │   │   └── profile/
│   │   │       ├── profile.jsx     ✓ User profile page
│   │   │       ├── DashboardPage.jsx ✓ User dashboard
│   │   │       ├── complaint.jsx   ✓ File complaints
│   │   │       └── profile.css     ✓ Profile styling
│   │   │
│   │   ├── components/             ← Reusable components
│   │   │   ├── ProductCard.jsx     ✓ Product display card
│   │   │   ├── CategoryCard.jsx    ✓ Category tile
│   │   │   ├── SearchBar.jsx       ✓ Search functionality
│   │   │   ├── Loader.jsx          ✓ Loading spinner
│   │   │   └── adminComp/
│   │   │       ├── Sidebar.jsx     ✓ Admin navigation
│   │   │       └── StatCard.jsx    ✓ Stats display
│   │   │
│   │   ├── admin/
│   │   │   └── Admin.jsx           ✓ Admin layout
│   │   │
│   │   └── assets/                 ← Images & static files
│   │
│   ├── package.json                ← Dependencies
│   ├── vite.config.js              ← Vite configuration
│   ├── tailwind.config.js          ← Tailwind CSS config
│   └── postcss.config.js           ← PostCSS config
│
└── uploads/                        ← Server-side file storage
    └── profile-images/             ← Uploaded images

```

---

## 🔑 Key Function Explanations

### **1. Bidding System (Core Feature)**

```javascript
// User Places Bid
POST /products/:id/placeBid
├─ Receives: amount, bidderId, bidderName
├─ Database Operations:
│  ├─ Find Product
│  ├─ Check If User Already Bid
│  ├─ If Yes → Update Bid Amount
│  ├─ If No → Create New Bid
│  └─ Update Product's activeBids
├─ Notification Sent to Seller:
│  └─ "New bid of $X on Product Y"
└─ Frontend Updates:
   └─ Show success message & updated bid

// Seller Accepts Bid
POST /products/:id/acceptBid
├─ Receives: bidId, bidderId, acceptedAmount
├─ Database Operations:
│  ├─ Set Bid Status → "accepted"
│  ├─ Reject All Other Bids
│  ├─ Mark Product as Sold
│  └─ Store Accepted Offer Info
├─ Notification Sent to Buyer:
│  └─ "🎉 Your bid has been ACCEPTED!"
└─ Cart System:
   └─ Item now uses Special Bid Price (not original)
```

### **2. Payment Processing (Stripe Integration)**

```javascript
// Frontend Initiates Checkout
POST /api/stripe/create-checkout-session
├─ Sends: cart items, email, shipping address
├─ Backend:
│  ├─ Calculates Subtotal
│  ├─ Calculates Tax (8%)
│  ├─ Creates Stripe Session
│  └─ Returns Stripe URL
└─ Frontend:
   └─ Redirects User to Stripe Payment Page

// User Completes Payment on Stripe
User enters card details → Stripe processes

// Stripe Webhook (Server-to-Server)
POST /api/stripe/webhook
├─ Triggered Automatically by Stripe
├─ Backend Verifies Payment Success
├─ Database Updates:
│  ├─ Create Order Record
│  ├─ Clear User's Cart
│  ├─ Mark Products as Sold
│  └─ Create Order Notification
└─ Email Sent to User:
   └─ Order confirmation with details
```

### **3. User Authentication (Signup/Login)**

```javascript
// User Signup
POST /signup
├─ Receives: name, email, password
├─ Validation:
│  ├─ Check Email Format
│  ├─ Check Password Length (≥8 chars)
│  └─ Check Email Doesn't Exist
├─ Password Security:
│  └─ Hash with bcrypt (10 rounds)
├─ Database:
│  └─ Create New User Record
└─ Response:
   └─ User ID & Success Message

// User Login
POST /login
├─ Receives: email, password
├─ Validation:
│  ├─ Find User by Email
│  ├─ Compare Password with Hash
│  └─ Check If Account Suspended
├─ If Successful:
│  └─ Return User Object + ID
├─ Frontend:
│  ├─ Store User in localStorage
│  └─ Set Authentication Flag
└─ User Can Now Access Protected Features
```

---

## 🎯 Summary

**Thriftifyy is a complete e-commerce platform** that brings innovation to thrift shopping through:

1. **Smart Bidding System** - Buyers negotiate prices, sellers get best offers
2. **Secure Payments** - Stripe integration for safe transactions
3. **User Management** - Profiles, favorites, order history
4. **Admin Control** - Complete dashboard for platform management
5. **Real-time Notifications** - Users stay updated on bids and orders
6. **Responsive Design** - Works on desktop and mobile

**Technology Stack** makes it scalable and maintainable:
- React for responsive frontend
- Express for robust backend
- MongoDB for flexible data storage
- Stripe for reliable payments

**File Organization** is clear and logical:
- Backend routes handle business logic
- Frontend pages manage UI
- Components ensure reusability
- Database collections store organized data

---

**End of Documentation**

*Last Updated: November 26, 2024*
*Version: 1.0*
*Project: Thriftifyy E-Commerce Platform*

