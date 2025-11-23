import React, { useState, useEffect } from "react";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusCircleIcon,
  FileTextIcon,
  UserIcon,
  TagIcon,
  CalendarIcon,
  SearchIcon,
  FilterIcon,
  XIcon,
} from "lucide-react";

export function UserComplaintPage() {
  const [showForm, setShowForm] = useState(false);
  const [userComplaints, setUserComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // In a real app, this would come from authentication
  const [currentUser] = useState("David Lee");

  const [newComplaint, setNewComplaint] = useState({
    user: currentUser,
    orderId: "",
    subject: "",
    description: "",
    priority: "Low",
  });

  // 🟢 Fetch only current user's complaints
  const fetchUserComplaints = async () => {
    try {
      const res = await fetch("http://localhost:3000/admin/complain");
      const data = await res.json();
      if (data.success && Array.isArray(data.complains)) {
        const userComplaints = data.complains.filter(
          complaint => complaint.user === currentUser
        );
        setUserComplaints(userComplaints);
      }
    } catch (err) {
      console.error("❌ Error fetching complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserComplaints();
  }, [currentUser]);

  // 🟡 Submit new complaint
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const complaintData = {
        ...newComplaint,
        user: currentUser,
        status: "Open",
        date: new Date().toISOString().split("T")[0],
      };

      const res = await fetch("http://localhost:3000/admin/complain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(complaintData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await fetchUserComplaints();
        setShowForm(false);
        setNewComplaint({
          user: currentUser,
          orderId: "",
          subject: "",
          description: "",
          priority: "Low",
        });
      } else {
        alert("Failed to submit complaint: " + data.message);
      }
    } catch (err) {
      console.error("❌ Error submitting complaint:", err);
      alert("Error submitting complaint. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // 🟣 Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case "Resolved":
        return { 
          icon: CheckCircleIcon, 
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          gradient: "from-green-50 to-green-25",
          badgeColor: "bg-green-100 text-green-800 border-green-200"
        };
      case "In Progress":
        return { 
          icon: ClockIcon, 
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          gradient: "from-blue-50 to-blue-25",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200"
        };
      case "Open":
        return { 
          icon: AlertCircleIcon, 
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          gradient: "from-orange-50 to-orange-25",
          badgeColor: "bg-orange-100 text-orange-800 border-orange-200"
        };
      default:
        return { 
          icon: FileTextIcon, 
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          gradient: "from-gray-50 to-gray-25",
          badgeColor: "bg-gray-100 text-gray-800 border-gray-200"
        };
    }
  };

  // 🟠 Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // 🔵 Filter complaints
  const filteredComplaints = userComplaints.filter(complaint => {
    const matchesSearch = complaint.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.orderId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats data
  const stats = [
    {
      label: "Open Complaints",
      count: userComplaints.filter(c => c.status === "Open").length,
      icon: AlertCircleIcon,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      gradient: "from-orange-500 to-orange-600"
    },
    {
      label: "In Progress",
      count: userComplaints.filter(c => c.status === "In Progress").length,
      icon: ClockIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      label: "Resolved",
      count: userComplaints.filter(c => c.status === "Resolved").length,
      icon: CheckCircleIcon,
      color: "text-green-600",
      bgColor: "bg-green-50",
      gradient: "from-green-500 to-green-600"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 border border-blue-100/50 shadow-sm mb-6">
            <UserIcon className="text-blue-600" size={20} />
            <span className="text-gray-700">
              Welcome, <span className="font-semibold text-gray-900">{currentUser}</span>
            </span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent mb-4">
            Support Center
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We're here to help! Submit your concerns and track their progress in real-time.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.count}</p>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={stat.color} size={24} />
                </div>
              </div>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full bg-gradient-to-r ${stat.gradient} transition-all duration-1000`}
                  style={{ 
                    width: `${userComplaints.length ? (stat.count / userComplaints.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-100/50 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Complaints</h2>
              <p className="text-gray-600">
                {userComplaints.length === 0 
                  ? "Get started by submitting your first complaint"
                  : `You have ${userComplaints.length} complaint${userComplaints.length !== 1 ? 's' : ''} in total`
                }
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <PlusCircleIcon size={20} />
              <span className="font-semibold">New Complaint</span>
            </button>
          </div>

          {/* Search and Filter */}
          {userComplaints.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search complaints by subject or order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <FilterIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-12 pr-8 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Complaint Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-slideUp">
              <div className="absolute -top-4 -right-4">
                <button
                  onClick={() => !submitting && setShowForm(false)}
                  disabled={submitting}
                  className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                >
                  <XIcon size={20} className="text-gray-600" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <PlusCircleIcon className="text-blue-600" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Submit New Complaint</h2>
                  <p className="text-gray-600 mt-1">We'll get back to you within 24 hours</p>
                </div>

                <form onSubmit={handleSubmitComplaint} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Order ID *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., #1006"
                      value={newComplaint.orderId}
                      onChange={(e) =>
                        setNewComplaint({ ...newComplaint, orderId: e.target.value })
                      }
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      placeholder="Brief description of your issue"
                      value={newComplaint.subject}
                      onChange={(e) =>
                        setNewComplaint({ ...newComplaint, subject: e.target.value })
                      }
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Detailed Description *
                    </label>
                    <textarea
                      placeholder="Please describe your issue in detail..."
                      value={newComplaint.description}
                      onChange={(e) =>
                        setNewComplaint({ ...newComplaint, description: e.target.value })
                      }
                      required
                      rows="4"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority Level
                    </label>
                    <select
                      value={newComplaint.priority}
                      onChange={(e) =>
                        setNewComplaint({ ...newComplaint, priority: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Submitting...
                      </div>
                    ) : (
                      "Submit Complaint"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Complaints List */}
        <div className="space-y-6">
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/50 shadow-sm">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FileTextIcon className="text-blue-400" size={40} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {userComplaints.length === 0 ? "No complaints yet" : "No matching complaints"}
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                {userComplaints.length === 0 
                  ? "Ready to submit your first complaint? We're here to help!"
                  : "Try adjusting your search or filter criteria"
                }
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Submit Your First Complaint
              </button>
            </div>
          ) : (
            filteredComplaints.map((complaint) => {
              const statusInfo = getStatusInfo(complaint.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div 
                  key={complaint._id} 
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100/50 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-200/50"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl border ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
                          <StatusIcon className={statusInfo.color} size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                              {complaint.subject}
                            </h3>
                            <div className="flex gap-2">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(complaint.priority)}`}>
                                {complaint.priority} Priority
                              </span>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusInfo.badgeColor}`}>
                                {complaint.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <TagIcon size={16} className="text-gray-400" />
                              <span>Order: {complaint.orderId}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarIcon size={16} className="text-gray-400" />
                              <span>Submitted: {complaint.date}</span>
                            </div>
                          </div>

                          {complaint.description && (
                            <p className="text-gray-700 leading-relaxed bg-gray-50/50 rounded-lg p-4 border border-gray-100">
                              {complaint.description}
                            </p>
                          )}
                          
                          <div className="mt-4 text-xs text-gray-500 font-mono">
                            Ticket ID: {complaint._id}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}