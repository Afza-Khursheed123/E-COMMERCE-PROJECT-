import express from "express";
const router = express.Router();

export default function (db) {
  // Helper function to calculate growth percentage from October 1st, 2025
  const calculateGrowth = (current, baseline) => {
    if (baseline === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - baseline) / baseline) * 100).toFixed(1));
  };

  // GET Dashboard Statistics
  router.get("/", async (req, res) => {
    try {
      const octoberFirst2025 = new Date("2025-10-01T00:00:00.000Z");

      // ===== ACTIVE USERS (status = "Active") =====
      const allUsers = await db.collection("User").find({}).toArray();
      
      // Count users with status "Active" (case-insensitive)
      const activeUsers = allUsers.filter(user => 
        user.status && user.status.toLowerCase() === "active"
      );
      const totalUsers = activeUsers.length;
      
      // Active users on October 1st, 2025
      const activeUsersOnOct1 = allUsers.filter(user => {
        const joinedDate = new Date(user.joinedAt);
        return joinedDate <= octoberFirst2025 && 
               user.status && user.status.toLowerCase() === "active";
      }).length;
      
      const userGrowth = calculateGrowth(totalUsers, activeUsersOnOct1);

      // ===== TOTAL REVENUE (based on PAYMENT status = "Completed") =====
      const allOrders = await db.collection("Orders").find({}).toArray();
      const allPayments = await db.collection("Payments").find({}).toArray();
      
      // Get orders with Completed payment status
      const completedPaymentOrders = allOrders.filter(order => {
        const payment = allPayments.find(p => p.orderId === order._id.toString());
        const paymentStatus = payment?.status || "Pending";
        return paymentStatus.toLowerCase() === "completed";
      });
      
      const totalRevenue = completedPaymentOrders.reduce((sum, order) => {
        return sum + (parseFloat(order.totalAmount) || 0);
      }, 0);

      // Revenue on October 1st, 2025 (completed payments)
      const completedPaymentsOnOct1 = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const payment = allPayments.find(p => p.orderId === order._id.toString());
        const paymentStatus = payment?.status || "Pending";
        return orderDate <= octoberFirst2025 && paymentStatus.toLowerCase() === "completed";
      });
      const revenueOnOct1 = completedPaymentsOnOct1.reduce((sum, order) => {
        return sum + (parseFloat(order.totalAmount) || 0);
      }, 0);

      const revenueGrowth = calculateGrowth(totalRevenue, revenueOnOct1);

      // ===== ACTIVE ORDERS (orders with PROCESSING or SHIPPED status from Orders table) =====
      const activeOrdersList = allOrders.filter(order => {
        const orderStatus = (order.status || "").toLowerCase().trim();
        return orderStatus === "processing" || orderStatus === "shipped";
      });
      const activeOrders = activeOrdersList.length;

      // DEBUG: Log active orders details
      console.log("🔍 Total Orders in DB:", allOrders.length);
      console.log("🔍 Active Orders (Processing/Shipped):", activeOrders);
      console.log("🔍 Active Orders Details:");
      activeOrdersList.forEach(order => {
        console.log(`  - Order ID: ${order._id}, Status: "${order.status}"`);
      });

      // Active orders on October 1st, 2025
      const activeOrdersOnOct1 = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const orderStatus = (order.status || "").toLowerCase().trim();
        return orderDate <= octoberFirst2025 && 
               (orderStatus === "processing" || orderStatus === "shipped");
      }).length;

      const ordersGrowth = calculateGrowth(activeOrders, activeOrdersOnOct1);

      console.log("🔍 Active Orders October 1st:", activeOrdersOnOct1);
      console.log("🔍 Active Orders Current:", activeOrders);
      console.log("🔍 Orders Growth:", ordersGrowth);

      // ===== RECENT ORDERS (orders with DELIVERED status from Orders table) =====
      const recentOrders = allOrders
        .filter(order => {
          const orderStatus = (order.status || "").toLowerCase();
          return orderStatus === "delivered";
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((order) => {
          // Get user info for customer name
          const user = allUsers.find(u => u._id?.toString() === order.userId?.toString());
          
          return {
            _id: order._id.toString(),
            orderId: order._id?.toString() || order.orderId,
            customerName: user?.name || "Unknown Customer",
            customerId: order.userId?.toString(),
            status: order.status || "Unknown"  // Show ORDER status, not payment status
          };
        });

      // ===== OPEN COMPLAINTS (status = "Open" or "In Progress") =====
      const allComplaints = await db.collection("Complains").find({}).toArray();
      
      const openComplaintsList = allComplaints.filter(complaint => 
        complaint.status === "Open" || complaint.status === "In Progress"
      );
      const openComplaints = openComplaintsList.length;

      // Open complaints on October 1st, 2025
      const complaintsOnOct1 = allComplaints.filter(complaint => {
        const complaintDate = new Date(complaint.date);
        return complaintDate <= octoberFirst2025 && 
               (complaint.status === "Open" || complaint.status === "In Progress");
      }).length;

      const complaintsGrowth = calculateGrowth(openComplaints, complaintsOnOct1);

      // ===== COMMISSION SUMMARY (based on Payment status) =====
      // Total Commission Earned - 10% of all Completed payment orders
      const totalCommissionEarned = completedPaymentOrders.reduce((sum, order) => {
        return sum + ((parseFloat(order.totalAmount) || 0) * 0.1);  // 10% commission
      }, 0);

      // Pending Payouts - sum of all Pending or Processing payment orders
      const pendingPaymentOrders = allOrders.filter(order => {
        const payment = allPayments.find(p => p.orderId === order._id.toString());
        const paymentStatus = payment?.status || "Pending";
        return paymentStatus.toLowerCase() === "pending" || paymentStatus.toLowerCase() === "processing";
      });
      
      const pendingPayouts = pendingPaymentOrders.reduce((sum, order) => {
        return sum + (parseFloat(order.totalAmount) || 0);
      }, 0);

      // Commission rate
      const commissionRate = 10;

      const commission = {
        totalEarned: Math.round(totalCommissionEarned),
        pendingPayouts: Math.round(pendingPayouts),
        rate: commissionRate
      };

      // ===== SEND RESPONSE =====
      const dashboardData = {
        totalUsers,
        userGrowth,
        totalRevenue: Math.round(totalRevenue),
        revenueGrowth,
        activeOrders,
        ordersGrowth,
        openComplaints,
        complaintsGrowth,
        recentOrders,
        commission
      };

      console.log("✅ Dashboard data being sent:", JSON.stringify(dashboardData, null, 2));
      res.json(dashboardData);

    } catch (err) {
      console.error("❌ Error fetching dashboard data:", err);
      res.status(500).json({ 
        error: "Internal server error",
        message: err.message 
      });
    }
  });

  return router;
}