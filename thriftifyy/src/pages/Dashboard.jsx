import React, { useState, useEffect } from "react";
import { StatCard } from "../components/adminComp/StatCard";
import {
  Users,
  CreditCard,
  Package2 as Package,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Shield,
  Activity,
  Database,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

  const [analyticsData, setAnalyticsData] = useState({
    revenueData: [],
    userData: [],
    complaintData: [],
    orderData: [],
    complaintsByStatus: [],
    ordersByStatus: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeMetric, setActiveMetric] = useState(null);

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
      
      // Fetch analytics data
      await fetchAnalyticsData();
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // You can add error handling UI here
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      // Fetch complaints, orders, payments and users from backend
      const [complaintsRes, ordersRes, paymentsRes, usersRes] = await Promise.all([
        fetch("http://localhost:3000/admin/complain"),
        fetch("http://localhost:3000/admin/orders"),
        fetch("http://localhost:3000/admin/payment"),
        fetch("http://localhost:3000/admin/users"),
      ]);

      const complaintsJson = await complaintsRes.json();
      const complaints = complaintsJson.success ? complaintsJson.complains : [];

      const orders = await ordersRes.json(); // array from /admin/orders
      const payments = await paymentsRes.json(); // array from /admin/payment
      const usersJson = await usersRes.json();
      const users = usersJson.success ? usersJson.users : [];

      // Helper: get last N months labels and keys
      const getLastNMonths = (n) => {
        const result = [];
        const now = new Date();
        for (let i = n - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const label = d.toLocaleString(undefined, { month: "short" });
          result.push({ key, label });
        }
        return result;
      };

      const months = getLastNMonths(6);

      // Aggregate helpers
      const aggregateSumByMonth = (items, dateField, filterFn, valueField) => {
        const map = new Map(months.map(m => [m.key, 0]));
        items.forEach(item => {
          try {
            const raw = item[dateField] || item.date || item.createdAt;
            if (!raw) return;
            const d = new Date(raw);
            if (isNaN(d)) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            if (!map.has(key)) return;
            if (filterFn && !filterFn(item)) return;
            const val = valueField ? (parseFloat(item[valueField]) || 0) : 1;
            map.set(key, map.get(key) + val);
          } catch {
              // ignore parse errors
            }
        });
        return months.map(m => ({ month: m.label, value: map.get(m.key) }));
      };

      // Revenue: sum of payments with status 'Completed'
      const revenueAgg = aggregateSumByMonth(payments, 'createdAt', p => (p.status || '').toLowerCase() === 'completed', 'totalAmount');
      const revenueData = revenueAgg.map(r => ({ month: r.month, revenue: r.value }));

      // Users: count of joined users by month (joinedAt)
      const userAgg = aggregateSumByMonth(users, 'joinedAt', null, null);
      const userData = userAgg.map(u => ({ month: u.month, users: u.value }));

      // Orders: count orders by month
      const orderAgg = aggregateSumByMonth(orders, 'date', null, null);
      const orderData = orderAgg.map(o => ({ month: o.month, orders: o.value }));

      // Complaints: count complaints by month
      const complaintAgg = aggregateSumByMonth(complaints, 'date', null, null);
      const complaintData = complaintAgg.map(c => ({ month: c.month, complaints: c.value }));

      // Complaints by status
      const complaintsByStatus = [
        { name: 'Open', value: complaints.filter(c => (c.status || '').toLowerCase() === 'open').length, color: '#ef4444' },
        { name: 'In Progress', value: complaints.filter(c => (c.status || '').toLowerCase() === 'in progress').length, color: '#3b82f6' },
        { name: 'Resolved', value: complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length, color: '#22c55e' },
      ];

      // Orders by status (use orders array)
      const statusCounts = {};
      orders.forEach(ord => {
        const s = (ord.status || 'Unknown').toString();
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      const ordersByStatus = Object.keys(statusCounts).map((k, idx) => ({ name: k, value: statusCounts[k], color: ["#f59e0b", "#3b82f6", "#22c55e", "#8b5cf6"][idx % 4] }));

      setAnalyticsData({
        revenueData,
        userData,
        complaintData,
        orderData,
        complaintsByStatus,
        ordersByStatus,
      });

    } catch (error) {
      console.error("Error fetching analytics data:", error);
    }
  };

  // Fetch data on component mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh every 30 seconds
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

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
          <p className="mt-4 text-gray-600 text-lg font-medium">Loading Dashboard...</p>
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
                <Shield className="w-8 h-8 text-[#19535F]" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-[#19535F] to-[#0B7A75] rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-[#19535F] to-[#0B7A75] bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#0B7A75]" />
                Real-time analytics and insights
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200 shadow-sm transform hover:scale-105 transition-all duration-300">
                <span className="text-sm text-gray-600">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
            )}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center gap-3 px-6 py-3 bg-white text-gray-700 rounded-xl border border-gray-200 hover:border-[#0B7A75] transform hover:scale-105 hover:shadow-lg transition-all duration-300 font-semibold group"
            >
              <BarChart3 className={`w-5 h-5 transition-transform duration-300 ${showAnalytics ? 'rotate-180 text-[#0B7A75]' : 'text-gray-500'}`} />
              {showAnalytics ? "Hide Analytics" : "Show Analytics"}
              <div className="w-2 h-2 bg-[#0B7A75] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#19535F] to-[#0B7A75] text-white rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-semibold group"
            >
              <RefreshCw
                className={`w-5 h-5 ${isRefreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
              />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              title: "Total Users", 
              value: dashboardData.totalUsers.toLocaleString(), 
              icon: Users, 
              trend: `${dashboardData.userGrowth > 0 ? "+" : ""}${dashboardData.userGrowth}%`,
              trendUp: dashboardData.userGrowth >= 0,
              delay: 100 
            },
            { 
              title: "Total Revenue", 
              value: `$${dashboardData.totalRevenue.toLocaleString()}`, 
              icon: CreditCard, 
              trend: `${dashboardData.revenueGrowth > 0 ? "+" : ""}${dashboardData.revenueGrowth}%`,
              trendUp: dashboardData.revenueGrowth >= 0,
              delay: 200 
            },
            { 
              title: "Active Orders", 
              value: dashboardData.activeOrders.toString(), 
              icon: Package, 
              trend: `${dashboardData.ordersGrowth > 0 ? "+" : ""}${dashboardData.ordersGrowth}%`,
              trendUp: dashboardData.ordersGrowth >= 0,
              delay: 300 
            },
            { 
              title: "Open Complaints", 
              value: dashboardData.openComplaints.toString(), 
              icon: MessageSquare, 
              trend: `${dashboardData.complaintsGrowth > 0 ? "+" : ""}${dashboardData.complaintsGrowth}%`,
              trendUp: dashboardData.complaintsGrowth < 0,
              delay: 400 
            },
          ].map((stat) => (
            <div 
              key={stat.title}
              className="animate-slide-up"
              style={{ animationDelay: `${stat.delay}ms` }}
              onMouseEnter={() => setActiveMetric(stat.title)}
              onMouseLeave={() => setActiveMetric(null)}
            >
              <StatCard 
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                trend={stat.trend}
                trendUp={stat.trendUp}
                isActive={activeMetric === stat.title}
              />
            </div>
          ))}
        </div>

        {/* Analytics Section */}
        {showAnalytics && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-[#19535F] to-[#0B7A75] rounded-2xl shadow-lg">
                  <TrendingUp className="text-white" size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Analytics & Insights</h2>
                  <p className="text-gray-600">Comprehensive data visualization</p>
                </div>
              </div>
              <div className="flex gap-2">
                {['1W', '1M', '3M', '1Y', 'ALL'].map((period) => (
                  <button
                    key={period}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-[#0B7A75] hover:text-[#0B7A75] transition-all duration-300 font-medium"
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {[
                { 
                  title: "Revenue Trend", 
                  data: analyticsData.revenueData, 
                  type: 'area',
                  dataKey: 'revenue',
                  color: '#0B7A75',
                  delay: 100 
                },
                { 
                  title: "User Growth", 
                  data: analyticsData.userData, 
                  type: 'line',
                  dataKey: 'users',
                  color: '#19535F',
                  delay: 200 
                },
                { 
                  title: "Orders Over Time", 
                  data: analyticsData.orderData, 
                  type: 'bar',
                  dataKey: 'orders',
                  color: '#D7C9AA',
                  delay: 300 
                },
                { 
                  title: "Complaints Trend", 
                  data: analyticsData.complaintData, 
                  type: 'area',
                  dataKey: 'complaints',
                  color: '#7B2D26',
                  delay: 400 
                },
              ].map((chart) => (
                <div 
                  key={chart.title}
                  className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.02] transition-all duration-500 animate-slide-up"
                  style={{ animationDelay: `${chart.delay}ms` }}
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">{chart.title}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    {chart.type === 'area' ? (
                      <AreaChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: `2px solid ${chart.color}20`,
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey={chart.dataKey} 
                          stroke={chart.color} 
                          fill={chart.color}
                          fillOpacity={0.1}
                          strokeWidth={3}
                        />
                      </AreaChart>
                    ) : chart.type === 'line' ? (
                      <LineChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: `2px solid ${chart.color}20`,
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey={chart.dataKey} 
                          stroke={chart.color} 
                          strokeWidth={3}
                          dot={{ fill: chart.color, strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: chart.color }}
                        />
                      </LineChart>
                    ) : (
                      <BarChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: `2px solid ${chart.color}20`,
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                          }} 
                        />
                        <Bar 
                          dataKey={chart.dataKey} 
                          fill={chart.color}
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              ))}
            </div>

            {/* Pie Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                { 
                  title: "Complaints by Status", 
                  data: analyticsData.complaintsByStatus,
                  delay: 100 
                },
                { 
                  title: "Orders by Status", 
                  data: analyticsData.ordersByStatus,
                  delay: 200 
                },
              ].map((chart) => (
                <div 
                  key={chart.title}
                  className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.02] transition-all duration-500 animate-slide-up"
                  style={{ animationDelay: `${chart.delay}ms` }}
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">{chart.title}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chart.data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chart.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '2px solid #19535F20',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-[#19535F] rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                Recent Orders
              </h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {dashboardData.recentOrders.length} orders
              </span>
            </div>
            <div className="space-y-3">
              {dashboardData.recentOrders.length > 0 ? (
                dashboardData.recentOrders.map((order, index) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#0B7A75] hover:bg-[#0B7A75] hover:bg-opacity-5 transform hover:scale-[1.02] transition-all duration-300 group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div>
                      <p className="font-semibold text-gray-800 group-hover:text-[#0B7A75] transition-colors">{order.orderId}</p>
                      <p className="text-sm text-gray-600 group-hover:text-gray-700">
                        {order.customerName || `Customer ${order.customerId}`}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full border transition-all duration-300 ${
                        order.status === "Delivered"
                          ? "bg-green-100 text-green-700 border-green-200 group-hover:bg-green-200"
                          : order.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700 border-yellow-200 group-hover:bg-yellow-200"
                          : "bg-blue-100 text-blue-700 border-blue-200 group-hover:bg-blue-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-[#D7C9AA] mx-auto mb-2 opacity-50" />
                  <p className="text-gray-500">No recent orders</p>
                </div>
              )}
            </div>
          </div>

          {/* Commission Summary */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 animate-slide-up animation-delay-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-[#0B7A75] rounded-lg">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                Commission Summary
              </h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {dashboardData.commission.rate}% rate
              </span>
            </div>
            <div className="space-y-4">
              {[
                { 
                  label: "Total Commission Earned", 
                  value: `$${dashboardData.commission.totalEarned.toLocaleString()}`,
                  icon: '💰',
                  color: 'text-green-600'
                },
                { 
                  label: "Pending Payouts", 
                  value: `$${dashboardData.commission.pendingPayouts.toLocaleString()}`,
                  icon: '⏳',
                  color: 'text-yellow-600'
                },
                { 
                  label: "Commission Rate", 
                  value: `${dashboardData.commission.rate}%`,
                  icon: '📊',
                  color: 'text-blue-600'
                },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#19535F] hover:bg-[#19535F] hover:bg-opacity-5 transform hover:scale-[1.02] transition-all duration-300 group"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-gray-700 font-medium group-hover:text-[#19535F] transition-colors">
                      {item.label}
                    </span>
                  </div>
                  <span className={`text-lg font-bold ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
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
          animation: fade-in 0.8s ease-out; 
        }
        .animate-float-slow { 
          animation: float-slow 8s ease-in-out infinite; 
        }
        .animate-pulse-slow { 
          animation: pulse-slow 4s ease-in-out infinite; 
        }
        .animation-delay-100 { animation-delay: 100ms; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-300 { animation-delay: 300ms; }
        .animation-delay-400 { animation-delay: 400ms; }
        .animation-delay-2000 { animation-delay: 2000ms; }
      `}</style>
    </div>
  );
}