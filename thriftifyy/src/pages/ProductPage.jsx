import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Loader from "../components/Loader";
import ErrorNotification from "../components/ErrorNotification";
import { Container, Row, Col, Card, Button, Accordion, Modal, Badge } from 'react-bootstrap';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showBidCard, setShowBidCard] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [userBid, setUserBid] = useState(null);
  const [placingBid, setPlacingBid] = useState(false);
  
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
  // Seller info fallback (fetch if product doesn't include populated user)
  const [seller, setSeller] = useState(null);
  // Error notification state
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // ✅ NEW: Accept bid state
  const [acceptingBid, setAcceptingBid] = useState(false);
  const [invalidProductId, setInvalidProductId] = useState(false);
  const [bidStatusNotificationShown, setBidStatusNotificationShown] = useState(false);  // ✅ Track if notification shown

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
      // ✅ VALIDATION: Check if product ID is valid first
      if (!id || id.trim() === "") {
        console.warn("⚠️ Invalid product ID:", id);
        setInvalidProductId(true);
        setLoading(false);
        return;
      }

      setInvalidProductId(false);
      setLoading(true);
      const userId = user?._id || user?.id;
      const userIdString = String(userId);

      // ✅ Add cache-buster timestamp to force fresh data
      const timestamp = new Date().getTime();
      const query = userId ? `?userId=${encodeURIComponent(userIdString)}&t=${timestamp}` : `?t=${timestamp}`;
      
      console.log(`🔄 Fetching product ${id} for user ${userId || 'guest'} at ${new Date().toLocaleTimeString()}`);
      const productRes = await api.get(`/products/${id}${query}`);
      const productData = productRes.data;
      
      console.log("✅ Product Data Received:", {
        id: productData._id,
        available: productData.isAvailable,
        acceptedBid: productData.acceptedBid,
        activeBids: productData.activeBids?.length || 0,
        userIdCompare: userIdString
      });
      
      setProduct(productData);
      // If backend didn't populate the `user` object, try fetching seller by id
      const sellerId = productData.user?._id || productData.userId || productData.sellerId;
      if (productData.user) {
        setSeller(productData.user);
      } else if (sellerId) {
        try {
          const sellerRes = await api.get(`/users/${sellerId}`);
          // backend may return seller in .data or .data.user
          const sellerData = sellerRes.data?.user || sellerRes.data;
          setSeller(sellerData);
        } catch (e) {
          console.warn('Could not fetch seller info:', e);
          setSeller(null);
        }
      }
      
      // Set initial selected image
      const initialImage = productData.images?.[0] || "/placeholder.jpg";
      setSelectedImage(initialImage);

      // ✅ FIX: Properly set userBid from activeBids - check if user is owner
      // ✅ CRITICAL: Ensure string comparison - bidderId is string from DB
      const userBids = productData.activeBids || [];
      console.log(`🔍 Searching for bid with bidderId: ${userIdString} in ${userBids.length} bids:`, userBids.map(b => ({ bidderId: b.bidderId, bidStatus: b.bidStatus, amount: b.amount })));
      
      const currentUserBid = userBids.find(bid => 
        String(bid.bidderId) === userIdString
      );
      
      console.log(`🎯 Found user's bid:`, currentUserBid || "NOT FOUND");
      
      // Only set userBid if the user is NOT the owner (owners don't have their own bids)
      const isOwner = userIdString === String(productData.userId);
      if (!isOwner) {
        // ✅ Use API data if available
        if (currentUserBid) {
          setUserBid(currentUserBid);
          // Update localStorage with fresh API data
          localStorage.setItem(`bid_${id}`, JSON.stringify(currentUserBid));
          console.log(`✅ Set userBid from API:`, `${currentUserBid.bidStatus} - ${currentUserBid.amount || currentUserBid.bidAmount}`);
        } else {
          // ✅ FALLBACK: If API doesn't return bid, try localStorage
          const storedBid = localStorage.getItem(`bid_${id}`);
          if (storedBid) {
            try {
              const parsedBid = JSON.parse(storedBid);
              setUserBid(parsedBid);
              console.log(`✅ Set userBid from localStorage (fallback):`, `${parsedBid.bidStatus} - ${parsedBid.amount || parsedBid.bidAmount}`);
            } catch (e) {
              setUserBid(null);
              localStorage.removeItem(`bid_${id}`);
              console.log(`⚠️ Invalid localStorage bid data, cleared`);
            }
          } else {
            setUserBid(null);
            console.log(`ℹ️ No bid found in API or localStorage`);
          }
        }
      } else {
        setUserBid(null); // Owners don't have personal bids on their own products
        console.log(`👑 User is owner - not showing bid`);
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

      // ✅ REMOVED: Don't use localStorage as fallback - always use fresh API data
      // This ensures bid status is always current (including when rejected)
    } catch (err) {
      console.error("Product fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // ✅ Reset notification tracker when product or user changes
  useEffect(() => {
    setBidStatusNotificationShown(false);
  }, [id, user?._id]);

  // ✅ NEW: Show bid status notification when bid status changes (accepted or rejected)
  useEffect(() => {
    if (userBid && !bidStatusNotificationShown) {
      // Check if user is the owner
      const currentUserId = user?._id || user?.id;
      const isOwnerCheck = currentUserId && product && String(currentUserId) === String(product.userId);
      
      if (isOwnerCheck) {
        return;  // Don't show notification for product owners
      }
      
      // Determine bid status
      const bidStatus = userBid.bidStatus || userBid.status || "pending";
      
      // Get bid amount for message
      const bidAmount = userBid.amount || userBid.bidAmount || 0;
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(bidAmount);
      
      if (bidStatus === 'rejected') {
        setError(null);
        setSuccess(`😢 Your bid of ${formattedAmount} on this product was declined by the seller. Better luck next time!`);
        setBidStatusNotificationShown(true);
        // ✅ CRITICAL: Refetch product to ensure the rejection card updates properly
        console.log(`🔄 Rejection detected - refetching product to update UI`);
        fetchProduct();
        // Auto-clear after 6 seconds
        const timer = setTimeout(() => setSuccess(null), 6000);
        return () => clearTimeout(timer);
      } else if (bidStatus === 'accepted') {
        setError(null);
        setSuccess(`🎉 Great news! Your bid of ${formattedAmount} has been accepted! Proceed to checkout to complete your purchase.`);
        setBidStatusNotificationShown(true);
        // Auto-clear after 6 seconds
        const timer = setTimeout(() => setSuccess(null), 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [userBid, product, user, bidStatusNotificationShown, fetchProduct]);

  // ✅ NEW: Refetch product data when window regains focus (user switches back to tab)
  // This ensures bid status and product availability are always current
  useEffect(() => {
    const handleWindowFocus = () => {
      console.log("🔄 Window gained focus - refreshing product data");
      fetchProduct();
    };

    window.addEventListener("focus", handleWindowFocus);
    return () => window.removeEventListener("focus", handleWindowFocus);
  }, [fetchProduct]);

  // ✅ Get display price - UPDATED to use accepted offer price if available
  const getDisplayPrice = () => {
    if (!product) return 0;
    
    // If user has an accepted offer, use that price
    if (product.userAcceptedBid && product.userAcceptedBid.acceptedAmount) {
      return product.userAcceptedBid.acceptedAmount;
    }

    // Also support backend field `acceptedBid` in case API returns it directly
    const currentUserId = user?._id || user?.id;
    if (product.acceptedBid && currentUserId && String(product.acceptedBid.bidderId) === String(currentUserId)) {
      return product.acceptedBid.acceptedAmount;
    }
    
    // Otherwise use regular price
    return product.price;
  };

  // ✅ Toggle Cart Function with localStorage persistence - UPDATED to use accepted price
  const toggleCart = async () => {
    if (!user) {
      setError("Please log in to manage cart items.");
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!product.isAvailable) {
      setError("This product is no longer available.");
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
        setSuccess("Item removed from cart");
      } else {
        // Use accepted bid price if available, otherwise regular price
        const finalPrice = getDisplayPrice();
        const currentUserId = user._id || user.id;
        const isAcceptedBid = !!(
          (product.userAcceptedBid && product.userAcceptedBid.acceptedAmount) ||
          (product.acceptedBid && String(product.acceptedBid.bidderId) === String(currentUserId))
        );

        await api.post("/cart/add", {
          userId: user._id || user.id,
          productId: id,
          quantity: 1,
          price: finalPrice, // Include the price in cart
          isAcceptedBid
        });
        setIsInCart(true);
        localStorage.setItem(`cart_${id}`, JSON.stringify(true));
        setSuccess("Item added to cart");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to update cart. Please try again.";
      setError(errorMsg);
    } finally {
      setUpdatingCart(false);
    }
  };

  // ✅ Toggle Favorite Function with localStorage persistence
  const toggleFavorite = async () => {
    if (!user) {
      setError("Please log in to manage favorites.");
      setTimeout(() => navigate('/login'), 2000);
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
        setSuccess("Removed from favorites");
      } else {
        await api.post("/favorites/add", { 
          userId: user._id || user.id, 
          productId: id 
        });
        setIsFavorite(true);
        localStorage.setItem(`favorite_${id}`, JSON.stringify(true));
        setSuccess("Added to favorites");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to update favorites. Please try again.";
      setError(errorMsg);
    } finally {
      setUpdatingFavorite(false);
    }
  };

  // ✅ Handle bid placement with localStorage persistence
  const handlePlaceBid = async () => {
    if (!user) {
      setError("Please log in to make a bid.");
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!product.isAvailable) {
      setError("This product is no longer available.");
      return;
    }

    const parsedBidAmount = parseFloat(bidAmount);
    if (isNaN(parsedBidAmount) || parsedBidAmount <= 0) {
      setError("Please enter a valid bid amount greater than $0.");
      return;
    }

    setPlacingBid(true);
    try {
      const res = await api.post(`/products/${id}/placeBid`, {
        amount: parsedBidAmount,
        bidderId: user._id || user.id,
        bidderName: user.name,
      });

      setProduct(res.data.product);
      setBidAmount("");
      setShowBidCard(false);
      
      // ✅ FIX: Set userBid with proper bid data and persist to localStorage
      const isOwner = (user._id || user.id) === product.userId;
      if (!isOwner) {
        // Use the bid from response - prefer product.activeBids version for consistency
        const userBid = res.data.product.activeBids?.find(
          bid => String(bid.bidderId) === String(user._id || user.id)
        ) || res.data.bid;
        
        setUserBid(userBid);
        // Store to localStorage with all necessary fields
        localStorage.setItem(`bid_${id}`, JSON.stringify(userBid));
        console.log(`💾 Bid stored to localStorage:`, userBid);
      }

      if (res.data.isUpdate) {
        setSuccess("Bid updated successfully!");
      } else {
        setSuccess("Bid submitted successfully! The seller will review your bid.");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to submit bid. Please try again.";
      setError(errorMsg);
    } finally {
      setPlacingBid(false);
    }
  };

  // ✅ NEW: Handle Accept Bid for sellers
  const handleAcceptBid = async (bid) => {
    if (!user || !product) {
      setError("Please log in to perform this action.");
      return;
    }

    // ✅ VALIDATION: Verify user is the product owner
    const isOwner = String(user._id || user.id) === String(product.userId);
    if (!isOwner) {
      setError("Only the product owner can accept bids.");
      return;
    }

    setAcceptingBid(true);
    try {
      // Show loading feedback
      setSuccess("Processing bid acceptance...");

      const response = await api.post(`/products/${id}/acceptBid`, {
        bidId: bid.bidId,
        bidderId: bid.bidderId,
        acceptedAmount: bid.amount
      });

      // ✅ Refetch with cache-buster and proper user ID
      const userId = String(user._id || user.id);
      const timestamp = new Date().getTime();
      const updatedProduct = await api.get(`/products/${id}?userId=${encodeURIComponent(userId)}&t=${timestamp}`);
      setProduct(updatedProduct.data);

      // ✅ Show success feedback
      setSuccess(`Bid of $${bid.amount} from ${bid.bidderName} accepted successfully.`);

      // ✅ Clear any showing offer card
      setshowBidCard(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to accept bid. Please try again.";
      setError(errorMsg);
      console.error("Error accepting bid:", err);
    } finally {
      setAcceptingBid(false);
    }
  };

  // ✅ Handle Buy Now Function - UPDATED to use accepted offer price
  const handleBuyNow = async () => {
    if (!user) {
      setError("Please log in to make a purchase.");
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!product.isAvailable) {
      setError("This product is no longer available.");
      return;
    }

    setUpdatingCart(true);
    try {
      // Use accepted bid price if available, otherwise regular price
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
      const isAcceptedBid = !!(
        (product.userAcceptedBid && product.userAcceptedBid.acceptedAmount) ||
        (product.acceptedBid && String(product.acceptedBid.bidderId) === String(currentUserId))
      );

      navigate('/checkout', { 
        state: { 
          directPurchase: true,
          productId: id,
          productName: product.name,
          price: finalPrice, // Use the correct price (accepted offer or regular)
          quantity: 1,
          isAcceptedBid
        }
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to process purchase. Please try again.";
      setError(errorMsg);
    } finally {
      setUpdatingCart(false);
    }
  };

  // ✅ Handle bid button click
  const handleBidButtonClick = () => {
    if (!user) {
      setError("Please log in to make a bid.");
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    if (userBid) {
      setBidAmount(getBidAmount(userBid).toString());
    }
    setShowBidCard(true);
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

  const getBidAmount = (offer) => {
    if (!offer) return 0;
    return offer.amount || offer.bidAmount || 0;
  };

  const getBidStatus = (offer) => {
    // Check bidStatus first, then status, default to pending
    const status = (offer?.bidStatus || offer?.status || "pending").toLowerCase().trim();
    // Ensure it's a valid status value
    if (["pending", "accepted", "rejected"].includes(status)) {
      return status;
    }
    return "pending";
  };

  // ✅ NEW: Determine which card to show - ensures only ONE card renders at a time
  // Uses priority: rejected > accepted > pending
  const getCardTypeToShow = () => {
    if (!userBid || isOwner || showBidCard) {
      console.log('🔍 getCardTypeToShow: returning null because', {
        userBidNull: !userBid,
        isOwner,
        showBidCard
      });
      return null;
    }
    
    const status = getBidStatus(userBid);
    const cardType = status === 'rejected' ? 'rejected' : (status === 'accepted' ? 'accepted' : (status === 'pending' || !userBid.bidStatus ? 'pending' : null));
    
    console.log(`🎯 CARD TO SHOW: "${cardType}" | userBid.bidStatus="${userBid.bidStatus}" | normalizedStatus="${status}" | amount=$${userBid.amount}`);
    
    // PRIORITY ORDER (highest to lowest):
    if (status === 'rejected') return 'rejected';
    if (status === 'accepted') return 'accepted';
    if (status === 'pending' || !userBid.bidStatus) return 'pending';
    
    return null;
  };

  const isUserOwner = () => {
    if (!user || !product) return false;
    return String(user._id || user.id) === String(product.userId);
  };

  const getSellerInfo = () => {
    if (!product) return {};
    // Prefer explicit `seller` state (populated or fetched). Fallback to product.user or fields on product.
    const source = seller || product.user || {};
    const userRating = source.rating ?? product.userRating ?? product.sellerRating ?? "No rating";

    return {
      name: source.name || product.userName || product.sellerName || "Unknown User",
      rating: (typeof userRating === 'number' || !isNaN(parseFloat(userRating))) ? Number(userRating).toFixed(1) : userRating,
      location: source.location || product.userLocation || product.sellerLocation || "Location not specified",
      sales: source.successfulSales || product.successfulSales || "0",
      profileImage: source.profileImage || product.user?.profileImage || null
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
  
  // ✅ Handle invalid product ID error
  if (invalidProductId) {
    return (
      <Container fluid style={{ 
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        minHeight: '100vh',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Container>
          <Row className="justify-content-center">
            <Col md={6} className="text-center">
              <Card className="border-0 shadow-lg p-5" style={{ borderRadius: '20px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>❌</div>
                <h3 style={{ color: colors.badge, fontWeight: '700', marginBottom: '1rem' }}>Invalid Product ID</h3>
                <p style={{ color: colors.bg, fontSize: '1.1rem', marginBottom: '2rem' }}>
                  The product ID you're trying to access is invalid or empty. Please make sure you have the correct product link.
                </p>
                <Button
                  onClick={() => navigate('/categories')}
                  className="hover-lift"
                  style={{
                    background: colors.bg,
                    border: 'none',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '1rem'
                  }}
                >
                  <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.5rem' }}></i>
                  Back to Products
                </Button>
              </Card>
            </Col>
          </Row>
        </Container>
      </Container>
    );
  }
  
  if (!product)
    return (
      <Container fluid style={{ 
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        minHeight: '100vh',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Container>
          <Row className="justify-content-center">
            <Col md={6} className="text-center">
              <Card className="border-0 shadow-lg p-5" style={{ borderRadius: '20px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📦</div>
                <h3 style={{ color: colors.bg, fontWeight: '700', marginBottom: '1rem' }}>Product Not Found</h3>
                <p style={{ color: colors.bg, fontSize: '1.1rem', marginBottom: '2rem' }}>
                  Sorry, the product you're looking for doesn't exist or has been removed. Please check the product ID and try again.
                </p>
                <Button
                  onClick={() => navigate('/categories')}
                  className="hover-lift"
                  style={{
                    background: colors.bg,
                    border: 'none',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '1rem'
                  }}
                >
                  <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.5rem' }}></i>
                  Back to Products
                </Button>
              </Card>
            </Col>
          </Row>
        </Container>
      </Container>
    );

  const isAvailable = product.isAvailable;
  const currentBids = product.activeBids || [];
  const sellerInfo = getSellerInfo();
  const isOwner = product.isOwner || isUserOwner();
  const displayPrice = getDisplayPrice();

  return (
    <Container fluid style={{ 
      background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
      minHeight: '100vh',
      padding: 0 
    }}>
      {/* Error and Success Notifications */}
      <div style={{ position: 'sticky', top: '68px', zIndex: 1020, backgroundColor: '#f8f9fa', padding: '1rem' }}>
        {error && (
          <ErrorNotification 
            message={error} 
            type="error" 
            onClose={() => setError(null)}
          />
        )}
        {success && (
          <ErrorNotification 
            message={success} 
            type="success" 
            onClose={() => setSuccess(null)}
            autoClose={true}
          />
        )}
      </div>

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
                    color: product.isAvailable ? colors.bg : '#9CA3AF',
                    fontWeight: '800',
                    fontSize: '2.5rem',
                    margin: 0,
                    flex: 1,
                    lineHeight: '1.2',
                    textDecoration: product.isAvailable ? 'none' : 'line-through'
                  }}>
                    {product.name}
                  </h1>
                  <div style={{ display: 'flex', gap: '0.8rem' }}>
                    {!product.isAvailable && (
                      <Badge style={{ 
                        background: '#EF4444',
                        color: 'white',
                        padding: '0.6rem 1.2rem',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        borderRadius: '12px'
                      }}>
                        <i className="fa-solid fa-sold" style={{ marginRight: '0.5rem' }}></i>
                        SOLD
                      </Badge>
                    )}
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
                border: product.userAcceptedBid ? `3px solid #22C55E` : 'none',
                borderRadius: '16px',
                overflow: 'hidden'
              }}>
                <Card.Body className="p-4">
                  <div className="d-flex align-items-baseline gap-3 mb-2 flex-wrap">
                    <span style={{ 
                      color: product.userAcceptedBid ? '#22C55E' : colors.accent,
                      fontSize: '2.5rem',
                      fontWeight: '800',
                    }}>
                      {formatCurrency(displayPrice)}
                    </span>
                    
                    {product.userAcceptedBid ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <span style={{ 
                          color: '#6c757d', 
                          textDecoration: 'line-through', 
                          fontSize: '1.6rem',
                          fontWeight: '600'
                        }}>
                          {formatCurrency(product.userAcceptedBid.originalPrice)}
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
                          Your Accepted bid!
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
                    color: product.userAcceptedBid ? '#22C55E' : colors.bg, 
                    fontWeight: '600', 
                    margin: 0, 
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <i className={`fa-solid ${product.userAcceptedBid ? 'fa-handshake' : 'fa-comments-dollar'}`}></i>
                    {product.userAcceptedBid ? 
                      "Congratulations! Your bid was accepted at this special price!" : 
                      "Price is negotiable - Make a bid!"}
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
                      onClick={handleBidButtonClick}
                      disabled={!isAvailable || placingBid || 
                               (userBid && (getBidStatus(userBid) === 'accepted' || getBidStatus(userBid) === 'rejected'))}
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
                      ) : userBid && getBidStatus(userBid) === 'accepted' ? (
                        <>
                          <i className="fa-solid fa-check-circle"></i>
                          Accepted
                        </>
                      ) : userBid && getBidStatus(userBid) === 'rejected' ? (
                        <>
                          <i className="fa-solid fa-times-circle"></i>
                          Closed
                        </>
                      ) : userBid ? (
                        <>
                          <i className="fa-solid fa-edit"></i>
                          Update Bid
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-handshake"></i>
                          Make Bid
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
                        background: product.userAcceptedBid ? 
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
                      ) : product.userAcceptedBid ? (
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
                    {currentBids.length > 0 && (
                      <p style={{ 
                        color: colors.accent, 
                        margin: '0.5rem 0 0 0',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}>
                        <i className="fa-solid fa-hand-holding-dollar"></i>
                        You have {currentBids.length} bid{currentBids.length > 1 ? 's' : ''} on this product
                      </p>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* Enhanced Offer Card */}
              {showBidCard && !isOwner && (
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
                        {userBid ? 'Update Your Bid' : 'Make Your Bid'}
                      </h6>
                    </div>
                    
                    {userBid && (
                      <Card className="border-0 mb-3 gradient-bg" style={{ borderRadius: '12px' }}>
                        <Card.Body className="p-3 text-center">
                          <p style={{ color: colors.bg, fontWeight: '700', margin: 0, fontSize: '1rem' }}>
                            Current bid: <span style={{ color: colors.accent, fontSize: '1.2rem' }}>{formatCurrency(getBidAmount(userBid))}</span>
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
                        Bid Amount
                      </label>
                      <input
                        type="number"
                        placeholder={userBid ? "Enter new bid amount..." : "Enter your bid amount..."}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
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
                          This is bargaining - bid any amount you think is fair! The seller will review your bid.
                        </p>
                      </Card.Body>
                    </Card>
                    
                    <div className="d-flex gap-3">
                      <Button
                        onClick={() => setShowBidCard(false)}
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
                        onClick={handlePlaceBid}
                        disabled={placingBid || !bidAmount}
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
                        {placingBid ? (
                          <i className="fa-solid fa-spinner fa-spin"></i>
                        ) : userBid ? (
                          <>
                            <i className="fa-solid fa-pen-to-square" style={{ marginRight: '0.5rem' }}></i>
                            Update Bid
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-paper-plane" style={{ marginRight: '0.5rem' }}></i>
                            Submit Bid
                          </>
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* ✅ Show "Your Current Bid" card ONLY for PENDING bids */}
              {getCardTypeToShow() === 'pending' && (
                <Card className="border-0 shadow hover-lift" 
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.accent}15, ${colors.bg}15)`,
                    border: `3px solid ${colors.bg}`,
                    borderRadius: '16px'
                  }}
                >
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 style={{ 
                          color: colors.bg,
                          fontWeight: '700',
                          margin: 0,
                          fontSize: '1.1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <i className="fa-solid fa-clock"></i>
                          Your Current Bid
                        </h6>
                        <p style={{ 
                          color: colors.bg,
                          fontWeight: '800',
                          margin: '0.5rem 0 0 0',
                          fontSize: '1.3rem'
                        }}>
                          {formatCurrency(getBidAmount(userBid))}
                        </p>
                        <small style={{ 
                          color: colors.bg,
                          opacity: 0.8,
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}>
                          ⏳ Waiting for seller response
                        </small>
                      </div>
                      <Button
                        onClick={handleBidButtonClick}
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
                        <i className="fa-solid fa-pen-to-square" style={{ marginRight: '0.5rem' }}></i>
                        Update Bid
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* ✅ DEBUG: Log userBid state for rejection card troubleshooting */}
              {userBid && (
                <div style={{ display: 'none' }}>
                  {console.log('🔍 REJECTION CARD DEBUG:', {
                    userBidExists: !!userBid,
                    isOwner: isOwner,
                    showBidCard: showBidCard,
                    computedBidStatus: getBidStatus(userBid),
                    rawBidStatus: userBid.bidStatus,
                    shouldRenderRejection: (getBidStatus(userBid) === 'rejected' && userBid.bidStatus === 'rejected'),
                    fullBid: userBid
                  })}
                </div>
              )}

              {/* ✅ Show "Bid Rejected" card ONLY for REJECTED bids - PRIORITY CHECK */}
              {getCardTypeToShow() === 'rejected' && (
                <Card className="border-0 shadow hover-lift" 
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(245, 101, 101, 0.1), rgba(229, 62, 62, 0.1))',
                    border: `3px solid ${colors.badge}`,
                    borderRadius: '16px'
                  }}
                >
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-start">
                      <div style={{ flex: 1 }}>
                        <h6 style={{ 
                          color: colors.badge,
                          fontWeight: '700',
                          margin: 0,
                          fontSize: '1.1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <i className="fa-solid fa-times-circle"></i>
                          Bid Rejected
                        </h6>
                        <p style={{ 
                          color: colors.bg,
                          fontWeight: '800',
                          margin: '0.5rem 0 0.25rem 0',
                          fontSize: '1.3rem'
                        }}>
                          {formatCurrency(getBidAmount(userBid))}
                        </p>
                        <small style={{ 
                          color: colors.bg,
                          opacity: 0.8,
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          lineHeight: '1.5',
                          display: 'block'
                        }}>
                          Your bid was rejected by the seller
                        </small>
                      </div>
                      <Button
                        onClick={handleBidButtonClick}
                        className="hover-lift"
                        style={{
                          background: colors.accent,
                          border: 'none',
                          borderRadius: '10px',
                          padding: '0.75rem 1.25rem',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          color: 'white',
                          marginLeft: '1rem',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fa-solid fa-plus" style={{ marginRight: '0.5rem' }}></i>
                        Try Another Bid
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* ✅ Show "Your Accepted Offer" card ONLY for ACCEPTED bids - PRIORITY CHECK */}
              {getCardTypeToShow() === 'accepted' && (
                <>
                  <Card className="border-0 shadow hover-lift" 
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.15))',
                      border: `3px solid #22C55E`,
                      borderRadius: '16px'
                    }}
                  >
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 style={{ 
                            color: '#22C55E',
                            fontWeight: '700',
                            margin: 0,
                            fontSize: '1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <i className="fa-solid fa-check-circle"></i>
                            Your Accepted Bid!
                          </h6>
                          <p style={{ 
                            color: colors.bg,
                            fontWeight: '800',
                            margin: '0.5rem 0 0 0',
                            fontSize: '1.3rem'
                          }}>
                            {formatCurrency(getBidAmount(userBid))}
                          </p>
                          <small style={{ 
                            color: colors.bg,
                            opacity: 0.8,
                            fontSize: '0.9rem',
                            fontWeight: '500'
                          }}>
                            Congratulations! Your bid was accepted at this special price!
                          </small>
                        </div>
                        <Button
                          onClick={handleBuyNow}
                          className="hover-lift"
                          style={{
                            background: '#22C55E',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '0.75rem 1.25rem',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            color: 'white'
                          }}
                        >
                          <i className="fa-solid fa-cart-shopping" style={{ marginRight: '0.5rem' }}></i>
                          Checkout
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                  
                   
                   
                </>
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

                  {/* ✅ NEW: All Bids Display (for sold products - visible to all users) */}
                  {!isAvailable && currentBids.length > 0 && (
                    <Accordion.Item eventKey="2" className="border-0 mb-3" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                      <Accordion.Header style={{ 
                        fontWeight: '700', 
                        color: colors.bg,
                        background: 'white',
                        border: 'none',
                        padding: '1.5rem',
                        fontSize: '1.1rem'
                      }}>
                        <i className="fa-solid fa-gavel" style={{ marginRight: '0.8rem', color: colors.accent }}></i>
                        Bidding Summary ({currentBids.length} bid{currentBids.length > 1 ? 's' : ''})
                      </Accordion.Header>
                      <Accordion.Body style={{ 
                        background: '#d7c9aa37',
                        padding: '2rem',
                        borderTop: `2px solid ${colors.accent}`
                      }}>
                        <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '1rem' }}>
                          {currentBids
                            .sort((a, b) => getBidAmount(b) - getBidAmount(a))
                            .map((offer, index) => (
                              <Card 
                                key={offer.bidId || `offer-${index}`}
                                className="mb-3 border-0 hover-lift"
                                style={{ 
                                  background: getBidStatus(offer) === 'accepted' 
                                    ? 'linear-gradient(90deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))'
                                    : 'white',
                                  borderRadius: '12px',
                                  borderLeft: `5px solid ${
                                    getBidStatus(offer) === 'accepted' ? '#22C55E' :
                                    getBidStatus(offer) === 'rejected' ? colors.badge : colors.bg
                                  }`,
                                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                                  border: getBidStatus(offer) === 'accepted' ? `2px solid #22C55E` : undefined
                                }}
                              >
                                <Card.Body className="p-3">
                                  <div className="d-flex justify-content-between align-items-start gap-3">
                                    <div style={{ flex: 1 }}>
                                      <h6 style={{ color: colors.bg, margin: 0, fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <i className="fa-solid fa-user" style={{ color: colors.accent }}></i>
                                        {offer.bidderName || "Unknown User"}
                                      </h6>
                                      <small style={{ color: colors.bg, fontSize: '0.85rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem' }}>
                                        <i className="fa-solid fa-calendar" style={{ color: colors.highlight }}></i>
                                        {formatDate(offer.date)}
                                      </small>
                                    </div>
                                    <div style={{ textAlign: 'right', minWidth: '180px' }}>
                                      <div style={{ 
                                        color: colors.accent,
                                        fontSize: '1.2rem',
                                        fontWeight: '800',
                                        marginBottom: '0.5rem'
                                      }}>
                                        {formatCurrency(getBidAmount(offer))}
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end' }}>
                                        <small style={{ 
                                          color: getBidStatus(offer) === 'accepted' ? '#22C55E' :
                                                 getBidStatus(offer) === 'rejected' ? colors.badge : colors.highlight,
                                          fontWeight: '700',
                                          fontSize: '0.85rem',
                                          textTransform: 'capitalize'
                                        }}>
                                          {getBidStatus(offer)}
                                        </small>
                                        {getBidStatus(offer) === 'accepted' && (
                                          <Badge style={{ 
                                            background: '#22C55E',
                                            marginTop: '0.3rem',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            padding: '0.4rem 0.8rem'
                                          }}>
                                            <i className="fa-solid fa-crown" style={{ marginRight: '0.3rem' }}></i>
                                            WINNING BID
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </Card.Body>
                              </Card>
                            ))}
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  )}

                  {/* Bids (for owner) - UPDATED to show all bids to owner with Accept buttons */}
                  {isOwner && currentBids.length > 0 && (
                    <Accordion.Item eventKey="3" className="border-0 mb-3" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                      <Accordion.Header style={{ 
                        fontWeight: '700', 
                        color: colors.bg,
                        background: 'white',
                        border: 'none',
                        padding: '1.5rem',
                        fontSize: '1.1rem'
                      }}>
                        <i className="fa-solid fa-hand-holding-dollar" style={{ marginRight: '0.8rem', color: colors.accent }}></i>
                        Received Bids ({currentBids.length})
                      </Accordion.Header>
                      <Accordion.Body style={{ 
                        background: '#d7c9aa37',
                        padding: '2rem',
                        borderTop: `2px solid ${colors.accent}`
                      }}>
                        <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '1rem' }}>
                          {currentBids
                            .sort((a, b) => getBidAmount(b) - getBidAmount(a))
                            .map((offer, index) => (
                              <Card 
                                key={offer.bidId || `offer-${index}`}
                                className="mb-3 border-0 hover-lift"
                                style={{ 
                                  background: 'white',
                                  borderRadius: '12px',
                                  borderLeft: `5px solid ${
                                    getBidStatus(offer) === 'accepted' ? '#22C55E' :
                                    getBidStatus(offer) === 'rejected' ? colors.badge : colors.bg
                                  }`,
                                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
                                }}
                              >
                                <Card.Body className="p-3">
                                  <div className="d-flex justify-content-between align-items-start gap-3">
                                    <div style={{ flex: 1 }}>
                                      <h6 style={{ color: colors.bg, margin: 0, fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <i className="fa-solid fa-user" style={{ color: colors.accent }}></i>
                                        {offer.bidderName || "Unknown User"}
                                      </h6>
                                      <small style={{ color: colors.bg, fontSize: '0.85rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem' }}>
                                        <i className="fa-solid fa-calendar" style={{ color: colors.highlight }}></i>
                                        {formatDate(offer.date)}
                                      </small>
                                    </div>
                                    <div style={{ textAlign: 'right', minWidth: '150px' }}>
                                      <div style={{ 
                                        color: colors.accent,
                                        fontSize: '1.2rem',
                                        fontWeight: '800',
                                        marginBottom: '0.5rem'
                                      }}>
                                        {formatCurrency(getBidAmount(offer))}
                                      </div>
                                      <small style={{ 
                                        color: getBidStatus(offer) === 'accepted' ? '#22C55E' :
                                               getBidStatus(offer) === 'rejected' ? colors.badge : colors.highlight,
                                        fontWeight: '700',
                                        fontSize: '0.85rem',
                                        textTransform: 'capitalize'
                                      }}>
                                        {getBidStatus(offer)}
                                      </small>
                                    </div>
                                  </div>
                                  
                                  {/* ✅ NEW: Accept button for pending bids */}
                                  {getBidStatus(offer) === 'pending' && (
                                    <div className="mt-3">
                                      <Button
                                        onClick={() => handleAcceptBid(offer)}
                                        disabled={acceptingBid}
                                        className="w-100 hover-lift"
                                        style={{
                                          background: '#22C55E',
                                          border: 'none',
                                          color: 'white',
                                          padding: '0.7rem 1rem',
                                          borderRadius: '8px',
                                          fontWeight: '700',
                                          fontSize: '0.9rem',
                                          transition: 'all 0.3s ease'
                                        }}
                                      >
                                        {acceptingBid ? (
                                          <>
                                            <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                                            Processing...
                                          </>
                                        ) : (
                                          <>
                                            <i className="fa-solid fa-check-circle" style={{ marginRight: '0.5rem' }}></i>
                                            Accept Bid
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  )}
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
