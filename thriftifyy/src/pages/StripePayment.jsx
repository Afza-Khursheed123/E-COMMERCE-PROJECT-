// Location: frontend/src/pages/StripePayment.jsx
// Purpose: Stripe payment page with checkout button

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Row, Col } from "react-bootstrap";

// Theme colors matching your dashboard
const theme = {
  bg: '#19535F',
  accent: '#0B7A75',
  text: '#F0F3F5',
  highlight: '#D7C9AA',
  badge: '#7B2D26',
  lightBg: '#ffffff'
};

// Product display component with checkout button
const ProductDisplay = ({ onCheckout, loading, cartItems = [] }) => {
  const totalPrice = cartItems && cartItems.length > 0 
    ? cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0)
    : 20.00;

  return (
  <section style={styles.section}>
    {/* Animated Background */}
    <div style={styles.backgroundAnimation}></div>
    
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <div style={styles.logo}>🛒</div>
          <h1 style={styles.title}>Secure Checkout</h1>
        </div>
        <p style={styles.subtitle}>Complete your purchase with confidence</p>
      </div>

      <div style={styles.productCard}>
        {/* Product Image with Animation */}
        <div style={styles.imageContainer}>
          <img
            src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop&crop=center"
            alt="Stubborn Attachments Book"
            style={styles.productImage}
          />
          <div style={styles.imageOverlay}></div>
        </div>

        {/* Product Details */}
        <div style={styles.productDetails}>
          <div style={styles.badge}>Bestseller</div>
          <h3 style={styles.productTitle}>Stubborn Attachments</h3>
          <div style={styles.rating}>
            <span style={styles.stars}>★★★★★</span>
            <span style={styles.ratingText}>(4.8 • 1,247 reviews)</span>
          </div>
          <p style={styles.productDesc}>
            A fascinating exploration of economics, values, and building a better future. 
            This thought-provoking book challenges conventional wisdom and offers fresh perspectives.
          </p>
          
          {/* Features List */}
          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>📚</span>
              <span>320 pages of insightful content</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>🚚</span>
              <span>Free worldwide shipping</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>↩️</span>
              <span>30-day money-back guarantee</span>
            </div>
          </div>

          {/* Price Section */}
          <div style={styles.priceSection}>
            <div style={styles.priceMain}>
              <span style={styles.price}>$20.00</span>
              <span style={styles.priceOld}>$24.99</span>
              <span style={styles.discount}>20% OFF</span>
            </div>
            <p style={styles.priceNote}>One-time payment • No subscription</p>
          </div>
        </div>
      </div>

      {/* Security Badges */}
      <div style={styles.securitySection}>
        <div style={styles.securityBadges}>
          <div style={styles.securityBadge}>
            <span style={styles.securityIcon}>🔒</span>
            <span>SSL Secured</span>
          </div>
          <div style={styles.securityBadge}>
            <span style={styles.securityIcon}>🛡️</span>
            <span>PCI Compliant</span>
          </div>
          <div style={styles.securityBadge}>
            <span style={styles.securityIcon}>💳</span>
            <span>256-bit Encryption</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <button 
        onClick={onCheckout} 
        disabled={loading}
        style={{
          ...styles.checkoutButton,
          ...(loading ? styles.checkoutButtonLoading : {}),
        }}
      >
        {loading ? (
          <>
            <div style={styles.spinner}></div>
            <span>Processing Your Order...</span>
          </>
        ) : (
          <>
            <span style={styles.lockIcon}>🔒</span>
            <span>Complete Secure Payment - ${totalPrice.toFixed(2)}</span>
            <span style={styles.arrowIcon}>→</span>
          </>
        )}
      </button>

      {/* Trust Indicators */}
      <div style={styles.trustSection}>
        <p style={styles.trustText}>
          <span style={styles.shieldIcon}>🛡️</span>
          Your payment information is encrypted and secure. We never store your card details.
        </p>
        <div style={styles.paymentMethods}>
          <span style={styles.paymentText}>Accepted Payment Methods:</span>
          <div style={styles.paymentIcons}>
            <span>💳</span>
            <span>🏦</span>
            <span>📱</span>
            <span>🔵</span>
          </div>
        </div>
      </div>
    </div>
  </section>
  );
};

// Success/Cancel message component
const Message = ({ message, type }) => (
  <section style={styles.section}>
    <div style={styles.backgroundAnimation}></div>
    
    <div style={styles.container}>
      <div style={{
        ...styles.messageCard,
        ...(type === 'success' ? styles.successCard : styles.cancelCard)
      }}>
        <div style={styles.messageIcon}>
          {type === 'success' ? (
            <div style={styles.successAnimation}>
              <div style={styles.checkmark}>✓</div>
            </div>
          ) : (
            <div style={styles.cancelAnimation}>
              <div style={styles.cross}>✕</div>
            </div>
          )}
        </div>
        
        <h2 style={styles.messageTitle}>
          {type === 'success' ? 'Payment Successful! 🎉' : 'Payment Canceled'}
        </h2>
        
        <p style={styles.messageText}>{message}</p>

        {type === 'success' && (
          <div style={styles.successDetails}>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Status:</span>
              <span style={styles.detailValue}>Completed</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Delivery:</span>
              <span style={styles.detailValue}>Within 2-3 business days</span>
            </div>
          </div>
        )}
        
        <div style={styles.messageActions}>
          <button 
            onClick={() => window.location.href = '/'} 
            style={styles.primaryButton}
          >
            Continue Shopping
          </button>
          {type === 'success' && (
            <button 
              onClick={() => window.location.href = '/orders'} 
              style={styles.secondaryButton}
            >
              View Order Details
            </button>
          )}
        </div>
      </div>
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
      setMessage("Your payment was canceled. Don't worry, you can continue shopping and complete your purchase whenever you're ready. Your cart items have been saved.");
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
          `Thank you for your purchase! Your payment of $${response.data.amountTotal} has been confirmed. ` +
          `We've sent a confirmation email with order details and tracking information. ` +
          `You should receive your items within 3-5 business days.`
        );
        setMessageType("success");
      } else {
        setMessage("We're having trouble verifying your payment. Please contact our support team with your order details, and we'll help you sort this out immediately.");
        setMessageType("canceled");
      }
    } catch (error) {
      console.error("❌ Error verifying payment:", error);
      setMessage(
        "We encountered an issue while verifying your payment status. " +
        "If the amount was deducted from your account, please contact our support team with your transaction details for immediate assistance."
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
        "We couldn't start the checkout process. Please check your connection and try again.\n\n" +
        "If the problem continues, contact our support team."
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
// ENHANCED STYLES WITH ANIMATIONS
// ============================================

const styles = {
  section: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: `linear-gradient(135deg, ${theme.bg}15 0%, ${theme.accent}15 100%)`,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 80%, ${theme.accent}10 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, ${theme.highlight}10 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, ${theme.bg}10 0%, transparent 50%)
    `,
    animation: 'float 6s ease-in-out infinite',
  },
  container: {
    maxWidth: '480px',
    width: '100%',
    position: 'relative',
    zIndex: 2,
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
    animation: 'slideDown 0.8s ease-out',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  logo: {
    fontSize: '32px',
    background: `linear-gradient(135deg, ${theme.accent}, ${theme.bg})`,
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'bounce 2s infinite',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: theme.bg,
    margin: 0,
    background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '16px',
    color: theme.accent,
    margin: 0,
    opacity: 0.8,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    marginBottom: '24px',
    border: `1px solid ${theme.bg}10`,
    animation: 'slideUp 0.6s ease-out',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    marginBottom: '24px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  },
  productImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(135deg, ${theme.accent}20, ${theme.bg}20)`,
  },
  productDetails: {
    textAlign: 'left',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: theme.highlight,
    color: theme.bg,
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '16px',
    animation: 'pulse 2s infinite',
  },
  productTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: theme.bg,
    marginBottom: '12px',
    lineHeight: '1.3',
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  stars: {
    color: '#FFD700',
    fontSize: '16px',
  },
  ratingText: {
    fontSize: '14px',
    color: theme.accent,
    opacity: 0.8,
  },
  productDesc: {
    fontSize: '15px',
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '20px',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    color: theme.bg,
  },
  featureIcon: {
    fontSize: '16px',
    width: '20px',
    textAlign: 'center',
  },
  priceSection: {
    backgroundColor: `${theme.bg}05`,
    padding: '20px',
    borderRadius: '12px',
    border: `1px solid ${theme.bg}10`,
  },
  priceMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  price: {
    fontSize: '32px',
    fontWeight: '700',
    color: theme.bg,
  },
  priceOld: {
    fontSize: '18px',
    color: '#999',
    textDecoration: 'line-through',
  },
  discount: {
    backgroundColor: theme.badge,
    color: 'white',
    padding: '4px 8px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
  },
  priceNote: {
    fontSize: '14px',
    color: theme.accent,
    margin: 0,
    opacity: 0.8,
  },
  securitySection: {
    marginBottom: '20px',
    animation: 'fadeIn 0.8s ease-out 0.2s both',
  },
  securityBadges: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  securityBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: theme.bg,
    opacity: 0.8,
  },
  securityIcon: {
    fontSize: '16px',
  },
  checkoutButton: {
    width: '100%',
    background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent})`,
    color: 'white',
    border: 'none',
    padding: '20px 32px',
    fontSize: '18px',
    fontWeight: '600',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    boxShadow: `0 8px 24px ${theme.accent}40`,
    marginBottom: '20px',
    animation: 'slideUp 0.6s ease-out 0.4s both',
  },
  checkoutButtonLoading: {
    opacity: 0.7,
    cursor: 'not-allowed',
    transform: 'scale(0.98)',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: `3px solid rgba(255,255,255,0.3)`,
    borderTop: `3px solid white`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  lockIcon: {
    fontSize: '20px',
  },
  arrowIcon: {
    fontSize: '20px',
    transition: 'transform 0.3s ease',
  },
  trustSection: {
    textAlign: 'center',
    animation: 'fadeIn 0.8s ease-out 0.6s both',
  },
  trustText: {
    fontSize: '14px',
    color: theme.accent,
    marginBottom: '16px',
    lineHeight: '1.5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  shieldIcon: {
    fontSize: '16px',
  },
  paymentMethods: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    fontSize: '14px',
    color: theme.accent,
    opacity: 0.8,
  },
  paymentText: {
    fontSize: '12px',
  },
  paymentIcons: {
    display: 'flex',
    gap: '8px',
  },
  messageCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '40px 32px',
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    border: `1px solid ${theme.bg}10`,
    animation: 'scaleIn 0.6s ease-out',
  },
  successCard: {
    borderTop: `4px solid ${theme.accent}`,
  },
  cancelCard: {
    borderTop: `4px solid ${theme.badge}`,
  },
  messageIcon: {
    marginBottom: '24px',
  },
  successAnimation: {
    width: '80px',
    height: '80px',
    background: `linear-gradient(135deg, ${theme.accent}, ${theme.bg})`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    animation: 'scaleIn 0.6s ease-out',
  },
  cancelAnimation: {
    width: '80px',
    height: '80px',
    background: `linear-gradient(135deg, ${theme.badge}, #C44536)`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    animation: 'shake 0.6s ease-out',
  },
  checkmark: {
    color: 'white',
    fontSize: '36px',
    fontWeight: 'bold',
  },
  cross: {
    color: 'white',
    fontSize: '36px',
    fontWeight: 'bold',
  },
  messageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: theme.bg,
    marginBottom: '16px',
  },
  messageText: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  successDetails: {
    backgroundColor: `${theme.bg}05`,
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: `1px solid ${theme.bg}10`,
  },
  detailLabel: {
    fontSize: '14px',
    color: theme.accent,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: '14px',
    color: theme.bg,
    fontWeight: '600',
  },
  messageActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  primaryButton: {
    background: `linear-gradient(135deg, ${theme.bg}, ${theme.accent})`,
    color: 'white',
    border: 'none',
    padding: '14px 28px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    flex: 1,
  },
  secondaryButton: {
    background: 'transparent',
    color: theme.bg,
    border: `2px solid ${theme.bg}30`,
    padding: '14px 28px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    flex: 1,
  },
};

// Add CSS animations
const keyframes = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;

// Inject keyframes
const style = document.createElement('style');
style.textContent = keyframes;
document.head.append(style);

// Add hover effects
const hoverStyles = `
  .checkout-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px ${theme.accent}60;
  }
  .checkout-button:hover .arrow-icon {
    transform: translateX(4px);
  }
  .product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(0,0,0,0.15);
  }
  .primary-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px ${theme.accent}40;
  }
  .secondary-button:hover {
    background: ${theme.bg}10;
    transform: translateY(-2px);
  }
  .product-image:hover {
    transform: scale(1.05);
  }
`;

const hoverStyle = document.createElement('style');
hoverStyle.textContent = hoverStyles;
document.head.append(hoverStyle);