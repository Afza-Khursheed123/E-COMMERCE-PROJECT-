import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import Loader from "../components/Loader";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("listings");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        
        // Get user data from localStorage
        const userData = localStorage.getItem('user');
        if (!userData) {
          console.error("    No user data in localStorage");
          navigate('/login');
          return;
        }

        const user = JSON.parse(userData);
        const userId = user._id || user.id;

        if (!userId) {
          console.error("    No user ID found");
          navigate('/login');
          return;
        }

        console.log("🔄 Fetching dashboard for user ID:", userId);
        
        // Fetch dashboard data directly
        const res = await api.get(`/dashboard/${userId}`);
        console.log("    Dashboard data loaded");
        setDashboardData(res.data);
        
      } catch (err) {
        console.error("    Dashboard fetch error:", err);
        
        if (err.response?.status === 401 || err.response?.status === 404) {
          console.error("User not found or unauthorized");
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

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      try {
        await api.delete(`/products/${productId}`);
        setDashboardData(prev => ({
          ...prev,
          products: prev.products.filter(product => product._id !== productId),
          stats: {
            ...prev.stats,
            totalListings: prev.stats.totalListings - 1,
            activeListings: prev.stats.activeListings - 1
          }
        }));
        alert("    Listing deleted successfully!");
      } catch (err) {
        console.error("    Error deleting product:", err);
        alert("    Failed to delete listing.");
      }
    }
  };

  const handleMarkAsSold = async (productId) => {
    try {
      await api.put(`/products/${productId}`, {
        available: false,
        isAvailable: false,
        soldAt: new Date().toISOString()
      });
      
      setDashboardData(prev => ({
        ...prev,
        products: prev.products.map(product => 
          product._id === productId 
            ? { ...product, available: false, isAvailable: false, soldAt: new Date().toISOString() }
            : product
        ),
        stats: {
          ...prev.stats,
          activeListings: prev.stats.activeListings - 1,
          soldListings: prev.stats.soldListings + 1
        }
      }));
      alert("    Marked as sold!");
    } catch (err) {
      console.error("    Error marking as sold:", err);
      alert("    Failed to update listing.");
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">    Failed to load dashboard</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/productlisting"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium"
              >
                + Add New Listing
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Profile Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-6">
            <img
              src={user?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{user?.name || "User"}</h2>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-gray-500 text-sm">{user?.location || "No location set"}</p>
              <div className="flex items-center space-x-6 mt-2">
                <span className="flex items-center text-yellow-500">
                  ⭐ {user?.rating?.toFixed(1) || "0.0"}
                </span>
                <span className="text-gray-500">
                  {stats?.totalListings || 0} Listings
                </span>
                <span className="text-gray-500">
                  {stats?.totalBids || 0} Bids
                </span>
                <span className="text-gray-500">
                  Joined {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : "Recently"}
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats?.totalListings || 0}</div>
              <div className="text-sm text-gray-500">Total Listings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.activeListings || 0}</div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats?.soldListings || 0}</div>
              <div className="text-sm text-gray-500">Sold</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats?.totalBids || 0}</div>
              <div className="text-sm text-gray-500">Total Bids</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats?.activeBids || 0}</div>
              <div className="text-sm text-gray-500">Active Bids</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats?.bidsOnMyProducts || 0}</div>
              <div className="text-sm text-gray-500">Bids on My Items</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="border-b">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {[
                { key: "listings", label: `My Listings (${stats?.totalListings || 0})` },
                { key: "sold", label: `Sold Items (${stats?.soldListings || 0})` },
                { key: "bids", label: `My Bids (${stats?.totalBids || 0})` },
                { key: "orders", label: `Purchases (${stats?.totalPurchases || 0})` },
                { key: "notifications", label: `Notifications (${notifications?.length || 0})` }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
                onMarkAsSold={handleMarkAsSold}
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
              <NotificationsList notifications={notifications} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components
const EmptyState = ({ title, description, buttonText, buttonLink, onButtonClick }) => (
  <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
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
        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
      >
        {buttonText}
      </Link>
    ) : (
      <button
        onClick={onButtonClick}
        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
      >
        {buttonText}
      </button>
    )}
  </div>
);

const ProductGrid = ({ products, onMarkAsSold, onDelete, showActions }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {products.map((product) => (
      <div key={product._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
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
            {product.discount > 0 && (
              <span className="text-gray-400 text-sm line-through ml-2">
                ${product.originalPrice}
              </span>
            )}
          </p>
          
          {showActions && product.available && (
            <div className="flex space-x-2">
              <Link
                to={`/products/${product._id}`}
                className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition text-sm"
              >
                View
              </Link>
              <button
                onClick={() => onMarkAsSold(product._id)}
                className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition text-sm"
              >
                Mark Sold
              </button>
              <button
                onClick={() => onDelete(product._id)}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition text-sm"
              >
                Delete
              </button>
            </div>
          )}
          {!showActions && (
            <Link
              to={`/products/${product._id}`}
              className="w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition text-sm block"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    ))}
  </div>
);

const BidsList = ({ bids }) => (
  <div className="space-y-4">
    {bids.map((bid) => (
      <div key={bid._id} className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h4 className="font-semibold text-gray-900">{bid.product?.name || "Product not found"}</h4>
              <span className={`px-3 py-1 rounded-full text-sm ${
                bid.bidStatus === 'active' ? 'bg-yellow-100 text-yellow-800' :
                bid.bidStatus === 'won' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {bid.bidStatus}
              </span>
            </div>
            <p className="text-gray-600">Your bid: <strong>${bid.bidAmount}</strong></p>
            <p className="text-gray-500 text-sm">Placed: {new Date(bid.placedAt).toLocaleDateString()}</p>
            {bid.product && (
              <p className="text-blue-600 text-sm mt-1">
                Current Price: ${bid.product.price}
              </p>
            )}
          </div>
          {bid.product && (
            <Link
              to={`/products/${bid.product._id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
            >
              View Product
            </Link>
          )}
        </div>
      </div>
    ))}
  </div>
);

const OrdersList = ({ orders }) => (
  <div className="space-y-4">
    {orders.map((order) => (
      <div key={order._id} className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-semibold text-gray-900">Order #{order._id.slice(-6)}</h4>
            <p className="text-gray-600">Total: <strong>${order.totalAmount}</strong></p>
            <p className="text-gray-500 text-sm">Date: {new Date(order.orderDate).toLocaleDateString()}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm ${
            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {order.status}
          </span>
        </div>
      </div>
    ))}
  </div>
);

const NotificationsList = ({ notifications }) => (
  <div className="space-y-4">
    {notifications.map((notification, index) => (
      <div key={notification._id || index} className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition">
        <div className="flex items-start space-x-3">
          <div className={`w-2 h-2 mt-2 rounded-full ${
            notification.type === 'bid' ? 'bg-yellow-500' : 'bg-blue-500'
          }`}></div>
          <div className="flex-1">
            <p className="text-gray-800 font-medium">{notification.message}</p>
            <p className="text-gray-500 text-sm mt-1">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
            {notification.productId && (
              <Link
                to={`/products/${notification.productId}`}
                className="text-blue-600 text-sm hover:underline mt-2 inline-block"
              >
                View Product →
              </Link>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default DashboardPage;