import React, { useState, useEffect, useMemo } from "react";
import { DollarSign, TrendingUp, Clock, Trash2, RefreshCw, CreditCard, Shield, Activity, BarChart3, Wallet } from "lucide-react";

export function PaymentMgt() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch all payments (from Orders collection)
  const fetchPayments = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);
    
    try {
      const res = await fetch("http://localhost:3000/admin/payment");
      const data = await res.json();
      
      const formattedData = data.map((p) => ({
        ...p,
        totalAmount: parseFloat(p.totalAmount) || 0,
        status: p.status || "Pending",
      }));
      
      setPayments(formattedData);
    } catch (err) {
      console.error("Error fetching payments:", err);
      alert("Failed to load payments");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filter payments based on status
  const filteredPayments = useMemo(() => {
    if (statusFilter === "all") return payments;
    return payments.filter(payment => 
      payment.status.toLowerCase() === statusFilter.toLowerCase()
    );
  }, [payments, statusFilter]);

  // Calculate totals dynamically
  const totals = useMemo(() => {
    const completed = payments.filter((p) => 
      (p.status || "").toLowerCase() === "completed" || 
      (p.status || "").toLowerCase() === "delivered"
    );
    const pending = payments.filter((p) => 
      (p.status || "").toLowerCase() !== "completed" && 
      (p.status || "").toLowerCase() !== "delivered"
    );

    const totalRevenue = completed.reduce((sum, p) => sum + (parseFloat(p.totalAmount) || 0), 0);
    const totalCommission = completed.reduce((sum, p) => sum + ((parseFloat(p.totalAmount) || 0) * 0.1), 0);
    const pendingPayouts = pending.reduce((sum, p) => sum + (parseFloat(p.totalAmount) || 0), 0);

    return {
      revenue: totalRevenue,
      commission: totalCommission,
      pending: pendingPayouts,
      completedCount: completed.length,
      pendingCount: pending.length,
      totalCount: payments.length,
    };
  }, [payments]);

  // Update payment status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:3000/admin/payment/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setPayments((prev) =>
          prev.map((p) =>
            p.orderId === orderId ? { ...p, status: newStatus } : p
          )
        );
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Network error while updating status");
    }
  };

  // Delete payment (deletes the order)
  const handleDelete = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;

    try {
      const res = await fetch(`http://localhost:3000/admin/payment/${orderId}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      
      if (res.ok || res.status === 204) {
        setPayments((prev) => prev.filter((p) => p.orderId !== orderId));
        alert("Order deleted successfully!");
      } else {
        const errorData = await res.json();
        alert(`Failed to delete order: ${errorData.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error deleting order:", err);
      alert("Network error while deleting order");
    }
  };

  // Get status badge styling
  const getStatusStyle = (status) => {
    const normalizedStatus = (status || "Pending").toLowerCase();
    
    if (normalizedStatus === "completed" || normalizedStatus === "delivered") {
      return { 
        bg: "bg-green-100", 
        text: "text-green-700", 
        border: "border-green-200",
        icon: "✅"
      };
    } else if (normalizedStatus === "pending") {
      return { 
        bg: "bg-yellow-100", 
        text: "text-yellow-700", 
        border: "border-yellow-200",
        icon: "⏳"
      };
    } else if (normalizedStatus === "processing" || normalizedStatus === "shipped") {
      return { 
        bg: "bg-blue-100", 
        text: "text-blue-700", 
        border: "border-blue-200",
        icon: "🔄"
      };
    } else if (normalizedStatus === "cancelled" || normalizedStatus === "refunded") {
      return { 
        bg: "bg-red-100", 
        text: "text-red-700", 
        border: "border-red-200",
        icon: "❌"
      };
    }
    return { 
      bg: "bg-gray-100", 
      text: "text-gray-700", 
      border: "border-gray-200",
      icon: "📄"
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin border-t-[#19535F]"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <CreditCard className="w-6 h-6 text-[#19535F] animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 text-lg font-medium">Loading Payments...</p>
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
                <CreditCard className="w-8 h-8 text-[#19535F]" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-[#19535F] to-[#0B7A75] rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-[#19535F] to-[#0B7A75] bg-clip-text text-transparent">
                Payment & Commission
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0B7A75]" />
                Manage transactions and platform earnings
              </p>
            </div>
          </div>
          
          <button
            onClick={() => fetchPayments(true)}
            disabled={isRefreshing}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#19535F] to-[#0B7A75] text-white rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-semibold group"
          >
            <RefreshCw
              className={`w-5 h-5 ${isRefreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
            />
            Refresh Data
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              title: "Total Revenue", 
              value: `$${totals.revenue.toFixed(2)}`, 
              subtitle: "From completed orders",
              icon: DollarSign, 
              color: "text-green-600",
              bg: "bg-green-100",
              delay: 100
            },
            { 
              title: "Platform Commission", 
              value: `$${totals.commission.toFixed(2)}`, 
              subtitle: "10% of completed orders",
              icon: TrendingUp, 
              color: "text-blue-600",
              bg: "bg-blue-100",
              delay: 200
            },
            { 
              title: "Pending Payouts", 
              value: `$${totals.pending.toFixed(2)}`, 
              subtitle: "Awaiting completion",
              icon: Clock, 
              color: "text-yellow-600",
              bg: "bg-yellow-100",
              delay: 300
            },
            { 
              title: "Total Transactions", 
              value: totals.totalCount.toString(), 
              subtitle: `${totals.completedCount} completed, ${totals.pendingCount} pending`,
              icon: BarChart3, 
              color: "text-purple-600",
              bg: "bg-purple-100",
              delay: 400
            },
          ].map((stat) => (
            <div 
              key={stat.title}
              className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${stat.delay}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-sm font-medium text-gray-600 mt-1">{stat.title}</p>
                  <p className="text-xs text-gray-500 mt-2">{stat.subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 mb-6 animate-slide-up">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-700">Filter by Status:</span>
              {["all", "completed", "pending", "processing", "cancelled"].map((status) => {
                const statusStyle = getStatusStyle(status);
                return (
                  <button
                    key={status}
                    className={`px-4 py-2 rounded-xl border transition-all duration-300 font-medium text-sm capitalize ${
                      statusFilter === status
                        ? `${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} shadow-md`
                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                    }`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === "all" ? "All Transactions" : status}
                  </button>
                );
              })}
            </div>
            
            <div className="bg-gray-50 rounded-xl px-4 py-2">
              <span className="text-sm font-medium text-gray-700">
                Showing <span className="font-bold text-[#0B7A75]">{filteredPayments.length}</span> of{" "}
                <span className="font-bold text-[#19535F]">{payments.length}</span> transactions
              </span>
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 overflow-hidden animate-slide-up animation-delay-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Transaction Details
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {filteredPayments.length} transactions
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Order ID", "Seller", "Buyer", "Product", "Amount", "Commission", "Status", "Date", "Actions"].map((header) => (
                    <th key={header} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center">
                      <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No transactions found</p>
                      <p className="text-gray-400 text-sm mt-2">
                        {statusFilter === "all" 
                          ? "No payments in the system yet" 
                          : `No ${statusFilter} transactions found`}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment, index) => {
                    const statusStyle = getStatusStyle(payment.status);
                    return (
                      <tr 
                        key={payment.orderId} 
                        className="hover:bg-gray-50 group transition-all duration-300 animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-[#19535F] group-hover:text-[#0B7A75] transition-colors">
                            {payment.orderId?.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">
                            {payment.sellerName || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">
                            {payment.buyerName || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {payment.productName || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-800">
                            ${parseFloat(payment.totalAmount).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-green-600">
                            ${(parseFloat(payment.totalAmount) * 0.1 || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={payment.status || "Pending"}
                            onChange={(e) => handleStatusChange(payment.orderId, e.target.value)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B7A75] cursor-pointer transition-all duration-300 w-32 ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {payment.createdAt?.split("T")[0] || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDelete(payment.orderId)}
                            className="text-red-600 hover:text-red-800 transform hover:scale-110 transition-all duration-300 p-2 rounded-lg hover:bg-red-50"
                            title="Delete Transaction"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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