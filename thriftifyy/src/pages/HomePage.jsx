import React, { useEffect, useState } from "react";
import api from "../api.js";
import { Link } from "react-router-dom";
import Navbar from "../components/navbar/navbar.jsx";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await api.get("/home");
        console.log("📦 Home API data:", res.data);

        setCategories(res.data.categories || []);
        setFeaturedProducts(res.data.featured || []);
        setRecentlyAdded(res.data.recentlyAdded || []);
        setLoading(false);
      } catch (err) {
        console.error("    Home fetch error:", err);
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-gray-600 mt-10 text-lg">
        Loading homepage data...
      </div>
    );
  }

  return (
    <>
      <Navbar />
      
      {/* Add Profile/Dashboard Button in Navbar or Header */}
      <div className="fixed top-4 right-4 z-50">
        <Link
          to="/dashboard"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-semibold shadow-lg flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>My Profile</span>
        </Link>
      </div>

      <div className="bg-gray-50 min-h-screen text-gray-900">
        {/*  Hero Section */}
        <section
          className="text-white py-40 text-center bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(30, 58, 138, 0.8), rgba(59, 130, 246, 0.8)), url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070')",
            backgroundBlendMode: "overlay",
          }}
        >
          <h1 className="text-4xl font-bold mb-4">Welcome to Thriftify</h1>
          <p className="text-lg opacity-90">
            Buy and sell pre-owned items with confidence.
          </p>
          
          {/* Add Listing Button in Hero Section */}
          <div className="mt-8">
            <Link
              to="/sell"
              className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition font-semibold text-lg inline-flex items-center space-x-2 shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Sell Your Item</span>
            </Link>
          </div>
        </section>

        {/*  Categories */}
        <section className="max-w-6xl mx-auto py-12 px-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/category/${encodeURIComponent(cat.name)}`}
                className="bg-white rounded-xl shadow hover:shadow-lg transition duration-200"
              >
                <img
                  src={cat.image || "https://via.placeholder.com/300x200?text=No+Image"}
                  alt={cat.name}
                  className="w-full h-40 object-cover rounded-t-xl"
                />
                <div className="p-3 text-center">
                  <h3 className="font-semibold text-gray-800">{cat.name}</h3>
                  <p className="text-sm text-gray-500">{cat.itemsCount} items</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="max-w-6xl mx-auto py-12 px-6 bg-white rounded-xl shadow-inner">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
            Featured Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => (
              <Link
                key={prod._id}
                to={`/products/${prod._id}`}
                className="bg-gray-50 rounded-xl shadow hover:shadow-md transition duration-200 overflow-hidden"
              >
                <img
                  src={
                    prod.image ||
                    (prod.images && prod.images[0]) ||
                    "https://via.placeholder.com/300x200?text=No+Image"
                  }
                  alt={prod.name}
                  className="w-full h-56 object-cover rounded-t-xl"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-1">{prod.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{prod.condition}</p>
                  <p className="text-green-600 font-semibold">
                    ${prod.price}
                    {prod.originalPrice && (
                      <span className="text-gray-400 text-sm line-through ml-2">
                        ${prod.originalPrice}
                      </span>
                    )}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recently Added */}
        <section className="max-w-6xl mx-auto py-12 px-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
            Recently Added
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recentlyAdded.map((prod) => (
              <Link
                key={prod._id}
                to={`/products/${prod._id}`}
                className="bg-white rounded-xl shadow hover:shadow-md transition duration-200 overflow-hidden"
              >
                <img
                  src={
                    prod.image ||
                    (prod.images && prod.images[0]) ||
                    "https://via.placeholder.com/300x200?text=No+Image"
                  }
                  alt={prod.name}
                  className="w-full h-56 object-cover rounded-t-xl"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-1">{prod.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{prod.condition}</p>
                  <p className="text-green-600 font-semibold">
                    ${prod.price}
                    {prod.originalPrice && (
                      <span className="text-gray-400 text-sm line-through ml-2">
                        ${prod.originalPrice}
                      </span>
                    )}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-blue-900 text-white py-6 text-center mt-10">
          <p className="text-sm">
            © {new Date().getFullYear()} SecondHand Market — All Rights Reserved.
          </p>
        </footer>
      </div>
    </>
  );
}