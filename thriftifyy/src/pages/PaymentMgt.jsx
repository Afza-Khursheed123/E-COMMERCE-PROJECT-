import React, { useState, useEffect, useMemo } from "react";
import { DollarSign, TrendingUp, Clock, Trash2 } from "lucide-react";

export function PaymentMgt() {
  const [payments, setPayments] = useState([]);
  const [newPayment, setNewPayment] = useState({
    orderId: "",
    sellerName: "",
    buyerName: "",
    totalAmount: "",
  });

  // Fetch all payments
  useEffect(() => {
    fetch("http://localhost:3000/admin/payment")
      .then((res) => res.json())
      .then((data) => {
        // Ensure totalAmount is number
        const formattedData = data.map((p) => ({
          ...p,
          totalAmount: parseFloat(p.totalAmount) || 0,
          status: p.status || "Pending",
        }));
        setPayments(formattedData);
      })
      .catch((err) => console.error("Error fetching payments:", err));
  }, []);

  // Calculate totals dynamically
  const totals = useMemo(() => {
    const completed = payments.filter((p) => (p.status || "").toLowerCase() === "completed");
    const pending = payments.filter((p) => (p.status || "").toLowerCase() !== "completed");

    const totalRevenue = completed.reduce((sum, p) => sum + (parseFloat(p.totalAmount) || 0), 0);
    const totalCommission = completed.reduce((sum, p) => sum + ((parseFloat(p.totalAmount) || 0) * 0.1), 0);
    const pendingPayouts = pending.reduce((sum, p) => sum + (parseFloat(p.totalAmount) || 0), 0);

    return {
      revenue: totalRevenue,
      commission: totalCommission,
      pending: pendingPayouts,
    };
  }, [payments]);

  // Handle input change for form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPayment((prev) => ({ ...prev, [name]: value }));
  };

  // Add new payment
  const addPayment = async (e) => {
    e.preventDefault();
    if (!newPayment.orderId || !newPayment.sellerName || !newPayment.buyerName || !newPayment.totalAmount) {
      alert("Please fill all fields!");
      return;
    }

    const paymentData = {
      orderId: newPayment.orderId,
      sellerName: newPayment.sellerName,
      buyerName: newPayment.buyerName,
      totalAmount: parseFloat(newPayment.totalAmount),
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("http://localhost:3000/admin/payment/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (res.ok) {
        const savedPayment = await res.json();
        console.log("Saved payment:", savedPayment);
        
        // Ensure all fields are properly formatted
        const formattedPayment = {
          orderId: savedPayment.orderId || paymentData.orderId,
          sellerName: savedPayment.sellerName || paymentData.sellerName,
          buyerName: savedPayment.buyerName || paymentData.buyerName,
          totalAmount: parseFloat(savedPayment.totalAmount || paymentData.totalAmount) || 0,
          status: savedPayment.status || "Pending",
          createdAt: savedPayment.createdAt || paymentData.createdAt,
        };
        setPayments((prev) => [...prev, formattedPayment]);
        setNewPayment({ orderId: "", sellerName: "", buyerName: "", totalAmount: "" });
        alert("Payment added successfully!");
      } else {
        const errorData = await res.json();
        console.error("Error response:", errorData);
        alert(`Failed to add payment: ${errorData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error adding payment:", err);
      alert("Network error while adding payment.");
    }
  };

  // Update payment status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:3000/admin/payment/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Backend might not return updated object, so update manually
        setPayments((prev) =>
          prev.map((p) =>
            p.orderId === orderId ? { ...p, status: newStatus } : p
          )
        );
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Delete payment
  const handleDelete = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) return;

    try {
      const res = await fetch(`http://localhost:3000/admin/payment/${orderId}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      
      console.log("Delete response status:", res.status);
      
      if (res.ok || res.status === 204) {
        // Remove from UI immediately
        setPayments((prev) => prev.filter((p) => p.orderId !== orderId));
        alert("Payment deleted successfully!");
      } else {
        const errorData = await res.text();
        console.error("Delete failed:", errorData);
        alert(`Failed to delete payment. Status: ${res.status}`);
      }
    } catch (err) {
      console.error("Error deleting payment:", err);
      alert("Network error while deleting payment.");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Payment & Commission Management</h1>

      {/* Add Payment Form */}
      <form onSubmit={addPayment} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Payment</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input type="text" name="orderId" value={newPayment.orderId} onChange={handleInputChange} placeholder="Order ID"
            className="text-black bg-white border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
          <input type="text" name="sellerName" value={newPayment.sellerName} onChange={handleInputChange} placeholder="Seller Name"
            className="text-black bg-white border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
          <input type="text" name="buyerName" value={newPayment.buyerName} onChange={handleInputChange} placeholder="Buyer Name"
            className="text-black bg-white border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
          <input type="number" name="totalAmount" value={newPayment.totalAmount} onChange={handleInputChange} placeholder="Amount ($)"
            className="text-black bg-white border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Add Payment</button>
        </div>
      </form>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="text-green-600" size={24} /></div>
            <span className="text-sm text-gray-500 font-medium">Total Revenue</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">${totals.revenue.toFixed(2)}</p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg"><TrendingUp className="text-blue-600" size={24} /></div>
            <span className="text-sm text-gray-500 font-medium">Total Commission</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">${totals.commission.toFixed(2)}</p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="text-yellow-600" size={24} /></div>
            <span className="text-sm text-gray-500 font-medium">Pending Payouts</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">${totals.pending.toFixed(2)}</p>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                {["Order ID", "Seller", "Buyer", "Amount", "Commission", "Status", "Date", "Actions"].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.orderId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{payment.orderId}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{payment.sellerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{payment.buyerName}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">${parseFloat(payment.totalAmount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">${(parseFloat(payment.totalAmount) * 0.1 || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <select
                      value={payment.status || "Pending"}
                      onChange={(e) => handleStatusChange(payment.orderId, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold focus:outline-none cursor-pointer ${
                        (payment.status || "Pending").toLowerCase() === "completed"
                          ? "bg-green-100 text-green-700"
                          : (payment.status || "Pending").toLowerCase() === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{payment.createdAt?.split("T")[0]}</td>
                  <td className="px-6 py-4 text-sm">
                    <button onClick={() => handleDelete(payment.orderId)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}