import React, { useState, useEffect } from "react";
import {
  SearchIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusCircleIcon,
  XIcon,
} from "lucide-react";

export function ComplaintMgt() {
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newComplaint, setNewComplaint] = useState({
    user: "",
    orderId: "",
    subject: "",
    priority: "Low",
    status: "Open",
    date: new Date().toISOString().split("T")[0],
  });

  // 🟢 Fetch complaints
  const fetchComplaints = async () => {
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
      (priorityFilter === "all" ||
        complaint.priority.toLowerCase() === priorityFilter) &&
      (complaint.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint._id?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openCount = complaints.filter((c) => c.status === "Open").length;
  const inProgressCount = complaints.filter(
    (c) => c.status === "In Progress"
  ).length;
  const resolvedCount = complaints.filter((c) => c.status === "Resolved").length;

  if (loading) return <p className="text-center mt-10">Loading complaints...</p>;

  return (
    <div className="p-6">
      {/* Title + Add Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Complaint Management
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <PlusCircleIcon size={18} />
          Add Complaint
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertCircleIcon className="text-red-600" size={24} />
            </div>
            <span className="text-sm text-gray-500 font-medium">
              Open Complaints
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{openCount}</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <ClockIcon className="text-yellow-600" size={24} />
            </div>
            <span className="text-sm text-gray-500 font-medium">
              In Progress
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{inProgressCount}</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircleIcon className="text-green-600" size={24} />
            </div>
            <span className="text-sm text-gray-500 font-medium">Resolved</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{resolvedCount}</p>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <XIcon size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4">Add New Complaint</h2>

            <form onSubmit={handleAddComplaint} className="space-y-3">
              <input
                type="text"
                placeholder="User Name"
                value={newComplaint.user}
                onChange={(e) =>
                  setNewComplaint({ ...newComplaint, user: e.target.value })
                }
                required
                className="bg-white w-full border border-gray-300 rounded-lg px-3 py-2"
              />

              <input
                type="text"
                placeholder="Order ID (e.g. #1006)"
                value={newComplaint.orderId}
                onChange={(e) =>
                  setNewComplaint({ ...newComplaint, orderId: e.target.value })
                }
                required
                className="bg-white w-full border border-gray-300 rounded-lg px-3 py-2"
              />

              <input
                type="text"
                placeholder="Complaint Subject"
                value={newComplaint.subject}
                onChange={(e) =>
                  setNewComplaint({ ...newComplaint, subject: e.target.value })
                }
                required
                className="bg-white w-full border border-gray-300 rounded-lg px-3 py-2"
              />

              <select
                value={newComplaint.priority}
                onChange={(e) =>
                  setNewComplaint({ ...newComplaint, priority: e.target.value })
                }
                className="bg-white w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>

              <select
                value={newComplaint.status}
                onChange={(e) =>
                  setNewComplaint({ ...newComplaint, status: e.target.value })
                }
                className="bg-white w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option>Open</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </select>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Add Complaint
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Search + Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "Ticket ID",
                  "User",
                  "Order ID",
                  "Subject",
                  "Priority",
                  "Status",
                  "Date",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredComplaints.map((complaint) => (
                <tr key={complaint._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">
                    {complaint._id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {complaint.user}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {complaint.orderId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {complaint.subject}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={complaint.priority}
                      onChange={(e) =>
                        handlePriorityChange(complaint._id, e.target.value)
                      }
                      className={`px-3 py-1 text-xs font-semibold rounded-full cursor-pointer
                        ${
                          complaint.priority === "High"
                            ? "bg-red-100 text-red-800"
                            : complaint.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={complaint.status}
                      onChange={(e) =>
                        handleStatusChange(complaint._id, e.target.value)
                      }
                      className={`px-3 py-1 text-xs font-semibold rounded-full cursor-pointer
                        ${
                          complaint.status === "Resolved"
                            ? "bg-green-100 text-green-800"
                            : complaint.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {complaint.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredComplaints.length === 0 && (
            <p className="text-center text-gray-500 py-6">
              No complaints found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
