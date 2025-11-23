import express from 'express';
import { ObjectId } from 'mongodb';

export default function orderRoute(db) {
  const router = express.Router();

  console.log("✅ Order routes initialized");

  // GET orders by user ID
  router.get('/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      console.log(`📦 Fetching orders for user: ${userId}`);
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'User ID is required' 
        });
      }

      const ordersCollection = db.collection('Orders');
      let orders = [];

      // Try multiple user ID formats
      orders = await ordersCollection.find({ userId: userId }).sort({ createdAt: -1 }).toArray();
      
      // If no orders found with string userId, try ObjectId
      if (orders.length === 0 && ObjectId.isValid(userId)) {
        orders = await ordersCollection.find({ userId: new ObjectId(userId) }).sort({ createdAt: -1 }).toArray();
      }

      console.log(`✅ Found ${orders.length} orders for user ${userId}`);

      // Transform orders to include products array for frontend
      const transformedOrders = orders.map((order) => {
        // Handle both old and new productId formats
        let productIdArray = [];
        
        if (Array.isArray(order.productId)) {
          // ✅ New format: productId is already an array
          productIdArray = order.productId;
        } else if (order.productId === 'multiple') {
          // ❌ Old format: extract from products array
          productIdArray = order.products?.map(p => p.productId) || [];
        } else {
          // Single product (old format)
          productIdArray = [order.productId];
        }

        // If order already has products array, use it
        if (order.products && Array.isArray(order.products)) {
          return {
            _id: order._id,
            orderId: order._id,
            userId: order.userId,
            status: order.status || 'Processing',
            totalAmount: order.totalAmount || 0,
            subtotal: order.subtotal || 0,
            tax: order.tax || 0,
            paymentMethod: order.paymentMethod || 'stripe',
            shippingAddress: order.shippingAddress,
            customerEmail: order.customerEmail,
            createdAt: order.createdAt,
            products: order.products,
            // ✅ Include the transformed productId array
            productId: productIdArray
          };
        }

        // For legacy orders without products array, create one
        return {
          _id: order._id,
          orderId: order._id,
          userId: order.userId,
          status: order.status || 'Processing',
          totalAmount: order.totalAmount || 0,
          subtotal: order.subtotal || 0,
          tax: order.tax || 0,
          paymentMethod: order.paymentMethod || 'stripe',
          shippingAddress: order.shippingAddress,
          customerEmail: order.customerEmail,
          createdAt: order.createdAt,
          products: [{
            productId: order.productId || 'unknown',
            productName: `Product ${order.productId || 'unknown'}`,
            price: order.totalAmount || 0,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'
          }],
          // ✅ Include the transformed productId array
          productId: productIdArray
        };
      });

      res.json({
        success: true,
        data: transformedOrders,
        count: transformedOrders.length
      });

    } catch (error) {
      console.error('❌ Error fetching user orders:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch orders',
        error: error.message 
      });
    }
  });

  // GET all orders
  router.get('/', async (req, res) => {
    try {
      console.log("📦 Fetching all orders");
      
      const ordersCollection = db.collection('Orders');
      const orders = await ordersCollection.find({}).sort({ createdAt: -1 }).toArray();
      
      console.log(`📊 Found ${orders.length} total orders`);
      
      // Transform orders to handle both formats
      const transformedOrders = orders.map((order) => {
        let productIdArray = [];
        
        if (Array.isArray(order.productId)) {
          productIdArray = order.productId;
        } else if (order.productId === 'multiple') {
          productIdArray = order.products?.map(p => p.productId) || [];
        } else {
          productIdArray = [order.productId];
        }

        return {
          ...order,
          // Ensure productId is always an array for frontend
          productId: productIdArray
        };
      });
      
      res.json({
        success: true,
        data: transformedOrders,
        count: transformedOrders.length
      });
      
    } catch (error) {
      console.error('❌ Error fetching all orders:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch orders',
        error: error.message 
      });
    }
  });

  // GET single order by ID
  router.get('/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;
      console.log(`🔍 Fetching order: ${orderId}`);
      
      const ordersCollection = db.collection('Orders');
      
      let order = await ordersCollection.findOne({ _id: orderId });
      if (!order) {
        order = await ordersCollection.findOne({ orderId: orderId });
      }
      
      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: 'Order not found' 
        });
      }

      // Transform productId to array format for single order
      let productIdArray = [];
      
      if (Array.isArray(order.productId)) {
        productIdArray = order.productId;
      } else if (order.productId === 'multiple') {
        productIdArray = order.products?.map(p => p.productId) || [];
      } else {
        productIdArray = [order.productId];
      }

      const transformedOrder = {
        ...order,
        productId: productIdArray
      };
      
      res.json({
        success: true,
        data: transformedOrder
      });
      
    } catch (error) {
      console.error('❌ Error fetching order:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch order',
        error: error.message 
      });
    }
  });

  // POST create new order - FIXED VERSION
  router.post('/', async (req, res) => {
    try {
      const { 
        products, 
        userId, 
        status, 
        totalAmount, 
        subtotal,
        tax,
        total,
        paymentMethod, 
        shippingAddress,
        sessionId,
        customerEmail,
        productId // ✅ Add this to accept productId array from frontend
      } = req.body;
      
      console.log("📦 Creating order with data:", { 
        userId, 
        productsCount: products?.length,
        productId: productId, // ✅ Log the productId array
        totalAmount: totalAmount || total
      });

      // Validate required fields
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Use provided values or calculate
      const finalTotalAmount = totalAmount || total || 0;
      const finalSubtotal = subtotal || finalTotalAmount;
      const finalTax = tax || 0;

      // Generate order ID
      const orderId = generateOrderId();
      
      // ✅ FIXED: Store productId as array, not as 'multiple'
      const productIdArray = productId || (products?.map(p => p.productId) || []);
      
      // Create order document
      const newOrder = {
        _id: orderId,
        // ✅ FIXED: Store as array of product IDs
        productId: productIdArray,
        userId: userId,
        status: status || 'Processing',
        totalAmount: finalTotalAmount,
        paymentMethod: paymentMethod || 'stripe',
        shippingAddress: formatAddressString(shippingAddress),
        createdAt: new Date().toISOString(),
        // ✅ Always include products array with detailed information
        products: products?.map(product => ({
          productId: product.productId,
          productName: product.productName || `Product ${product.productId}`,
          price: product.price || 0,
          quantity: product.quantity || 1,
          image: product.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'
        })) || []
      };

      // Add optional fields
      if (subtotal !== undefined) newOrder.subtotal = subtotal;
      if (tax !== undefined) newOrder.tax = tax;
      if (customerEmail) newOrder.customerEmail = customerEmail;
      if (sessionId) newOrder.sessionId = sessionId;

      console.log("💾 Saving order to Orders collection:", {
        orderId: newOrder._id,
        productId: newOrder.productId, // ✅ This should now be an array
        productsCount: newOrder.products.length
      });

      const ordersCollection = db.collection('Orders');
      await ordersCollection.insertOne(newOrder);
      
      console.log(`✅ Order created: ${newOrder._id} for user: ${userId}`);
      console.log(`📊 Product IDs stored:`, newOrder.productId);
      
      res.status(201).json({
        success: true,
        data: newOrder,
        message: 'Order created successfully'
      });
      
    } catch (error) {
      console.error('❌ Error creating order:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create order',
        error: error.message 
      });
    }
  });

  // PATCH update order status
  router.patch('/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      console.log(`🔄 Updating order ${orderId} status to: ${status}`);

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const ordersCollection = db.collection('Orders');
      
      let result = await ordersCollection.updateOne(
        { _id: orderId },
        { $set: { status: status, updatedAt: new Date().toISOString() } }
      );

      // If not found by _id, try orderId field
      if (result.matchedCount === 0) {
        result = await ordersCollection.updateOne(
          { orderId: orderId },
          { $set: { status: status, updatedAt: new Date().toISOString() } }
        );
      }

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      console.log(`✅ Order ${orderId} status updated to: ${status}`);

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: { orderId, status }
      });

    } catch (error) {
      console.error('❌ Error updating order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order',
        error: error.message
      });
    }
  });

  // DELETE order
  router.delete('/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;

      console.log(`🗑️ Deleting order: ${orderId}`);

      const ordersCollection = db.collection('Orders');
      
      let result = await ordersCollection.deleteOne({ _id: orderId });

      // If not found by _id, try orderId field
      if (result.deletedCount === 0) {
        result = await ordersCollection.deleteOne({ orderId: orderId });
      }

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      console.log(`✅ Order ${orderId} deleted successfully`);

      res.json({
        success: true,
        message: 'Order deleted successfully'
      });

    } catch (error) {
      console.error('❌ Error deleting order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete order',
        error: error.message
      });
    }
  });

  // DEBUG ROUTE - Check database state
  router.get("/debug/state", async (req, res) => {
    try {
      const orders = await db.collection('Orders').find({}).toArray();
      const payments = await db.collection('Payments').find({}).toArray();
      
      console.log("=== ORDERS COLLECTION ===");
      orders.forEach(order => {
        console.log(`Order ${order._id}:`, {
          userId: order.userId,
          status: order.status,
          totalAmount: order.totalAmount,
          productId: order.productId, // ✅ Now shows array instead of 'multiple'
          productsCount: order.products?.length || 0,
          createdAt: order.createdAt,
          sessionId: order.sessionId
        });
      });

      console.log("=== PAYMENTS COLLECTION ===");
      payments.forEach(payment => {
        console.log(`Payment for order ${payment.orderId}:`, {
          status: payment.status,
          totalAmount: payment.totalAmount,
          createdAt: payment.createdAt
        });
      });

      res.json({
        ordersCount: orders.length,
        paymentsCount: payments.length,
        orders: orders,
        payments: payments
      });
    } catch (error) {
      console.error("Debug error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Helper function to generate unique order ID
  const generateOrderId = () => {
    return (Math.floor(Math.random() * 900) + 100).toString();
  };

  // Helper function to format address
  const formatAddressString = (address) => {
    if (typeof address === 'string') return address;
    
    const parts = [];
    if (address.fullName) parts.push(address.fullName);
    if (address.address) parts.push(address.address);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zipCode) parts.push(address.zipCode);
    if (address.country) parts.push(address.country);
    
    return parts.join(', ');
  };

  // Test route
  router.get('/test', (req, res) => {
    res.json({ 
      success: true, 
      message: "Orders route is working!",
      timestamp: new Date().toISOString()
    });
  });

  return router;
}