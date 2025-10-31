import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Loader from "../components/Loader";

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("❌ Product fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <Loader />;
  if (!product)
    return <p className="text-center mt-8 text-red-600 font-semibold">❌ Product not found.</p>;

  return (
    <div className="px-6 md:px-16 py-10 bg-gray-50 min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
      >
        ← Back
      </button>

      <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg p-6 gap-10">
        {/* Product Image */}
        <div className="md:w-1/2 flex justify-center">
          <img
            src={product.images?.[0] || "/placeholder.jpg"}
            alt={product.name}
            className="w-full max-w-md rounded-2xl shadow-md object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 space-y-4">
          <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
          <p className="text-2xl text-green-700 font-semibold">
            ${product.price}
          </p>

          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {product.condition}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
              {product.category}
            </span>
          </div>

          <hr className="my-4" />

          <div>
            <h2 className="text-lg font-semibold mb-1">Description</h2>
            <p className="text-gray-700 leading-relaxed">
              {product.description || "No description provided."}
            </p>
          </div>

          <div className="mt-6">
            <button className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition">
              Contact Seller
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
