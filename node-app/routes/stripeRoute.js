import express from "express";
import Stripe from "stripe";

const router = express.Router();

export default function stripeRoutes(db) {
  // Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const YOUR_DOMAIN = process.env.FRONTEND_URL || 'http://localhost:5173';

  console.log("✅ Stripe routes initialized");

  // Helper functions
  const generateOrderId = () => {
    return (Math.floor(Math.random() * 900) + 100).toString();
  };

  const formatShippingAddress = (address) => {
    if (!address) return 'Address not provided';
    if (typeof address === 'string') return address;
    
    const parts = [];
    if (address.fullName) parts.push(address.fullName);
    if (address.address) parts.push(address.address);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zipCode) parts.push(address.zipCode);
    if (address.country) parts.push(address.country);
    
    return parts.length > 0 ? parts.join(', ') : 'Address not provided';
  };

  // FIXED: Sanitize image URLs for Stripe
  const sanitizeImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'];
    }
    
    if (imageUrl.startsWith('data:image')) {
      console.log("🖼️ Replacing base64 image with placeholder (Stripe URL limit)");
      return ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'];
    }
    
    if (imageUrl.startsWith('http') && imageUrl.length <= 2048) {
      return [imageUrl];
    }
    
    return ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'];
  };

  // Calculate totals
  const calculateOrderTotals = (products) => {
    if (!products || !Array.isArray(products)) {
      return { subtotal: 0, tax: 0, total: 0 };
    }

    const subtotal = products.reduce((sum, product) => {
      const price = parseFloat(product.price) || 0;
      const quantity = parseInt(product.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
    
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  };

  // CREATE CHECKOUT SESSION
  router.post("/create-checkout-session", async (req, res) => {
    try {
      console.log("=== STRIPE CHECKOUT REQUEST START ===");
      
      const { 
        customerEmail, 
        productName, 
        userId, 
        products, 
        shippingAddress 
      } = req.body;

      console.log("🔍 Request details:", { 
        userId: userId || 'unknown',
        customerEmail: customerEmail || 'unknown',
        productsCount: products?.length || 0
      });

      // Validate required fields
      if (!customerEmail) {
        console.log("❌ Missing customer email");
        return res.status(400).json({
          success: false,
          error: "Customer email is required"
        });
      }

      if (!products || !Array.isArray(products) || products.length === 0) {
        console.log("❌ No products provided");
        return res.status(400).json({
          success: false,
          error: "No products in cart"
        });
      }

      // Calculate totals
      const totals = calculateOrderTotals(products);
      console.log("💰 Calculated totals:", totals);

      // Create line items for Stripe WITH SANITIZED IMAGES
      const lineItems = products.map((product, index) => {
        const price = parseFloat(product.price);
        const quantity = parseInt(product.quantity) || 1;
        const productName = product.productName || `Product ${product.productId || index}`;
        
        const sanitizedImages = sanitizeImageUrl(product.image);

        console.log(`📦 Product ${index}:`, { 
          name: productName, 
          price, 
          quantity,
          imageType: product.image?.startsWith('data:image') ? 'base64' : 'url'
        });

        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName.substring(0, 100),
              images: sanitizedImages,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: quantity,
        };
      });

      console.log("🛒 Created line items:", lineItems.length);

      // Create Stripe checkout session
      console.log("🔄 Creating Stripe checkout session...");
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${YOUR_DOMAIN}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${YOUR_DOMAIN}/checkout?canceled=true`,
        customer_email: customerEmail,
        metadata: {
          userId: userId || 'guest',
          productsCount: products.length.toString(),
        },
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'PK'],
        },
      });

      console.log("✅ Stripe session created successfully:", session.id);
      console.log("🔗 Checkout URL:", session.url);

      // Save to database with pending status
      if (db) {
        try {
          const pendingPayment = {
            sessionId: session.id,
            userId: userId,
            customerEmail: customerEmail,
            amount: totals.total,
            subtotal: totals.subtotal,
            tax: totals.tax,
            productName: productName || 'Multiple Products',
            products: products,
            shippingAddress: shippingAddress,
            status: 'pending',
            paymentIntentId: null,
            createdAt: new Date(),
            paidAt: null,
          };

          await db.collection('StripePaymentInfo').insertOne(pendingPayment);
          console.log("✅ Payment record saved to StripePaymentInfo collection");
        } catch (dbError) {
          console.error("⚠️ Error saving payment record:", dbError.message);
        }
      }

      console.log("=== STRIPE CHECKOUT REQUEST SUCCESS ===");
      
      res.json({ 
        success: true,
        url: session.url,
        sessionId: session.id,
        calculatedTotals: totals
      });

    } catch (error) {
      console.error("=== STRIPE CHECKOUT REQUEST FAILED ===");
      console.error("❌ Error creating checkout session:");
      console.error("Error message:", error.message);
      console.error("Error type:", error.type);
      
      res.status(500).json({ 
        success: false,
        error: error.message,
        details: "Check server console for detailed error information"
      });
    }
  });

  // VERIFY PAYMENT - COMPLETELY FIXED WITH DUPLICATE PREVENTION
  router.get("/verify-payment/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      console.log("🔍 Verifying payment for session:", sessionId);

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: "Session ID is required"
        });
      }

      // Retrieve session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'payment_intent']
      });

      console.log("💰 Stripe session status:", session.payment_status);

      let orderData = null;
      let paymentData = null;

      // Update database if payment is successful
      if (db && session.payment_status === 'paid') {
        try {
          // Get payment info from database
          const paymentInfo = await db.collection('StripePaymentInfo').findOne({ sessionId: sessionId });
          
          if (paymentInfo) {
            console.log("📝 Found payment info for user:", paymentInfo.userId);

            // ⚠️ CRITICAL FIX: Check if order already exists for this session
            const existingOrder = await db.collection('Orders').findOne({ sessionId: sessionId });
            if (existingOrder) {
              console.log("✅ Order already exists for this session:", existingOrder._id);
              
              // Get existing payment too
              const existingPayment = await db.collection('Payments').findOne({ orderId: existingOrder._id });
              
              orderData = existingOrder;
              paymentData = existingPayment;
              
              console.log("🔄 Returning existing order data, skipping creation");
            } else {
              // Calculate totals
              const totals = calculateOrderTotals(paymentInfo.products);
              
              // Generate order ID
              const orderId = generateOrderId();

              // ✅ FIXED: Create order data with array of product IDs
              orderData = {
                _id: orderId,
                // ✅ FIXED: Always store as array, never as 'multiple'
                productId: paymentInfo.products?.map(p => p.productId) || [],
                userId: paymentInfo.userId,
                status: 'Processing',
                totalAmount: totals.total,
                paymentMethod: 'stripe',
                shippingAddress: formatShippingAddress(paymentInfo.shippingAddress),
                createdAt: new Date().toISOString(),
                products: paymentInfo.products.map(product => ({
                  productId: product.productId,
                  productName: product.productName || `Product ${product.productId}`,
                  price: parseFloat(product.price) || 0,
                  quantity: parseInt(product.quantity) || 1,
                  image: product.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'
                })),
                subtotal: totals.subtotal,
                tax: totals.tax,
                customerEmail: paymentInfo.customerEmail,
                sessionId: sessionId
              };

              console.log("💾 Saving order to Orders collection:", orderId);
              console.log("📊 Product IDs being stored:", orderData.productId);

              // Save order
              const ordersCollection = db.collection('Orders');
              const orderResult = await ordersCollection.insertOne(orderData);
              console.log("✅ Order saved to Orders collection:", orderResult.insertedId);

              // Create payment record
              paymentData = {
                orderId: orderId,
                status: 'Completed',
                totalAmount: totals.total,
                paymentMethod: 'stripe',
                customerEmail: paymentInfo.customerEmail,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                productName: paymentInfo.products.length === 1 
                  ? paymentInfo.products[0].productName 
                  : 'Multiple Products',
                price: totals.total,
                buyerName: paymentInfo.shippingAddress?.fullName || 'Customer',
                sellerName: 'Thriftify'
              };

              // Save payment
              const paymentsCollection = db.collection('Payments');
              const paymentResult = await paymentsCollection.insertOne(paymentData);
              console.log("💰 Payment record created in Payments collection:", paymentResult.insertedId);

              // Update payment info in StripePaymentInfo
              await db.collection('StripePaymentInfo').updateOne(
                { sessionId: sessionId },
                {
                  $set: {
                    status: 'completed',
                    paymentIntentId: session.payment_intent?.id,
                    paidAt: new Date(),
                    orderId: orderId
                  }
                }
              );

              console.log("✅ Payment info updated in StripePaymentInfo");
            }
          } else {
            console.log("❌ No payment info found for session:", sessionId);
          }
        } catch (dbError) {
          console.error("❌ Database error in verify-payment:", dbError);
        }
      }

      // Return response
      const response = {
        success: true,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email || session.customer_email,
        amountTotal: session.amount_total / 100,
        sessionId: session.id,
        order: orderData,
        payment: paymentData
      };

      console.log("📤 Sending verification response");
      res.json(response);

    } catch (error) {
      console.error("❌ Error verifying payment:", error.message);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });

  // DEBUG ROUTE: Check what's in the database
  router.get("/debug/collections", async (req, res) => {
    try {
      const orders = await db.collection('Orders').find({}).toArray();
      const payments = await db.collection('Payments').find({}).toArray();
      const stripePayments = await db.collection('StripePaymentInfo').find({}).toArray();
      
      console.log("=== DATABASE DEBUG ===");
      console.log("Orders collection:", orders.length, "documents");
      console.log("Payments collection:", payments.length, "documents");
      console.log("StripePaymentInfo collection:", stripePayments.length, "documents");

      res.json({
        orders: orders,
        payments: payments,
        stripePayments: stripePayments
      });
    } catch (error) {
      console.error("Debug error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Test route
  router.get("/test", (req, res) => {
    res.json({ 
      success: true, 
      message: "Stripe routes are working!",
      timestamp: new Date().toISOString()
    });
  });

  return router;
}