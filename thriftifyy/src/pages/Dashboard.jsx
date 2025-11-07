import React, { useState, useEffect } from "react";
import { StatCard } from "../components/adminComp/StatCard";
import {
  Users,
  CreditCard,
  Package2 as Package,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    userGrowth: 0,
    totalRevenue: 0,
    revenueGrowth: 0,
    activeOrders: 0,
    ordersGrowth: 0,
    openComplaints: 0,
    complaintsGrowth: 0,
    recentOrders: [],
    commission: {
      totalEarned: 0,
      pendingPayouts: 0,
      rate: 0,
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch dashboard data from API
  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // Replace with your actual API endpoint
      const response = await fetch("http://localhost:3000/admin/dashboard", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch dashboard data");

      const data = await response.json();
      setDashboardData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // You can add error handling UI here
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={dashboardData.totalUsers.toLocaleString()}
          icon={Users}
          trend={`${dashboardData.userGrowth > 0 ? "+" : ""}${dashboardData.userGrowth}%`}
          trendUp={dashboardData.userGrowth >= 0}
        />
        <StatCard
          title="Total Revenue"
          value={`$${dashboardData.totalRevenue.toLocaleString()}`}
          icon={CreditCard}
          trend={`${dashboardData.revenueGrowth > 0 ? "+" : ""}${dashboardData.revenueGrowth}%`}
          trendUp={dashboardData.revenueGrowth >= 0}
        />
        <StatCard
          title="Active Orders"
          value={dashboardData.activeOrders.toString()}
          icon={Package}
          trend={`${dashboardData.ordersGrowth > 0 ? "+" : ""}${dashboardData.ordersGrowth}%`}
          trendUp={dashboardData.ordersGrowth >= 0}
        />
        <StatCard
          title="Open Complaints"
          value={dashboardData.openComplaints.toString()}
          icon={MessageSquare}
          trend={`${dashboardData.complaintsGrowth > 0 ? "+" : ""}${dashboardData.complaintsGrowth}%`}
          trendUp={dashboardData.complaintsGrowth < 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Section */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Orders
          </h2>
          <div className="space-y-3">
            {dashboardData.recentOrders.length > 0 ? (
              dashboardData.recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{order.orderId}</p>
                    <p className="text-sm text-gray-500">
                      {order.customerName || `Customer ${order.customerId}`}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      order.status === "Delivered"
                        ? "bg-green-100 text-green-700"
                        : order.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent orders</p>
            )}
          </div>
        </div>

        {/* Commission Summary Section */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Commission Summary
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Commission Earned</span>
              <span className="text-lg font-bold text-gray-900">
                ${dashboardData.commission.totalEarned.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Payouts</span>
              <span className="text-lg font-bold text-gray-900">
                ${dashboardData.commission.pendingPayouts.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Commission Rate</span>
              <span className="text-lg font-bold text-gray-900">
                {dashboardData.commission.rate}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}