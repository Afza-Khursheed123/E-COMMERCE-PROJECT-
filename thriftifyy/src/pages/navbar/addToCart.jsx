import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Badge from 'react-bootstrap/Badge';
import colors from '../../theme';
import api from '../../api';

function Cart({ name, ...props }) {
    const [show, setShow] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const navigate = useNavigate();

    // ✅ Get current user
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const handleClose = () => setShow(false);
    const handleShow = () => {
        if (!currentUser) {
            alert("⚠️ Please log in to view your cart.");
            return;
        }
        setShow(true);
        fetchCart();
    };

    // ✅ Fetch real cart data
    const fetchCart = async () => {
        if (!currentUser) return;
        
        try {
            setLoading(true);
            const res = await api.get(`/cart/user/${currentUser._id || currentUser.id}`);
            console.log("🛒 Cart data:", res.data);
            
            const itemsWithDetails = await Promise.all(
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
                            productDetails: { name: 'Product not available', price: 0, isAvailable: false }
                        };
                    }
                })
            );
            
            setCartItems(itemsWithDetails);
            // Calculate total after setting cart items
            calculateTotal(itemsWithDetails, selectedItems);
        } catch (err) {
            console.error("❌ Cart fetch error:", err);
            setCartItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Calculate total for selected items (updated to accept parameters)
    const calculateTotal = (items = cartItems, selected = selectedItems) => {
        const selectedTotal = items.reduce((acc, item) => {
            if (selected.has(item.productId)) {
                return acc + (item.productDetails.price * item.quantity);
            }
            return acc;
        }, 0);
        setTotal(selectedTotal);
    };

    // ✅ Toggle item selection (fixed with immediate calculation)
    const toggleItemSelection = (productId) => {
        setSelectedItems(prevSelected => {
            const newSelectedItems = new Set(prevSelected);
            if (newSelectedItems.has(productId)) {
                newSelectedItems.delete(productId);
            } else {
                newSelectedItems.add(productId);
            }
            
            // Calculate total immediately with the new selected items
            calculateTotal(cartItems, newSelectedItems);
            return newSelectedItems;
        });
    };

    // ✅ Select all items (fixed with immediate calculation)
    const selectAllItems = () => {
        const allAvailableItems = cartItems
            .filter(item => item.productDetails.isAvailable !== false)
            .map(item => item.productId);
        
        const newSelectedItems = new Set(allAvailableItems);
        setSelectedItems(newSelectedItems);
        calculateTotal(cartItems, newSelectedItems);
    };

    // ✅ Deselect all items (fixed with immediate calculation)
    const deselectAllItems = () => {
        setSelectedItems(new Set());
        setTotal(0);
    };

    // ✅ Update quantity (fixed to recalculate total)
    const updateQuantity = async (productId, newQuantity) => {
        if (!currentUser) return;

        try {
            if (newQuantity === 0) {
                await api.post("/cart/remove", {
                    userId: currentUser._id || currentUser.id,
                    productId: productId
                });
                // Remove from selected items if quantity becomes 0
                setSelectedItems(prevSelected => {
                    const newSelectedItems = new Set(prevSelected);
                    newSelectedItems.delete(productId);
                    // Recalculate total after removal
                    calculateTotal(cartItems, newSelectedItems);
                    return newSelectedItems;
                });
            } else {
                await api.post("/cart/update", {
                    userId: currentUser._id || currentUser.id,
                    productId: productId,
                    quantity: newQuantity
                });
            }
            
            fetchCart(); // This will recalculate total after fetch
        } catch (error) {
            console.error("Update cart error:", error);
            alert("❌ Failed to update cart");
        }
    };

    // ✅ Increase quantity
    const increaseQty = (productId, currentQty) => {
        updateQuantity(productId, currentQty + 1);
    };

    // ✅ Decrease quantity
    const decreaseQty = (productId, currentQty) => {
        if (currentQty > 1) {
            updateQuantity(productId, currentQty - 1);
        } else {
            if (window.confirm("Remove item from cart?")) {
                updateQuantity(productId, 0);
            }
        }
    };

    // ✅ Remove item
    const removeItem = (productId) => {
        if (window.confirm("Remove item from cart?")) {
            updateQuantity(productId, 0);
        }
    };

    // ✅ Format currency
    const formatCurrency = (amount) => {
        if (!amount || isNaN(amount)) return "$0.00";
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    // ✅ Proceed to checkout with selected items
    const proceedToCheckout = () => {
        if (selectedItems.size === 0) {
            alert("🛒 Please select at least one item to checkout!");
            return;
        }

        const selectedProducts = cartItems.filter(item => 
            selectedItems.has(item.productId)
        ).map(item => ({
            productId: item.productId,
            productName: item.productDetails.name,
            price: item.productDetails.price,
            quantity: item.quantity,
            image: item.productDetails.images?.[0]
        }));

        handleClose();
        navigate('/checkout', { 
            state: { 
                selectedProducts,
                fromCart: true
            }
        });
    };

    // Calculate item count for badge
    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    // Calculate selected count
    const selectedCount = selectedItems.size;

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
                <i className="fa-solid fa-cart-shopping fs-5"></i>
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

            {/* 🧺 Cart Drawer */}
            <Offcanvas
                show={show}
                onHide={handleClose}
                {...props}
                placement="end"
                style={{ width: '420px' }}
            >
                <Offcanvas.Header
                    closeButton
                    style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                    }}
                >
                    <Offcanvas.Title>
                        <i className="fa-solid fa-cart-shopping me-2"></i>
                        Your Cart {itemCount > 0 && `(${itemCount})`}
                    </Offcanvas.Title>
                </Offcanvas.Header>

                <Offcanvas.Body
                    style={{
                        backgroundColor: colors.text,
                        color: colors.bg,
                        padding: '0',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%'
                    }}
                >
                    {/* Selection Controls */}
                    {cartItems.length > 0 && (
                        <div style={{ 
                            padding: '15px', 
                            backgroundColor: 'white',
                            borderBottom: `1px solid ${colors.accent}20`
                        }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={selectedItems.size === cartItems.filter(item => item.productDetails.isAvailable !== false).length && selectedItems.size > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                selectAllItems();
                                            } else {
                                                deselectAllItems();
                                            }
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <label className="form-check-label" style={{ cursor: 'pointer', fontWeight: '600' }}>
                                        Select All ({selectedCount} selected)
                                    </label>
                                </div>
                                <Button
                                    variant="link"
                                    onClick={deselectAllItems}
                                    style={{ 
                                        color: colors.primary, 
                                        textDecoration: 'none',
                                        fontSize: '0.8rem',
                                        fontWeight: '600'
                                    }}
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center p-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading cart...</p>
                        </div>
                    ) : cartItems.length > 0 ? (
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {cartItems.map((item) => (
                                <div
                                    key={item.productId}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        backgroundColor: 'white',
                                        padding: '15px',
                                        borderBottom: `1px solid ${colors.accent}20`,
                                        opacity: item.productDetails.isAvailable === false ? 0.6 : 1
                                    }}
                                >
                                    {/* Checkbox */}
                                    <div className="me-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.has(item.productId)}
                                            onChange={() => toggleItemSelection(item.productId)}
                                            disabled={item.productDetails.isAvailable === false}
                                            style={{ 
                                                cursor: item.productDetails.isAvailable === false ? 'not-allowed' : 'pointer',
                                                transform: 'scale(1.2)'
                                            }}
                                        />
                                    </div>

                                    {/* Product Image */}
                                    <div className="me-3">
                                        <img
                                            src={item.productDetails.images?.[0] || '/placeholder.jpg'}
                                            alt={item.productDetails.name}
                                            style={{
                                                width: '60px',
                                                height: '60px',
                                                objectFit: 'cover',
                                                borderRadius: '8px'
                                            }}
                                        />
                                    </div>

                                    {/* Product Details */}
                                    <div style={{ flex: 1 }}>
                                        <h6 
                                            style={{ 
                                                marginBottom: '5px',
                                                color: colors.bg,
                                                fontSize: '0.9rem',
                                                fontWeight: '600'
                                            }}
                                        >
                                            {item.productDetails.name || 'Unknown Product'}
                                            {item.productDetails.isAvailable === false && (
                                                <span style={{ 
                                                    color: '#dc3545', 
                                                    fontSize: '0.7rem',
                                                    marginLeft: '5px'
                                                }}>
                                                    (Unavailable)
                                                </span>
                                            )}
                                        </h6>
                                        <p 
                                            style={{ 
                                                margin: '0',
                                                color: colors.accent,
                                                fontWeight: '600',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            {formatCurrency(item.productDetails.price || 0)}
                                        </p>
                                        
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                marginTop: '8px'
                                            }}
                                        >
                                            <Button
                                                size="sm"
                                                style={{
                                                    backgroundColor: colors.accent,
                                                    border: 'none',
                                                    padding: '2px 8px',
                                                    fontSize: '0.8rem'
                                                }}
                                                onClick={() => decreaseQty(item.productId, item.quantity)}
                                                disabled={item.productDetails.isAvailable === false}
                                            >
                                                -
                                            </Button>
                                            <span style={{ fontWeight: '500', minWidth: '20px', textAlign: 'center' }}>
                                                {item.quantity}
                                            </span>
                                            <Button
                                                size="sm"
                                                style={{
                                                    backgroundColor: colors.accent,
                                                    border: 'none',
                                                    padding: '2px 8px',
                                                    fontSize: '0.8rem'
                                                }}
                                                onClick={() => increaseQty(item.productId, item.quantity)}
                                                disabled={item.productDetails.isAvailable === false}
                                            >
                                                +
                                            </Button>
                                            
                                            <Button
                                                variant="link"
                                                size="sm"
                                                style={{
                                                    color: '#dc3545',
                                                    textDecoration: 'none',
                                                    marginLeft: '10px',
                                                    padding: '2px 6px'
                                                }}
                                                onClick={() => removeItem(item.productId)}
                                                title="Remove item"
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Item Total */}
                                    <div style={{ textAlign: 'right', minWidth: '80px' }}>
                                        <div style={{ fontWeight: '600', color: colors.bg, fontSize: '0.9rem' }}>
                                            {formatCurrency((item.productDetails.price || 0) * item.quantity)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-5" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <i 
                                className="fa-solid fa-cart-shopping mb-3"
                                style={{ fontSize: '3rem', color: colors.accent, opacity: 0.5 }}
                            ></i>
                            <p style={{ color: colors.bg, marginBottom: '20px' }}>
                                {currentUser ? "Your cart is empty." : "Please log in to view your cart."}
                            </p>
                            {!currentUser && (
                                <Button
                                    style={{
                                        backgroundColor: colors.accent,
                                        border: 'none'
                                    }}
                                    onClick={() => window.location.href = '/login'}
                                >
                                    <i className="fa-solid fa-sign-in-alt me-2"></i>
                                    Login
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Checkout Footer */}
                    {cartItems.length > 0 && (
                        <div
                            style={{
                                borderTop: `2px solid ${colors.accent}30`,
                                padding: '15px',
                                backgroundColor: 'white'
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '15px',
                                    fontSize: '1.1rem',
                                    fontWeight: '600'
                                }}
                            >
                                <span style={{ color: colors.bg }}>Selected Total:</span>
                                <span style={{ color: colors.accent }}>{formatCurrency(total)}</span>
                            </div>
                            
                            <div className="d-flex gap-2">
                                <Button
                                    style={{
                                        backgroundColor: colors.primary,
                                        border: 'none',
                                        flex: 1,
                                        padding: '10px',
                                        fontSize: '0.9rem',
                                        fontWeight: '600'
                                    }}
                                    onClick={proceedToCheckout}
                                    disabled={selectedItems.size === 0}
                                >
                                    <i className="fa-solid fa-credit-card me-2"></i>
                                    Checkout ({selectedCount})
                                </Button>
                            </div>
                            
                            {selectedItems.size === 0 && (
                                <div 
                                    className="mt-2 p-2 text-center"
                                    style={{
                                        backgroundColor: '#fff3cd',
                                        border: '1px solid #ffeaa7',
                                        borderRadius: '5px',
                                        color: '#856404',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    <i className="fa-solid fa-info-circle me-2"></i>
                                    Select items to checkout
                                </div>
                            )}
                        </div>
                    )}
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
}

function Drawer() {
    return <Cart />;
}

export default Drawer;