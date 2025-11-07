import React, { useEffect, useState } from "react";
import { Search, MoreVertical, UserCheck, UserX, Plus } from "lucide-react";

export function UserMgt() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(null);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "Buyer",
    status: "Active",
    phone: "",
  });

  // ✅ Fetch users from backend
  useEffect(() => {
    fetch("http://localhost:3000/admin/users")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched users:", data);
        const userArray = Array.isArray(data) ? data : data.users || [];
        // Map joinedAt field
        setUsers(
          userArray.map((u, i) => ({
            id: u._id || i + 1,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status,
            joined: u.joinedAt ? u.joinedAt.split("T")[0] : "N/A",
            phone: u.phone || "N/A",
          }))
        );
      })
      .catch((err) => console.error(err));
  }, []);

  // ✅ Add new user (backend + frontend)
  const addUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.phone) {
      alert("Please fill in all fields.");
      return;
    }

    const userToAdd = {
      ...newUser,
      joinedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("http://localhost:3000/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userToAdd),
      });

      if (res.ok) {
        const saved = await res.json();
        setUsers((prev) => [
          ...prev,
          {
            id: saved._id || prev.length + 1,
            ...userToAdd,
            joined: userToAdd.joinedAt.split("T")[0],
          },
        ]);
        setNewUser({
          name: "",
          email: "",
          role: "Buyer",
          status: "Active",
          phone: "",
        });
        setShowForm(false);
      } else {
        alert("Failed to add user.");
      }
    } catch (error) {
      console.error("Add user error:", error);
      alert("Error adding user.");
    }
  };

  // ✅ Toggle status
  const toggleStatus = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/admin/users/status/${id}`, {
        method: "PATCH",
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state with the new status from backend
        setUsers((prev) =>
          prev.map((user) =>
            user.id === id
              ? { ...user, status: data.status }
              : user
          )
        );
      } else {
        alert("Failed to update status.");
      }
    } catch (error) {
      console.error("Toggle status error:", error);
      alert("Error updating status.");
    }
    setMenuOpen(null);
  };

  // ✅ Delete user
  const deleteUser = async (id) => {
    try {
      await fetch(`http://localhost:3000/admin/users/${id}`, {
        method: "DELETE",
      });
      setUsers((prev) => prev.filter((user) => user.id !== id));
      setMenuOpen(null);
    } catch (error) {
      console.error("Delete user error:", error);
    }
  };

  // ✅ Filters
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
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Add New User
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={newUser.name}
              onChange={(e) =>
                setNewUser({ ...newUser, name: e.target.value })
              }
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newUser.role}
              onChange={(e) =>
                setNewUser({ ...newUser, role: e.target.value })
              }
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Buyer">Buyer</option>
              <option value="Seller">Seller</option>
            </select>
            <select
              value={newUser.status}
              onChange={(e) =>
                setNewUser({ ...newUser, status: e.target.value })
              }
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
            <input
              type="text"
              placeholder="Phone Number"
              value={newUser.phone}
              onChange={(e) =>
                setNewUser({ ...newUser, phone: e.target.value })
              }
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 relative">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.role}
                  </td>
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
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.joined}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.phone}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative">
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() =>
                          setMenuOpen(menuOpen === user.id ? null : user.id)
                        }
                      >
                        <MoreVertical size={20} />
                      </button>

                      {menuOpen === user.id && (
                        <div className="absolute right-0 top-8 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
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
                    </div>
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
