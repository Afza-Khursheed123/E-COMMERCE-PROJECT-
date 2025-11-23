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
      <div className="flex justify-center items-center min-h-screen text-gray-600 text-lg">
        Loading homepage data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Compact Hero Section */}
      <div className="relative bg-gradient-to-r from-[#19535F] to-[#0B7A75] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Give Items a Second Chance
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Turn thrift into a lifestyle — Thriftify your world.
            </p>
            <Link
              to="/categories"
              className="inline-flex items-center bg-[#D7C9AA] text-[#19535F] px-8 py-3 rounded-full font-semibold hover:bg-[#c5b899] transition-colors duration-300"
            >
              Explore Now
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="py-12 bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#19535F] mb-12">
            Featured Products
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {featuredProducts.slice(0, 4).map((prod) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(4, 8).map((prod) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#19535F] mb-12">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { title: "Select Your Item", text: "Browse through the categories and pick the item you love." },
              { title: "Bid the Price", text: "Set your price and place your bid for the item." },
              { title: "Get Confirmation", text: "Receive confirmation once your bid is accepted." },
              { title: "Make Payment", text: "Complete the payment securely through our system." },
              { title: "Receive Your Item", text: "Get your thrifted treasure delivered to your doorstep!" },
            ].map((step, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300 border border-gray-100"
              >
                <div className="w-12 h-12 bg-[#0B7A75] text-white rounded-full flex items-center justify-center font-bold text-lg mb-4 mx-auto">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-[#19535F] mb-2 text-lg">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="py-16 bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#19535F] mb-12">
            Browse Categories
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/category/${encodeURIComponent(cat.name)}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden text-center p-4 border border-gray-100"
              >
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
                <h3 className="font-medium text-gray-800 text-sm">{cat.name}</h3>
                <p className="text-gray-500 text-xs mt-1">{cat.itemsCount} items</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#19535F] mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {[
              {
                question: "What makes Thriftify different from other resale platforms?",
                answer: "Thriftify is built around bartering and swapping, not just selling. It also features AI-based price suggestions, map-based local discovery, eco-impact tracking, and a secure payment system with a small commission fee."
              },
              {
                question: "Is it free to use Thriftify?",
                answer: "Yes! Creating an account and listing items is completely free. A small 5% commission is only charged to sellers after a successful sale. Swaps and barters are free of charge."
              },
              {
                question: "How are payments handled?",
                answer: "Payments are made securely through Thriftify. Buyers pay sellers directly, while sellers send a 5% commission to the platform via their in-app wallet."
              },
              {
                question: "How do I communicate with other users?",
                answer: "Thriftify integrates WhatsApp chat for smooth and private communication between buyers and sellers. You can negotiate details and confirm transactions directly from your mobile device."
              },
              {
                question: "How does Thriftify promote sustainability?",
                answer: "By encouraging swapping and reuse, Thriftify reduces waste and promotes eco-friendly consumption. The platform also displays sustainability metrics that show the positive environmental impact of your activities."
              },
              {
                question: "How are user ratings handled?",
                answer: "After each successful transaction, buyers can leave ratings and reviews for sellers (and vice versa). This builds trust and transparency within the Thriftify community."
              }
            ].map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <details className="group">
                  <summary className="bg-white px-6 py-4 cursor-pointer list-none flex justify-between items-center hover:bg-gray-50 transition-colors duration-200">
                    <span className="font-medium text-[#19535F] text-lg">{faq.question}</span>
                    <span className="text-[#0B7A75] transform transition-transform duration-300 group-open:rotate-180">▼</span>
                  </summary>
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#19535F] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} Thriftify — All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Product Card Component for reusability
function ProductCard({ product }) {
  return (
    <Link
      to={`/products/${product._id}`}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group"
    >
      <div className="aspect-w-16 aspect-h-12 bg-gray-200 overflow-hidden">
        <img
          src={
            product.image ||
            (product.images && product.images[0]) ||
            "https://via.placeholder.com/300x200?text=No+Image"
          }
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-2">{product.condition}</p>
        <div className="flex items-center justify-between">
          <span className="text-green-600 font-bold text-lg">
            ${product.price}
          </span>
          {product.originalPrice && (
            <span className="text-gray-400 text-sm line-through">
              ${product.originalPrice}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}