import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Loader from "../components/Loader";
import { Container, Row, Col, Card, Button, Accordion, Modal, Badge } from 'react-bootstrap';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showOfferCard, setShowOfferCard] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [userOffer, setUserOffer] = useState(null);
  const [placingOffer, setPlacingOffer] = useState(false);
  
  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  
  // Cart state - initialize from localStorage if available
  const [isInCart, setIsInCart] = useState(() => {
    const savedCart = localStorage.getItem(`cart_${id}`);
    return savedCart ? JSON.parse(savedCart) : false;
  });
  const [updatingCart, setUpdatingCart] = useState(false);
  
  // Favorites state - initialize from localStorage if available
  const [isFavorite, setIsFavorite] = useState(() => {
    const savedFavorite = localStorage.getItem(`favorite_${id}`);
    return savedFavorite ? JSON.parse(savedFavorite) : false;
  });
  const [updatingFavorite, setUpdatingFavorite] = useState(false);

  // User state
  const [user, setUser] = useState(null);

  // Using your exact color theme from provided components
  const colors = {
    bg: "#19535F",           // Dark teal - primary
    accent: "#0B7A75",       // Medium teal - secondary
    highlight: "#D7C9AA",    // Beige - highlights
    badge: "#7B2D26",        // Dark red - accents
    text: "#F0F3F5",         // Light gray - text on dark
    lightBg: "#ffffff"       // White background
  };

  // ✅ Get current user from localStorage
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // ✅ Fetch product details with cart and favorite status - UPDATED to handle owner bids viewing
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const userId = user?._id || user?.id;

      const query = userId ? `?userId=${encodeURIComponent(String(userId))}` : '';
      const productRes = await api.get(`/products/${id}${query}`);
      const productData = productRes.data;
      setProduct(productData);
      
      // Set initial selected image
      const initialImage = productData.images?.[0] || "/placeholder.jpg";
      setSelectedImage(initialImage);

      // ✅ FIX: Properly set userOffer from activeBids - check if user is owner
      const userOffers = productData.activeBids || [];
      const currentUserOffer = userOffers.find(offer => 
        offer.bidderId === (user?._id || user?.id)
      );
      
      // Only set userOffer if the user is NOT the owner (owners don't have their own offers)
      const isOwner = (user?._id || user?.id) === productData.userId;
      if (!isOwner) {
        setUserOffer(currentUserOffer || null);
      } else {
        setUserOffer(null); // Owners don't have personal offers on their own products
      }

      // Store offer in localStorage for persistence (only for non-owners)
      if (currentUserOffer && !isOwner) {
        localStorage.setItem(`offer_${id}`, JSON.stringify(currentUserOffer));
      }
      
      // Fetch cart and favorites status if user is logged in
      if (userId) {
        try {
          const cartRes = await api.get(`/cart/user/${userId}`);
          const cartItem = cartRes.data.items?.find(item => item.productId === id);
          const cartStatus = !!cartItem;
          setIsInCart(cartStatus);
          localStorage.setItem(`cart_${id}`, JSON.stringify(cartStatus));
        } catch (error) {
          console.error("Error fetching cart status:", error);
        }

        try {
          const favRes = await api.get(`/favorites/user/${userId}`);
          const isFav = favRes.data.items?.some((item) => item.productId === id);
          setIsFavorite(isFav);
          localStorage.setItem(`favorite_${id}`, JSON.stringify(isFav));
        } catch (error) {
          console.error("Error fetching favorite status:", error);
        }
      }

      // ✅ Load userOffer from localStorage if API didn't return it (persistence fix) - only for non-owners
      const savedOffer = localStorage.getItem(`offer_${id}`);
      if (savedOffer && !currentUserOffer && !isOwner) {
        setUserOffer(JSON.parse(savedOffer));
      }
    } catch (err) {
      console.error("Product fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // ✅ Get display price - UPDATED to use accepted offer price if available
  const getDisplayPrice = () => {
    if (!product) return 0;
    
    // If user has an accepted offer, use that price
    if (product.userAcceptedOffer && product.userAcceptedOffer.acceptedAmount) {
      return product.userAcceptedOffer.acceptedAmount;
    }

    // Also support backend field `acceptedOffer` in case API returns it directly
    const currentUserId = user?._id || user?.id;
    if (product.acceptedOffer && currentUserId && String(product.acceptedOffer.bidderId) === String(currentUserId)) {
      return product.acceptedOffer.acceptedAmount;
    }
    
    // Otherwise use regular price
    return product.price;
  };

  // ✅ Toggle Cart Function with localStorage persistence - UPDATED to use accepted price
  const toggleCart = async () => {
    if (!user) {
      alert("Please log in to manage cart items.");
      navigate('/login');
      return;
    }

    if (!product.isAvailable) {
      alert("This product is no longer available.");
      return;
    }

    setUpdatingCart(true);
    try {
      if (isInCart) {
        await api.post("/cart/remove", {
          userId: user._id || user.id,
          productId: id
        });
        setIsInCart(false);
        localStorage.setItem(`cart_${id}`, JSON.stringify(false));
      } else {
        // Use accepted offer price if available, otherwise regular price
        const finalPrice = getDisplayPrice();
        const currentUserId = user._id || user.id;
        const isAcceptedOffer = !!(
          (product.userAcceptedOffer && product.userAcceptedOffer.acceptedAmount) ||
          (product.acceptedOffer && String(product.acceptedOffer.bidderId) === String(currentUserId))
        );

        await api.post("/cart/add", {
          userId: user._id || user.id,
          productId: id,
          quantity: 1,
          price: finalPrice, // Include the price in cart
          isAcceptedOffer
        });
        setIsInCart(true);
        localStorage.setItem(`cart_${id}`, JSON.stringify(true));
      }
    } catch (error) {
      console.error("Cart toggle error:", error);
      alert("Failed to update cart");
    } finally {
      setUpdatingCart(false);
    }
  };

  // ✅ Toggle Favorite Function with localStorage persistence
  const toggleFavorite = async () => {
    if (!user) {
      alert("Please log in to manage favorites.");
      navigate('/login');
      return;
    }

    setUpdatingFavorite(true);
    try {
      if (isFavorite) {
        await api.post("/favorites/remove", { 
          userId: user._id || user.id, 
          productId: id 
        });
        setIsFavorite(false);
        localStorage.setItem(`favorite_${id}`, JSON.stringify(false));
      } else {
        await api.post("/favorites/add", { 
          userId: user._id || user.id, 
          productId: id 
        });
        setIsFavorite(true);
        localStorage.setItem(`favorite_${id}`, JSON.stringify(true));
      }
    } catch (error) {
      console.error("Toggle favorite error:", error);
      alert("Failed to update favorites");
    } finally {
      setUpdatingFavorite(false);
    }
  };

  // ✅ Handle offer placement with localStorage persistence
  const handlePlaceOffer = async () => {
    if (!user) {
      alert("Please log in to make an offer.");
      navigate('/login');
      return;
    }

    if (!product.isAvailable) {
      alert("This product is no longer available.");
      return;
    }

    const offer = parseFloat(offerAmount);
    if (isNaN(offer) || offer <= 0) {
      alert("Please enter a valid offer amount.");
      return;
    }

    setPlacingOffer(true);
    try {
      const res = await api.post(`/products/${id}/placeBid`, {
        amount: offer,
        bidderId: user._id || user.id,
        bidderName: user.name,
      });

      setProduct(res.data.product);
      setOfferAmount("");
      setShowOfferCard(false);
      
      // ✅ FIX: Update userOffer state and persist to localStorage (only for non-owners)
      const newUserOffer = res.data.bid;
      const isOwner = (user._id || user.id) === product.userId;
      if (!isOwner) {
        setUserOffer(newUserOffer);
        localStorage.setItem(`offer_${id}`, JSON.stringify(newUserOffer));
      }

      if (res.data.isUpdate) {
        alert("Offer updated successfully!");
      } else {
        alert("Offer submitted successfully!");
      }
    } catch (err) {
      console.error("Error placing offer:", err);
      alert(err.response?.data?.message || "Failed to submit offer.");
    } finally {
      setPlacingOffer(false);
    }
  };

  // ✅ Handle Buy Now Function - UPDATED to use accepted offer price
  const handleBuyNow = async () => {
    if (!user) {
      alert("Please log in to make a purchase.");
      navigate('/login');
      return;
    }

    if (!product.isAvailable) {
      alert("This product is no longer available.");
      return;
    }

    setUpdatingCart(true);
    try {
      // Use accepted offer price if available, otherwise regular price
      const finalPrice = getDisplayPrice();
      
      // Add to cart first with correct price
      await api.post("/cart/add", {
        userId: user._id || user.id,
        productId: id,
        quantity: 1,
        price: finalPrice
      });
      
      // Update local state
      setIsInCart(true);
      localStorage.setItem(`cart_${id}`, JSON.stringify(true));
      
      // Navigate directly to checkout with correct price
      const currentUserId = user._id || user.id;
      const isAcceptedOffer = !!(
        (product.userAcceptedOffer && product.userAcceptedOffer.acceptedAmount) ||
        (product.acceptedOffer && String(product.acceptedOffer.bidderId) === String(currentUserId))
      );

      navigate('/checkout', { 
        state: { 
          directPurchase: true,
          productId: id,
          productName: product.name,
          price: finalPrice, // Use the correct price (accepted offer or regular)
          quantity: 1,
          isAcceptedOffer
        }
      });
    } catch (error) {
      console.error("Buy Now error:", error);
      alert("Failed to process purchase");
    } finally {
      setUpdatingCart(false);
    }
  };

  // ✅ Handle offer button click
  const handleOfferButtonClick = () => {
    if (!user) {
      alert("Please log in to make an offer.");
      navigate('/login');
      return;
    }
    
    if (userOffer) {
      setOfferAmount(getOfferAmount(userOffer).toString());
    }
    setShowOfferCard(true);
  };

  // ✅ Open image in modal for better viewing
  const openImageModal = (image) => {
    setModalImage(image);
    setShowImageModal(true);
  };

  // ✅ Utility functions
  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? "Invalid date" : date.toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  const getOfferAmount = (offer) => {
    if (!offer) return 0;
    return offer.amount || offer.bidAmount || 0;
  };

  const getOfferStatus = (offer) => {
    return offer.bidStatus || offer.status || "pending";
  };

  const isUserOwner = () => {
    if (!user || !product) return false;
    return String(user._id || user.id) === String(product.userId);
  };

  const getSellerInfo = () => {
    if (!product) return {};
    
    // Try to get rating from product.user first, then fallback to product properties
    const userRating = product.user?.rating || product.userRating || product.sellerRating || "No rating";
    
    return {
      name: product.user?.name || product.userName || product.sellerName || "Unknown User",
      rating: typeof userRating === 'number' ? userRating.toFixed(1) : userRating,
      location: product.user?.location || product.userLocation || product.sellerLocation || "Location not specified",
      sales: product.successfulSales || "0",
      profileImage: product.user?.profileImage || null
    };
  };

  // ✅ Render product details
  const renderProductDetails = () => {
    if (!product.details) return null;

    const details = product.details;
    const detailEntries = Object.entries(details);

    if (detailEntries.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 style={{ color: colors.bg, fontWeight: '600', marginBottom: '1.5rem' }}>Product Specifications</h4>
        <Row>
          {detailEntries.map(([key, value]) => (
            <Col key={key} xs={6} md={4} className="mb-3">
              <div 
                className="hover-shadow"
                style={{ 
                  background: 'white',
                  padding: '1rem', 
                  borderRadius: '8px',
                  border: `1px solid ${colors.highlight}`,
                  height: '100%',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: colors.bg, 
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  marginBottom: '0.5rem'
                }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div style={{ fontSize: '0.95rem', color: '#2D3748', fontWeight: '500' }}>
                  {value}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  if (loading) return <Loader />;
  if (!product)
    return (
      <Container className="text-center mt-5">
        <div style={{ color: colors.bg, fontSize: '1.5rem', fontWeight: '600' }}>
          Product not found
        </div>
      </Container>
    );

  const isAvailable = product.isAvailable;
  const currentOffers = product.activeBids || [];
  const sellerInfo = getSellerInfo();
  const isOwner = product.isOwner || isUserOwner();
  const displayPrice = getDisplayPrice();

  return (
    <Container fluid style={{ 
      background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
      minHeight: '100vh',
      padding: 0 
    }}>
      {/* Enhanced CSS Animations */}
      <style>{`
        @keyframes floatIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(215, 201, 170, 0.3); }
          50% { box-shadow: 0 0 30px rgba(215, 201, 170, 0.6); }
        }
        @keyframes slideInFromLeft {
          0% { opacity: 0; transform: translateX(-30px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .hover-lift { 
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
        }
        .hover-lift:hover { 
          transform: translateY(-8px); 
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
        }
        .image-zoom { 
          transition: transform 0.6s ease, filter 0.6s ease; 
        }
        .image-zoom:hover { 
          transform: scale(1.08); 
          filter: brightness(1.05);
        }
        .pulse-accept { 
          animation: pulse-glow 2s infinite; 
        }
        .fade-in { 
          animation: floatIn 0.8s ease-out; 
        }
        .slide-in { 
          animation: slideInFromLeft 0.6s ease-out; 
        }
        .gradient-bg {
          background: linear-gradient(135deg, ${colors.bg}15, ${colors.accent}15);
        }
      `}</style>

      {/* Enhanced Image Modal */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)} 
        size="xl" 
        centered
        className="image-modal"
      >
        <Modal.Header closeButton style={{ border: 'none', background: colors.bg }}>
          <Modal.Title style={{ color: colors.text, fontWeight: '600' }}>
            {product.name} - Full View
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-0" style={{ background: '#f8f9fa' }}>
          <img
            src={modalImage}
            alt={product.name}
            style={{
              width: '100%',
              height: '70vh',
              objectFit: 'contain',
              background: '#f8f9fa'
            }}
          />
        </Modal.Body>
      </Modal>

      {/* Modern Header with Gradient Background */}
      <div style={{ 
        background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent} 100%)`,
        padding: '2.5rem 0',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Elements */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          animation: 'float 8s infinite ease-in-out'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          right: '-5%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(215, 201, 170, 0.2)',
          animation: 'float 6s infinite ease-in-out 1s'
        }}></div>
        
        <Container style={{ position: 'relative', zIndex: 2 }}>
          <button
            onClick={() => navigate(-1)}
            className="hover-lift"
            style={{
              background: 'rgba(240, 243, 245, 0.15)',
              border: `2px solid ${colors.highlight}`,
              color: colors.text,
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backdropFilter: 'blur(10px)',
              fontSize: '1rem'
            }}
          >
            <i className="fa-solid fa-arrow-left"></i>
            Back to Browse
          </button>
        </Container>
      </div>

      <Container>
        <Row className="g-4 fade-in">
          {/* Product Images Section - Enhanced */}
          <Col lg={6}>
            <Card 
              className="border-0 shadow-sm hover-lift"
              style={{ 
                borderRadius: '20px',
                overflow: 'hidden',
                background: 'white',
                animation: 'slideInFromLeft 0.8s ease-out'
              }}
            >
              <div style={{ position: 'relative', cursor: 'pointer' }}>
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="image-zoom"
                  style={{
                    width: '100%',
                    height: '450px',
                    objectFit: 'cover'
                  }}
                  onClick={() => openImageModal(selectedImage)}
                />
                
                {/* Enhanced Status Badges */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {product.condition && (
                    <Badge style={{ 
                      background: colors.accent,
                      padding: '0.6rem 1.2rem',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      border: `2px solid ${colors.text}`,
                      borderRadius: '12px',
                      textTransform: 'capitalize'
                    }}>
                      <i className="fa-solid fa-tag" style={{ marginRight: '0.5rem' }}></i>
                      {product.condition}
                    </Badge>
                  )}
                  <Badge style={{ 
                    background: isAvailable ? '#22C55E' : colors.badge,
                    padding: '0.6rem 1.2rem',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    border: `2px solid ${colors.text}`,
                    borderRadius: '12px'
                  }}>
                    <i className={`fa-solid ${isAvailable ? 'fa-check' : 'fa-ban'}`} style={{ marginRight: '0.5rem' }}></i>
                    {isAvailable ? 'Available' : 'Sold'}
                  </Badge>
                </div>

                {/* Enhanced Favorite Button */}
                <button
                  onClick={toggleFavorite}
                  disabled={updatingFavorite || !user}
                  className="hover-lift"
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: isFavorite ? colors.badge : 'rgba(255, 255, 255, 0.95)',
                    border: `3px solid ${isFavorite ? colors.badge : colors.bg}`,
                    fontSize: '1.3rem',
                    color: isFavorite ? 'white' : colors.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: updatingFavorite ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                  }}
                >
                  {updatingFavorite ? 
                    <i className="fa-solid fa-spinner fa-spin"></i> : 
                    (isFavorite ? '❤️' : '🤍')
                  }
                </button>

                {/* Enhanced Zoom Indicator */}
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '20px',
                  background: 'rgba(25, 83, 95, 0.9)',
                  color: colors.text,
                  padding: '0.6rem 1.2rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <i className="fa-solid fa-expand-arrows-alt"></i>
                  Click to zoom
                </div>
              </div>

              {/* Enhanced Image Thumbnails */}
              {product.images && product.images.length > 0 && (
                <div className="p-4" style={{ background: colors.text }}>
                  <h6 style={{ 
                    color: colors.bg, 
                    fontWeight: '700', 
                    marginBottom: '1.2rem',
                    fontSize: '1.1rem'
                  }}>
                    <i className="fa-solid fa-images" style={{ marginRight: '0.5rem' }}></i>
                    Product Gallery ({product.images.length})
                  </h6>
                  <Row className="g-3">
                    {product.images.map((img, index) => (
                      <Col key={index} xs={4} sm={3} md={2}>
                        <div
                          className="hover-lift"
                          style={{
                            height: '90px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: `3px solid ${img === selectedImage ? colors.highlight : 'transparent'}`,
                            transition: 'all 0.3s ease',
                            transform: img === selectedImage ? 'scale(1.05)' : 'scale(1)'
                          }}
                          onClick={() => setSelectedImage(img)}
                        >
                          <img
                            src={img}
                            alt={`${product.name}-${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </Card>
          </Col>

          {/* Enhanced Product Info Section */}
          <Col lg={6}>
            <div style={{ padding: '0 0.5rem' }} className="fade-in">
              {/* Enhanced Product Header */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h1 style={{ 
                    color: colors.bg, 
                    fontWeight: '800',
                    fontSize: '2.5rem',
                    margin: 0,
                    flex: 1,
                    lineHeight: '1.2'
                  }}>
                    {product.name}
                  </h1>
                  <Badge style={{ 
                    background: `linear-gradient(135deg, ${colors.bg}, ${colors.accent})`,
                    color: colors.text,
                    padding: '0.6rem 1.2rem',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    borderRadius: '12px'
                  }}>
                    <i className="fa-solid fa-tag" style={{ marginRight: '0.5rem' }}></i>
                    {product.category || 'General'}
                  </Badge>
                </div>
                
                {isInCart && (
                  <div style={{ 
                    color: colors.accent,
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    background: 'rgba(11, 122, 117, 0.1)',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    width: 'fit-content'
                  }}>
                    <i className="fa-solid fa-cart-shopping"></i>
                    Added to Cart
                  </div>
                )}
              </div>

              {/* Enhanced Pricing Section */}
              <Card className="border-0 mb-4 hover-lift gradient-bg" style={{ 
                border: product.userAcceptedOffer ? `3px solid #22C55E` : 'none',
                borderRadius: '16px',
                overflow: 'hidden'
              }}>
                <Card.Body className="p-4">
                  <div className="d-flex align-items-baseline gap-3 mb-2 flex-wrap">
                    <span style={{ 
                      color: product.userAcceptedOffer ? '#22C55E' : colors.accent,
                      fontSize: '2.5rem',
                      fontWeight: '800',
                    }}>
                      {formatCurrency(displayPrice)}
                    </span>
                    
                    {product.userAcceptedOffer ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <span style={{ 
                          color: '#6c757d', 
                          textDecoration: 'line-through', 
                          fontSize: '1.6rem',
                          fontWeight: '600'
                        }}>
                          {formatCurrency(product.userAcceptedOffer.originalPrice)}
                        </span>
                        <Badge style={{ 
                          background: '#22C55E',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          borderRadius: '20px'
                        }} className="pulse-accept">
                          <i className="fa-solid fa-trophy" style={{ marginRight: '0.5rem' }}></i>
                          Your Accepted Offer!
                        </Badge>
                      </div>
                    ) : (
                      product.originalPrice && product.originalPrice > product.price && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                          <span style={{ 
                            color: '#6c757d', 
                            textDecoration: 'line-through', 
                            fontSize: '1.6rem',
                            fontWeight: '600'
                          }}>
                            {formatCurrency(product.originalPrice)}
                          </span>
                          {product.discount && (
                            <Badge style={{ 
                              background: colors.badge,
                              color: 'white',
                              padding: '0.5rem 1rem',
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              borderRadius: '20px'
                            }}>
                              <i className="fa-solid fa-bolt" style={{ marginRight: '0.5rem' }}></i>
                              {product.discount}% OFF
                            </Badge>
                          )}
                        </div>
                      )
                    )}
                  </div>
                  <p style={{ 
                    color: product.userAcceptedOffer ? '#22C55E' : colors.bg, 
                    fontWeight: '600', 
                    margin: 0, 
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <i className={`fa-solid ${product.userAcceptedOffer ? 'fa-handshake' : 'fa-comments-dollar'}`}></i>
                    {product.userAcceptedOffer ? 
                      "Congratulations! Your offer was accepted at this special price!" : 
                      "Price is negotiable - Make an offer!"}
                  </p>
                </Card.Body>
              </Card>

              {/* Enhanced Action Buttons */}
              {!isOwner && (
                <Row className="g-3 mb-4">
                  <Col sm={6}>
                    <Button
                      onClick={toggleCart}
                      disabled={!isAvailable || updatingCart}
                      className="w-100 border-0 hover-lift d-flex align-items-center justify-content-center gap-2"
                      style={{ 
                        background: isInCart ? colors.accent : colors.bg,
                        padding: '1.1rem',
                        borderRadius: '12px',
                        fontWeight: '700',
                        fontSize: '1.05rem',
                        transition: 'all 0.3s ease',
                        height: '58px',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                      }}
                    >
                      {updatingCart ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      ) : isInCart ? (
                        <>
                          <i className="fa-solid fa-check-circle"></i>
                          In Cart
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-cart-plus"></i>
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </Col>
                  
                  <Col sm={6}>
                    <Button
                      onClick={handleOfferButtonClick}
                      disabled={!isAvailable || placingOffer || 
                               (userOffer && (getOfferStatus(userOffer) === 'accepted' || getOfferStatus(userOffer) === 'rejected'))}
                      className="w-100 border-0 hover-lift d-flex align-items-center justify-content-center gap-2"
                      style={{ 
                        background: colors.highlight,
                        color: colors.bg,
                        padding: '1.1rem',
                        borderRadius: '12px',
                        fontWeight: '700',
                        fontSize: '1.05rem',
                        transition: 'all 0.3s ease',
                        height: '58px',
                        border: `3px solid ${colors.highlight}`,
                        boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                      }}
                    >
                      {!isAvailable ? (
                        <>
                          <i className="fa-solid fa-ban"></i>
                          Sold
                        </>
                      ) : userOffer && getOfferStatus(userOffer) === 'accepted' ? (
                        <>
                          <i className="fa-solid fa-check-circle"></i>
                          Accepted
                        </>
                      ) : userOffer && getOfferStatus(userOffer) === 'rejected' ? (
                        <>
                          <i className="fa-solid fa-times-circle"></i>
                          Closed
                        </>
                      ) : userOffer ? (
                        <>
                          <i className="fa-solid fa-edit"></i>
                          Update Offer
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-handshake"></i>
                          Make Offer
                        </>
                      )}
                    </Button>
                  </Col>

                  <Col sm={12}>
                    <Button
                      onClick={handleBuyNow}
                      disabled={!isAvailable || updatingCart}
                      className="w-100 border-0 hover-lift d-flex align-items-center justify-content-center gap-2"
                      style={{ 
                        background: product.userAcceptedOffer ? 
                          'linear-gradient(135deg, #22C55E, #16A34A)' : 
                          `linear-gradient(135deg, ${colors.accent}, ${colors.bg})`,
                        padding: '1.1rem',
                        borderRadius: '12px',
                        fontWeight: '700',
                        fontSize: '1.05rem',
                        color: 'white',
                        transition: 'all 0.3s ease',
                        height: '58px',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                      }}
                    >
                      {updatingCart ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      ) : product.userAcceptedOffer ? (
                        <>
                          <i className="fa-solid fa-bolt"></i>
                          Buy at Your Accepted Price!
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-bolt"></i>
                          Buy Now
                        </>
                      )}
                    </Button>
                  </Col>
                </Row>
              )}

              {/* Enhanced User Status */}
              <Card className="border-0 mb-4 hover-lift" style={{ 
                background: `linear-gradient(135deg, ${colors.accent}20, ${colors.bg}20)`,
                borderRadius: '12px',
                border: `2px solid ${colors.accent}30`
              }}>
                <Card.Body className="p-3 text-center">
                  <p style={{ 
                    color: colors.bg, 
                    margin: 0,
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    {user ? (
                      <>
                        <i className="fa-solid fa-user-check" style={{ color: colors.accent }}></i>
                        Welcome, {user.name}! Ready to make this yours?
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-lock" style={{ color: colors.badge }}></i>
                        Please login to use all features
                      </>
                    )}
                  </p>
                </Card.Body>
              </Card>

              {/* Enhanced Owner Message */}
              {isOwner && (
                <Card className="border-0 mb-4 hover-lift" style={{ 
                  background: `linear-gradient(135deg, ${colors.highlight}25, ${colors.bg}15)`, 
                  border: `3px solid ${colors.highlight}`,
                  borderRadius: '12px'
                }}>
                  <Card.Body className="p-3 text-center">
                    <p style={{ 
                      color: colors.bg, 
                      margin: 0,
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}>
                      <i className="fa-solid fa-crown" style={{ color: colors.highlight }}></i>
                      This is your own listing - Manage it from your profile
                    </p>
                    {currentOffers.length > 0 && (
                      <p style={{ 
                        color: colors.accent, 
                        margin: '0.5rem 0 0 0',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}>
                        <i className="fa-solid fa-hand-holding-dollar"></i>
                        You have {currentOffers.length} offer{currentOffers.length > 1 ? 's' : ''} on this product
                      </p>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* Enhanced Offer Card */}
              {showOfferCard && !isOwner && (
                <Card className="border-0 shadow hover-lift" style={{ 
                  border: `3px solid ${colors.highlight}`,
                  borderRadius: '16px',
                  background: 'white'
                }}>
                  <Card.Body className="p-4">
                    <div className="text-center mb-3">
                      <h6 style={{ 
                        color: colors.bg, 
                        fontWeight: '700', 
                        margin: 0,
                        fontSize: '1.2rem'
                      }}>
                        <i className="fa-solid fa-handshake" style={{ marginRight: '0.5rem' }}></i>
                        {userOffer ? 'Update Your Offer' : 'Make Your Offer'}
                      </h6>
                    </div>
                    
                    {userOffer && (
                      <Card className="border-0 mb-3 gradient-bg" style={{ borderRadius: '12px' }}>
                        <Card.Body className="p-3 text-center">
                          <p style={{ color: colors.bg, fontWeight: '700', margin: 0, fontSize: '1rem' }}>
                            Current offer: <span style={{ color: colors.accent, fontSize: '1.2rem' }}>{formatCurrency(getOfferAmount(userOffer))}</span>
                          </p>
                        </Card.Body>
                      </Card>
                    )}
                    
                    <div className="mb-3">
                      <label style={{ 
                        color: colors.bg, 
                        fontWeight: '700', 
                        marginBottom: '0.8rem', 
                        display: 'block',
                        fontSize: '1rem'
                      }}>
                        <i className="fa-solid fa-dollar-sign" style={{ marginRight: '0.5rem' }}></i>
                        Offer Amount
                      </label>
                      <input
                        type="number"
                        placeholder={userOffer ? "Enter new offer amount..." : "Enter your offer amount..."}
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '1rem',
                          border: `2px solid ${colors.highlight}`,
                          borderRadius: '10px',
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: colors.bg,
                          background: 'white',
                          transition: 'all 0.3s ease'
                        }}
                        step="0.01"
                        onFocus={(e) => e.target.style.borderColor = colors.accent}
                        onBlur={(e) => e.target.style.borderColor = colors.highlight}
                      />
                    </div>
                    
                    <Card className="border-0 mb-3" style={{ background: 'rgba(215, 201, 170, 0.2)', borderRadius: '10px' }}>
                      <Card.Body className="p-3">
                        <p style={{ color: colors.bg, fontSize: '0.9rem', margin: 0, fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <i className="fa-solid fa-lightbulb" style={{ color: colors.highlight }}></i>
                          This is bargaining - offer any amount you think is fair! The seller will review your offer.
                        </p>
                      </Card.Body>
                    </Card>
                    
                    <div className="d-flex gap-3">
                      <Button
                        onClick={() => setShowOfferCard(false)}
                        className="hover-lift"
                        style={{
                          flex: 1,
                          background: 'transparent',
                          border: `3px solid ${colors.bg}`,
                          color: colors.bg,
                          padding: '1rem',
                          borderRadius: '10px',
                          fontWeight: '700',
                          fontSize: '1rem',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <i className="fa-solid fa-times" style={{ marginRight: '0.5rem' }}></i>
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePlaceOffer}
                        disabled={placingOffer || !offerAmount}
                        className="hover-lift"
                        style={{
                          flex: 1,
                          background: colors.bg,
                          border: 'none',
                          color: 'white',
                          padding: '1rem',
                          borderRadius: '10px',
                          fontWeight: '700',
                          fontSize: '1rem',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {placingOffer ? (
                          <i className="fa-solid fa-spinner fa-spin"></i>
                        ) : userOffer ? (
                          <>
                            <i className="fa-solid fa-pen-to-square" style={{ marginRight: '0.5rem' }}></i>
                            Update Offer
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-paper-plane" style={{ marginRight: '0.5rem' }}></i>
                            Submit Offer
                          </>
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* Enhanced User's Current Offer */}
              {userOffer && !isOwner && !showOfferCard && (
                <Card className="border-0 shadow hover-lift" 
                  style={{ 
                    background: getOfferStatus(userOffer) === 'accepted' ? 
                      'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1))' :
                      getOfferStatus(userOffer) === 'rejected' ? 
                      'linear-gradient(135deg, rgba(245, 101, 101, 0.1), rgba(229, 62, 62, 0.1))' :
                      `linear-gradient(135deg, ${colors.accent}15, ${colors.bg}15)`,
                    border: `3px solid ${
                      getOfferStatus(userOffer) === 'accepted' ? '#22C55E' :
                      getOfferStatus(userOffer) === 'rejected' ? colors.badge : colors.bg
                    }`,
                    borderRadius: '16px'
                  }}
                >
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 style={{ 
                          color: getOfferStatus(userOffer) === 'accepted' ? '#22C55E' :
                                 getOfferStatus(userOffer) === 'rejected' ? colors.badge : colors.bg,
                          fontWeight: '700',
                          margin: 0,
                          fontSize: '1.1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          {getOfferStatus(userOffer) === 'accepted' ? (
                            <>
                              <i className="fa-solid fa-check-circle"></i>
                              Offer Accepted!
                            </>
                          ) : getOfferStatus(userOffer) === 'rejected' ? (
                            <>
                              <i className="fa-solid fa-times-circle"></i>
                              Offer Declined
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-clock"></i>
                              Your Current Offer
                            </>
                          )}
                        </h6>
                        <p style={{ 
                          color: colors.bg,
                          fontWeight: '800',
                          margin: '0.5rem 0 0 0',
                          fontSize: '1.3rem'
                        }}>
                          {formatCurrency(getOfferAmount(userOffer))}
                        </p>
                        <small style={{ 
                          color: colors.bg,
                          opacity: 0.8,
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}>
                          {getOfferStatus(userOffer) === 'pending' ? 'Waiting for seller response' :
                           getOfferStatus(userOffer) === 'accepted' ? 'Congratulations! Proceed to checkout' :
                           'Seller declined your offer'}
                        </small>
                      </div>
                      <Button
                        onClick={handleOfferButtonClick}
                        disabled={getOfferStatus(userOffer) === 'accepted' || getOfferStatus(userOffer) === 'rejected' || !isAvailable}
                        className="hover-lift"
                        style={{
                          background: colors.bg,
                          border: 'none',
                          borderRadius: '10px',
                          padding: '0.75rem 1.25rem',
                          fontSize: '0.9rem',
                          fontWeight: '700'
                        }}
                      >
                        {getOfferStatus(userOffer) === 'accepted' ? 'Accepted' :
                         getOfferStatus(userOffer) === 'rejected' ? 'Closed' : 'Update'}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </div>
          </Col>
        </Row>

        {/* Enhanced Product Details Accordion */}
        <Row className="mt-5 fade-in">
          <Col lg={10} className="mx-auto">
            <Card className="border-0 shadow-sm hover-lift" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-5">
                <h3 className="text-center mb-5" style={{ 
                  color: colors.bg, 
                  fontWeight: '800',
                  fontSize: '2.2rem',
                  position: 'relative'
                }}>
                  Product Details
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '-15px', 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    width: '100px', 
                    height: '4px', 
                    background: `linear-gradient(90deg, ${colors.bg}, ${colors.accent})`,
                    borderRadius: '2px'
                  }}></div>
                </h3>

                <Accordion defaultActiveKey="0" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                  {/* Description */}
                  <Accordion.Item eventKey="0" className="border-0 mb-3" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                    <Accordion.Header style={{ 
                      fontWeight: '700', 
                      color: colors.bg,
                      background: 'white',
                      border: 'none',
                      padding: '1.5rem',
                      fontSize: '1.1rem'
                    }}>
                      <i className="fa-solid fa-file-lines" style={{ marginRight: '0.8rem', color: colors.accent }}></i>
                      Product Description
                    </Accordion.Header>
                    <Accordion.Body style={{ 
                      background: '#d7c9aa37',
                      padding: '2rem',
                      borderTop: `2px solid ${colors.accent}`
                    }}>
                      <p style={{ 
                        lineHeight: '1.8', 
                        margin: 0, 
                        color: colors.bg,
                        fontSize: '1.05rem'
                      }}>
                        {product.description || "No description provided."}
                      </p>
                      {renderProductDetails()}
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* Owner Information */}
                  <Accordion.Item eventKey="1" className="border-0 mb-3" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                    <Accordion.Header style={{ 
                      fontWeight: '700', 
                      color: colors.bg,
                      background: 'white',
                      border: 'none',
                      padding: '1.5rem',
                      fontSize: '1.1rem'
                    }}>
                      <i className="fa-solid fa-user" style={{ marginRight: '0.8rem', color: colors.accent }}></i>
                      Seller Information
                    </Accordion.Header>
                    <Accordion.Body style={{ 
                      background: '#d7c9aa37',
                      padding: '2rem',
                      borderTop: `2px solid ${colors.accent}`
                    }}>
                      <Row>
                        <Col md={6}>
                          <div style={{ marginBottom: '1.5rem' }}>
                            <strong style={{ color: colors.bg, fontSize: '1.1rem' }}>Name:</strong>
                            <div style={{ color: colors.bg, fontWeight: '600', fontSize: '1.05rem', marginTop: '0.5rem' }}>
                              <i className="fa-solid fa-user-tag" style={{ marginRight: '0.5rem', color: colors.accent }}></i>
                              {sellerInfo.name}
                            </div>
                          </div>
                          <div style={{ marginBottom: '1.5rem' }}>
                            <strong style={{ color: colors.bg, fontSize: '1.1rem' }}>Location:</strong>
                            <div style={{ color: colors.bg, fontWeight: '600', fontSize: '1.05rem', marginTop: '0.5rem' }}>
                              <i className="fa-solid fa-location-dot" style={{ marginRight: '0.5rem', color: colors.accent }}></i>
                              {sellerInfo.location}
                            </div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div style={{ marginBottom: '1.5rem' }}>
                            <strong style={{ color: colors.bg, fontSize: '1.1rem' }}>Rating:</strong>
                            <div style={{ color: colors.bg, fontWeight: '600', fontSize: '1.05rem', marginTop: '0.5rem' }}>
                              <i className="fa-solid fa-star" style={{ color: colors.highlight, marginRight: '0.5rem' }}></i>
                              {sellerInfo.rating}
                            </div>
                          </div>
                          <div style={{ marginBottom: '1.5rem' }}>
                            <strong style={{ color: colors.bg, fontSize: '1.1rem' }}>Completed Sales:</strong>
                            <div style={{ color: colors.bg, fontWeight: '600', fontSize: '1.05rem', marginTop: '0.5rem' }}>
                              <i className="fa-solid fa-chart-line" style={{ marginRight: '0.5rem', color: colors.accent }}></i>
                              {sellerInfo.sales}
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* Offers (for owner) - UPDATED to show all bids to owner */}
                  {isOwner && currentOffers.length > 0 && (
                    <Accordion.Item eventKey="2" className="border-0 mb-3" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                      <Accordion.Header style={{ 
                        fontWeight: '700', 
                        color: colors.bg,
                        background: 'white',
                        border: 'none',
                        padding: '1.5rem',
                        fontSize: '1.1rem'
                      }}>
                        <i className="fa-solid fa-hand-holding-dollar" style={{ marginRight: '0.8rem', color: colors.accent }}></i>
                        Received Offers ({currentOffers.length})
                      </Accordion.Header>
                      <Accordion.Body style={{ 
                        background: '#d7c9aa37',
                        padding: '2rem',
                        borderTop: `2px solid ${colors.accent}`
                      }}>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '1rem' }}>
                          {currentOffers
                            .sort((a, b) => getOfferAmount(b) - getOfferAmount(a))
                            .map((offer, index) => (
                              <Card 
                                key={offer.bidId || `offer-${index}`}
                                className="mb-3 border-0 hover-lift"
                                style={{ 
                                  background: 'white',
                                  borderRadius: '12px',
                                  borderLeft: `5px solid ${
                                    getOfferStatus(offer) === 'accepted' ? '#22C55E' :
                                    getOfferStatus(offer) === 'rejected' ? colors.badge : colors.bg
                                  }`,
                                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
                                }}
                              >
                                <Card.Body className="p-3">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <h6 style={{ color: colors.bg, margin: 0, fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <i className="fa-solid fa-user" style={{ color: colors.accent }}></i>
                                        {offer.bidderName || "Unknown User"}
                                      </h6>
                                      <small style={{ color: colors.bg, fontSize: '0.85rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem' }}>
                                        <i className="fa-solid fa-calendar" style={{ color: colors.highlight }}></i>
                                        {formatDate(offer.date)}
                                      </small>
                                    </div>
                                    <div className="text-end">
                                      <div style={{ 
                                        color: colors.accent,
                                        fontSize: '1.2rem',
                                        fontWeight: '800'
                                      }}>
                                        {formatCurrency(getOfferAmount(offer))}
                                      </div>
                                      <small style={{ 
                                        color: getOfferStatus(offer) === 'accepted' ? '#22C55E' :
                                               getOfferStatus(offer) === 'rejected' ? colors.badge : colors.highlight,
                                        fontWeight: '700',
                                        fontSize: '0.85rem',
                                        textTransform: 'capitalize'
                                      }}>
                                        {getOfferStatus(offer)}
                                      </small>
                                    </div>
                                  </div>
                                </Card.Body>
                              </Card>
                            ))}
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  )}
                </Accordion>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modern Footer with Gradient */}
      <div style={{ 
        background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent} 100%)`,
        padding: '4rem 0',
        marginTop: '5rem',
        color: colors.text,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Footer Background Elements */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-5%',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          animation: 'float 10s infinite ease-in-out'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-3%',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'rgba(215, 201, 170, 0.15)',
          animation: 'float 8s infinite ease-in-out 2s'
        }}></div>
        
        <Container style={{ position: 'relative', zIndex: 2 }}>
          <h5 style={{ fontWeight: '800', marginBottom: '1.2rem', fontSize: '1.8rem' }}>
            Ready to make this item yours?
          </h5>
          <p style={{ marginBottom: '2.5rem', opacity: 0.9, fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Join thousands of happy customers who found their perfect match on Thriftify!
          </p>
          <Button
            onClick={() => navigate('/categories')}
            className="hover-lift"
            style={{
              background: colors.highlight,
              border: 'none',
              color: colors.bg,
              padding: '1rem 2.5rem',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '1.1rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
            }}
          >
            <i className="fa-solid fa-bag-shopping" style={{ marginRight: '0.8rem' }}></i>
            Continue Shopping
          </Button>
        </Container>
      </div>
    </Container>
  );
};

export default ProductPage;