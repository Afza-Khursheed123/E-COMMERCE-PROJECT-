// Location: backend/routes/stripeRoutes.js
// Purpose: Stripe payment routes + controllers (all in one file)

import express from "express";
import Stripe from "stripe";

const router = express.Router();
const stripe = new Stripe(process.env.SECRET_KEY);
const YOUR_DOMAIN = 'http://localhost:5173';

// Store database instance
let database;

// Function to set database (called from server.js)
export function setStripeDatabase(db) {
  database = db;
}

// ============================================
// CONTROLLER 1: Create Checkout Session
// ============================================
async function createCheckoutSession(req, res) {
  try {
    const { amount, customerEmail, productName, userId } = req.body;

    console.log("📝 Creating checkout session for:", { 
      amount, 
      customerEmail, 
      productName 
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName || 'Product Purchase',
            },
            unit_amount: amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/stripe?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/stripe?canceled=true`,
      customer_email: customerEmail,
      metadata: {
        userId: userId || 'guest',
        productName: productName || 'Product Purchase',
      },
    });

    // Save to database with pending status
    if (database) {
      await database.collection('StripePaymentInfo').insertOne({
        sessionId: session.id,
        userId: userId || 'guest',
        customerEmail: customerEmail,
        amount: amount / 100, // Convert cents to dollars
        productName: productName || 'Product Purchase',
        status: 'pending',
        paymentIntentId: null,
        createdAt: new Date(),
        paidAt: null,
        updatedAt: new Date(),
      });
      console.log("✅ Payment record saved to database (pending)");
    }

    // Return checkout URL to frontend
    res.json({ 
      success: true,
      url: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error("❌ Error creating checkout session:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

// ============================================
// CONTROLLER 2: Verify Payment
// ============================================
async function verifyPayment(req, res) {
  try {
    const { sessionId } = req.params;

    console.log("🔍 Verifying payment for session:", sessionId);

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Update database if payment is successful
    if (database && session.payment_status === 'paid') {
      const updateResult = await database.collection('StripePaymentInfo').updateOne(
        { sessionId: sessionId },
        {
          $set: {
            status: 'completed',
            paymentIntentId: session.payment_intent,
            paidAt: new Date(),
            updatedAt: new Date(),
          }
        }
      );

      console.log("✅ Payment verified and database updated:", updateResult.modifiedCount);
    }

    // Return payment details to frontend
    res.json({
      success: true,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total / 100,
      sessionId: session.id,
    });

  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

// ============================================
// CONTROLLER 3: Handle Webhook
// ============================================
async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("🔔 Webhook received:", event.type);

  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log("💰 Payment completed:", session.id);

      // Update database
      if (database) {
        await database.collection('StripePaymentInfo').updateOne(
          { sessionId: session.id },
          {
            $set: {
              status: 'completed',
              paymentIntentId: session.payment_intent,
              paidAt: new Date(),
              updatedAt: new Date(),
            }
          }
        );
        console.log("✅ Webhook: Database updated");
      }
      break;

    case 'checkout.session.expired':
      console.log("⏰ Session expired:", event.data.object.id);
      
      if (database) {
        await database.collection('StripePaymentInfo').updateOne(
          { sessionId: event.data.object.id },
          {
            $set: {
              status: 'expired',
              updatedAt: new Date(),
            }
          }
        );
      }
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return success response to Stripe
  res.json({ received: true });
}

// ============================================
// ROUTES
// ============================================

/**
 * @route   POST /api/stripe/create-checkout-session
 * @desc    Create a Stripe checkout session
 * @access  Public
 */
router.post("/create-checkout-session", createCheckoutSession);

/**
 * @route   GET /api/stripe/verify-payment/:sessionId
 * @desc    Verify payment status after checkout
 * @access  Public
 */
router.get("/verify-payment/:sessionId", verifyPayment);

/**
 * @route   POST /api/stripe/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (Stripe only)
 */
router.post("/webhook", express.raw({ type: 'application/json' }), handleWebhook);

// Export router and database setter
export default router;