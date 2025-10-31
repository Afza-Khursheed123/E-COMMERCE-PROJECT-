import React, { useEffect, useState } from "react";
import api from "../api"; // your axios instance
import { Link } from "react-router-dom";

export default function SellerHomePage() {
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
        console.error("❌ Home fetch error:", err);
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
    <div className="bg-gray-50 min-h-screen text-gray-900">
      {/* 🏠 Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500 text-white py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to SecondHand Market</h1>
        <p className="text-lg opacity-90">
          Buy and sell pre-owned items with confidence.
        </p>
      </section>

        {/* 🧩 Categories */}
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

      {/* 🌟 Featured Products */}
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

      {/* 🕒 Recently Added */}
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

      {/* 📩 Footer */}
      <footer className="bg-blue-900 text-white py-6 text-center mt-10">
        <p className="text-sm">
          © {new Date().getFullYear()} SecondHand Market — All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}