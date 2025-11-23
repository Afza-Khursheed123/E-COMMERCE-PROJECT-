import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Loader from "../components/Loader";
import { Container, Row, Col, Card, Button, Accordion, Modal } from 'react-bootstrap';

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

  // Theme colors matching your home page exactly
  const colors = {
    primary: "#19535F",
    secondary: "#0B7A75", 
    accent: "#D7C9AA",
    light: "#F0F3F5",
    dark: "#1a1a1a",
    badge: "#19535F",
    bg: "#19535F",
    text: "#F0F3F5"
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
        <h4 style={{ color: colors.primary, fontWeight: '600', marginBottom: '1rem' }}>Product Specifications</h4>
        <Row>
          {detailEntries.map(([key, value]) => (
            <Col key={key} xs={6} md={4} className="mb-3">
              <div style={{ 
                background: 'rgba(215, 201, 170, 0.1)', 
                padding: '0.75rem', 
                borderRadius: '8px',
                border: `1px solid ${colors.accent}20`
              }}>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: colors.primary, 
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  marginBottom: '0.25rem'
                }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div style={{ fontSize: '0.9rem', color: colors.dark, fontWeight: '500' }}>
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
      background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
      minHeight: '100vh',
      padding: 0 
    }}>
      {/* Image Modal for Enhanced Viewing */}
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
        <Modal.Body className="text-center p-0">
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

      {/* Enhanced Header with Back Button - Matching Home Theme */}
      <div style={{ 
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`, 
        padding: '1.5rem 0',
        marginBottom: '3rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <Container>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.3)',
              color: colors.light,
              padding: '0.75rem 1.5rem',
              borderRadius: '30px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backdropFilter: 'blur(10px)',
              fontSize: '1rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.25)';
              e.target.style.transform = 'translateX(-5px)';
              e.target.style.borderColor = colors.accent;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.15)';
              e.target.style.transform = 'translateX(0)';
              e.target.style.borderColor = 'rgba(255,255,255,0.3)';
            }}
          >
            <i className="fa-solid fa-arrow-left"></i>
            Back to Browse
          </button>
        </Container>
      </div>

      <Container>
        <Row className="g-5">
          {/* Enhanced Product Images Section - Matching Home Design */}
          <Col lg={6}>
            <Card 
              className="border-0 shadow-lg"
              style={{ 
                borderRadius: '25px',
                overflow: 'hidden',
                background: 'white',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ position: 'relative', cursor: 'pointer' }}>
                <img
                  src={selectedImage}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '500px',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                  }}
                  onClick={() => openImageModal(selectedImage)}
                />
                
                {/* Click to Zoom Indicator */}
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '20px',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '25px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <i className="fa-solid fa-expand"></i>
                  Click to zoom
                </div>
                
                {/* Condition Badge - Matching Home Style */}
                {product.condition && (
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: colors.secondary,
                    color: 'white',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '25px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    textTransform: 'capitalize',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                    border: `2px solid white`
                  }}>
                    {product.condition}
                  </div>
                )}

                {/* Availability Badge */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: isAvailable ? '#28a745' : '#dc3545',
                  color: 'white',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '25px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                  border: `2px solid white`
                }}>
                  {isAvailable ? 'Available' : 'Sold'}
                </div>

                {/* Favorite Button - Enhanced */}
                <button
                  onClick={toggleFavorite}
                  disabled={updatingFavorite || !user}
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    width: '55px',
                    height: '55px',
                    borderRadius: '50%',
                    background: isFavorite ? 'rgba(220, 53, 69, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    border: `3px solid ${isFavorite ? '#dc3545' : colors.primary}`,
                    fontSize: '1.4rem',
                    color: isFavorite ? 'white' : colors.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: updatingFavorite ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    transform: 'scale(1)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={(e) => {
                    if (!updatingFavorite) {
                      e.target.style.transform = 'scale(1.15)';
                      e.target.style.background = isFavorite ? 'rgba(220, 53, 69, 1)' : 'rgba(255, 255, 255, 1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!updatingFavorite) {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.background = isFavorite ? 'rgba(220, 53, 69, 0.95)' : 'rgba(255, 255, 255, 0.95)';
                    }
                  }}
                  title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {updatingFavorite ? '⏳' : (isFavorite ? '❤️' : '🤍')}
                </button>
              </div>

              {/* Enhanced Image Thumbnails */}
              {product.images && product.images.length > 0 && (
                <div className="p-4" style={{ background: 'rgba(240, 243, 245, 0.5)' }}>
                  <h6 style={{ 
                    color: colors.primary, 
                    fontWeight: '700', 
                    marginBottom: '1rem',
                    fontSize: '1.1rem'
                  }}>
                    Product Images ({product.images.length})
                  </h6>
                  <Row className="g-3">
                    {product.images.map((img, index) => (
                      <Col key={index} xs={4} sm={3} md={2}>
                        <div
                          style={{
                            height: '90px',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: `4px solid ${img === selectedImage ? colors.accent : 'transparent'}`,
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.08)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                          }}
                          onClick={() => {
                            setSelectedImage(img);
                            openImageModal(img);
                          }}
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
                          {/* Zoom icon overlay on hover */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(25, 83, 95, 0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                            color: 'white',
                            fontSize: '1.5rem'
                          }}
                          className="zoom-overlay"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '0';
                          }}
                          >
                            <i className="fa-solid fa-expand"></i>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </Card>
          </Col>

          {/* Enhanced Product Info Section - Matching Home Design */}
          <Col lg={6}>
            <div style={{ padding: '0 1rem' }}>
              {/* Product Header - Matching Home Typography */}
              <div className="mb-4">
                <h1 style={{ 
                  color: colors.primary, 
                  fontWeight: '700',
                  fontSize: '2.5rem',
                  marginBottom: '0.75rem',
                  lineHeight: '1.2',
                  position: 'relative'
                }}>
                  {product.name}
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '-10px', 
                    left: '0', 
                    width: '80px', 
                    height: '4px', 
                    background: 'linear-gradient(90deg, #0B7A75, #D7C9AA)',
                    borderRadius: '2px'
                  }}></div>
                </h1>
                
                <div className="d-flex align-items-center gap-3 mb-4 mt-4">
                  <span style={{ 
                    background: colors.accent,
                    color: colors.primary,
                    padding: '0.5rem 1.25rem',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    textTransform: 'capitalize',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}>
                    {product.category || 'General'}
                  </span>
                  
                  {/* Cart Status Indicator */}
                  <div style={{ 
                    background: isInCart ? colors.secondary : 'transparent',
                    color: isInCart ? 'white' : colors.primary,
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    border: `2px solid ${isInCart ? colors.secondary : colors.primary}`,
                    transition: 'all 0.3s ease'
                  }}>
                    {isInCart ? '🛒 In Cart' : 'Add to Cart'}
                  </div>
                </div>
              </div>

              {/* Enhanced Pricing Section - Matching Home Style */}
              <div className="mb-4 p-4" style={{ 
                background: 'linear-gradient(135deg, rgba(25, 83, 95, 0.05) 0%, rgba(11, 122, 117, 0.05) 100%)',
                borderRadius: '20px',
                border: `2px solid ${colors.accent}30`
              }}>
                <div className="d-flex align-items-baseline gap-3 mb-2">
                  <span style={{ 
                    color: colors.secondary,
                    fontSize: '2.5rem',
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
                        fontWeight: '600'
                      }}>
                        {formatCurrency(product.originalPrice)}
                      </span>
                      {product.discount && (
                        <span style={{ 
                          color: '#dc3545',
                          background: '#ffe6e6',
                          padding: '0.4rem 0.9rem',
                          borderRadius: '20px',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          border: '2px solid #dc3545'
                        }}>
                          {product.discount}% OFF
                        </span>
                      )}
                    </>
                  )}
                </div>
                <p style={{ color: colors.primary, fontWeight: '600', margin: 0, fontSize: '1rem' }}>
                  💰 Price is negotiable - Make an offer!
                </p>
              </div>

              {/* Enhanced Action Buttons - Matching Home Style */}
              {!isOwner && (
                <Row className="g-3 mb-4">
                  <Col sm={4}>
                    <Button
                      onClick={toggleCart}
                      disabled={!isAvailable || updatingCart}
                      className="w-100 border-0 d-flex align-items-center justify-content-center gap-2"
                      style={{ 
                        background: isInCart ? colors.secondary : colors.primary,
                        padding: '1rem',
                        borderRadius: '16px',
                        fontWeight: '600',
                        fontSize: '1rem',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        height: '55px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-8px)';
                        e.target.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                      }}
                    >
                      {updatingCart ? (
                        <span>⏳ Updating...</span>
                      ) : isInCart ? (
                        <span>✅ In Cart</span>
                      ) : (
                        <span>🛒 Add to Cart</span>
                      )}
                    </Button>
                  </Col>
                  
                  <Col sm={4}>
                    <Button
                      onClick={handleOfferButtonClick}
                      disabled={!isAvailable || placingOffer || 
                               (userOffer && (getOfferStatus(userOffer) === 'accepted' || getOfferStatus(userOffer) === 'rejected'))}
                      className="w-100 border-0 d-flex align-items-center justify-content-center gap-2"
                      style={{ 
                        background: colors.accent,
                        color: colors.primary,
                        padding: '1rem',
                        borderRadius: '16px',
                        fontWeight: '600',
                        fontSize: '1rem',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        height: '55px',
                        border: `2px solid ${colors.accent}`
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-8px)';
                        e.target.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
                        e.target.style.background = colors.primary;
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                        e.target.style.background = colors.accent;
                        e.target.style.color = colors.primary;
                      }}
                    >
                      {!isAvailable ? "❌ Sold" :
                       userOffer && getOfferStatus(userOffer) === 'accepted' ? "✅ Accepted" :
                       userOffer && getOfferStatus(userOffer) === 'rejected' ? "❌ Closed" :
                       userOffer ? "✏️ Update Offer" : "💰 Make Offer"}
                    </Button>
                  </Col>

                  {/* BUY NOW BUTTON */}
                  <Col sm={4}>
                    <Button
                      onClick={handleBuyNow}
                      disabled={!isAvailable || updatingCart}
                      className="w-100 border-0 d-flex align-items-center justify-content-center gap-2"
                      style={{ 
                        background: '#28a745',
                        padding: '1rem',
                        borderRadius: '16px',
                        fontWeight: '600',
                        fontSize: '1rem',
                        color: 'white',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        height: '55px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-8px)';
                        e.target.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
                        e.target.style.background = '#218838';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                        e.target.style.background = '#28a745';
                      }}
                    >
                      {updatingCart ? "⏳ Processing..." : "🛍️ Buy Now"}
                    </Button>
                  </Col>
                </Row>
              )}

              {/* Enhanced User Status */}
              <div style={{ 
                background: `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}15)`,
                padding: '1.25rem',
                borderRadius: '15px',
                marginBottom: '2rem',
                border: `2px solid ${colors.accent}30`,
                textAlign: 'center'
              }}>
                <p style={{ 
                  color: colors.primary, 
                  margin: 0,
                  fontWeight: '600',
                  fontSize: '1rem'
                }}>
                  {user ? `👋 Welcome, ${user.name}! Ready to make this yours?` : "🔒 Please login to use all features"}
                </p>
              </div>

              {/* Enhanced Owner Message */}
              {isOwner && (
                <div style={{ 
                  background: `linear-gradient(135deg, ${colors.accent}20, ${colors.primary}10)`,
                  border: `3px solid ${colors.accent}`,
                  padding: '1.5rem',
                  borderRadius: '15px',
                  marginBottom: '2rem',
                  textAlign: 'center'
                }}>
                  <p style={{ 
                    color: colors.primary, 
                    margin: 0,
                    fontWeight: '700',
                    fontSize: '1rem'
                  }}>
                    ⚠️ This is your own listing - Manage it from your profile
                  </p>
                </div>
              )}

              {/* Enhanced Offer Card */}
              {showOfferCard && !isOwner && (
                <Card 
                  className="border-0 shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.accent}15, ${colors.primary}10)`,
                    borderRadius: '20px',
                    marginBottom: '2rem',
                    border: `3px solid ${colors.accent}`,
                    overflow: 'hidden'
                  }}
                >
                  <Card.Body className="p-4">
                    <div className="text-center mb-4">
                      <h5 style={{ 
                        color: colors.primary, 
                        fontWeight: '700', 
                        marginBottom: '0.5rem',
                        fontSize: '1.3rem'
                      }}>
                        {userOffer ? 'Update Your Offer' : 'Make Your Offer'}
                      </h5>
                      <p style={{ color: colors.primary, fontWeight: '600', fontSize: '1rem' }}>
                        💰 Bargain for the best price!
                      </p>
                    </div>
                    
                    {userOffer && (
                      <div style={{ 
                        background: 'rgba(25, 83, 95, 0.1)',
                        padding: '1rem',
                        borderRadius: '15px',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                      }}>
                        <p style={{ color: colors.primary, fontWeight: '600', margin: 0, fontSize: '1rem' }}>
                          Current offer: <span style={{ color: colors.secondary, fontSize: '1.2rem' }}>{formatCurrency(getOfferAmount(userOffer))}</span>
                        </p>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <label style={{ 
                        color: colors.primary, 
                        fontWeight: '600', 
                        marginBottom: '0.75rem', 
                        display: 'block',
                        fontSize: '1rem'
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
                          padding: '1rem',
                          border: `2px solid ${colors.accent}`,
                          borderRadius: '12px',
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: colors.primary,
                          background: 'rgba(255,255,255,0.8)',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.background = 'white';
                          e.target.style.boxShadow = `0 0 0 3px ${colors.accent}50`;
                        }}
                        onBlur={(e) => {
                          e.target.style.background = 'rgba(255,255,255,0.8)';
                          e.target.style.boxShadow = 'none';
                        }}
                        step="0.01"
                      />
                    </div>
                    
                    <div style={{ 
                      background: 'rgba(215, 201, 170, 0.2)',
                      padding: '1rem',
                      borderRadius: '12px',
                      marginBottom: '1.5rem'
                    }}>
                      <p style={{ color: colors.primary, fontSize: '0.9rem', margin: 0, fontWeight: '600' }}>
                        💡 This is bargaining - offer any amount you think is fair! The seller will review your offer.
                      </p>
                    </div>
                    
                    <div className="d-flex gap-3">
                      <Button
                        onClick={() => setShowOfferCard(false)}
                        style={{
                          flex: 1,
                          background: 'transparent',
                          border: `2px solid ${colors.primary}`,
                          color: colors.primary,
                          padding: '0.9rem',
                          borderRadius: '12px',
                          fontWeight: '600',
                          transition: 'all 0.3s ease',
                          fontSize: '0.9rem'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = colors.primary;
                          e.target.style.color = 'white';
                          e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.color = colors.primary;
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePlaceOffer}
                        disabled={placingOffer || !offerAmount}
                        style={{
                          flex: 1,
                          background: colors.primary,
                          border: 'none',
                          color: 'white',
                          padding: '0.9rem',
                          borderRadius: '12px',
                          fontWeight: '600',
                          transition: 'all 0.3s ease',
                          fontSize: '0.9rem'
                        }}
                        onMouseEnter={(e) => {
                          if (!placingOffer) {
                            e.target.style.background = colors.secondary;
                            e.target.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!placingOffer) {
                            e.target.style.background = colors.primary;
                            e.target.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        {placingOffer ? "⏳ Submitting..." : (userOffer ? "✏️ Update Offer" : "💰 Submit Offer")}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* Enhanced User's Current Offer */}
              {userOffer && !isOwner && !showOfferCard && (
                <Card 
                  className="border-0 shadow-lg mb-4"
                  style={{ 
                    background: getOfferStatus(userOffer) === 'accepted' ? 
                      'linear-gradient(135deg, #d4edda, #c3e6cb)' :
                      getOfferStatus(userOffer) === 'rejected' ? 
                      'linear-gradient(135deg, #f8d7da, #f5c6cb)' :
                      'linear-gradient(135deg, #cce7ff, #b3d9ff)',
                    borderRadius: '16px',
                    border: `2px solid ${
                      getOfferStatus(userOffer) === 'accepted' ? '#28a745' :
                      getOfferStatus(userOffer) === 'rejected' ? '#dc3545' : colors.primary
                    }`,
                    overflow: 'hidden'
                  }}
                >
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 style={{ 
                          color: getOfferStatus(userOffer) === 'accepted' ? '#155724' :
                                 getOfferStatus(userOffer) === 'rejected' ? '#721c24' : colors.primary,
                          fontWeight: '700',
                          margin: 0,
                          fontSize: '1rem'
                        }}>
                          {getOfferStatus(userOffer) === 'accepted' ? '🎉 Offer Accepted!' : 
                           getOfferStatus(userOffer) === 'rejected' ? '❌ Offer Declined' : 
                           '💰 Your Current Offer'}
                        </h6>
                        <p style={{ 
                          color: getOfferStatus(userOffer) === 'accepted' ? '#155724' :
                                 getOfferStatus(userOffer) === 'rejected' ? '#721c24' : colors.primary,
                          fontWeight: '700',
                          margin: '0.25rem 0 0 0',
                          fontSize: '1.1rem'
                        }}>
                          {formatCurrency(getOfferAmount(userOffer))}
                        </p>
                        <small style={{ 
                          color: getOfferStatus(userOffer) === 'accepted' ? '#155724' :
                                 getOfferStatus(userOffer) === 'rejected' ? '#721c24' : colors.primary,
                          opacity: 0.8,
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
                        style={{
                          background: colors.primary,
                          border: 'none',
                          borderRadius: '12px',
                          padding: '0.6rem 1.2rem',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!e.target.disabled) {
                            e.target.style.background = colors.secondary;
                            e.target.style.transform = 'scale(1.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!e.target.disabled) {
                            e.target.style.background = colors.primary;
                            e.target.style.transform = 'scale(1)';
                          }
                        }}
                      >
                        {getOfferStatus(userOffer) === 'accepted' ? '✅ Accepted' :
                         getOfferStatus(userOffer) === 'rejected' ? '❌ Closed' : 'Update'}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </div>
          </Col>
        </Row>

        {/* Enhanced Additional Information Accordion - Matching FAQ Style */}
        <Row className="mt-5">
          <Col lg={10} className="mx-auto">
            <h2 className="text-center mb-4" style={{ 
              color: colors.primary, 
              fontWeight: '700',
              fontSize: '2.5rem',
              position: 'relative'
            }}>
              Product Details
              <div style={{ 
                position: 'absolute', 
                bottom: '-10px', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                width: '80px', 
                height: '4px', 
                background: 'linear-gradient(90deg, #0B7A75, #D7C9AA)',
                borderRadius: '2px'
              }}></div>
            </h2>

            <Accordion defaultActiveKey="0" style={{ marginBottom: '3rem' }}>
              {/* Description */}
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  Product Description
                </Accordion.Header>
                <Accordion.Body>
                  <p style={{ lineHeight: '1.6', margin: 0, fontSize: '1rem' }}>
                    {product.description || "No description provided."}
                  </p>
                  {renderProductDetails()}
                </Accordion.Body>
              </Accordion.Item>

              {/* Owner Information */}
              <Accordion.Item eventKey="1">
                <Accordion.Header>
                  Seller Information
                </Accordion.Header>
                <Accordion.Body>
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
                        <div style={{ color: colors.dark, fontWeight: '500' }}>⭐ {sellerInfo.rating}</div>
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
                  <Accordion.Header>
                    Received Offers ({currentOffers.length})
                  </Accordion.Header>
                  <Accordion.Body>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {currentOffers
                        .sort((a, b) => getOfferAmount(b) - getOfferAmount(a))
                        .map((offer, index) => (
                          <Card 
                            key={offer.bidId || `offer-${index}`}
                            className="mb-3 border-0 shadow-sm"
                            style={{ 
                              background: 'white',
                              borderRadius: '10px'
                            }}
                          >
                            <Card.Body className="p-3">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <h6 style={{ color: colors.primary, margin: 0, fontWeight: '600' }}>
                                    {offer.bidderName || "Unknown User"}
                                  </h6>
                                  <small style={{ color: colors.dark }}>
                                    {formatDate(offer.date)}
                                  </small>
                                </div>
                                <div className="text-end">
                                  <div style={{ 
                                    color: colors.secondary,
                                    fontSize: '1.1rem',
                                    fontWeight: '700'
                                  }}>
                                    {formatCurrency(getOfferAmount(offer))}
                                  </div>
                                  <small style={{ 
                                    color: getOfferStatus(offer) === 'accepted' ? '#28a745' :
                                           getOfferStatus(offer) === 'rejected' ? '#dc3545' : '#ffc107',
                                    fontWeight: '600'
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
          </Col>
        </Row>
      </Container>

      {/* Enhanced Footer Section */}
      <div style={{ 
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        padding: '3rem 0',
        marginTop: '4rem',
        color: colors.light,
        textAlign: 'center'
      }}>
        <Container>
          <h5 style={{ fontWeight: '700', marginBottom: '1rem', fontSize: '1.5rem' }}>
            Ready to make this item yours?
          </h5>
          <p style={{ marginBottom: '2rem', opacity: 0.9, fontSize: '1.1rem' }}>
            Join thousands of happy customers who found their perfect match on Thriftify!
          </p>
          <Button
            onClick={() => navigate('/categories')}
            style={{
              background: colors.accent,
              border: 'none',
              color: colors.primary,
              padding: '1rem 2.5rem',
              borderRadius: '25px',
              fontWeight: '700',
              fontSize: '1.1rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Continue Shopping
          </Button>
        </Container>
      </div>
    </Container>
  );
};

export default ProductPage;