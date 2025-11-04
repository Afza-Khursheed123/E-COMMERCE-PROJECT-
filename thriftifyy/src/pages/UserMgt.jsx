import React, { useState } from "react";
import { Search, MoreVertical, UserCheck, UserX, Plus } from "lucide-react";

export function UserMgt() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(null);
  const [users, setUsers] = useState([
    { id: 1, name: "John Doe", email: "john@example.com", role: "Seller", status: "Active", joined: "2024-01-15", sales: 45 },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Buyer", status: "Active", joined: "2024-02-20", sales: 12 },
    { id: 3, name: "Mike Johnson", email: "mike@example.com", role: "Seller", status: "Suspended", joined: "2023-11-10", sales: 78 },
    { id: 4, name: "Sarah Williams", email: "sarah@example.com", role: "Buyer", status: "Active", joined: "2024-03-05", sales: 5 },
    { id: 5, name: "Tom Brown", email: "tom@example.com", role: "Seller", status: "Active", joined: "2024-01-28", sales: 34 },
  ]);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "Buyer",
    status: "Active",
    sales: 0,
  });
  const [showForm, setShowForm] = useState(false);

  const addUser = () => {
    if (!newUser.name || !newUser.email) {
      alert("Please fill in all fields.");
      return;
    }
    const newEntry = {
      id: users.length + 1,
      ...newUser,
      joined: new Date().toISOString().split("T")[0],
    };
    setUsers([...users, newEntry]);
    setNewUser({ name: "", email: "", role: "Buyer", status: "Active", sales: 0 });
    setShowForm(false);
  };

  const toggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id
          ? { ...user, status: user.status === "Active" ? "Suspended" : "Active" }
          : user
      )
    );
    setMenuOpen(null);
  };

  const deleteUser = (id) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
    setMenuOpen(null);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Add New User
        </button>
      </div>

      {/* Add User Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New User</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Buyer">Buyer</option>
              <option value="Seller">Seller</option>
            </select>
            <select
              value={newUser.status}
              onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
          <button
            onClick={addUser}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Add User
          </button>
        </div>
      )}

      {/* Search + Filter */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="relative w-full md:w-1/2">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto relative">
          <table className="w-full relative">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 relative">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{user.role}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.joined}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{user.sales}</td>
                  <td className="px-6 py-4 text-right relative">
                    <button
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() =>
                        setMenuOpen(menuOpen === user.id ? null : user.id)
                      }
                    >
                      <MoreVertical size={20} />
                    </button>

                    {/* Dropdown fixed */}
                    {menuOpen === user.id && (
                      <div className="absolute right-6 top-10 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                        <button
                          onClick={() => toggleStatus(user.id)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                        >
                          <UserCheck size={16} /> Toggle Status
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                        >
                          <UserX size={16} /> Delete User
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <p className="text-center text-gray-500 py-6">
              No users found matching your filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
