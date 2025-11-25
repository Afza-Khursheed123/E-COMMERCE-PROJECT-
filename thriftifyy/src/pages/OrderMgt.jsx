import React, { useState, useEffect } from "react";
import { Search, Filter, Trash2, Package, RefreshCw, Truck, CheckCircle, Clock, XCircle, Shield, Activity } from "lucide-react";

export function OrderMgt() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all orders from backend
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch("http://localhost:3000/admin/orders");
      const data = await res.json();
      console.log("Fetched orders:", data);
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      alert("Failed to fetch orders");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Function to update order status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:3000/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.orderId === orderId ? { ...order, status: newStatus } : order
          )
        );
      } else {
        console.error("Failed to update order status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Delete order
  const handleDelete = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      const res = await fetch(`http://localhost:3000/admin/orders/${orderId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });

      console.log("Delete response status:", res.status);

      if (res.ok || res.status === 204) {
        setOrders((prev) => prev.filter((order) => order.orderId !== orderId));
        alert("Order deleted successfully!");
      } else {
        const errorData = await res.text();
        console.error("Delete failed:", errorData);
        alert(`Failed to delete order. Status: ${res.status}`);
      }
    } catch (err) {
      console.error("Error deleting order:", err);
      alert("Network error while deleting order.");
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order =>
    (statusFilter === "all" || order.status === statusFilter) &&
    (order.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.sellerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case "Delivered":
        return { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100", border: "border-green-200" };
      case "Shipped":
        return { icon: Truck, color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-200" };
      case "Processing":
        return { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-200" };
      case "Cancelled":
        return { icon: XCircle, color: "text-red-600", bg: "bg-red-100", border: "border-red-200" };
      default:
        return { icon: Clock, color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200" };
    }
  };

  // Get status counts for stats
  const statusCounts = {
    all: orders.length,
    Processing: orders.filter(o => o.status === "Processing").length,
    Shipped: orders.filter(o => o.status === "Shipped").length,
    Delivered: orders.filter(o => o.status === "Delivered").length,
    Cancelled: orders.filter(o => o.status === "Cancelled").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin border-t-[#19535F]"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Package className="w-6 h-6 text-[#19535F] animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 text-lg font-medium">Loading Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Advanced Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-10 w-72 h-72 bg-[#19535F] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-float-slow"></div>
        <div className="absolute bottom-1/4 -right-10 w-96 h-96 bg-[#0B7A75] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-float-slow animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#D7C9AA] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse-slow"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `linear-gradient(#19535F 1px, transparent 1px), linear-gradient(90deg, #19535F 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}></div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8 animate-slide-down">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 bg-white rounded-2xl shadow-lg border border-gray-100 transform hover:rotate-12 transition-all duration-500">
                <Package className="w-8 h-8 text-[#19535F]" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-[#19535F] to-[#0B7A75] rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-[#19535F] to-[#0B7A75] bg-clip-text text-transparent">
                Order Management
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0B7A75]" />
                Manage and track all customer orders
              </p>
            </div>
          </div>
          
          <button
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#19535F] to-[#0B7A75] text-white rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-semibold group"
          >
            <RefreshCw
              className={`w-5 h-5 ${isRefreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
            />
            Refresh Orders
          </button>
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { status: "all", label: "Total Orders", icon: Package, color: "text-gray-600", bg: "bg-gray-100" },
            { status: "Processing", label: "Processing", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100" },
            { status: "Shipped", label: "Shipped", icon: Truck, color: "text-blue-600", bg: "bg-blue-100" },
            { status: "Delivered", label: "Delivered", icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
            { status: "Cancelled", label: "Cancelled", icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
          ].map((stat, index) => (
            <div 
              key={stat.status}
              className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setStatusFilter(stat.status)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{statusCounts[stat.status]}</p>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 mb-6 animate-slide-up">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search orders by ID, product, seller, or buyer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B7A75] focus:border-transparent transition-all duration-300"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B7A75] focus:border-transparent transition-all duration-300"
                >
                  <option value="all">All Status</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <button className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transform hover:scale-105 transition-all duration-300 font-medium">
                <Filter size={18} />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 animate-slide-up animation-delay-100">
          <div className="bg-white rounded-2xl px-6 py-3 border border-gray-200 shadow-sm inline-block">
            <span className="text-sm font-medium text-gray-700">
              Showing <span className="font-bold text-[#0B7A75]">{filteredOrders.length}</span> orders
            </span>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 overflow-hidden animate-slide-up animation-delay-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Order Details
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {filteredOrders.length} orders
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Order ID", "Product", "Seller", "Buyer", "Amount", "Status", "Date", "Actions"].map((heading) => (
                    <th key={heading} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order, index) => {
                  const StatusIcon = getStatusInfo(order.status || "Processing").icon;
                  const statusColor = getStatusInfo(order.status || "Processing").color;
                  const statusBg = getStatusInfo(order.status || "Processing").bg;
                  const statusBorder = getStatusInfo(order.status || "Processing").border;
                  
                  return (
                    <tr 
                      key={order.orderId} 
                      className="hover:bg-gray-50 group transition-all duration-300 animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#19535F] group-hover:text-[#0B7A75] transition-colors">
                          {order.orderId}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {order.productName || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.sellerName || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.buyerName || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          ${parseFloat(order.amount || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <select
                            value={order.status || "Processing"}
                            onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                            className={`appearance-none px-4 py-2 text-sm font-semibold rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B7A75] transition-all duration-300 w-32 ${statusBg} ${statusBorder} ${statusColor}`}
                          >
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                            <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {order.date ? order.date.split("T")[0] : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleDelete(order.orderId)} 
                          className="text-red-600 hover:text-red-800 transform hover:scale-110 transition-all duration-300 p-2 rounded-lg hover:bg-red-50"
                          title="Delete Order"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No orders found matching your filters.</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Animations */}
      <style jsx>{`
        @keyframes slide-down {
          from { 
            opacity: 0; 
            transform: translateY(-30px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        @keyframes slide-up {
          from { 
            opacity: 0; 
            transform: translateY(30px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        @keyframes float-slow {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          33% { 
            transform: translateY(-20px) rotate(5deg); 
          }
          66% { 
            transform: translateY(-10px) rotate(-3deg); 
          }
        }
        @keyframes pulse-slow {
          0%, 100% { 
            opacity: 0.05; 
            transform: scale(1); 
          }
          50% { 
            opacity: 0.1; 
            transform: scale(1.1); 
          }
        }
        .animate-slide-down { 
          animation: slide-down 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94); 
        }
        .animate-slide-up { 
          animation: slide-up 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; 
        }
        .animate-float-slow { 
          animation: float-slow 8s ease-in-out infinite; 
        }
        .animate-pulse-slow { 
          animation: pulse-slow 4s ease-in-out infinite; 
        }
        .animation-delay-100 { animation-delay: 100ms; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-2000 { animation-delay: 2000ms; }
      `}</style>
    </div>
  );
}