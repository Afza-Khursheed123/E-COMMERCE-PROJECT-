import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Loader from "../components/Loader";

const ProductListingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    condition: "Like New",
    categoryId: "",
    images: [],
    biddingEnabled: false,
    swappable: false,
    details: [],
  });

  const user = JSON.parse(localStorage.getItem("user")); // assume stored after login

  //     Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/category");
        setCategories(res.data);
      } catch (err) {
        console.error("    Categories fetch error:", err);
      }
    };
    fetchCategories();
  }, []);

  //     Handle field input
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  //     Convert images to Base64
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const readers = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((base64Images) => {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...base64Images],
      }));
    });
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  //     Additional details
  const addDetail = () =>
    setFormData((prev) => ({
      ...prev,
      details: [...prev.details, { key: "", value: "" }],
    }));

  const removeDetail = (i) =>
    setFormData((prev) => ({
      ...prev,
      details: prev.details.filter((_, index) => index !== i),
    }));

  const handleDetailChange = (i, field, value) => {
    const details = [...formData.details];
    details[i][field] = value;
    setFormData((prev) => ({ ...prev, details }));
  };

  //     Submit listing
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please log in to list an item.");

    setLoading(true);
    try {
      const price = parseFloat(formData.price);
      const originalPrice = formData.originalPrice
        ? parseFloat(formData.originalPrice)
        : price;

      const discount =
        originalPrice > price
          ? Math.round(((originalPrice - price) / originalPrice) * 100)
          : 0;

      const productData = {
        ...formData,
        price,
        originalPrice,
        discount,
        categoryId: parseInt(formData.categoryId),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          location: user.location,
          phone: user.phone,
          rating: user.rating || 0,
        },
      };

      const res = await api.post("/productlisting", productData);
      alert("    Product listed successfully!");
      navigate(`/products/${res.data._id}`);
    } catch (err) {
      console.error("    Listing error:", err);
      alert("    Failed to list product.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;


  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">List Your Item</h1>
          <p className="text-gray-600 mt-2">
            Fill in the details to sell any item
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-6 space-y-6"
        >
          {/* Basic Info */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
              Basic Information
            </h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Wooden Table, Laptop..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your item..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Category *
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Condition *
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Used">Used</option>
                <option value="Refurbished">Refurbished</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
              Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price ($) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Original Price ($)
                </label>
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
              Features
            </h2>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="biddingEnabled"
                checked={formData.biddingEnabled}
                onChange={handleInputChange}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <span>Enable Bidding</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="swappable"
                checked={formData.swappable}
                onChange={handleInputChange}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <span>Open to Swaps</span>
            </label>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
              Additional Details
            </h2>
            {formData.details.map((detail, i) => (
              <div key={i} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Field (e.g., Size, Brand)"
                  value={detail.key}
                  onChange={(e) =>
                    handleDetailChange(i, "key", e.target.value)
                  }
                  className="w-1/2 px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Value (e.g., Medium, Nike)"
                  value={detail.value}
                  onChange={(e) =>
                    handleDetailChange(i, "value", e.target.value)
                  }
                  className="w-1/2 px-4 py-2 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeDetail(i)}
                  className="px-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addDetail}
              className="text-blue-600 font-medium hover:underline"
            >
              + Add another detail
            </button>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
              Images
            </h2>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
            />
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {formData.images.map((img, i) => (
                  <div key={i} className="relative">
                    <img
                      src={img}
                      alt={`Preview ${i + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-6 border-t">
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-green-700 transition"
            >
              List Item for Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductListingPage;
