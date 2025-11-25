# E-Commerce Project

A full-stack e-commerce web application designed for buying and selling pre-owned items. The platform allows users to browse products by category, view detailed listings, and manage their accounts securely.

## 📋 Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **User Authentication**: Secure user registration and login system
- **Product Browsing**: Browse products by categories with detailed listings
- **Product Management**: Add, edit, and delete product listings
- **Shopping Cart**: Add items to cart and manage purchases
- **Search Functionality**: Search for products across the platform
- **User Dashboard**: Manage account details and view order history
- **Responsive Design**: Mobile-friendly interface for seamless shopping experience
- **Secure Transactions**: Protected payment processing for safe purchases
- **Admin Panel**: Interface where admin will manage the entire platform

## 🚀 Technologies Used

### Frontend
- React.js
- Tailwind CSS
- Bootstrap
- JavaScript (ES6+)

### Backend
- Node.js
- Express.js

### Database
- MongoDB

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.x or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Package manager
- **MongoDB** (v5.x or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - Version control
- A code editor like **VS Code**

## 🔧 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/Afza-Khursheed123/E-COMMERCE-PROJECT-.git
cd E-COMMERCE-PROJECT-
```

### Step 2: Checkout the Features Branch

```bash
git checkout features
```

### Step 3: Install Dependencies

#### Backend Dependencies
Navigate to the backend directory and install dependencies:
```bash
cd node-app
npm install
```

#### Frontend Dependencies
Navigate to the frontend directory and install dependencies:
```bash
cd ../thriftiffy
npm install
```

### Step 4: Set Up MongoDB

1. Make sure MongoDB is running on your system:
```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
# or
mongod
```

2. The database will be created automatically when you run the application.

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the **backend** directory and add the following:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ecommerce_db
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce_db

# Payment Gateway (optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLIC_KEY=your_stripe_public_key
```

### Update Configuration Files

Make sure your MongoDB connection is properly configured in your backend files.

## 🏃 Running the Application

### Development Mode

You'll need to run both the backend and frontend servers simultaneously.

#### Terminal 1 - Start Backend Server:
```bash
cd node-app
npm start
```

The backend server will run on `http://localhost:3000`

#### Terminal 2 - Start Frontend React App:
```bash
cd thriftiffy
npm run dev
```

The React app will automatically open in your browser at `http://localhost:5173`

### Production Mode

#### Build Frontend:
```bash
cd thiriftiffy
npm run build
```

#### Start Backend in Production:
```bash
cd node-app
NODE_ENV=production npm start
```

### Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

The frontend will communicate with the backend API at `http://localhost:3000`

## 📁 Project Structure

```
E-COMMERCE-PROJECT-/
├── node-app/                # Backend Node.js/Express server
│   ├── config/            # Configuration files
│   ├── routes/            # API routes
│   ├── .env               # Environment variables
│   ├── index.js          # Entry point
│   └── package.json       # Backend dependencies
├── thriftiffy/              # React frontend
│   ├── public/            # Static files
│   ├── src/               # React source files
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── App.jsx         # Main App component
│   │   └── index.js       # Entry point
│   │   └── main.jsx       # Root point
│   ├── tailwind.config.js # Tailwind CSS configuration
│   └── package.json       # Frontend dependencies
├── .gitignore             # Git ignore file
└── README.md              # Project documentation
```

## 💡 Usage

### For Customers:
1. **Register/Login**: Create an account or log in to existing account
2. **Browse Products**: Explore products by categories
3. **Search**: Use the search bar to find specific items
4. **Add to Cart**: Select products and add them to your shopping cart
5. **Checkout**: Complete purchase with secure payment
6. **Track Orders**: View order history in your dashboard

### For Sellers:
1. **Create Listing**: Add new products with descriptions and images
2. **Manage Products**: Edit or remove your listings
3. **View Sales**: Track your sales in the seller dashboard

### For Admins:
1. **View Dashboard & Analytics**: Add new products with descriptions and images
2. **View Sales**: Track your sales in the admin dashboard
3. **Manage Orders**: Edit or remove your orders
4. **Manage Payments**: Edit or remove your payments
5. **Manage Complaints**: Edit or remove your complains

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Issues

If you encounter any issues or have suggestions, please [open an issue](https://github.com/Afza-Khursheed123/E-COMMERCE-PROJECT-/issues).

---

**Note**: Make sure to update the configuration files with your actual database credentials and API keys before running the application. Never commit sensitive information like passwords or API keys to version control.
