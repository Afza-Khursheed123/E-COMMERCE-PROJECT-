import React, { useState, useMemo } from "react";
import { DollarSign, TrendingUp, Clock } from "lucide-react";

export function PaymentMgt() {
  const [payments, setPayments] = useState([
    {
      id: 1,
      orderId: "#1001",
      seller: "John Doe",
      buyer: "Alice Cooper",
      amount: 250,
      commission: 25,
      status: "Completed",
      date: "2024-03-15",
    },
    {
      id: 2,
      orderId: "#1002",
      seller: "Mike Johnson",
      buyer: "Bob Smith",
      amount: 180,
      commission: 18,
      status: "Pending",
      date: "2024-03-16",
    },
  ]);

  const [newPayment, setNewPayment] = useState({
    seller: "",
    buyer: "",
    amount: "",
  });

  // Calculate totals dynamically
  const totals = useMemo(() => {
    const completed = payments.filter((p) => p.status === "Completed");
    const pending = payments.filter((p) => p.status !== "Completed");

    const totalRevenue = completed.reduce((sum, p) => sum + p.amount, 0);
    const totalCommission = completed.reduce((sum, p) => sum + p.commission, 0);
    const pendingPayouts = pending.reduce((sum, p) => sum + p.amount, 0);

    return {
      revenue: totalRevenue,
      commission: totalCommission,
      pending: pendingPayouts,
    };
  }, [payments]);

  // Handle status change
  const handleStatusChange = (id, newStatus) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
  };

  // Handle input changes for new payment
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPayment((prev) => ({ ...prev, [name]: value }));
  };

  // Add new payment with 5% commission
  const addPayment = (e) => {
    e.preventDefault();
    if (!newPayment.seller || !newPayment.buyer || !newPayment.amount) {
      alert("Please fill all fields!");
      return;
    }

    const amount = parseFloat(newPayment.amount);
    const commission = (amount * 5) / 100;

    const newEntry = {
      id: payments.length + 1,
      orderId: `#100${payments.length + 1}`,
      seller: newPayment.seller,
      buyer: newPayment.buyer,
      amount,
      commission,
      status: "Pending",
      date: new Date().toISOString().split("T")[0],
    };

    setPayments((prev) => [...prev, newEntry]);
    setNewPayment({ seller: "", buyer: "", amount: "" });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Payment & Commission Management
      </h1>

      {/* Add Payment Form */}
      <form
        onSubmit={addPayment}
        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8"
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Add New Payment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            name="seller"
            value={newPayment.seller}
            onChange={handleInputChange}
            placeholder="Seller Name"
            className="text-black bg-white border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="text"
            name="buyer"
            value={newPayment.buyer}
            onChange={handleInputChange}
            placeholder="Buyer Name"
            className="text-black bg-white border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="number"
            name="amount"
            value={newPayment.amount}
            onChange={handleInputChange}
            placeholder="Amount ($)"
            className="text-black bg-white border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Payment
          </button>
        </div>
      </form>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <span className="text-sm text-gray-500 font-medium">
              Total Revenue
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            ${totals.revenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <span className="text-sm text-gray-500 font-medium">
              Total Commission
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            ${totals.commission.toFixed(2)}
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <span className="text-sm text-gray-500 font-medium">
              Pending Payouts
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            ${totals.pending.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Recent Transactions
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                {[
                  "Order ID",
                  "Seller",
                  "Buyer",
                  "Amount",
                  "Commission",
                  "Status",
                  "Date",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {payment.orderId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {payment.seller}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {payment.buyer}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                    ${payment.amount}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">
                    ${payment.commission.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={payment.status}
                      onChange={(e) =>
                        handleStatusChange(payment.id, e.target.value)
                      }
                      className={`px-3 py-1 rounded-full text-xs font-semibold focus:outline-none cursor-pointer ${
                        payment.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : payment.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {payment.date}
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
