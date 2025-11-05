import React, { useState, useEffect } from "react";
import { Search, Filter, Trash2 } from "lucide-react";

export function OrderMgt() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState([]);

  // Fetch all orders from backend
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:3000/admin/orders");
      const data = await res.json();
      console.log("Fetched orders:", data);
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      alert("Failed to fetch orders");
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

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Order Management</h1>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter size={18} />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Order ID", "Product", "Seller", "Buyer", "Amount", "Status", "Date", "Actions"].map((heading) => (
                  <th key={heading} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {orders
                .filter(order =>
                  (statusFilter === "all" || order.status === statusFilter) &&
                  (order.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.sellerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map(order => (
                  <tr key={order.orderId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {order.orderId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.productName || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.sellerName || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.buyerName || "N/A"}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ${parseFloat(order.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status || "Processing"}
                        onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full cursor-pointer focus:outline-none
                        ${(order.status || "Processing") === "Delivered"
                            ? "bg-green-100 text-green-800"
                            : (order.status || "Processing") === "Shipped"
                              ? "bg-blue-100 text-blue-800"
                              : (order.status || "Processing") === "Processing"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                      >
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.date ? order.date.split("T")[0] : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button 
                        onClick={() => handleDelete(order.orderId)} 
                        className="text-red-600 hover:text-red-800"
                      >
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