// Location: frontend/src/pages/StripePayment.jsx
// Purpose: Stripe payment page with checkout button

import React, { useState, useEffect } from "react";
import axios from "axios";

// Product display component with checkout button
const ProductDisplay = ({ onCheckout, loading }) => (
  <section style={styles.section}>
    <div style={styles.container}>
      <div style={styles.productCard}>
        <img
          src="https://i.imgur.com/EHyR2nP.png"
          alt="Product"
          style={styles.productImage}
        />
        <div style={styles.description}>
          <h3 style={styles.productTitle}>Stubborn Attachments</h3>
          <h5 style={styles.price}>$20.00</h5>
          <p style={styles.productDesc}>
            A fascinating book about economics, values, and the modern world.
          </p>
        </div>
      </div>
      
      <button 
        onClick={onCheckout} 
        disabled={loading}
        style={{
          ...styles.checkoutButton,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
          transform: loading ? 'scale(0.98)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.target.style.backgroundColor = '#4053b8';
            e.target.style.transform = 'scale(1.02)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.target.style.backgroundColor = '#5469d4';
            e.target.style.transform = 'scale(1)';
          }
        }}
      >
        {loading ? (
          <>
            <span style={styles.spinner}></span>
            Processing...
          </>
        ) : (
          <>
            🔒 Checkout
          </>
        )}
      </button>

      <p style={styles.secureNote}>
        🛡️ Secure payment powered by Stripe
      </p>
    </div>
  </section>
);

// Success/Cancel message component
const Message = ({ message, type }) => (
  <section style={styles.messageSection}>
    <div style={{
      ...styles.messageBox,
      backgroundColor: type === 'success' ? '#d4edda' : '#f8d7da',
      borderColor: type === 'success' ? '#c3e6cb' : '#f5c6cb',
      color: type === 'success' ? '#155724' : '#721c24'
    }}>
      <div style={styles.iconContainer}>
        {type === 'success' ? (
          <span style={styles.successIcon}>✓</span>
        ) : (
          <span style={styles.cancelIcon}>✕</span>
        )}
      </div>
      
      <h2 style={styles.messageTitle}>
        {type === 'success' ? 'Payment Successful!' : 'Payment Canceled'}
      </h2>
      
      <p style={styles.messageText}>{message}</p>
      
      <button 
        onClick={() => window.location.href = '/stripe'} 
        style={styles.backButton}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#4053b8';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#5469d4';
          e.target.style.transform = 'scale(1)';
        }}
      >
        Back to Shop
      </button>
    </div>
  </section>
);

// Main component
export default function StripePayment() {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const sessionId = query.get("session_id");

    // Handle successful payment
    if (query.get("success") && sessionId) {
      verifyPayment(sessionId);
    }

    // Handle canceled payment
    if (query.get("canceled")) {
      setMessage("Payment was canceled. You can continue shopping and checkout when you're ready.");
      setMessageType("canceled");
    }
  }, []);

  // Verify payment with backend
  const verifyPayment = async (sessionId) => {
    try {
      console.log("🔍 Verifying payment...");
      
      const response = await axios.get(
        `http://localhost:3000/api/stripe/verify-payment/${sessionId}`
      );
      
      console.log("✅ Payment verified:", response.data);

      if (response.data.success && response.data.paymentStatus === 'paid') {
        setMessage(
          `Payment of $${response.data.amountTotal} received successfully! ` +
          `A confirmation email will be sent to ${response.data.customerEmail}.`
        );
        setMessageType("success");
      } else {
        setMessage("Payment verification failed. Please contact support with your order details.");
        setMessageType("canceled");
      }
    } catch (error) {
      console.error("❌ Error verifying payment:", error);
      setMessage(
        "Unable to verify payment status. Please contact support if amount was deducted."
      );
      setMessageType("canceled");
    }
  };

  // Handle checkout button click
  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      console.log("🛒 Starting checkout process...");

      // Get user info (adjust this based on your auth system)
      const userEmail = localStorage.getItem('userEmail') || 'customer@example.com';
      const userId = localStorage.getItem('userId') || null;

      // Create checkout session
      const response = await axios.post(
        'http://localhost:3000/api/stripe/create-checkout-session',
        {
          amount: 2000, // $20.00 in cents
          customerEmail: userEmail,
          productName: 'Stubborn Attachments',
          userId: userId,
        }
      );

      console.log("✅ Checkout session created:", response.data);

      // Redirect to Stripe Checkout page
      if (response.data.url) {
        console.log("🔗 Redirecting to Stripe...");
        window.location.href = response.data.url;
      } else {
        throw new Error("No checkout URL received");
      }

    } catch (error) {
      console.error("❌ Checkout error:", error);
      alert(
        "Failed to start checkout process. Please try again.\n\n" +
        "Error: " + (error.response?.data?.error || error.message)
      );
      setLoading(false);
    }
  };

  // Render message or product display
  return message ? (
    <Message message={message} type={messageType} />
  ) : (
    <ProductDisplay onCheckout={handleCheckout} loading={loading} />
  );
}

// ============================================
// STYLES
// ============================================

const styles = {
  section: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  container: {
    maxWidth: '500px',
    width: '100%',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    textAlign: 'center',
    marginBottom: '24px',
  },
  productImage: {
    width: '100%',
    maxWidth: '300px',
    height: 'auto',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  description: {
    marginTop: '24px',
  },
  productTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '12px',
  },
  price: {
    fontSize: '32px',
    color: '#5469d4',
    fontWeight: 'bold',
    marginBottom: '16px',
  },
  productDesc: {
    fontSize: '15px',
    color: '#666',
    lineHeight: '1.6',
    marginTop: '12px',
  },
  checkoutButton: {
    width: '100%',
    backgroundColor: '#5469d4',
    color: 'white',
    border: 'none',
    padding: '18px 40px',
    fontSize: '18px',
    fontWeight: '600',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: '0 4px 12px rgba(84, 105, 212, 0.3)',
  },
  spinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '3px solid rgba(255,255,255,0.3)',
    borderTop: '3px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  secureNote: {
    textAlign: 'center',
    color: 'white',
    fontSize: '14px',
    marginTop: '16px',
    opacity: 0.9,
  },
  messageSection: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  messageBox: {
    padding: '50px 40px',
    borderRadius: '16px',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center',
    border: '2px solid',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  iconContainer: {
    marginBottom: '20px',
  },
  successIcon: {
    display: 'inline-block',
    width: '80px',
    height: '80px',
    lineHeight: '80px',
    borderRadius: '50%',
    backgroundColor: '#28a745',
    color: 'white',
    fontSize: '48px',
    fontWeight: 'bold',
  },
  cancelIcon: {
    display: 'inline-block',
    width: '80px',
    height: '80px',
    lineHeight: '80px',
    borderRadius: '50%',
    backgroundColor: '#dc3545',
    color: 'white',
    fontSize: '48px',
    fontWeight: 'bold',
  },
  messageTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '16px',
  },
  messageText: {
    fontSize: '16px',
    lineHeight: '1.6',
    marginTop: '20px',
    marginBottom: '32px',
  },
  backButton: {
    backgroundColor: '#5469d4',
    color: 'white',
    border: 'none',
    padding: '14px 40px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};