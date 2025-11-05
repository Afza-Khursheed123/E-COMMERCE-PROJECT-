import React, { useState } from "react";
import { Search, Filter } from "lucide-react";

export function OrderMgt() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [orders, setOrders] = useState([
    { id: "#1001", seller: "John Doe", buyer: "Alice Cooper", product: "Vintage Camera", amount: 250, status: "Delivered", date: "2024-03-15" },
    { id: "#1002", seller: "Mike Johnson", buyer: "Bob Smith", product: "Gaming Console", amount: 180, status: "Shipped", date: "2024-03-16" },
    { id: "#1003", seller: "Tom Brown", buyer: "Carol White", product: "Designer Watch", amount: 420, status: "Delivered", date: "2024-03-16" },
    { id: "#1004", seller: "John Doe", buyer: "David Lee", product: "Headphones", amount: 95, status: "Processing", date: "2024-03-17" },
    { id: "#1005", seller: "Tom Brown", buyer: "Emma Davis", product: "Laptop", amount: 310, status: "Delivered", date: "2024-03-17" },
    { id: "#1006", seller: "Mike Johnson", buyer: "Frank Miller", product: "Smartphone", amount: 275, status: "Cancelled", date: "2024-03-18" },
  ]);

  // Function to update order status
  const handleStatusChange = (id, newStatus) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === id ? { ...order, status: newStatus } : order
      )
    );
    // Here, you can also call an API to update the status in the backend
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
                {["Order ID", "Product", "Seller", "Buyer", "Amount", "Status", "Date"].map((heading) => (
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
                  (order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.buyer.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{order.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.product}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.seller}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.buyer}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">${order.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full cursor-pointer
                        ${order.status === "Delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "Shipped"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "Processing"
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

                    <td className="px-6 py-4 text-sm text-gray-500">{order.date}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
