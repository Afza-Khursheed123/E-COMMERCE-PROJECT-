import { Routes, Route } from "react-router-dom";
import Login from "./pages/login.jsx";
import Signup from "./pages/signup.jsx";
import Layout from "./pages/navbar/layout.jsx";
import About from './pages/about/about';
import Contact from './pages/contact/contact.jsx'
import Profile from './pages/profile/profile.jsx';
import { Categories, CategoryPage } from './pages/categories/categories.jsx';
import ProductPage from "./pages/ProductPage.jsx";
import ProductListingPage from "./pages/ProductListing.jsx";
import DashboardPage from "./pages//profile/DashboardPage.jsx"
import AdminLayout from "./admin/Admin.jsx";
import Home from "./pages/home page/home.jsx";
import CheckoutPage from "./pages/Checkout.jsx";
import { UserComplaintPage } from "./pages/profile/complaint.jsx";
// Remove FavoritesPage import since we're using drawer now
// Add this temporary debug component to your App.js or any page
import React, { useEffect } from 'react';

function UserDebug() {
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    console.log("🔍 DEBUG - Current user:", user);
    console.log("🔍 DEBUG - User ID:", user?._id, "Type:", typeof user?._id);
    console.log("🔍 DEBUG - User object keys:", user ? Object.keys(user) : 'No user');
  }, []);

  return null;
}

// Use it in your App component
// <UserDebug />
function App() {
  return (
    
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="categories" element={<Categories />} />
        <Route path="productlisting" element={<ProductListingPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="about" element={<About />} />
        <Route path="profile" element={<Profile />} />
        <Route path="contact" element={<Contact />} />
        {/* Remove favorites route since we're using drawer now */}
      <Route path="/category" element={<Categories />} />

      <Route path="/sellerhomepage" element={<Home />} />
      <Route path="/category/:categoryName" element={<CategoryPage />} />
      <Route path="/products/:id" element={<ProductPage />} />
      <Route path="/productlisting" element={<ProductListingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/complaints" element={<UserComplaintPage />} />

      </Route>
           <Route path="/admin/*" element={<AdminLayout />} />
   <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
}

export default App;