import React, { useState, useEffect } from 'react';
import { Button, Offcanvas, Badge, Card, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import colors from '../../theme';
import api from '../../api';

function OrdersDrawer({ name, ...props }) {
    const [show, setShow] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const handleClose = () => setShow(false);
    const handleShow = () => {
        if (!currentUser) {
            alert("⚠️ Please log in to view your orders.");
            return;
        }
        setShow(true);
        fetchOrders();
    };

    // Fetch user orders - FIXED VERSION
    const fetchOrders = async () => {
        if (!currentUser) return;
        
        try {
            setLoading(true);
            setError('');
            
            // Get user ID - try multiple possible fields
            const userId = currentUser._id || currentUser.id || currentUser.userId;
            
            if (!userId) {
                setError('User ID not found. Please log in again.');
                return;
            }

            console.log("🔍 Fetching orders for user:", userId);
            const response = await api.get(`/orders/user/${userId}`);
            console.log("📦 Orders API response:", response.data);

            // Handle API response
            if (response.data && response.data.success) {
                // Filter out duplicate orders and ensure proper data structure
                const uniqueOrders = response.data.data.filter((order, index, self) => 
                    index === self.findIndex(o => o._id === order._id)
                );
                
                setOrders(uniqueOrders || []);
                console.log(`✅ Loaded ${uniqueOrders.length} unique orders`);
            } else {
                setError('Invalid response from server');
                setOrders([]);
            }
        } catch (err) {
            console.error("❌ Orders fetch error:", err);
            const errorMessage = err.response?.data?.message || 
                               err.message || 
                               'Failed to load orders. Please try again.';
            setError(errorMessage);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        if (!status) return '#6c757d';
        
        switch (status.toLowerCase()) {
            case 'delivered':
            case 'completed':
                return '#28a745';
            case 'processing':
                return '#ffc107';
            case 'shipped':
                return '#17a2b8';
            case 'pending':
                return '#6c757d';
            case 'cancelled':
            case 'canceled':
                return '#dc3545';
            default:
                return '#6c757d';
        }
    };

    const getStatusIcon = (status) => {
        if (!status) return 'fa-box';
        
        switch (status.toLowerCase()) {
            case 'delivered':
            case 'completed':
                return 'fa-check-circle';
            case 'processing':
                return 'fa-cog';
            case 'shipped':
                return 'fa-shipping-fast';
            case 'pending':
                return 'fa-clock';
            case 'cancelled':
            case 'canceled':
                return 'fa-times-circle';
            default:
                return 'fa-box';
        }
    };

    const formatCurrency = (amount) => {
        if (!amount || isNaN(amount)) return "$0.00";
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Date not available';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    // Calculate total orders count
    const ordersCount = orders.length;

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
                <i className="fa-solid fa-box-open fs-5"></i>
                {ordersCount > 0 && (
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
                        {ordersCount}
                    </Badge>
                )}
            </Button>

            {/* Orders Drawer */}
            <Offcanvas
                show={show}
                onHide={handleClose}
                {...props}
                placement="end"
                style={{ width: '500px' }}
            >
                <Offcanvas.Header
                    closeButton
                    style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                    }}
                >
                    <Offcanvas.Title>
                        <i className="fa-solid fa-box-open me-2"></i>
                        My Orders {ordersCount > 0 && `(${ordersCount})`}
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
                    {error && (
                        <Alert variant="danger" className="m-3">
                            <i className="fa-solid fa-exclamation-triangle me-2"></i>
                            {error}
                            <div className="mt-2">
                                <Button 
                                    size="sm" 
                                    variant="outline-danger"
                                    onClick={fetchOrders}
                                >
                                    Try Again
                                </Button>
                            </div>
                        </Alert>
                    )}

                    {loading ? (
                        <div className="text-center p-4">
                            <Spinner animation="border" role="status" style={{ color: colors.primary }}>
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                            <p className="mt-2">Loading orders...</p>
                        </div>
                    ) : orders.length > 0 ? (
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {orders.map((order, index) => (
                                <Card 
                                    key={order._id || order.orderId || index} 
                                    className="m-3" 
                                    style={{ 
                                        border: 'none', 
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <Card.Body>
                                        {/* Order Header */}
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <h6 style={{ 
                                                    color: colors.bg, 
                                                    marginBottom: '5px',
                                                    fontWeight: '600'
                                                }}>
                                                    Order #{order._id || order.orderId}
                                                </h6>
                                                <small className="text-muted">
                                                    {formatDate(order.createdAt)}
                                                </small>
                                            </div>
                                            <div 
                                                className="d-flex align-items-center"
                                                style={{ 
                                                    color: getStatusColor(order.status),
                                                    fontWeight: '600',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <i className={`fa-solid ${getStatusIcon(order.status)} me-1`}></i>
                                                {order.status || 'Processing'}
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        <div className="mb-3">
                                            {(order.products || []).slice(0, 3).map((product, idx) => (
                                                <div key={idx} className="d-flex align-items-center mb-2">
                                                    <img 
                                                        src={product.image} 
                                                        alt={product.productName}
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            objectFit: 'cover',
                                                            borderRadius: '6px',
                                                            marginRight: '10px'
                                                        }}
                                                        onError={(e) => {
                                                            e.target.src = '/placeholder.jpg';
                                                        }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ 
                                                            fontSize: '0.85rem',
                                                            fontWeight: '500',
                                                            color: colors.bg
                                                        }}>
                                                            {product.productName}
                                                        </div>
                                                        <div style={{ 
                                                            fontSize: '0.75rem',
                                                            color: colors.accent
                                                        }}>
                                                            Qty: {product.quantity || 1} × {formatCurrency(product.price)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(order.products || []).length > 3 && (
                                                <div className="text-center mt-2">
                                                    <small className="text-muted">
                                                        +{(order.products || []).length - 3} more items
                                                    </small>
                                                </div>
                                            )}
                                        </div>

                                        {/* Order Footer */}
                                        <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                            <div>
                                                <div style={{ 
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600',
                                                    color: colors.primary
                                                }}>
                                                    {formatCurrency(order.totalAmount || order.total || 0)}
                                                </div>
                                                <small className="text-muted">
                                                    {order.paymentMethod || 'stripe'}
                                                </small>
                                            </div>
                                            
                                            
                                        </div>

                                        {/* Shipping Address */}
                                        {order.shippingAddress && (
                                            <div className="mt-2 pt-2 border-top">
                                                <small className="text-muted">
                                                    <i className="fa-solid fa-location-dot me-1"></i>
                                                    {typeof order.shippingAddress === 'string' 
                                                        ? `Ship to: ${order.shippingAddress}`
                                                        : `Ship to: ${order.shippingAddress.fullName}, ${order.shippingAddress.city}`
                                                    }
                                                </small>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-5" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <i 
                                className="fa-solid fa-box-open mb-3"
                                style={{ fontSize: '3rem', color: colors.accent, opacity: 0.5 }}
                            ></i>
                            <p style={{ color: colors.bg, marginBottom: '10px' }}>
                                {currentUser ? "You haven't placed any orders yet." : "Please log in to view your orders."}
                            </p>
                            <p className="text-muted small mb-3">
                                Your order history will appear here after you make a purchase.
                            </p>
                            {!currentUser ? (
                                <Button
                                    style={{
                                        backgroundColor: colors.accent,
                                        border: 'none',
                                        color: colors.primary
                                    }}
                                    onClick={() => {
                                        handleClose();
                                        navigate('/login');
                                    }}
                                >
                                    <i className="fa-solid fa-sign-in-alt me-2"></i>
                                    Login
                                </Button>
                            ) : (
                                <Button
                                    style={{
                                        backgroundColor: colors.primary,
                                        border: 'none'
                                    }}
                                    onClick={() => {
                                        handleClose();
                                        navigate('/');
                                    }}
                                >
                                    <i className="fa-solid fa-shopping-bag me-2"></i>
                                    Start Shopping
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Quick Actions Footer */}
                    {orders.length > 0 && (
                        <div
                            style={{
                                borderTop: `2px solid ${colors.accent}30`,
                                padding: '15px',
                                backgroundColor: 'white'
                            }}
                        >
                            <div className="d-flex gap-2">
                               
                                <Button
                                    variant="outline-primary"
                                    style={{
                                        borderColor: colors.primary,
                                        color: colors.primary,
                                        flex: 1
                                    }}
                                    onClick={fetchOrders}
                                >
                                    <i className="fa-solid fa-refresh me-2"></i>
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    )}
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
}

export default OrdersDrawer;