import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Badge from 'react-bootstrap/Badge';
import colors from '../../theme';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

function FavoritesDrawer({ name, ...props }) {
    const [show, setShow] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // ✅ Get current user
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const handleClose = () => setShow(false);
    const handleShow = () => {
        if (!currentUser) {
            alert("⚠️ Please log in to view your favorites.");
            return;
        }
        setShow(true);
        fetchFavorites();
    };

    // ✅ Fetch favorites
    const fetchFavorites = async () => {
        if (!currentUser) return;
        
        try {
            setLoading(true);
            const res = await api.get(`/favorites/user/${currentUser._id || currentUser.id}`);
            console.log("💖 Favorites data:", res.data);
            
            // Fetch product details for each favorite
            const favoritesWithDetails = await Promise.all(
                res.data.items.map(async (item) => {
                    try {
                        const productRes = await api.get(`/products/${item.productId}`);
                        return {
                            ...item,
                            productDetails: productRes.data
                        };
                    } catch (error) {
                        console.error("Error fetching product details:", error);
                        return {
                            ...item,
                            productDetails: { 
                                name: 'Product not available', 
                                price: 0,
                                isAvailable: false 
                            }
                        };
                    }
                })
            );
            
            setFavorites(favoritesWithDetails);
        } catch (err) {
            console.error("❌ Favorites fetch error:", err);
            setFavorites([]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Remove from favorites
    const removeFromFavorites = async (productId) => {
        if (!currentUser) return;

        try {
            await api.post("/favorites/remove", {
                userId: currentUser._id || currentUser.id,
                productId: productId
            });

            // Remove from local state
            setFavorites(prev => prev.filter(item => item.productId !== productId));
        } catch (error) {
            console.error("Remove from favorites error:", error);
            alert("❌ Failed to remove from favorites");
        }
    };

    // ✅ Add to cart from favorites
    const addToCartFromFavorites = async (productId, productName) => {
        if (!currentUser) {
            alert("⚠️ Please log in to add items to cart.");
            return;
        }

        try {
            await api.post("/cart/add", {
                userId: currentUser._id || currentUser.id,
                productId: productId,
                quantity: 1,
            });
            
            alert(`✅ ${productName} added to cart!`);
        } catch (error) {
            console.error("Add to cart error:", error);
            alert("❌ Failed to add to cart");
        }
    };

    // ✅ Navigate to product
    const navigateToProduct = (productId) => {
        navigate(`/products/${productId}`);
        handleClose();
    };

    

    // ✅ Format currency
    const formatCurrency = (amount) => {
        if (!amount || isNaN(amount)) return "$0.00";
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    // Calculate item count for badge
    const itemCount = favorites.length;

    return (
        <>
            <Button
                variant="link"
                onClick={handleShow}
                className="icon-btn position-relative p-0"
                style={{ color: colors.text, fontSize: '1.2rem' }}
                onMouseOver={(e) => {
                    e.target.style.color = "#D7C9AA";
                }}
                onMouseOut={(e) => {
                    e.target.style.color = colors.text;
                }}
            >
                <i className="fa-regular fa-heart fs-5"></i>
                {itemCount > 0 && (
                    <Badge
                        pill
                        bg=""
                        style={{
                            backgroundColor: colors.badge,
                            color: 'white',
                            fontSize: '0.7rem',
                            position: 'absolute',
                            top: '-4px',
                            right: '-8px',
                        }}
                    >
                        {itemCount}
                    </Badge>
                )}
            </Button>

            {/* 💖 Favorites Drawer */}
            <Offcanvas
                show={show}
                onHide={handleClose}
                {...props}
                placement="end"
                style={{ width: '380px' }}
            >
                {/* Drawer Header */}
                <Offcanvas.Header
                    closeButton
                    style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                    }}
                >
                    <Offcanvas.Title>
                        <i className="fa-regular fa-heart me-2"></i>
                        Your Favorites {itemCount > 0 && `(${itemCount})`}
                    </Offcanvas.Title>
                </Offcanvas.Header>

                {/* Drawer Body */}
                <Offcanvas.Body
                    style={{
                        backgroundColor: colors.text,
                        color: colors.bg,
                        padding: '0'
                    }}
                >
                    {loading ? (
                        <div className="text-center p-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading favorites...</p>
                        </div>
                    ) : favorites.length > 0 ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {/* Favorites Items */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                                {favorites.map((item) => (
                                    <div
                                        key={item.productId}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            backgroundColor: 'white',
                                            padding: '12px',
                                            borderRadius: '10px',
                                            marginBottom: '12px',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                            border: `1px solid ${colors.accent}20`
                                        }}
                                    >
                                        {/* Product Image */}
                                        <div 
                                            style={{
                                                width: '60px',
                                                height: '60px',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                marginRight: '12px',
                                                cursor: 'pointer',
                                                flexShrink: 0
                                            }}
                                            onClick={() => navigateToProduct(item.productId)}
                                        >
                                            <img 
                                                src={item.productDetails?.images?.[0] || '/placeholder.jpg'} 
                                                alt={item.productDetails?.name}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <h6 
                                                style={{ 
                                                    marginBottom: '8px',
                                                    color: colors.bg,
                                                    fontSize: '0.95rem',
                                                    cursor: 'pointer',
                                                    lineHeight: '1.3'
                                                }}
                                                onClick={() => navigateToProduct(item.productId)}
                                                className="hover-text-primary"
                                            >
                                                {item.productDetails?.name || 'Unknown Product'}
                                            </h6>
                                            <p 
                                                style={{ 
                                                    margin: '0',
                                                    color: colors.accent,
                                                    fontWeight: '600',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                {formatCurrency(item.productDetails?.price || 0)}
                                            </p>
                                            
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    marginTop: '10px',
                                                    flexWrap: 'wrap'
                                                }}
                                            >
                                                <Button
                                                    size="sm"
                                                    style={{
                                                        backgroundColor: colors.accent,
                                                        border: 'none',
                                                        padding: '4px 12px',
                                                        fontSize: '0.8rem'
                                                    }}
                                                    onClick={() => navigateToProduct(item.productId)}
                                                >
                                                    <i className="fa-solid fa-eye me-1"></i>
                                                    View
                                                </Button>
                                                
                                                {item.productDetails?.isAvailable && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline-primary"
                                                        style={{
                                                            borderColor: colors.accent,
                                                            color: colors.accent,
                                                            padding: '4px 12px',
                                                            fontSize: '0.8rem'
                                                        }}
                                                        onClick={() => addToCartFromFavorites(item.productId, item.productDetails?.name)}
                                                    >
                                                        <i className="fa-solid fa-cart-plus me-1"></i>
                                                        Add to Cart
                                                    </Button>
                                                )}
                                                
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    style={{
                                                        color: '#dc3545',
                                                        textDecoration: 'none',
                                                        padding: '4px 8px'
                                                    }}
                                                    onClick={() => removeFromFavorites(item.productId)}
                                                    title="Remove from favorites"
                                                >
                                                    <i className="fa-solid fa-trash"></i>
                                                </Button>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', minWidth: '80px' }}>
                                            <div style={{ 
                                                fontSize: '0.7rem', 
                                                color: '#6c757d',
                                                marginBottom: '5px'
                                            }}>
                                                Added {new Date(item.addedAt).toLocaleDateString()}
                                            </div>
                                            {!item.productDetails?.isAvailable && (
                                                <Badge
                                                    bg="secondary"
                                                    style={{ fontSize: '0.7rem' }}
                                                >
                                                    Sold
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div
                                style={{
                                    borderTop: `2px solid ${colors.accent}30`,
                                    padding: '15px',
                                    backgroundColor: 'white'
                                }}
                            >
                                <div className="text-center">
                                    <p style={{ color: colors.bg, marginBottom: '15px', fontSize: '0.9rem' }}>
                                        {favorites.length} item{favorites.length !== 1 ? 's' : ''} in favorites
                                    </p>
                                    
                                 
                                    
                                    {!currentUser && (
                                        <div 
                                            className="mt-3 p-2 text-center"
                                            style={{
                                                backgroundColor: '#fff3cd',
                                                border: '1px solid #ffeaa7',
                                                borderRadius: '5px',
                                                color: '#856404',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            <i className="fa-solid fa-info-circle me-2"></i>
                                            Please log in to manage favorites
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-5">
                            <i 
                                className="fa-regular fa-heart mb-3"
                                style={{ fontSize: '3rem', color: colors.accent, opacity: 0.5 }}
                            ></i>
                            <p style={{ color: colors.bg, marginBottom: '20px' }}>
                                {currentUser ? "Your favorites list is empty." : "Please log in to view your favorites."}
                            </p>
                            {!currentUser && (
                                <Button
                                    style={{
                                        backgroundColor: colors.accent,
                                        border: 'none',
                                        marginRight: '10px'
                                    }}
                                    onClick={() => window.location.href = '/login'}
                                >
                                    <i className="fa-solid fa-sign-in-alt me-2"></i>
                                    Login
                                </Button>
                            )}
                            {currentUser && (
                                <Button
                                    style={{
                                        backgroundColor: colors.accent,
                                        border: 'none'
                                    }}
                                    onClick={() => {
                                        handleClose();
                                        navigate('/');
                                    }}
                                >
                                    <i className="fa-solid fa-bag-shopping me-2"></i>
                                    Start Shopping
                                </Button>
                            )}
                        </div>
                    )}
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
}

export default FavoritesDrawer;