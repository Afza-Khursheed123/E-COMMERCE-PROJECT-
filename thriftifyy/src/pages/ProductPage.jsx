import React, { useEffect, useState, useCallback, useRef } from "react";
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

  const hasFetched = useRef(false);

  // Using your exact color theme from CSS
  const colors = {
    primary: "#19535F",      // Dark teal - navbar background
    secondary: "#0B7A75",    // Medium teal - accents
    accent: "#D7C9AA",       // Beige - highlights
    light: "#F0F3F5",        // Light gray - text on dark
    background: "#fffff",   // Peach - body background
    dark: "#2D3748",         // Dark gray - text
    success: "#48BB78",      // Green - success states
    error: "#F56565"         // Red - error states
  };

  // ✅ Get current user from localStorage
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // ✅ Fetch product details with cart and favorite status
  const fetchProduct = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    try {
      setLoading(true);
      const userId = user?._id || user?.id;

      const productRes = await api.get(`/products/${id}${userId ? `?userId=${userId}` : ''}`);
      const productData = productRes.data;
      setProduct(productData);
      
      // Set initial selected image
      const initialImage = productData.images?.[0] || "/placeholder.jpg";
      setSelectedImage(initialImage);

      // ✅ FIX: Properly set userOffer from activeBids
      const userOffers = productData.activeBids || [];
      const currentUserOffer = userOffers.find(offer => 
        offer.bidderId === (user?._id || user?.id)
      );
      setUserOffer(currentUserOffer || null);

      // Store offer in localStorage for persistence
      if (currentUserOffer) {
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

      // ✅ Load userOffer from localStorage if API didn't return it (persistence fix)
      const savedOffer = localStorage.getItem(`offer_${id}`);
      if (savedOffer && !currentUserOffer) {
        setUserOffer(JSON.parse(savedOffer));
      }

    } catch (err) {
      console.error("Product fetch error:", err);
      hasFetched.current = false;
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // ✅ Toggle Cart Function with localStorage persistence
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
        await api.post("/cart/add", {
          userId: user._id || user.id,
          productId: id,
          quantity: 1,
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
      
      // ✅ FIX: Update userOffer state and persist to localStorage
      const newUserOffer = res.data.bid;
      setUserOffer(newUserOffer);
      localStorage.setItem(`offer_${id}`, JSON.stringify(newUserOffer));

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

  // ✅ Handle Buy Now Function
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
      // Add to cart first
      await api.post("/cart/add", {
        userId: user._id || user.id,
        productId: id,
        quantity: 1,
      });
      
      // Update local state
      setIsInCart(true);
      localStorage.setItem(`cart_${id}`, JSON.stringify(true));
      
      // Navigate directly to checkout
      navigate('/checkout', { 
        state: { 
          directPurchase: true,
          productId: id,
          productName: product.name,
          price: product.price,
          quantity: 1
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
    return (user._id || user.id) === product.userId;
  };

  const getSellerInfo = () => {
    if (!product) return {};
    
    return {
      name: product.userName || product.sellerName || "Unknown User",
      rating: product.userRating || product.sellerRating || "No rating",
      location: product.userLocation || product.sellerLocation || "Location not specified",
      sales: product.successfulSales || "0"
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
        <h4 style={{ color: colors.primary, fontWeight: '600', marginBottom: '1.5rem' }}>Product Specifications</h4>
        <Row>
          {detailEntries.map(([key, value]) => (
            <Col key={key} xs={6} md={4} className="mb-3">
              <div 
                className="hover-shadow"
                style={{ 
                  background: 'white',
                  padding: '1rem', 
                  borderRadius: '8px',
                  border: `1px solid ${colors.accent}`,
                  height: '100%',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: colors.primary, 
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  marginBottom: '0.5rem'
                }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div style={{ fontSize: '0.95rem', color: colors.dark, fontWeight: '500' }}>
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
        <div style={{ color: colors.primary, fontSize: '1.5rem', fontWeight: '600' }}>
          Product not found
        </div>
      </Container>
    );

  const isAvailable = product.isAvailable;
  const currentOffers = product.activeBids || [];
  const sellerInfo = getSellerInfo();
  const isOwner = isUserOwner();

  return (
    <Container fluid style={{ 
      background: colors.background,
      minHeight: '100vh',
      padding: 0 
    }}>
      {/* Enhanced Image Modal */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)} 
        size="xl" 
        centered
        className="image-modal"
      >
        <Modal.Header closeButton style={{ border: 'none', background: colors.primary }}>
          <Modal.Title style={{ color: colors.light, fontWeight: '600' }}>
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

      {/* Modern Header with Your Theme Colors */}
      <div style={{ 
        background: colors.primary, 
        padding: '2rem 0',
        marginBottom: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <Container>
          <button
            onClick={() => navigate(-1)}
            className="hover-shadow"
            style={{
              background: 'rgba(240, 243, 245, 0.15)',
              border: `2px solid ${colors.accent}`,
              color: colors.light,
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
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
        <Row className="g-4">
          {/* Product Images Section */}
          <Col lg={6}>
            <Card 
              className="border-0 shadow hover-shadow"
              style={{ 
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'white',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ position: 'relative', cursor: 'pointer' }}>
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="card-img-hover"
                  style={{
                    width: '100%',
                    height: '400px',
                    objectFit: 'cover'
                  }}
                  onClick={() => openImageModal(selectedImage)}
                />
                
                {/* Status Badges */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {product.condition && (
                    <Badge style={{ 
                      background: colors.secondary,
                      padding: '0.5rem 1rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      border: `2px solid ${colors.light}`
                    }}>
                      {product.condition}
                    </Badge>
                  )}
                  <Badge style={{ 
                    background: isAvailable ? colors.success : colors.error,
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    border: `2px solid ${colors.light}`
                  }}>
                    {isAvailable ? 'Available' : 'Sold'}
                  </Badge>
                </div>

                {/* Favorite Button */}
                <button
                  onClick={toggleFavorite}
                  disabled={updatingFavorite || !user}
                  className="hover-shadow"
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: isFavorite ? colors.error : 'rgba(255, 255, 255, 0.95)',
                    border: `2px solid ${isFavorite ? colors.error : colors.primary}`,
                    fontSize: '1.2rem',
                    color: isFavorite ? 'white' : colors.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: updatingFavorite ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  {updatingFavorite ? '⏳' : (isFavorite ? '❤️' : '🤍')}
                </button>

                {/* Zoom Indicator */}
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  background: 'rgba(25, 83, 95, 0.9)',
                  color: colors.light,
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <i className="fa-solid fa-expand"></i>
                  Click to zoom
                </div>
              </div>

              {/* Image Thumbnails */}
              {product.images && product.images.length > 0 && (
                <div className="p-3" style={{ background: colors.light }}>
                  <h6 style={{ 
                    color: colors.primary, 
                    fontWeight: '600', 
                    marginBottom: '1rem'
                  }}>
                    Product Images ({product.images.length})
                  </h6>
                  <Row className="g-2">
                    {product.images.map((img, index) => (
                      <Col key={index} xs={4} sm={3} md={2}>
                        <div
                          className="hover-shadow"
                          style={{
                            height: '80px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: `3px solid ${img === selectedImage ? colors.accent : 'transparent'}`,
                            transition: 'all 0.3s ease'
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

          {/* Product Info Section */}
          <Col lg={6}>
            <div style={{ padding: '0 0.5rem' }}>
              {/* Product Header */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h1 style={{ 
                    color: colors.primary, 
                    fontWeight: '700',
                    fontSize: '2.25rem',
                    margin: 0,
                    flex: 1
                  }}>
                    {product.name}
                  </h1>
                  <Badge style={{ 
                    background: colors.accent,
                    color: colors.primary,
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    {product.category || 'General'}
                  </Badge>
                </div>
                
                {isInCart && (
                  <div style={{ 
                    color: colors.secondary,
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <i className="fa-solid fa-cart-shopping"></i>
                    Added to Cart
                  </div>
                )}
              </div>

              {/* Pricing Section */}
              <Card className="border-0 mb-4 hover-shadow" style={{ background: `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}15)` }}>
                <Card.Body className="p-3">
                  <div className="d-flex align-items-baseline gap-3 mb-2">
                    <span style={{ 
                      color: colors.secondary,
                      fontSize: '2.25rem',
                      fontWeight: '700',
                    }}>
                      {formatCurrency(product.price)}
                    </span>
                    
                    {product.originalPrice && product.originalPrice > product.price && (
                      <>
                        <span style={{ 
                          color: '#6c757d', 
                          textDecoration: 'line-through', 
                          fontSize: '1.5rem',
                          fontWeight: '500'
                        }}>
                          {formatCurrency(product.originalPrice)}
                        </span>
                        {product.discount && (
                          <Badge style={{ 
                            background: colors.error,
                            color: 'white',
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}>
                            {product.discount}% OFF
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  <p style={{ color: colors.primary, fontWeight: '500', margin: 0, fontSize: '0.9rem' }}>
                    <i className="fa-solid fa-handshake" style={{ marginRight: '0.5rem' }}></i>
                    Price is negotiable - Make an offer!
                  </p>
                </Card.Body>
              </Card>

              {/* Action Buttons */}
              {!isOwner && (
                <Row className="g-3 mb-4">
                  <Col sm={6}>
                    <Button
                      onClick={toggleCart}
                      disabled={!isAvailable || updatingCart}
                      className="w-100 border-0 hover-shadow d-flex align-items-center justify-content-center gap-2"
                      style={{ 
                        background: isInCart ? colors.secondary : colors.primary,
                        padding: '1rem',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        height: '54px'
                      }}
                    >
                      {updatingCart ? (
                        <span className="loading-spinner" style={{ width: '20px', height: '20px' }}></span>
                      ) : isInCart ? (
                        <>
                          <i className="fa-solid fa-check"></i>
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
                      className="w-100 border-0 hover-shadow d-flex align-items-center justify-content-center gap-2"
                      style={{ 
                        background: colors.accent,
                        color: colors.primary,
                        padding: '1rem',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        height: '54px',
                        border: `2px solid ${colors.accent}`
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
                      className="w-100 border-0 hover-shadow d-flex align-items-center justify-content-center gap-2"
                      style={{ 
                        background: colors.success,
                        padding: '1rem',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '1rem',
                        color: 'white',
                        transition: 'all 0.3s ease',
                        height: '54px'
                      }}
                    >
                      {updatingCart ? (
                        <span className="loading-spinner" style={{ width: '20px', height: '20px' }}></span>
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

              {/* User Status */}
              <Card className="border-0 mb-4 hover-shadow" style={{ background: `linear-gradient(135deg, ${colors.secondary}15, ${colors.primary}15)` }}>
                <Card.Body className="p-3 text-center">
                  <p style={{ 
                    color: colors.primary, 
                    margin: 0,
                    fontWeight: '500',
                    fontSize: '0.9rem'
                  }}>
                    {user ? (
                      <>
                        <i className="fa-solid fa-user" style={{ marginRight: '0.5rem' }}></i>
                        Welcome, {user.name}! Ready to make this yours?
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-lock" style={{ marginRight: '0.5rem' }}></i>
                        Please login to use all features
                      </>
                    )}
                  </p>
                </Card.Body>
              </Card>

              {/* Owner Message */}
              {isOwner && (
                <Card className="border-0 mb-4 hover-shadow" style={{ background: `linear-gradient(135deg, ${colors.accent}25, ${colors.primary}15)`, border: `2px solid ${colors.accent}` }}>
                  <Card.Body className="p-3 text-center">
                    <p style={{ 
                      color: colors.primary, 
                      margin: 0,
                      fontWeight: '600',
                      fontSize: '0.9rem'
                    }}>
                      <i className="fa-solid fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
                      This is your own listing - Manage it from your profile
                    </p>
                  </Card.Body>
                </Card>
              )}

              {/* Offer Card */}
              {showOfferCard && !isOwner && (
                <Card className="border-0 shadow mb-4 hover-shadow" style={{ border: `2px solid ${colors.accent}` }}>
                  <Card.Body className="p-3">
                    <div className="text-center mb-3">
                      <h6 style={{ 
                        color: colors.primary, 
                        fontWeight: '600', 
                        margin: 0
                      }}>
                        {userOffer ? 'Update Your Offer' : 'Make Your Offer'}
                      </h6>
                    </div>
                    
                    {userOffer && (
                      <Card className="border-0 mb-3" style={{ background: 'rgba(25, 83, 95, 0.1)' }}>
                        <Card.Body className="p-2 text-center">
                          <p style={{ color: colors.primary, fontWeight: '600', margin: 0, fontSize: '0.9rem' }}>
                            Current offer: <span style={{ color: colors.secondary, fontSize: '1.1rem' }}>{formatCurrency(getOfferAmount(userOffer))}</span>
                          </p>
                        </Card.Body>
                      </Card>
                    )}
                    
                    <div className="mb-3">
                      <label style={{ 
                        color: colors.primary, 
                        fontWeight: '600', 
                        marginBottom: '0.5rem', 
                        display: 'block',
                        fontSize: '0.9rem'
                      }}>
                        Offer Amount
                      </label>
                      <input
                        type="number"
                        placeholder={userOffer ? "Enter new offer amount..." : "Enter your offer amount..."}
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `2px solid ${colors.accent}`,
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          color: colors.primary,
                          background: 'white'
                        }}
                        step="0.01"
                      />
                    </div>
                    
                    <Card className="border-0 mb-3" style={{ background: 'rgba(215, 201, 170, 0.2)' }}>
                      <Card.Body className="p-2">
                        <p style={{ color: colors.primary, fontSize: '0.8rem', margin: 0, fontWeight: '500' }}>
                          <i className="fa-solid fa-lightbulb" style={{ marginRight: '0.5rem' }}></i>
                          This is bargaining - offer any amount you think is fair! The seller will review your offer.
                        </p>
                      </Card.Body>
                    </Card>
                    
                    <div className="d-flex gap-2">
                      <Button
                        onClick={() => setShowOfferCard(false)}
                        className="hover-shadow"
                        style={{
                          flex: 1,
                          background: 'transparent',
                          border: `2px solid ${colors.primary}`,
                          color: colors.primary,
                          padding: '0.75rem',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePlaceOffer}
                        disabled={placingOffer || !offerAmount}
                        className="hover-shadow"
                        style={{
                          flex: 1,
                          background: colors.primary,
                          border: 'none',
                          color: 'white',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}
                      >
                        {placingOffer ? (
                          <span className="loading-spinner" style={{ width: '16px', height: '16px' }}></span>
                        ) : userOffer ? (
                          'Update Offer'
                        ) : (
                          'Submit Offer'
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* User's Current Offer */}
              {userOffer && !isOwner && !showOfferCard && (
                <Card className="border-0 shadow mb-4 hover-shadow" 
                  style={{ 
                    background: getOfferStatus(userOffer) === 'accepted' ? 
                      'rgba(72, 187, 120, 0.1)' :
                      getOfferStatus(userOffer) === 'rejected' ? 
                      'rgba(245, 101, 101, 0.1)' :
                      'rgba(11, 122, 117, 0.1)',
                    border: `2px solid ${
                      getOfferStatus(userOffer) === 'accepted' ? colors.success :
                      getOfferStatus(userOffer) === 'rejected' ? colors.error : colors.primary
                    }`
                  }}
                >
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 style={{ 
                          color: getOfferStatus(userOffer) === 'accepted' ? colors.success :
                                 getOfferStatus(userOffer) === 'rejected' ? colors.error : colors.primary,
                          fontWeight: '600',
                          margin: 0,
                          fontSize: '0.9rem'
                        }}>
                          {getOfferStatus(userOffer) === 'accepted' ? (
                            <>
                              <i className="fa-solid fa-check-circle" style={{ marginRight: '0.5rem' }}></i>
                              Offer Accepted!
                            </>
                          ) : getOfferStatus(userOffer) === 'rejected' ? (
                            <>
                              <i className="fa-solid fa-times-circle" style={{ marginRight: '0.5rem' }}></i>
                              Offer Declined
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-clock" style={{ marginRight: '0.5rem' }}></i>
                              Your Current Offer
                            </>
                          )}
                        </h6>
                        <p style={{ 
                          color: colors.dark,
                          fontWeight: '600',
                          margin: '0.25rem 0 0 0',
                          fontSize: '1rem'
                        }}>
                          {formatCurrency(getOfferAmount(userOffer))}
                        </p>
                        <small style={{ 
                          color: colors.dark,
                          opacity: 0.7,
                          fontSize: '0.8rem'
                        }}>
                          {getOfferStatus(userOffer) === 'pending' ? 'Waiting for seller response' :
                           getOfferStatus(userOffer) === 'accepted' ? 'Congratulations! Proceed to checkout' :
                           'Seller declined your offer'}
                        </small>
                      </div>
                      <Button
                        onClick={handleOfferButtonClick}
                        disabled={getOfferStatus(userOffer) === 'accepted' || getOfferStatus(userOffer) === 'rejected' || !isAvailable}
                        className="hover-shadow"
                        style={{
                          background: colors.primary,
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.5rem 1rem',
                          fontSize: '0.8rem',
                          fontWeight: '600'
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
        <Row className="mt-4">
          <Col lg={10} className="mx-auto">
            <Card className="border-0 shadow hover-shadow">
              <Card.Body className="p-4">
                <h3 className="text-center mb-4" style={{ 
                  color: colors.primary, 
                  fontWeight: '700'
                }}>
                  Product Details
                </h3>

                <Accordion defaultActiveKey="0">
                  {/* Description */}
                  <Accordion.Item eventKey="0">
                    <Accordion.Header style={{ fontWeight: '600', color: colors.primary }}>
                      <i className="fa-solid fa-file-lines" style={{ marginRight: '0.5rem' }}></i>
                      Product Description
                    </Accordion.Header>
                    <Accordion.Body style={{ background: '#d7c9aa37' }}>
                      <p style={{ lineHeight: '1.6', margin: 0, color: colors.dark }}>
                        {product.description || "No description provided."}
                      </p>
                      {renderProductDetails()}
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* Owner Information */}
                  <Accordion.Item eventKey="1">
                    <Accordion.Header style={{ fontWeight: '600', color: colors.primary }}>
                      <i className="fa-solid fa-user" style={{ marginRight: '0.5rem' }}></i>
                      Seller Information
                    </Accordion.Header>
                    <Accordion.Body style={{ background: '#d7c9aa37' }}>
                      <Row>
                        <Col md={6}>
                          <div style={{ marginBottom: '1rem' }}>
                            <strong style={{ color: colors.primary }}>Name:</strong>
                            <div style={{ color: colors.dark, fontWeight: '500' }}>{sellerInfo.name}</div>
                          </div>
                          <div style={{ marginBottom: '1rem' }}>
                            <strong style={{ color: colors.primary }}>Location:</strong>
                            <div style={{ color: colors.dark, fontWeight: '500' }}>{sellerInfo.location}</div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div style={{ marginBottom: '1rem' }}>
                            <strong style={{ color: colors.primary }}>Rating:</strong>
                            <div style={{ color: colors.dark, fontWeight: '500' }}>
                              <i className="fa-solid fa-star" style={{ color: colors.accent, marginRight: '0.25rem' }}></i>
                              {sellerInfo.rating}
                            </div>
                          </div>
                          <div style={{ marginBottom: '1rem' }}>
                            <strong style={{ color: colors.primary }}>Completed Sales:</strong>
                            <div style={{ color: colors.dark, fontWeight: '500' }}>{sellerInfo.sales}</div>
                          </div>
                        </Col>
                      </Row>
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* Offers (for owner) */}
                  {isOwner && currentOffers.length > 0 && (
                    <Accordion.Item eventKey="2">
                      <Accordion.Header style={{ fontWeight: '600', color: colors.primary }}>
                        <i className="fa-solid fa-hand-holding-dollar" style={{ marginRight: '0.5rem' }}></i>
                        Received Offers ({currentOffers.length})
                      </Accordion.Header>
                      <Accordion.Body style={{ background: '#d7c9aa37' }}>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {currentOffers
                            .sort((a, b) => getOfferAmount(b) - getOfferAmount(a))
                            .map((offer, index) => (
                              <Card 
                                key={offer.bidId || `offer-${index}`}
                                className="mb-2 border-0 hover-shadow"
                                style={{ 
                                  background: 'white'
                                }}
                              >
                                <Card.Body className="p-2">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <h6 style={{ color: colors.primary, margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>
                                        <i className="fa-solid fa-user" style={{ marginRight: '0.5rem' }}></i>
                                        {offer.bidderName || "Unknown User"}
                                      </h6>
                                      <small style={{ color: colors.dark, fontSize: '0.8rem' }}>
                                        <i className="fa-solid fa-calendar" style={{ marginRight: '0.25rem' }}></i>
                                        {formatDate(offer.date)}
                                      </small>
                                    </div>
                                    <div className="text-end">
                                      <div style={{ 
                                        color: colors.secondary,
                                        fontSize: '1rem',
                                        fontWeight: '700'
                                      }}>
                                        {formatCurrency(getOfferAmount(offer))}
                                      </div>
                                      <small style={{ 
                                        color: getOfferStatus(offer) === 'accepted' ? colors.success :
                                               getOfferStatus(offer) === 'rejected' ? colors.error : colors.accent,
                                        fontWeight: '600',
                                        fontSize: '0.8rem'
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

      {/* Modern Footer */}
      <div style={{ 
        background: colors.primary,
        padding: '3rem 0',
        marginTop: '4rem',
        color: colors.light,
        textAlign: 'center'
      }}>
        <Container>
          <h5 style={{ fontWeight: '700', marginBottom: '1rem' }}>
            Ready to make this item yours?
          </h5>
          <p style={{ marginBottom: '2rem', opacity: 0.9 }}>
            Join thousands of happy customers who found their perfect match on Thriftify!
          </p>
          <Button
            onClick={() => navigate('/categories')}
            className="hover-shadow"
            style={{
              background: colors.accent,
              border: 'none',
              color: colors.primary,
              padding: '0.875rem 2rem',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            <i className="fa-solid fa-bag-shopping" style={{ marginRight: '0.5rem' }}></i>
            Continue Shopping
          </Button>
        </Container>
      </div>
    </Container>
  );
};

export default ProductPage;