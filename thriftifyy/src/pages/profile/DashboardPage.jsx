import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import Loader from "../../components/Loader";

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

        const res = await api.get(`/dashboard/${userId}`);
        setDashboardData(res.data);
        
        if (res.data.user) {
          setProfileForm({
            name: res.data.user.name || "",
            email: res.data.user.email || "",
            phone: res.data.user.phone || "",
            location: res.data.user.location || "",
            profileImage: res.data.user.profileImage || ""
          });
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

  // ✅ ADDED: Handle profile image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setProfileError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
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
        
        // Update local storage and dashboard data immediately
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

  // ✅ ADDED: Remove profile image
  const handleRemoveImage = async () => {
    try {
      setImageUploading(true);
      
      const userData = localStorage.getItem('user');
      const user = JSON.parse(userData);
      const userId = user._id || user.id;

      const response = await api.delete(`/dashboard/user/${userId}/remove-image`);

      if (response.data.success) {
        setProfileForm(prev => ({
          ...prev,
          profileImage: ""
        }));
        
        // Update local storage and dashboard data
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

      console.log("🔄 Updating profile for user:", userId);
      console.log("📝 Sending data:", profileForm);

      const response = await api.put(`/dashboard/user/${userId}`, profileForm);

      console.log("✅ Profile update response:", response);
      
      if (response.data.success) {
        const updatedUser = response.data.user;
        
        // Update dashboard data with new user info
        setDashboardData(prev => ({
          ...prev,
          user: { ...prev.user, ...updatedUser }
        }));
        
        // Update localStorage user data
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

  // ✅ UPDATED: Product deletion that removes from database
  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      try {
        await api.delete(`/dashboard/product/${productId}`);
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
      } catch (err) {
        console.error("Error deleting product:", err);
        alert("❌ Failed to delete listing.");
      }
    }
  };

  const handleUpdateBidStatus = async (notification, status) => {
    try {
      const bidId = notification.relatedBidId;
      
      if (!bidId) {
        alert("No offer ID found for this notification!");
        return;
      }

      const response = await api.put(`/dashboard/bids/${bidId}/status`, { status });
      
      if (response.data.success) {
        // Update the notification locally to show the status
        setDashboardData(prev => ({
          ...prev,
          notifications: prev.notifications.map(notif => 
            notif._id === notification._id 
              ? { 
                  ...notif, 
                  status: status.toUpperCase(),
                  message: status === 'accepted' 
                    ? `You accepted the offer of $${notification.bidAmount} for ${notification.productName}`
                    : `You declined the offer of $${notification.bidAmount} for ${notification.productName}`,
                  updatedAt: new Date().toISOString()
                }
              : notif
          )
        }));
        
        alert(`Offer ${status} successfully!`);
      } else {
        alert(response.data.message || "Failed to update offer status");
      }
    } catch (err) {
      console.error("Failed to update offer status:", err);
      alert(err.response?.data?.message || "Failed to update offer status");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return <Loader />;
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-lg p-8 shadow-sm border">
          <div className="text-red-500 text-lg mb-4">Failed to load dashboard</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { user, products, bids, soldProducts, orders, stats, notifications } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                ← Back
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/productlisting"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + New Listing
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 text-sm transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Profile Section - ALWAYS VISIBLE AT TOP */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
            {!isEditingProfile ? (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveClick}
                  disabled={saveLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center space-x-2"
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
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {profileError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-700">
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
                    src={profileForm.profileImage || user?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face"}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                  
                  {/* Image Upload Controls - Only show in edit mode */}
                  {isEditingProfile && (
                    <div className="absolute -bottom-2 -right-2 flex space-x-1">
                      <label className="bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={imageUploading}
                        />
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </label>
                      {(profileForm.profileImage || user?.profileImage) && (
                        <button
                          onClick={handleRemoveImage}
                          disabled={imageUploading}
                          className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{user?.name || "User"}</h3>
                  <p className="text-gray-600 text-sm truncate">{user?.email}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="flex items-center text-yellow-600 text-sm">
                      ⭐ {user?.rating?.toFixed(1) || "0.0"}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {stats?.totalListings || 0} Listings
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: stats?.totalListings || 0, label: "Listings", color: "text-blue-600" },
                  { value: stats?.activeListings || 0, label: "Active", color: "text-green-600" },
                  { value: stats?.totalBids || 0, label: "Bids", color: "text-yellow-600" },
                  { value: stats?.bidsOnMyProducts || 0, label: "Offers", color: "text-purple-600" }
                ].map((stat, index) => (
                  <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className={`text-xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                    <div className="text-xs text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Form */}
            <div className="space-y-4">
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={profileForm.location}
                      onChange={handleProfileInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your city/country"
                    />
                  </div>
                  
                  {/* Profile Image Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                    <div className="flex items-center space-x-4">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={imageUploading}
                        />
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center text-sm text-gray-600">
                          {imageUploading ? "Uploading..." : "Choose New Image"}
                        </div>
                      </label>
                      {(profileForm.profileImage || user?.profileImage) && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={imageUploading}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: JPG, PNG, GIF. Max size: 5MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <InfoField label="Name" value={user.name} />
                  <InfoField label="Email" value={user.email} />
                  <InfoField label="Phone" value={user.phone || "Not provided"} />
                  <InfoField label="Location" value={user.location || "Not provided"} />
                  <InfoField label="Member Since" value={user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : "Recently"} />
                  <InfoField label="Account Status" value="Verified" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rest of the code remains the same */}
        {/* Navigation Tabs for other sections */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {[
              { key: "listings", label: `My Listings (${stats?.totalListings || 0})`, icon: "📦" },
              { key: "sold", label: `Sold Items (${stats?.soldListings || 0})`, icon: "💰" },
              { key: "bids", label: `My Bids (${stats?.totalBids || 0})`, icon: "🎯" },
              { key: "orders", label: `Purchases (${stats?.totalPurchases || 0})`, icon: "🛒" },
              { key: "notifications", label: `Notifications (${notifications?.length || 0})`, icon: "🔔" }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Listings Tab */}
        {activeTab === "listings" && (
          <div>
            {(!products || products.length === 0) ? (
              <EmptyState 
                title="No listings yet"
                description="Start selling by creating your first listing!"
                buttonText="Create Your First Listing"
                buttonLink="/productlisting"
              />
            ) : (
              <ProductGrid 
                products={products}
                onDelete={handleDeleteProduct}
                showActions={true}
              />
            )}
          </div>
        )}

        {/* Sold Items Tab */}
        {activeTab === "sold" && (
          <div>
            {(!soldProducts || soldProducts.length === 0) ? (
              <EmptyState 
                title="No sold items yet"
                description="Your sold items will appear here"
                buttonText="View Active Listings"
                onButtonClick={() => setActiveTab("listings")}
              />
            ) : (
              <ProductGrid 
                products={soldProducts}
                showActions={false}
              />
            )}
          </div>
        )}

        {/* My Bids Tab */}
        {activeTab === "bids" && (
          <div>
            {(!bids || bids.length === 0) ? (
              <EmptyState 
                title="No active bids"
                description="Start bidding on items you're interested in!"
                buttonText="Browse Products"
                buttonLink="/"
              />
            ) : (
              <BidsList bids={bids} />
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div>
            {(!orders || orders.length === 0) ? (
              <EmptyState 
                title="No purchases yet"
                description="Your purchase history will appear here"
                buttonText="Start Shopping"
                buttonLink="/"
              />
            ) : (
              <OrdersList orders={orders} />
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div>
            {(!notifications || notifications.length === 0) ? (
              <EmptyState 
                title="No notifications yet"
                description="Your notifications will appear here"
                buttonText="Browse Products"
                buttonLink="/"
              />
            ) : (
              <NotificationsList 
                notifications={notifications}
                onUpdateBidStatus={handleUpdateBidStatus}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// Helper Components (remain the same)
const InfoField = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
    <span className="text-sm text-gray-600 font-medium">{label}</span>
    <span className="text-sm text-gray-900 text-right">{value}</span>
  </div>
);

const EmptyState = ({ title, description, buttonText, buttonLink, onButtonClick }) => (
  <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
    <div className="text-gray-400 mb-4">
      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6">{description}</p>
    {buttonLink ? (
      <Link
        to={buttonLink}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        {buttonText}
      </Link>
    ) : (
      <button
        onClick={onButtonClick}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        {buttonText}
      </button>
    )}
  </div>
);

const ProductGrid = ({ products, onDelete, showActions }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {products.map((product) => (
      <div key={product._id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
        <img
          src={product.images?.[0] || "https://via.placeholder.com/300x200?text=No+Image"}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 truncate flex-1">{product.name}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ml-2 ${
              product.available 
                ? "bg-green-100 text-green-800" 
                : "bg-gray-100 text-gray-800"
            }`}>
              {product.available ? "Active" : "Sold"}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-2">{product.condition}</p>
          <p className="text-green-600 font-bold text-lg mb-4">
            ${product.price}
          </p>
          
          {showActions && product.available && (
            <div className="flex space-x-2">
              <Link
                to={`/products/${product._id}`}
                className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                View
              </Link>
              <button
                onClick={() => onDelete(product._id)}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          )}
          {!showActions && (
            <Link
              to={`/products/${product._id}`}
              className="w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm block"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    ))}
  </div>
);

const BidsList = ({ bids }) => {
  const uniqueBids = bids.filter((bid, index, self) => {
    return index === self.findIndex(b => b._id === bid._id);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {uniqueBids.map((bid) => {
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
          <div key={bid._id} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-900 flex-1 pr-2">
                {bid.product?.name || bid.productName || "Unknown Product"}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColors[bidStatus] || statusColors.pending}`}>
                {bidStatus.toUpperCase()}
              </span>
            </div>
            
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Your bid:</span> ${bidAmount || "N/A"}
              </p>
              <p className="text-gray-500 text-sm">
                <span className="font-medium">Placed:</span> {placedAt ? new Date(placedAt).toLocaleString() : "N/A"}
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                to={`/products/${bid.productId || bid.product?._id}`}
                className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
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

const OrdersList = ({ orders }) => (
  <div className="space-y-4">
    {orders.map((order) => (
      <div key={order._id} className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-semibold text-gray-900">Order #{order._id?.slice(-6) || "N/A"}</h4>
            <p className="text-gray-600">Total: <strong>${order.totalAmount || "N/A"}</strong></p>
            <p className="text-gray-500 text-sm">Date: {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "N/A"}</p>
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

const NotificationsList = ({ notifications, onUpdateBidStatus }) => {
  const uniqueNotifications = notifications.filter((notif, index, self) => 
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
      {uniqueNotifications.map((notif) => (
        <div
          key={notif._id}
          className="bg-white rounded-lg shadow-sm border p-4"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {notif.title || 
                       (notif.type === "bid" ? `New Offer: $${notif.bidAmount || '0'}` : 
                        notif.type === "bid_status" ? notif.title : 
                        notif.type === "item_sold" ? "Item Sold" :
                        "Notification")}
                    </h4>
                    {getStatusBadge(notif.status)}
                  </div>
                  
                  <p className="text-gray-700 mb-2">
                    {notif.message}
                  </p>

                  <p className="text-gray-500 text-sm">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>

                  {/* Show additional details for offer-related notifications */}
                  {(notif.type === "bid" || notif.type === "bid_status") && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-700 text-sm">
                        <strong>Product:</strong> {notif.productName || "Unknown Product"}
                      </p>
                      {notif.type === "bid" && notif.bidderName && (
                        <p className="text-gray-600 text-sm mt-1">
                          <strong>From:</strong> {notif.bidderName}
                        </p>
                      )}
                      {notif.bidAmount > 0 && (
                        <p className="text-gray-600 text-sm mt-1">
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
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <button
                onClick={() => onUpdateBidStatus(notif, "accepted")}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Accept Offer
              </button>
              <button
                onClick={() => onUpdateBidStatus(notif, "rejected")}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
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