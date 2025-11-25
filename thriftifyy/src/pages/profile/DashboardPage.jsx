import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import Loader from "../../components/Loader";

const theme = {
    bg: '#19535F',
    accent: '#0B7A75',
    text: '#F0F3F5',
    highlight: '#D7C9AA',
    badge: '#7B2D26',
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    profileImage: ""
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  // 🔥 ENHANCED: Smart image URL handler
  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) {
      return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face";
    }
    
    // Already full URL
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Relative path - construct full URL
    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:3000${imagePath}`;
    }
    
    // Fallback
    return imagePath;
  };

  // 🔥 ENHANCED: Dashboard fetch with better error handling
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        
        const userData = localStorage.getItem('user');
        if (!userData) {
          navigate('/login');
          return;
        }

        const user = JSON.parse(userData);
        const userId = user._id || user.id;

        if (!userId) {
          navigate('/login');
          return;
        }

        console.log("🔄 Fetching dashboard for user:", userId, "Type:", typeof userId);
        
        const response = await api.get(`/dashboard/${userId}`);
        
        if (response.data && response.data.user) {
          setDashboardData(response.data);
          setProfileForm({
            name: response.data.user.name || "",
            email: response.data.user.email || "",
            phone: response.data.user.phone || "",
            location: response.data.user.location || "",
            profileImage: response.data.user.profileImage || ""
          });
        } else {
          throw new Error("Invalid dashboard response");
        }
        
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        
        if (err.response?.status === 401 || err.response?.status === 404) {
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          alert("Failed to load dashboard. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboard();
  }, [navigate]);

  // 🔥 ENHANCED: Image upload with proper ID handling
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Image size should be less than 5MB");
      return;
    }

    try {
      setImageUploading(true);
      setProfileError("");

      const formData = new FormData();
      formData.append('profileImage', file);

      const userData = localStorage.getItem('user');
      const user = JSON.parse(userData);
      const userId = user._id || user.id;

      console.log("📤 Uploading image for user:", userId);

      const response = await api.post(`/dashboard/user/${userId}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const imageUrl = response.data.imageUrl;
        setProfileForm(prev => ({
          ...prev,
          profileImage: imageUrl
        }));
        
        // Update local storage and dashboard data
        const updatedUser = { ...user, profileImage: imageUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setDashboardData(prev => ({
          ...prev,
          user: { ...prev.user, profileImage: imageUrl }
        }));

        alert("✅ Profile image updated successfully!");
      }
    } catch (err) {
      console.error("❌ Error uploading image:", err);
      setProfileError(err.response?.data?.message || "Failed to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  // 🔥 ENHANCED: Remove image with proper ID handling
  const handleRemoveImage = async () => {
    if (!window.confirm("Are you sure you want to remove your profile image?")) {
      return;
    }

    try {
      setImageUploading(true);
      
      const userData = localStorage.getItem('user');
      const user = JSON.parse(userData);
      const userId = user._id || user.id;

      console.log("🗑️ Removing image for user:", userId);

      const response = await api.delete(`/dashboard/user/${userId}/remove-image`);

      if (response.data.success) {
        setProfileForm(prev => ({
          ...prev,
          profileImage: ""
        }));
        
        const updatedUser = { ...user, profileImage: "" };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setDashboardData(prev => ({
          ...prev,
          user: { ...prev.user, profileImage: "" }
        }));

        alert("✅ Profile image removed successfully!");
      }
    } catch (err) {
      console.error("❌ Error removing image:", err);
      setProfileError(err.response?.data?.message || "Failed to remove image");
    } finally {
      setImageUploading(false);
    }
  };

  // 🔥 ENHANCED: Profile update with ultimate ID handling
  const handleSaveProfile = async () => {
    try {
      setSaveLoading(true);
      setProfileError("");
      
      const userData = localStorage.getItem('user');
      if (!userData) {
        setProfileError("Please log in again");
        return;
      }

      const user = JSON.parse(userData);
      const userId = user._id || user.id;

      if (!userId) {
        setProfileError("No user ID found");
        return;
      }

      console.log("🔄 Updating profile for user:", userId, "Type:", typeof userId);
      console.log("📝 Sending data:", profileForm);

      const response = await api.put(`/dashboard/user/${userId}`, profileForm);

      console.log("✅ Profile update response:", response);
      
      if (response.data.success) {
        const updatedUser = response.data.user;
        
        setDashboardData(prev => ({
          ...prev,
          user: { ...prev.user, ...updatedUser }
        }));
        
        const newUserData = { ...user, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(newUserData));
        
        setIsEditingProfile(false);
        alert("✅ Profile updated successfully!");
      }
    } catch (err) {
      console.error("❌ Error updating profile:", err);
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          "Failed to update profile. Please try again.";
      setProfileError(errorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (dashboardData?.user) {
      setProfileForm({
        name: dashboardData.user.name || "",
        email: dashboardData.user.email || "",
        phone: dashboardData.user.phone || "",
        location: dashboardData.user.location || "",
        profileImage: dashboardData.user.profileImage || ""
      });
    }
    setIsEditingProfile(false);
    setProfileError("");
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
    if (profileError) setProfileError("");
  };

  const validateProfileForm = () => {
    if (!profileForm.name.trim()) {
      setProfileError("Name is required");
      return false;
    }
    if (!profileForm.email.trim()) {
      setProfileError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileForm.email)) {
      setProfileError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSaveClick = () => {
    if (validateProfileForm()) {
      handleSaveProfile();
    }
  };

  // 🔥 ENHANCED: Product deletion with better error handling
  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      try {
        console.log("🗑️ Deleting product:", productId);
        
        const response = await api.delete(`/dashboard/product/${productId}`);
        
        if (response.data.success) {
          setDashboardData(prev => ({
            ...prev,
            products: prev.products.filter(product => product._id !== productId),
            stats: {
              ...prev.stats,
              totalListings: prev.stats.totalListings - 1,
              activeListings: prev.stats.activeListings - (prev.products.find(p => p._id === productId)?.available ? 1 : 0)
            }
          }));
          
          alert("✅ Listing deleted successfully!");
        } else {
          alert("❌ Failed to delete listing: " + (response.data.message || "Unknown error"));
        }
      } catch (err) {
        console.error("Error deleting product:", err);
        const errorMessage = err.response?.data?.message || err.message || "Network error";
        alert("❌ Failed to delete listing: " + errorMessage);
      }
    }
  };

  // 🔥 FIXED: Bid status update with proper acceptedAmount handling
  const handleUpdateBidStatus = async (notification, status) => {
    try {
      const bidId = notification.relatedBidId;
      
      if (!bidId) {
        alert("No offer ID found for this notification!");
        return;
      }

      console.log("🔄 Updating bid status:", { bidId, status, notification });

      // ✅ FIX: Prepare request body with acceptedAmount when status is 'accepted'
      const requestBody = { status };
      
      // For acceptance, do NOT send an acceptedAmount from the (potentially stale) notification.
      // Let the server read the latest bid document and determine the correct accepted amount.
      // This avoids accepting an outdated value that may be present in the notification object.

      console.log("📤 Sending request body:", requestBody);

      const response = await api.put(`/dashboard/bids/${bidId}/status`, requestBody);
      
      if (response.data.success) {
        const acceptedAmount = response.data.acceptedAmount || notification.bidAmount;

        setDashboardData(prev => ({
          ...prev,
          notifications: prev.notifications.map(notif => 
            notif._id === notification._id 
              ? { 
                  ...notif, 
                  status: status.toUpperCase(),
                  // Use server-returned acceptedAmount when available to avoid stale values
                  bidAmount: acceptedAmount,
                  message: status === 'accepted' 
                    ? `You accepted the offer of $${acceptedAmount} for ${notification.productName}`
                    : `You declined the offer of $${acceptedAmount} for ${notification.productName}`,
                  updatedAt: new Date().toISOString()
                }
              : notif
          )
        }));

        alert(`✅ Offer ${status} successfully!`);
      } else {
        alert(response.data.message || "Failed to update offer status");
      }
    } catch (err) {
      console.error("❌ Failed to update offer status:", err);
      console.error("Error details:", err.response?.data);
      alert(err.response?.data?.message || "Failed to update offer status. Please check console for details.");
    }
  };

  // Delete a notification
  const handleDeleteNotification = async (notificationId) => {
    if (!notificationId) return;
    if (!window.confirm('Are you sure you want to delete this notification?')) return;

    try {
      console.log('🗑️ Deleting notification:', notificationId);
      const response = await api.delete(`/dashboard/notifications/${notificationId}`);
      if (response.data?.success) {
        setDashboardData(prev => ({
          ...prev,
          notifications: prev.notifications.filter(n => n._id !== notificationId)
        }));
        alert('✅ Notification deleted');
      } else {
        console.error('Failed to delete notification', response.data);
        alert('Failed to delete notification');
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      alert('Failed to delete notification. See console for details.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${theme.bg}20 0%, ${theme.accent}20 100%)` }}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-10 w-72 h-72 bg-[#19535F] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-float-slow"></div>
          <div className="absolute bottom-1/4 -right-10 w-96 h-96 bg-[#0B7A75] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-float-slow animation-delay-2000"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center h-screen">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-lg animate-slide-up">
            <div className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: `${theme.accent} transparent transparent transparent` }}></div>
            <p className="text-gray-600" style={{ color: theme.bg }}>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${theme.bg}20 0%, ${theme.accent}20 100%)` }}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-10 w-72 h-72 bg-[#19535F] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-float-slow"></div>
          <div className="absolute bottom-1/4 -right-10 w-96 h-96 bg-[#0B7A75] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-float-slow animation-delay-2000"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center h-screen p-4">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-lg animate-slide-up">
            <div className="text-red-500 text-lg mb-4" style={{ color: theme.badge }}>Failed to load dashboard</div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent})` }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { user, products, bids, soldProducts, stats, notifications } = dashboardData;

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${theme.bg}10 0%, ${theme.accent}10 100%)` }}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-10 w-72 h-72 bg-[#19535F] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-float-slow"></div>
        <div className="absolute bottom-1/4 -right-10 w-96 h-96 bg-[#0B7A75] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-float-slow animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#D7C9AA] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse-slow"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl transition-all duration-300 hover:bg-gray-100 hover:scale-105"
                style={{ color: theme.bg }}
              >
                ← Back
              </button>
              <h1 className="text-xl font-bold" style={{ color: theme.bg }}>Dashboard</h1>
            </div>
            <div className="flex items-center space-x-3">
              {/* Complaint Button */}
              <Link
                to="/complaints"
                className="px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ background: `linear-gradient(135deg, ${theme.badge}, #C44536)`, color: 'white' }}
              >
                🗨️ Complaint
              </Link>
              <Link
                to="/productlisting"
                className="px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent})`, color: 'white' }}
              >
                + New Listing
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl transition-all duration-300 hover:bg-gray-100 hover:scale-105"
                style={{ color: theme.bg }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Profile Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200 p-6 mb-6 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold" style={{ color: theme.bg }}>Profile Information</h2>
            {!isEditingProfile ? (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent})`, color: 'white' }}
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveClick}
                  disabled={saveLoading}
                  className="px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 flex items-center space-x-2"
                  style={{ background: `linear-gradient(135deg, ${theme.accent}, #2D936C)`, color: 'white' }}
                >
                  {saveLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ background: '#f8f9fa', color: theme.bg, border: `1px solid ${theme.bg}30` }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {profileError && (
            <div className="mb-6 p-4 rounded-xl border" style={{ background: `${theme.badge}10`, borderColor: theme.badge }}>
              <div className="flex items-center space-x-2" style={{ color: theme.badge }}>
                <span className="font-medium">Error:</span>
                <span>{profileError}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Info & Stats */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={getProfileImageUrl(profileForm.profileImage || user?.profileImage)}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg transition-all duration-300 hover:scale-110"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face";
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white" style={{ background: theme.accent }}></div>
                  
                  {isEditingProfile && (
                    <div className="absolute -bottom-2 -right-2 flex space-x-1">
                      <label className="p-1 rounded-full cursor-pointer transition-all duration-300 hover:scale-110" style={{ background: theme.bg }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={imageUploading}
                        />
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </label>
                      {(profileForm.profileImage || user?.profileImage) && (
                        <button
                          onClick={handleRemoveImage}
                          disabled={imageUploading}
                          className="p-1 rounded-full transition-all duration-300 hover:scale-110"
                          style={{ background: theme.badge }}
                        >
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {imageUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold truncate" style={{ color: theme.bg }}>{user?.name || "User"}</h3>
                  <p className="text-sm truncate" style={{ color: theme.accent }}>{user?.email}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="flex items-center text-sm" style={{ color: theme.highlight }}>
                      ⭐ {user?.rating?.toFixed(1) || "0.0"}
                    </span>
                    <span className="text-sm" style={{ color: theme.bg }}>
                      {stats?.totalListings || 0} Listings
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: stats?.totalListings || 0, label: "Listings", color: theme.bg },
                  { value: stats?.activeListings || 0, label: "Active", color: theme.accent },
                  { value: stats?.totalBids || 0, label: "Bids", color: theme.highlight },
                  
                ].map((stat, index) => (
                  <div 
                    key={index} 
                    className="text-center p-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    style={{ background: `${stat.color}10`, border: `1px solid ${stat.color}20` }}
                  >
                    <div className="text-xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-xs" style={{ color: theme.bg }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Form */}
            <div className="space-y-4">
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.bg }}>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileInputChange}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 transition-all duration-300"
                      style={{ borderColor: `${theme.bg}30`, focusBorderColor: theme.bg, focusRingColor: `${theme.bg}20` }}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.bg }}>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileInputChange}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 transition-all duration-300"
                      style={{ borderColor: `${theme.bg}30`, focusBorderColor: theme.bg, focusRingColor: `${theme.bg}20` }}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.bg }}>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileInputChange}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 transition-all duration-300"
                      style={{ borderColor: `${theme.bg}30`, focusBorderColor: theme.bg, focusRingColor: `${theme.bg}20` }}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.bg }}>Location</label>
                    <input
                      type="text"
                      name="location"
                      value={profileForm.location}
                      onChange={handleProfileInputChange}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 transition-all duration-300"
                      style={{ borderColor: `${theme.bg}30`, focusBorderColor: theme.bg, focusRingColor: `${theme.bg}20` }}
                      placeholder="Enter your city/country"
                    />
                  </div>
                  
                  {/* Profile Image Upload Section */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.bg }}>Profile Image</label>
                    <div className="flex items-center space-x-4">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={imageUploading}
                        />
                        <div className="w-full px-3 py-2 border rounded-xl text-center text-sm transition-all duration-300 hover:scale-105"
                             style={{ borderColor: `${theme.bg}30`, color: theme.bg, background: `${theme.bg}05` }}>
                          {imageUploading ? "Uploading..." : "Choose New Image"}
                        </div>
                      </label>
                      {(profileForm.profileImage || user?.profileImage) && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={imageUploading}
                          className="px-3 py-2 rounded-xl transition-all duration-300 hover:scale-105 text-sm"
                          style={{ background: theme.badge, color: 'white' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: theme.bg }}>
                      Supported formats: JPG, PNG, GIF. Max size: 5MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <InfoField label="Name" value={user.name} theme={theme} />
                  <InfoField label="Email" value={user.email} theme={theme} />
                  <InfoField label="Phone" value={user.phone || "Not provided"} theme={theme} />
                  <InfoField label="Location" value={user.location || "Not provided"} theme={theme} />
                  <InfoField label="Member Since" value={user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : "Recently"} theme={theme} />
                  <InfoField label="Account Status" value="Verified" theme={theme} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border mb-6 animate-slide-up">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {[
              { key: "listings", label: `My Listings (${stats?.totalListings || 0})`, icon: "📦" },
              { key: "sold", label: `Sold Items (${stats?.soldListings || 0})`, icon: "💰" },
              { key: "bids", label: `My Bids (${stats?.totalBids || 0})`, icon: "🎯" },
            
              { key: "notifications", label: `Notifications (${notifications?.length || 0})`, icon: "🔔" }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.key
                    ? "text-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                style={activeTab === tab.key ? { 
                  borderColor: theme.accent, 
                  background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent})`,
                  borderRadius: '8px',
                  margin: '4px'
                } : {}}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "listings" && (
          <div className="animate-slide-up">
            {(!products || products.length === 0) ? (
              <EmptyState 
                title="No listings yet"
                description="Start selling by creating your first listing!"
                buttonText="Create Your First Listing"
                buttonLink="/productlisting"
                theme={theme}
              />
            ) : (
              <ProductGrid 
                products={products}
                onDelete={handleDeleteProduct}
                showActions={true}
                theme={theme}
              />
            )}
          </div>
        )}

        {activeTab === "sold" && (
          <div className="animate-slide-up">
            {(!soldProducts || soldProducts.length === 0) ? (
              <EmptyState 
                title="No sold items yet"
                description="Your sold items will appear here"
                buttonText="View Active Listings"
                onButtonClick={() => setActiveTab("listings")}
                theme={theme}
              />
            ) : (
              <ProductGrid 
                products={soldProducts}
                showActions={false}
                theme={theme}
              />
            )}
          </div>
        )}

        {activeTab === "bids" && (
          <div className="animate-slide-up">
            {(!bids || bids.length === 0) ? (
              <EmptyState 
                title="No active bids"
                description="Start bidding on items you're interested in!"
                buttonText="Browse Products"
                buttonLink="/"
                theme={theme}
              />
            ) : (
              <BidsList bids={bids} theme={theme} />
            )}
          </div>
        )}

     

        {activeTab === "notifications" && (
          <div className="animate-slide-up">
            {(!notifications || notifications.length === 0) ? (
              <EmptyState 
                title="No notifications yet"
                description="Your notifications will appear here"
                buttonText="Browse Products"
                buttonLink="/"
                theme={theme}
              />
            ) : (
              <NotificationsList 
                notifications={notifications}
                onUpdateBidStatus={handleUpdateBidStatus}
                onDelete={handleDeleteNotification}
                theme={theme}
              />
            )}
          </div>
        )}
      </main>

      {/* CSS Animations */}
      <style>
        {`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(5deg); }
          66% { transform: translateY(-10px) rotate(-3deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.05; transform: scale(1); }
          50% { opacity: 0.1; transform: scale(1.1); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
        .animation-delay-2000 { animation-delay: 2000ms; }
        `}
      </style>
    </div>
  );
};

// Helper Components with updated theme
const InfoField = ({ label, value, theme }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
    <span className="text-sm font-medium" style={{ color: theme.bg }}>{label}</span>
    <span className="text-sm text-right" style={{ color: theme.accent }}>{value}</span>
  </div>
);

const EmptyState = ({ title, description, buttonText, buttonLink, onButtonClick, theme }) => (
  <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200 animate-slide-up">
    <div className="mb-4" style={{ color: theme.bg }}>
      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    </div>
    <h3 className="text-lg font-bold mb-2" style={{ color: theme.bg }}>{title}</h3>
    <p className="mb-6" style={{ color: theme.accent }}>{description}</p>
    {buttonLink ? (
      <Link
        to={buttonLink}
        className="px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
        style={{ background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent})`, color: 'white' }}
      >
        {buttonText}
      </Link>
    ) : (
      <button
        onClick={onButtonClick}
        className="px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
        style={{ background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent})`, color: 'white' }}
      >
        {buttonText}
      </button>
    )}
  </div>
);

const ProductGrid = ({ products, onDelete, showActions, theme }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {products.map((product, index) => (
      <div 
        key={product._id} 
        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl animate-slide-up"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <img
          src={product.images?.[0] || "https://via.placeholder.com/300x200?text=No+Image"}
          alt={product.name}
          className="w-full h-48 object-cover transition-transform duration-300 hover:scale-110"
        />
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold flex-1" style={{ color: theme.bg }}>{product.name}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ml-2 ${
              product.available 
                ? "bg-green-100 text-green-800" 
                : "bg-gray-100 text-gray-800"
            }`}>
              {product.available ? "Active" : "Sold"}
            </span>
          </div>
          <p className="text-sm mb-2" style={{ color: theme.accent }}>{product.condition}</p>
          <p className="font-bold text-lg mb-4" style={{ color: theme.bg }}>
            ${product.price}
          </p>
          
          {showActions && product.available && (
            <div className="flex space-x-2">
              <Link
                to={`/products/${product._id}`}
                className="flex-1 text-center py-2 rounded-xl transition-all duration-300 hover:scale-105 text-sm font-medium"
                style={{ background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent})`, color: 'white' }}
              >
                View
              </Link>
              <button
                onClick={() => onDelete(product._id)}
                className="flex-1 py-2 rounded-xl transition-all duration-300 hover:scale-105 text-sm font-medium"
                style={{ background: theme.badge, color: 'white' }}
              >
                Delete
              </button>
            </div>
          )}
          {!showActions && (
            <Link
              to={`/products/${product._id}`}
              className="w-full text-center py-2 rounded-xl transition-all duration-300 hover:scale-105 text-sm font-medium block"
              style={{ background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent})`, color: 'white' }}
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    ))}
  </div>
);

const BidsList = ({ bids, theme }) => {
  const uniqueBids = bids.filter((bid, index, self) => {
    return index === self.findIndex(b => b._id === bid._id);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {uniqueBids.map((bid, index) => {
        const bidAmount = bid.amount || bid.bidAmount;
        const placedAt = bid.placedAt || bid.createdAt || bid.date;
        const bidStatus = bid.bidStatus || bid.status || "pending";
        
        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          active: "bg-blue-100 text-blue-800", 
          accepted: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800",
          won: "bg-purple-100 text-purple-800",
          lost: "bg-gray-100 text-gray-800"
        };

        return (
          <div 
            key={bid._id} 
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200 p-4 transition-all duration-300 hover:scale-105 animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold flex-1 pr-2" style={{ color: theme.bg }}>
                {bid.product?.name || bid.productName || "Unknown Product"}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColors[bidStatus] || statusColors.pending}`}>
                {bidStatus.toUpperCase()}
              </span>
            </div>
            
            <div className="space-y-2">
              <p style={{ color: theme.bg }}>
                <span className="font-medium">Your bid:</span> ${bidAmount || "N/A"}
              </p>
              <p className="text-sm" style={{ color: theme.accent }}>
                <span className="font-medium">Placed:</span> {placedAt ? new Date(placedAt).toLocaleString() : "N/A"}
              </p>
            </div>

            <div className="mt-4">
              <Link
                to={`/products/${bid.productId || bid.product?._id}`}
                className="w-full text-center py-2 rounded-xl transition-all duration-300 hover:scale-105 text-sm font-medium block"
                style={{ background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent})`, color: 'white' }}
              >
                View Product
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const OrdersList = ({ orders, theme }) => (
  <div className="space-y-4">
    {orders.map((order, index) => (
      <div 
        key={order._id} 
        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200 p-4 transition-all duration-300 hover:scale-105 animate-slide-up"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-bold" style={{ color: theme.bg }}>Order #{order._id?.slice(-6) || "N/A"}</h4>
            <p style={{ color: theme.accent }}>Total: <strong>${order.totalAmount || "N/A"}</strong></p>
            <p className="text-sm" style={{ color: theme.bg }}>Date: {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "N/A"}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm ${
            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {order.status || "pending"}
          </span>
        </div>
      </div>
    ))}
  </div>
);

const NotificationsList = ({ notifications, onUpdateBidStatus, onDelete, theme }) => {
  // Ensure newest-first order, then dedupe by relatedBidId+type
  const sorted = (notifications || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const uniqueNotifications = sorted.filter((notif, index, self) => 
    index === self.findIndex(n => 
      n.relatedBidId === notif.relatedBidId && n.type === notif.type
    )
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      ACCEPTED: { color: "bg-green-100 text-green-800", label: "Accepted" },
      REJECTED: { color: "bg-red-100 text-red-800", label: "Declined" },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      accepted: { color: "bg-green-100 text-green-800", label: "Accepted" },
      rejected: { color: "bg-red-100 text-red-800", label: "Declined" }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {uniqueNotifications.map((notif, index) => (
        <div
          key={notif._id}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200 p-4 transition-all duration-300 hover:scale-105 animate-slide-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold" style={{ color: theme.bg }}>
                      {notif.title || 
                       (notif.type === "bid" ? `New Offer: $${notif.bidAmount || '0'}` : 
                        notif.type === "bid_status" ? notif.title : 
                        notif.type === "item_sold" ? "Item Sold" :
                        "Notification")}
                    </h4>
                    <div className="d-flex align-items-center">
                      {getStatusBadge(notif.status)}
                      <button
                        onClick={() => onDelete && onDelete(notif._id)}
                        className="btn btn-sm p-0 ms-3 text-muted"
                        style={{ border: 'none', background: 'none', fontSize: '1.2rem', lineHeight: '1' }}
                        title="Delete notification"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  <p className="mb-2" style={{ color: theme.accent }}>
                    {notif.message}
                  </p>

                  <p className="text-sm" style={{ color: theme.bg }}>
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>

                  {/* Show additional details for offer-related notifications */}
                  {(notif.type === "bid" || notif.type === "bid_status") && (
                    <div className="mt-3 p-3 rounded-xl" style={{ background: `${theme.bg}05` }}>
                      <p className="text-sm" style={{ color: theme.bg }}>
                        <strong>Product:</strong> {notif.productName || "Unknown Product"}
                      </p>
                      {notif.type === "bid" && notif.bidderName && (
                        <p className="text-sm mt-1" style={{ color: theme.accent }}>
                          <strong>From:</strong> {notif.bidderName}
                        </p>
                      )}
                      {notif.bidAmount > 0 && (
                        <p className="text-sm mt-1" style={{ color: theme.accent }}>
                          <strong>Amount:</strong> ${notif.bidAmount}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons - only show for pending bid notifications */}
          {(notif.type === "bid" && 
           (notif.status === "PENDING" || !notif.status || notif.status === "pending")) && (
            <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: `${theme.bg}20` }}>
              <button
                onClick={() => onUpdateBidStatus(notif, "accepted")}
                className="flex-1 py-2 rounded-xl transition-all duration-300 hover:scale-105 text-sm font-medium"
                style={{ background: `linear-gradient(135deg, ${theme.accent}, #2D936C)`, color: 'white' }}
              >
                Accept Offer
              </button>
              <button
                onClick={() => onUpdateBidStatus(notif, "rejected")}
                className="flex-1 py-2 rounded-xl transition-all duration-300 hover:scale-105 text-sm font-medium"
                style={{ background: theme.badge, color: 'white' }}
              >
                Decline Offer
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DashboardPage;