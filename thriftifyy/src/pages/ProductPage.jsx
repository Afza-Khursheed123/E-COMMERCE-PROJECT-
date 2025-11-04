import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Loader from "../components/Loader";

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showBidCard, setShowBidCard] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [userBid, setUserBid] = useState(null);
  var bidNo= 0;
  const userId = 201; // Replace with actual logged-in user id
  const userName = "John Doe"; // Replace with actual logged-in user name

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
        setSelectedImage(res.data.images?.[0] || "/placeholder.jpg");

        // Check if user already placed a bid
        const existingBid = res.data.activeBids?.find(b => b.bidderId === userId);
        setUserBid(existingBid || null);
      } catch (err) {
        console.error("    Product fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handlePlaceBid = async () => {
    bidNo = bidNo+1;
    if (!product.isAvailable) {
      alert("    This product is no longer available for bidding.");
      return;
    }

    const bid = parseFloat(bidAmount);
    if (isNaN(bid) || bid <= 0) {
      alert("    Invalid bid amount.");
      return;
    }

    try {
      const res = await api.post(`/products/${id}/placeBid`, {
        amount: bid,
        bidderId: userId,
        bidderName: userName,
      });

      setProduct(res.data);
      setBidAmount("");
      setShowBidCard(false);

      // Update user's bid
      const placedBid = res.data.activeBids.find(b => b.bidderId === userId);
      setUserBid(placedBid);

      alert("    Bid placed successfully!");
    } catch (err) {
      console.error("    Error placing bid:", err);
      alert("    Failed to place bid. Try again.");
    }
  };

  if (loading) return <Loader />;
  if (!product)
    return (
      <p className="text-center mt-8 text-red-600 font-semibold">
            Product not found.
      </p>
    );

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
        <div className="md:w-1/2 flex flex-col items-center gap-4">
          <img
            src={selectedImage}
            alt={product.name}
            className="w-full max-w-md rounded-2xl shadow-md object-cover hover:scale-105 transition-transform duration-300"
          />
          <div className="flex gap-3 overflow-x-auto mt-2">
            {product.images?.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`${product.name}-${index}`}
                className={`w-20 h-20 rounded-xl object-cover cursor-pointer border-2 ${
                  img === selectedImage ? "border-blue-500" : "border-gray-200"
                }`}
                onClick={() => setSelectedImage(img)}
              />
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 space-y-4">
          <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>

          <div className="flex items-baseline gap-3">
            <p className="text-2xl text-green-700 font-semibold">${product.price}</p>
            {product.discount > 0 && (
              <>
                <p className="text-gray-400 line-through">${product.originalPrice}</p>
                <p className="text-red-500 font-medium">{product.discount}% OFF</p>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 bg-blue-900 text-gray-200 rounded-full text-sm font-medium">
              {product.condition}
            </span>
          </div>

          <hr className="my-4" />

          <div>
            <h2 className="text-lg font-semibold mb-1">Description</h2>
            <p className="text-gray-700 leading-relaxed">
              {product.description || "No description provided."}
            </p>
          </div>

          <div className="p-4 bg-teal-800 text-gray-200  rounded-xl space-y-1">
            <h3 className="font-semibold text-lg">Seller Info</h3>
            <p>Name: {product.sellerName}</p>
            <p>Rating: {product.sellerRating} ⭐</p>
            <p>Location: {product.sellerLocation}</p>
            <p>Successful Sales: {product.successfulSales || "N/A"}</p>
          </div>

          <div className="p-4 bg-teal-800 text-gray-200 rounded-xl space-y-1">
            <p><strong>Shipping:</strong> {product.shipping}</p>
            <p><strong>Buyer Protection:</strong> {product.buyerProtection}</p>
          </div>

          <div className="p-4 bg-teal-800 text-gray-200 rounded-xl flex justify-between items-center">
            <p>⭐ {product.sellerRating} ({product.reviewsCount} reviews)</p>
            <button className="text-blue-600 underline">View Reviews</button>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition">
              Buy Now
            </button>
            <button
              onClick={() => setShowBidCard(true)}
              className="px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition"
            >
              Place Bid
            </button>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
              Propose Swap
            </button>
            <button className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition">
              Contact Seller
            </button>
            <button className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">
              Report Issue
            </button>
          </div>

          {/* Bid Card */}
          {showBidCard && (
            <div className="mt-6 p-6 bg-gray-100 rounded-xl shadow-md max-w-sm">
              <h3 className="text-lg font-semibold mb-2">Place Your Bid</h3>
              <input
                type="number"
                placeholder="Enter bid amount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="w-full px-4 py-2 mb-4 border rounded-lg"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowBidCard(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceBid}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                >
                  Submit Bid
                </button>
              </div>
            </div>
          )}

          {/* User's own bid */}
          {userBid && (
            <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-xl font-semibold">
              💰 Your bid: ${userBid.amount.toFixed(2)}
            </div>
          )}

          {/* Active Bids */}
        {product.activeBids?.length > 0 && (
  <div className="mt-6 p-4 bg-gray-100 rounded-xl text-emerald-900">
    <h3 className="font-semibold mb-2">Active Bids</h3>
    <ul>
      {product.activeBids.map((bid, index) => (
        <li
          key={index}
          className={
            bid.bidderId === userId ? "font-bold text-blue-800" : ""
          }
        >
          Bid #{index + 1}: {bid.bidderName} — ${bid.amount.toFixed(2)}
        </li>
      ))}
    </ul>
  </div>
)}

        </div>
      </div>
    </div>
  );
};

export default ProductPage;
