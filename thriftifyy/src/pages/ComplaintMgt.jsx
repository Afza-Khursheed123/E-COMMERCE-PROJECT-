import React, { useState, useEffect } from "react";
import {
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  PlusCircle,
  X,
  MessageSquare,
  Shield,
  Activity,
  Filter,
  RefreshCw
} from "lucide-react";

export function ComplaintMgt() {
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [newComplaint, setNewComplaint] = useState({
    user: "",
    orderId: "",
    subject: "",
    priority: "Low",
    status: "Open",
    date: new Date().toISOString().split("T")[0],
  });

  // 🟢 Fetch complaints
  const fetchComplaints = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);
    
    try {
      const res = await fetch("http://localhost:3000/admin/complain");
      const data = await res.json();
      if (data.success && Array.isArray(data.complains)) {
        setComplaints(data.complains);
      } else {
        console.error("Unexpected data format:", data);
      }
    } catch (err) {
      console.error("❌ Error fetching complaints:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // 🟡 Add new complaint
  const handleAddComplaint = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3000/admin/complain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newComplaint),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // ✅ Re-fetch complaints to auto-refresh list
        await fetchComplaints();
        setShowForm(false);
        setNewComplaint({
          user: "",
          orderId: "",
          subject: "",
          priority: "Low",
          status: "Open",
          date: new Date().toISOString().split("T")[0],
        });
      } else {
        console.error("❌ Failed to add complaint:", data.message);
      }
    } catch (err) {
      console.error("❌ Error adding complaint:", err);
    }
  };

  // 🔵 Change status
  const handleStatusChange = async (_id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:3000/admin/complain/${_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setComplaints((prev) =>
          prev.map((c) => (c._id === _id ? { ...c, status: newStatus } : c))
        );
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // 🔴 Change priority
  const handlePriorityChange = async (_id, newPriority) => {
    try {
      const res = await fetch(`http://localhost:3000/admin/complain/${_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });

      if (res.ok) {
        setComplaints((prev) =>
          prev.map((c) => (c._id === _id ? { ...c, priority: newPriority } : c))
        );
      }
    } catch (err) {
      console.error("Error updating priority:", err);
    }
  };

  // 🟣 Filter complaints
  const filteredComplaints = complaints.filter(
    (complaint) =>
      (priorityFilter === "all" || complaint.priority?.toLowerCase() === priorityFilter) &&
      (statusFilter === "all" || complaint.status?.toLowerCase() === statusFilter) &&
      (complaint.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.orderId?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openCount = complaints.filter((c) => c.status === "Open").length;
  const inProgressCount = complaints.filter((c) => c.status === "In Progress").length;
  const resolvedCount = complaints.filter((c) => c.status === "Resolved").length;
  const totalCount = complaints.length;

  // Get status style
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", icon: CheckCircle };
      case "in progress":
        return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: Clock };
      case "open":
      default:
        return { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", icon: AlertCircle };
    }
  };

  // Get priority style
  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" };
      case "medium":
        return { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" };
      case "low":
      default:
        return { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin border-t-[#19535F]"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <MessageSquare className="w-6 h-6 text-[#19535F] animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 text-lg font-medium">Loading Complaints...</p>
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
                <MessageSquare className="w-8 h-8 text-[#19535F]" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-[#19535F] to-[#0B7A75] rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-[#19535F] to-[#0B7A75] bg-clip-text text-transparent">
                Complaint Management
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0B7A75]" />
                Resolve customer issues and track complaints
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#19535F] to-[#0B7A75] text-white rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold group"
            >
              <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              Add Complaint
            </button>
            <button
              onClick={() => fetchComplaints(true)}
              disabled={isRefreshing}
              className="flex items-center gap-3 px-6 py-3 bg-white text-gray-700 rounded-xl border border-gray-200 hover:border-[#0B7A75] transform hover:scale-105 hover:shadow-lg transition-all duration-300 font-semibold group"
            >
              <RefreshCw
                className={`w-5 h-5 ${isRefreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              title: "Total Complaints", 
              value: totalCount, 
              subtitle: "All customer complaints",
              icon: MessageSquare, 
              color: "text-gray-600",
              bg: "bg-gray-100",
              delay: 100
            },
            { 
              title: "Open Complaints", 
              value: openCount, 
              subtitle: "Requiring attention",
              icon: AlertCircle, 
              color: "text-orange-600",
              bg: "bg-orange-100",
              delay: 200
            },
            { 
              title: "In Progress", 
              value: inProgressCount, 
              subtitle: "Being resolved",
              icon: Clock, 
              color: "text-blue-600",
              bg: "bg-blue-100",
              delay: 300
            },
            { 
              title: "Resolved", 
              value: resolvedCount, 
              subtitle: "Successfully closed",
              icon: CheckCircle, 
              color: "text-green-600",
              bg: "bg-green-100",
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

        {/* Search & Filter */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 mb-6 animate-slide-up">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search complaints by user, subject, order ID, or ticket ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B7A75] focus:border-transparent transition-all duration-300"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B7A75] focus:border-transparent transition-all duration-300"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B7A75] focus:border-transparent transition-all duration-300"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 animate-slide-up animation-delay-100">
          <div className="bg-white rounded-2xl px-6 py-3 border border-gray-200 shadow-sm inline-block">
            <span className="text-sm font-medium text-gray-700">
              Showing <span className="font-bold text-[#0B7A75]">{filteredComplaints.length}</span> of{" "}
              <span className="font-bold text-[#19535F]">{complaints.length}</span> complaints
            </span>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 overflow-hidden animate-slide-up animation-delay-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Complaint Details
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {filteredComplaints.length} complaints
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Ticket ID", "User", "Order ID", "Subject", "Priority", "Status", "Date"].map((header) => (
                    <th key={header} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredComplaints.map((complaint, index) => {
                  const statusStyle = getStatusStyle(complaint.status);
                  const priorityStyle = getPriorityStyle(complaint.priority);
                  const StatusIcon = statusStyle.icon;
                  
                  return (
                    <tr 
                      key={complaint._id} 
                      className="hover:bg-gray-50 group transition-all duration-300 animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-[#19535F] group-hover:text-[#0B7A75] transition-colors">
                          {complaint._id?.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {complaint.user}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded-lg inline-block">
                          {complaint.orderId}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {complaint.subject}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={complaint.priority || "Low"}
                          onChange={(e) => handlePriorityChange(complaint._id, e.target.value)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B7A75] cursor-pointer transition-all duration-300 w-28 ${priorityStyle.bg} ${priorityStyle.border} ${priorityStyle.text}`}
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <select
                            value={complaint.status || "Open"}
                            onChange={(e) => handleStatusChange(complaint._id, e.target.value)}
                            className={`appearance-none px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B7A75] cursor-pointer transition-all duration-300 w-32 ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                            <StatusIcon className={`w-4 h-4 ${statusStyle.text}`} />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {complaint.date}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredComplaints.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No complaints found matching your filters.</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 shadow-xl w-full max-w-md relative animate-slide-up">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transform hover:scale-110 transition-all duration-300"
            >
              <X size={24} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#0B7A75] rounded-lg">
                <PlusCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Add New Complaint</h2>
            </div>

            <form onSubmit={handleAddComplaint} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User Name</label>
                <input
                  type="text"
                  placeholder="Enter user name"
                  value={newComplaint.user}
                  onChange={(e) => setNewComplaint({ ...newComplaint, user: e.target.value })}
                  required
                  className="bg-white w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B7A75] focus:border-transparent transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order ID</label>
                <input
                  type="text"
                  placeholder="Enter order ID (e.g. #1006)"
                  value={newComplaint.orderId}
                  onChange={(e) => setNewComplaint({ ...newComplaint, orderId: e.target.value })}
                  required
                  className="bg-white w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B7A75] focus:border-transparent transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  placeholder="Enter complaint subject"
                  value={newComplaint.subject}
                  onChange={(e) => setNewComplaint({ ...newComplaint, subject: e.target.value })}
                  required
                  className="bg-white w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B7A75] focus:border-transparent transition-all duration-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newComplaint.priority}
                    onChange={(e) => setNewComplaint({ ...newComplaint, priority: e.target.value })}
                    className="bg-white w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B7A75] focus:border-transparent transition-all duration-300"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={newComplaint.status}
                    onChange={(e) => setNewComplaint({ ...newComplaint, status: e.target.value })}
                    className="bg-white w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B7A75] focus:border-transparent transition-all duration-300"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#19535F] to-[#0B7A75] text-white py-3 rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
                >
                  Add Complaint
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transform hover:scale-105 transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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