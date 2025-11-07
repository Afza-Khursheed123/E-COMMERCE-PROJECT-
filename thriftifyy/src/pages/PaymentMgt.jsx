import React, { useState, useEffect, useMemo } from "react";
import { DollarSign, TrendingUp, Clock, Trash2, RefreshCw } from "lucide-react";

export function PaymentMgt() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all payments (from Orders collection)
  const fetchPayments = async () => {
    setLoading(true);
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
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

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
      return "bg-green-100 text-green-700";
    } else if (normalizedStatus === "pending") {
      return "bg-yellow-100 text-yellow-700";
    } else if (normalizedStatus === "processing" || normalizedStatus === "shipped") {
      return "bg-blue-100 text-blue-700";
    } else if (normalizedStatus === "cancelled" || normalizedStatus === "refunded") {
      return "bg-red-100 text-red-700";
    }
    return "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Payment & Commission Management</h1>
        <button
          onClick={fetchPayments}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <span className="text-sm text-gray-500 font-medium">Total Revenue</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">${totals.revenue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">From completed orders</p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <span className="text-sm text-gray-500 font-medium">Total Commission (10%)</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">${totals.commission.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Platform earnings</p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <span className="text-sm text-gray-500 font-medium">Pending Payouts</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">${totals.pending.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting completion</p>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">All Transactions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Showing {payments.length} orders from the database
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                {["Order ID", "Seller", "Buyer", "Product", "Amount", "Commission", "Status", "Date", "Actions"].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    No orders found in the database
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.orderId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {payment.orderId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{payment.sellerName}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{payment.buyerName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{payment.productName || "N/A"}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                      ${parseFloat(payment.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      ${(parseFloat(payment.totalAmount) * 0.1 || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={payment.status || "Pending"}
                        onChange={(e) => handleStatusChange(payment.orderId, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold focus:outline-none cursor-pointer ${getStatusStyle(payment.status)}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {payment.createdAt?.split("T")[0] || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDelete(payment.orderId)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete Order"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}