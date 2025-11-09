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
  const [user, setUser] = useState(null);
  const [placingBid, setPlacingBid] = useState(false);

  // ✅ Get current user from localStorage
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) return;

        const user = JSON.parse(userData);
        const userId = user._id || user.id;

        if (!userId) return;

        console.log("🔄 User loaded from localStorage:", user.name);
        setUser(user);
        
      } catch (err) {
        console.error("❌ Error loading user:", err);
      }
    };
    
    fetchUser();
  }, []);

  // ✅ Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const userId = user?._id || user?.id;
        
        const res = await api.get(`/products/${id}${userId ? `?userId=${userId}` : ''}`);
        console.log("📦 Filtered product data:", res.data);
        
        setProduct(res.data);
        setSelectedImage(res.data.images?.[0] || "/placeholder.jpg");

        const userBids = res.data.activeBids || [];
        setUserBid(userBids.length > 0 ? userBids[0] : null);
        
      } catch (err) {
        console.error("❌ Product fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user || !loading) {
      fetchProduct();
    }
  }, [id, user]);

  // ✅ UPDATED: Enhanced offer placement - UPDATE existing offers
  const handlePlaceBid = async () => {
    if (!user) {
      alert("⚠️ Please log in to make an offer.");
      navigate('/login');
      return;
    }

    if (!product.isAvailable) {
      alert("❌ This product is no longer available.");
      return;
    }

    const bid = parseFloat(bidAmount);
    if (isNaN(bid) || bid <= 0) {
      alert("❌ Please enter a valid offer amount.");
      return;
    }

    setPlacingBid(true);
    try {
      console.log("🚀 Placing/updating offer:", {
        amount: bid,
        bidderId: user._id || user.id,
        bidderName: user.name,
        isUpdate: !!userBid
      });

      const res = await api.post(`/products/${id}/placeBid`, {
        amount: bid,
        bidderId: user._id || user.id,
        bidderName: user.name,
      });

      console.log("✅ Offer response:", res.data);

      // Update product with new offer data
      setProduct(res.data.product);
      setBidAmount("");
      setShowBidCard(false);
      
      // Update user's offer
      setUserBid(res.data.bid);

      if (res.data.isUpdate) {
        alert("✅ Offer updated successfully! The seller will see your new offer.");
      } else {
        alert("✅ Offer submitted successfully! The seller will review your offer.");
      }
    } catch (err) {
      console.error("❌ Error placing offer:", err);
      if (err.response?.data?.message) {
        alert(`❌ ${err.response.data.message}`);
      } else {
        alert("❌ Failed to submit offer. Please try again.");
      }
    } finally {
      setPlacingBid(false);
    }
  };

  // ✅ Handle offer button click
  const handleBidButtonClick = () => {
    if (!user) {
      alert("⚠️ Please log in to make an offer.");
      navigate('/login');
      return;
    }
    
    // Pre-fill with current offer amount if updating
    if (userBid) {
      setBidAmount(getBidAmount(userBid).toString());
    }
    setShowBidCard(true);
  };

  // ✅ Cancel offer update
  const handleCancelUpdate = () => {
    setBidAmount("");
    setShowBidCard(false);
  };

  // ✅ Check if user is the listing owner
  const isUserOwner = () => {
    if (!user || !product) return false;
    return (user._id || user.id) === product.userId;
  };

  // ✅ Format currency
  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // ✅ Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? "Invalid date" : date.toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  // ✅ Get bid amount safely
  const getBidAmount = (bid) => {
    if (!bid) return 0;
    return bid.amount || bid.bidAmount || 0;
  };

  // ✅ Get bid date safely
  const getBidDate = (bid) => {
    return bid.placedAt || bid.createdAt || bid.date;
  };

  // ✅ Get bid status safely
  const getBidStatus = (bid) => {
    return bid.bidStatus || bid.status || "pending";
  };

  // ✅ Get seller info
  const getSellerInfo = () => {
    if (!product) return {};
    
    return {
      name: product.userName || product.sellerName || "Unknown User",
      rating: product.userRating || product.sellerRating || "No rating",
      location: product.userLocation || product.sellerLocation || "Location not specified",
      sales: product.successfulSales || "0"
    };
  };

  // ✅ Render product details dynamically
  const renderProductDetails = () => {
    if (!product.details) return null;

    const details = product.details;
    const detailEntries = Object.entries(details);

    if (detailEntries.length === 0) return null;

    return (
      <div className="p-4 bg-yellow-50 rounded-xl">
        <h3 className="font-semibold text-lg text-gray-800 mb-3">Product Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {detailEntries.map(([key, value]) => (
            <div key={key} className="flex flex-col">
              <span className="text-gray-500 text-sm font-medium capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}:
              </span>
              <span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ✅ Render Logic
  if (loading) return <Loader />;
  if (!product)
    return (
      <p className="text-center mt-8 text-red-600 font-semibold">
        ❌ Product not found.
      </p>
    );

  const isAvailable = product.isAvailable;
  const currentBids = product.activeBids || [];
  const sellerInfo = getSellerInfo();
  const isOwner = isUserOwner();

  return (
    <div className="px-6 md:px-16 py-10 bg-gray-50 min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
      >
        ← Back
      </button>

      <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg p-6 gap-10">
        {/* Product Image Section */}
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

        {/* Product Info */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isAvailable 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {isAvailable ? "Available" : "Sold"}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <p className="text-2xl text-green-700 font-semibold">
              {formatCurrency(product.price)}
            </p>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <p className="text-gray-400 line-through">
                  {formatCurrency(product.originalPrice)}
                </p>
                {product.discount && (
                  <p className="text-red-500 font-medium">
                    {product.discount}% OFF
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {product.condition}
            </span>
            {product.categoryId && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                {product.categoryId}
              </span>
            )}
          </div>

          <hr className="my-4" />

          {/* Description */}
          <div>
            <h2 className="text-lg text-black font-semibold mb-1">Description</h2>
            <p className="text-gray-700 leading-relaxed">
              {product.description || "No description provided."}
            </p>
          </div>

          {/* Dynamic Product Details */}
          {renderProductDetails()}

          {/* Listing Owner Info */}
          <div className="p-4 bg-gray-100 rounded-xl space-y-2">
            <h3 className="font-semibold text-lg text-gray-800">Listing Owner</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium text-gray-700 ">{sellerInfo.name}</span>
              
              <span className="text-gray-600">Rating:</span>
              <span className="font-medium text-gray-700 ">⭐ {sellerInfo.rating}</span>
              
              <span className="text-gray-600">Location:</span>
              <span className="font-medium text-gray-700 ">{sellerInfo.location}</span>
              
              <span className="text-gray-600">Completed Sales:</span>
              <span className="font-medium text-gray-700 ">{sellerInfo.sales}</span>
            </div>
          </div>

         {/* Action Buttons - UPDATED: Properly disable for sold products and accepted offers */}
<div className="mt-6 flex flex-wrap gap-4">
  {/* Buy Now Button - Disabled if user is owner OR product is sold OR user has accepted offer */}
  {!isOwner && (
    <button 
      className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={isOwner || !isAvailable || (userBid && getBidStatus(userBid) === 'accepted')}
    >
      {isOwner ? "Your Listing" : 
       (userBid && getBidStatus(userBid) === 'accepted') ? "Item Purchased" : 
       "Buy Now"}
    </button>
  )}
  
  {/* Make/Update Offer Button - Hidden for owner, disabled if sold or offer finalized */}
  {!isOwner && (
    <button
      onClick={handleBidButtonClick}
      disabled={!isAvailable || placingBid || 
               (userBid && (getBidStatus(userBid) === 'accepted' || getBidStatus(userBid) === 'rejected'))}
      className="px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {!isAvailable ? "Item Sold" :
       userBid && getBidStatus(userBid) === 'accepted' ? "Offer Accepted" :
       userBid && getBidStatus(userBid) === 'rejected' ? "Offer Closed" :
       userBid ? "Update Offer" : "Make Offer"}
    </button>
  )}
  
  <button 
    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    disabled={!isAvailable || (userBid && getBidStatus(userBid) === 'accepted')}
  >
    Propose Swap
  </button>
  <button 
    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    disabled={!isAvailable}
  >
    Contact Owner
  </button>
</div>
          {/* Availability Message */}
          {!isAvailable && (
            <div className="mt-6 p-4 bg-red-100 text-red-800 rounded-xl font-medium">
              ❌ This item has been sold and is no longer available.
            </div>
          )}

          {/* Offer Card - Show for making/updating offers */}
          {showBidCard && !isOwner && (
            <div className={`mt-6 p-6 border rounded-xl shadow-md max-w-sm ${
              userBid ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">
                {userBid ? 'Update Your Offer' : 'Make Your Offer'}
              </h3>
              
              {userBid && (
                <p className="text-sm text-gray-600 mb-3">
                  Current offer: <strong>{formatCurrency(getBidAmount(userBid))}</strong>
                </p>
              )}
              
              <p className="text-sm text-gray-600 mb-3">
                Asking price: <strong>{formatCurrency(product.price)}</strong>
              </p>
              
              <p className="text-sm text-gray-600 mb-3">
                Logged in as: <strong>{user?.name}</strong>
              </p>
              
              <input
                type="number"
                placeholder={userBid ? "Enter new offer amount" : "Enter your offer amount"}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                step="0.01"
              />
              
              <p className="text-xs text-gray-500 mb-3">
                💡 This is bargaining - offer any amount you think is fair!
                {userBid && " Updating will replace your current offer."}
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelUpdate}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition font-medium"
                  disabled={placingBid}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceBid}
                  disabled={placingBid || !bidAmount}
                  className={`px-4 py-2 text-white rounded-lg transition font-medium disabled:opacity-50 ${
                    userBid ? 'bg-blue-500 hover:bg-blue-600' : 'bg-yellow-500 hover:bg-yellow-600'
                  }`}
                >
                  {placingBid ? "Submitting..." : (userBid ? "Update Offer" : "Submit Offer")}
                </button>
              </div>
            </div>
          )}







       // ✅ User's Current Offer - Only shown to the user who made the offer
{userBid && !isOwner && !showBidCard && (
  <div className={`mt-4 p-4 border rounded-xl ${
    getBidStatus(userBid) === 'accepted' ? 'bg-green-50 border-green-200' :
    getBidStatus(userBid) === 'rejected' ? 'bg-red-50 border-red-200' :
    'bg-blue-50 border-blue-200'
  }`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`font-semibold ${
          getBidStatus(userBid) === 'accepted' ? 'text-green-800' :
          getBidStatus(userBid) === 'rejected' ? 'text-red-800' :
          'text-blue-800'
        }`}>
          {getBidStatus(userBid) === 'accepted' ? '🎉 Offer Accepted!' : 
           getBidStatus(userBid) === 'rejected' ? '❌ Offer Declined' : 
           '💰 Your Current Offer'}
        </p>
        <p className={`text-xl font-bold ${
          getBidStatus(userBid) === 'accepted' ? 'text-green-700' :
          getBidStatus(userBid) === 'rejected' ? 'text-red-700' :
          'text-blue-700'
        }`}>
          {formatCurrency(getBidAmount(userBid))}
        </p>
        <p className={`text-sm ${
          getBidStatus(userBid) === 'accepted' ? 'text-green-600' :
          getBidStatus(userBid) === 'rejected' ? 'text-red-600' :
          'text-blue-600'
        }`}>
          {userBid.isUpdate ? 'Updated' : 'Submitted'} on {formatDate(getBidDate(userBid))}
        </p>
        <p className={`text-sm mt-1 ${
          getBidStatus(userBid) === 'accepted' ? 'text-green-600' :
          getBidStatus(userBid) === 'rejected' ? 'text-red-600' :
          'text-blue-600'
        }`}>
          Status: <span className={`font-medium capitalize ${
            getBidStatus(userBid) === 'accepted' ? 'text-green-700' :
            getBidStatus(userBid) === 'rejected' ? 'text-red-700' :
            'text-yellow-600'
          }`}>
            {getBidStatus(userBid)}
            {getBidStatus(userBid) === 'accepted' && ' 🎉'}
            {getBidStatus(userBid) === 'rejected' && ' ❌'}
          </span>
        </p>
        {getBidStatus(userBid) === 'accepted' && (
          <p className="text-sm text-green-600 mt-2">
            ✅ Congratulations! The seller accepted your offer. This item is now yours!
          </p>
        )}
        {getBidStatus(userBid) === 'rejected' && (
          <p className="text-sm text-red-600 mt-2">
            ❌ The seller declined your offer. You can try making a new offer on another item.
          </p>
        )}
      </div>
      <button
        onClick={handleBidButtonClick}
        disabled={getBidStatus(userBid) === 'accepted' || getBidStatus(userBid) === 'rejected' || !isAvailable}
        className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {getBidStatus(userBid) === 'accepted' ? 'Offer Locked' : 
         getBidStatus(userBid) === 'rejected' ? 'Offer Closed' : 
         'Update'}
      </button>
    </div>
  </div>
)}
        
        


        {/* Owner View: All Offers - Only shown to the listing owner */}
{isOwner && currentBids.length > 0 && (
  <div className="mt-6 p-4 bg-gray-50 rounded-xl">
    <h3 className="font-semibold mb-3 text-gray-800">
      Received Offers ({currentBids.length})
      {!isAvailable && <span className="ml-2 text-green-600">• Item Sold</span>}
    </h3>
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {currentBids
        .sort((a, b) => getBidAmount(b) - getBidAmount(a))
        .map((bid, index) => (
          <div
            key={bid.bidId || `bid-${index}`}
            className={`p-3 border rounded-lg ${
              bid.bidStatus === 'accepted' ? 'border-green-300 bg-green-25' :
              bid.bidStatus === 'rejected' ? 'border-red-300 bg-red-25' :
              bid.isUpdate ? 'border-yellow-300 bg-yellow-25' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">
                  {bid.bidderName || "Unknown User"}
                  {bid.isUpdate && <span className="ml-2 text-yellow-600 text-xs">(Updated)</span>}
                  {bid.bidStatus === 'accepted' && <span className="ml-2 text-green-600 text-xs">✓ Accepted</span>}
                  {bid.bidStatus === 'rejected' && <span className="ml-2 text-red-600 text-xs">✗ Rejected</span>}
                </p>
                <p className="text-sm text-gray-600">
                  {formatDate(bid.date)}
                </p>
                {bid.isUpdate && bid.previousAmount && (
                  <p className="text-xs text-gray-500">
                    Previous: {formatCurrency(bid.previousAmount)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-700">
                  {formatCurrency(getBidAmount(bid))}
                </p>
                {!isAvailable && bid.bidStatus === 'accepted' && (
                  <p className="text-xs text-green-600 font-medium">Sold to this buyer</p>
                )}
              </div>
            </div>
          </div>
        ))}
    </div>
  </div>
)}
          {/* No Offers Message - Only for owner */}
          {isAvailable && isOwner && currentBids.length === 0 && (
            <div className="mt-6 p-4 bg-gray-100 rounded-xl text-center">
              <p className="text-gray-600">
                No offers received yet. Share your listing to get more visibility!
              </p>
            </div>
          )}

       {/* Call to Action for Users - Only shown to non-owners without offers */}
{isAvailable && !isOwner && !userBid && !showBidCard && (
  <div className="mt-6 p-4 bg-yellow-50 rounded-xl text-center">
    <p className="text-gray-600 mb-2">
      Interested in this item? Make an offer!
    </p>
    <button
      onClick={handleBidButtonClick}
      className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition font-medium"
    >
      Start Bargaining
    </button>
  </div>
)}

{/* Sold Item Message for Users */}
{!isAvailable && !isOwner && (
  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
    <div className="text-center">
      <p className="text-red-800 font-semibold">❌ This item has been sold</p>
      <p className="text-red-600 text-sm mt-1">
        This item is no longer available for purchase or offers.
      </p>
    </div>
  </div>
)}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;