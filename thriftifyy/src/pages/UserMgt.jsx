import React, { useEffect, useState } from "react";
import { Search, MoreVertical, UserCheck, UserX, Plus, Users, Shield, Activity } from "lucide-react";

export function UserMgt() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(null);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "Buyer",
    status: "Active",
    phone: "",
  });

  // ✅ Fetch users from backend
  useEffect(() => {
    setIsLoading(true);
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
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin border-t-[#19535F]"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Activity className="w-6 h-6 text-[#19535F] animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 text-lg font-medium">Loading Users...</p>
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
                <Users className="w-8 h-8 text-[#19535F]" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-[#19535F] to-[#0B7A75] rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-[#19535F] to-[#0B7A75] bg-clip-text text-transparent">
                User Management
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0B7A75]" />
                Manage user accounts and permissions
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#19535F] to-[#0B7A75] text-white rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Add New User
          </button>
        </div>

        {/* Add User Form */}
        {showForm && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 mb-6 animate-slide-up">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
              <div className="p-2 bg-[#0B7A75] rounded-lg">
                <Plus className="w-5 h-5 text-white" />
              </div>
              Add New User
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B7A75] focus:border-transparent transition-all duration-300 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B7A75] focus:border-transparent transition-all duration-300 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                  className="bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B7A75] focus:border-transparent transition-all duration-300 w-full"
                >
                  <option value="Buyer">Buyer</option>
                  <option value="Seller">Seller</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={newUser.status}
                  onChange={(e) =>
                    setNewUser({ ...newUser, status: e.target.value })
                  }
                  className="bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B7A75] focus:border-transparent transition-all duration-300 w-full"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="text"
                  placeholder="Enter phone number"
                  value={newUser.phone}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone: e.target.value })
                  }
                  className="bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B7A75] focus:border-transparent transition-all duration-300 w-full"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={addUser}
                className="px-6 py-3 bg-gradient-to-r from-[#19535F] to-[#0B7A75] text-white rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
              >
                Add User
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transform hover:scale-105 transition-all duration-300 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 mb-6 animate-slide-up animation-delay-100">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="relative w-full md:w-1/2">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B7A75] focus:border-transparent transition-all duration-300"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B7A75] focus:border-transparent transition-all duration-300"
              >
                <option value="All">All Users</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 overflow-hidden animate-slide-up animation-delay-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                User Accounts
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {filteredUsers.length} users found
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50 group transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#19535F] to-[#0B7A75] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 group-hover:text-[#0B7A75] transition-colors">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                        user.role === "Seller" 
                          ? "bg-purple-100 text-purple-700 border-purple-200" 
                          : "bg-blue-100 text-blue-700 border-blue-200"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border transition-all duration-300 ${
                          user.status === "Active"
                            ? "bg-green-100 text-green-700 border-green-200 group-hover:bg-green-200"
                            : "bg-red-100 text-red-700 border-red-200 group-hover:bg-red-200"
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
                          className="text-gray-400 hover:text-gray-600 transform hover:scale-110 transition-all duration-300"
                          onClick={() =>
                            setMenuOpen(menuOpen === user.id ? null : user.id)
                          }
                        >
                          <MoreVertical size={20} />
                        </button>

                        {menuOpen === user.id && (
                          <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 animate-fade-in">
                            <button
                              onClick={() => toggleStatus(user.id)}
                              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full transition-colors duration-300 first:rounded-t-xl last:rounded-b-xl"
                            >
                              <UserCheck size={16} className="text-green-600" />
                              Toggle Status
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-gray-50 w-full transition-colors duration-300 first:rounded-t-xl last:rounded-b-xl"
                            >
                              <UserX size={16} />
                              Delete User
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
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No users found matching your filters.</p>
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
        @keyframes fade-in {
          from { 
            opacity: 0; 
          }
          to { 
            opacity: 1; 
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
        .animate-fade-in { 
          animation: fade-in 0.3s ease-out; 
        }
        .animate-float-slow { 
          animation: float-slow 8s ease-in-out infinite; 
        }
        .animate-pulse-slow { 
          animation: pulse-slow 4s ease-in-out infinite; 
        }
        .animation-delay-100 { animation-delay: 100ms; }
        .animation-delay-200 { animation-delay: 200ms; }
      `}</style>
    </div>
  );
}