import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import api from '../api';
import colors from '../theme';

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [user, setUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [paymentMessage, setPaymentMessage] = useState('');
    const [orderDetails, setOrderDetails] = useState(null);
    
    // Form states
    const [shippingAddress, setShippingAddress] = useState({
        fullName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
    });

    useEffect(() => {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser) {
            alert('Please log in to checkout');
            navigate('/login');
            return;
        }
        setUser(currentUser);

        // Check for Stripe return parameters
        const sessionId = searchParams.get("session_id");
        const success = searchParams.get("success");
        const canceled = searchParams.get("canceled");

        if (success && sessionId) {
            handleSuccessfulPayment(sessionId);
        } else if (canceled) {
            handleCanceledPayment();
        } else {
            // Normal checkout flow - load products
            if (location.state?.selectedProducts) {
                setProducts(location.state.selectedProducts);
            } else {
                fetchCartItems(currentUser);
            }

            // Pre-fill user data if available
            if (currentUser) {
                setShippingAddress(prev => ({
                    ...prev,
                    fullName: currentUser.name || currentUser.username || '',
                }));
            }
        }
    }, [location, navigate, searchParams]);

    // ✅ FIXED: Create order with proper product IDs and payment method
    const createOrder = async (paymentMethod = "stripe", sessionData = {}) => {
        try {
            // Ensure user data is available
            if (!user || !user._id && !user.id) {
                throw new Error('User information is missing');
            }

            const userId = user._id || user.id;
            const userEmail = user.email || 'unknown@example.com';
            const buyerName = user.name || user.username || 'Customer';

            // Combine product names for display
            const displayProductName = products.length === 1 ? products[0].productName : `Multiple Products (${products.length})`;

            const orderData = {
                userId: userId,
                // ✅ Store product IDs as array, not as "multiple"
                productId: products.map(product => product.productId),
                products: products.map(product => ({
                    productId: product.productId,
                    productName: product.productName,
                    price: product.price,
                    quantity: product.quantity,
                    image: product.image
                })),
                // ✅ Set status based on payment method: 'pending' for COD, 'Completed' for stripe
                status: paymentMethod === "stripe" ? "Completed" : "pending",
                totalAmount: calculateTotal(),
                paymentMethod: paymentMethod,
                shippingAddress: `${shippingAddress.fullName}, ${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.zipCode}, ${shippingAddress.country}`,
                customerEmail: userEmail,
                buyerName: buyerName,
                productName: displayProductName,
                price: calculateTotal(),
                sellerName: 'Thriftify',
                subtotal: calculateSubtotal(),
                tax: calculateTax(),
                ...(paymentMethod === "stripe" && {
                  sessionId: sessionData.id,
                  paymentIntentId: sessionData.payment_intent
                })
            };

            console.log("📦 Creating order with data:", orderData);
            
            const response = await api.post("/orders", orderData);
            console.log("✅ Order created:", response.data);
            return response.data;
        } catch (error) {
            console.error("❌ Order creation error:", error);
            console.error("Error response:", error.response?.data);
            throw error;
        }
    };

    const handleSuccessfulPayment = async (sessionId) => {
        setPaymentStatus('processing');
        try {
            console.log("🔍 Verifying payment...");
            
            const response = await api.get(`/api/stripe/verify-payment/${sessionId}`);
            console.log("✅ Payment verified:", response.data);

            if (response.data.success && response.data.paymentStatus === 'paid') {
                setPaymentStatus('success');
                setOrderDetails(response.data.order);
                setPaymentMessage(
                    `Payment of $${response.data.amountTotal} received successfully! `
                );

                // Clear cart after successful payment
                if (user && products.length > 0) {
                    try {
                        await api.post('/cart/removeMultiple', {
                            userId: user._id || user.id,
                            productIds: products.map(p => p.productId)
                        });
                        console.log("🛒 Cart cleared after successful payment");
                    } catch (error) {
                        console.error("Error clearing cart:", error);
                    }
                }
            } else {
                setPaymentStatus('canceled');
                setPaymentMessage("Payment verification failed. Please contact support with your order details.");
            }
        } catch (error) {
            console.error("❌ Error verifying payment:", error);
            setPaymentStatus('canceled');
            setPaymentMessage(
                "Unable to verify payment status. Please contact support if amount was deducted."
            );
        }
    };

    const handleCanceledPayment = () => {
        setPaymentStatus('canceled');
        setPaymentMessage("Payment was canceled. You can continue shopping and checkout when you're ready.");
    };

    const fetchCartItems = async (currentUser) => {
        try {
            setLoading(true);
            const userId = currentUser._id || currentUser.id;
            const res = await api.get(`/cart/user/${userId}`);
            
            if (res.data && res.data.items) {
                const itemsWithDetails = await Promise.all(
                    res.data.items.map(async (item) => {
                        try {
                            const productRes = await api.get(`/products/${item.productId}?userId=${userId}`);
                            return {
                                productId: item.productId,
                                productName: productRes.data.name,
                                // Prefer cart item's stored price (server-updated finalPrice) over product.price
                                price: (item.price !== undefined && item.price !== null) ? item.price : productRes.data.price,
                                quantity: item.quantity,
                                image: productRes.data.images?.[0] || '/placeholder.jpg',
                                // ✅ Store seller information
                                sellerName: productRes.data.userName || 'Unknown Seller',
                                sellerId: productRes.data.userId
                            };
                        } catch (error) {
                            console.error(`Error fetching product ${item.productId}:`, error);
                            return {
                                productId: item.productId,
                                productName: `Product ${item.productId}`,
                                price: item.price || 0,
                                quantity: item.quantity,
                                image: '/placeholder.jpg',
                                sellerName: 'Unknown Seller',
                                sellerId: null
                            };
                        }
                    })
                );
                setProducts(itemsWithDetails.filter(item => item.price > 0));
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
            alert('Failed to load cart items');
        } finally {
            setLoading(false);
        }
    };

    const calculateSubtotal = () => {
        return products.reduce((total, product) => {
            return total + (product.price * (product.quantity || 1));
        }, 0);
    };

    const calculateTax = () => {
        return calculateSubtotal() * 0.08; // 8% tax
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax();
    };

    const handleCashOnDelivery = async () => {
        if (!user) return;

        // Validate form
        if (!shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city || 
            !shippingAddress.state || !shippingAddress.zipCode) {
            alert('Please fill in all shipping details');
            return;
        }

        if (products.length === 0) {
            alert('No products to checkout');
            return;
        }

        setProcessing(true);
        try {
            // Calculate proper totals
            const subtotal = calculateSubtotal();
            const tax = calculateTax();
            const total = calculateTotal();

            console.log("💰 COD Order - Calculated totals:", { subtotal, tax, total });
            console.log("📦 Products to checkout:", products);

            // Create order with cash on delivery payment method (status will be set to "pending")
            const orderResult = await createOrder("cash_on_delivery");
            console.log("✅ COD Order created successfully with pending status", orderResult);

            const orderId = orderResult?.data?._id || orderResult?._id || orderResult?.insertedId || orderResult?.orderId;

            // ✅ NEW: Create payment document for COD
            try {
                // Get seller name from first product (usually single seller per order)
                const sellerName = products[0]?.sellerName || 'Unknown Seller';

                const paymentData = {
                    orderId: orderId,
                    status: "Pending",
                    totalAmount: total,
                    paymentMethod: "cash_on_delivery",
                    customerEmail: user.email || 'unknown@example.com',
                    productName: products.length === 1 ? products[0].productName : `Multiple Products (${products.length})`,
                    buyerName: user.name || user.username || 'Customer',
                    sellerName: sellerName,
                    price: total
                };

                console.log("💳 Creating payment record for COD:", paymentData);
                
                // POST to backend payments route (mounted at /admin/payment)
                const paymentResponse = await api.post('/admin/payment', paymentData);
                console.log("✅ Payment record created successfully:", paymentResponse.data);
            } catch (paymentError) {
                console.error("⚠️ Error creating payment record:", paymentError);
                console.warn("Order was created successfully, but payment record creation failed. This can be recovered manually.");
            }

            // Store order details for success message
            setOrderDetails(orderResult.data || orderResult);
            setPaymentMessage(`Your order has been placed successfully! You will pay $${total.toFixed(2)} when your package arrives. Order ID: ${orderId || 'Pending'}`);
            
            // Show success message
            setPaymentStatus('cod_success');
            
            // Clear processing state
            setProcessing(false);
            
            // DO NOT auto-redirect for COD - let user see success message
            // Clear cart after user closes success message
            localStorage.removeItem('cart');

        } catch (error) {
            console.error('Cash on Delivery checkout error:', error);
            console.error('Error details:', error.response?.data || error.message);
            alert('Failed to place order: ' + (error.response?.data?.message || error.message || 'Please try again.'));
            setProcessing(false);
        }
    };

    const handleStripeCheckout = async () => {
        if (!user) return;

        // Validate form
        if (!shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city || 
            !shippingAddress.state || !shippingAddress.zipCode) {
            alert('Please fill in all shipping details');
            return;
        }

        if (products.length === 0) {
            alert('No products to checkout');
            return;
        }

        setProcessing(true);
        try {
            // Calculate proper totals
            const subtotal = calculateSubtotal();
            const tax = calculateTax();
            const total = calculateTotal();

            console.log("💰 Calculated totals:", { subtotal, tax, total });
            console.log("📦 Products to checkout:", products);

            // Create Stripe checkout session with proper data
            const response = await api.post('/api/stripe/create-checkout-session', {
                amount: Math.round(total * 100), // Convert to cents
                customerEmail: user.email,
                productName: products.length === 1 ? products[0].productName : `Order with ${products.length} items`,
                userId: user._id || user.id,
                products: products,
                shippingAddress: shippingAddress,
                subtotal: subtotal,
                tax: tax,
                total: total
            });

            if (response.data.url) {
                // ✅ FIXED: Create order with stripe payment method
                try {
                    await createOrder("stripe", response.data.session);
                    console.log("✅ Order created for stripe payment");
                } catch (orderError) {
                    console.error("⚠️ Order creation failed, but continuing with payment:", orderError);
                    // Continue with payment even if order creation fails
                }
                
                // Redirect to Stripe
                window.location.href = response.data.url;
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (error) {
            console.error('Stripe checkout error:', error);
            alert('Failed to process payment. Please try again.');
            setProcessing(false);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount || isNaN(amount)) return "$0.00";
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    // Payment Success Component - FIXED
    const PaymentSuccessMessage = () => {
        // Use order details from verification response
        const displayProducts = orderDetails?.products || products;
        const displaySubtotal = orderDetails?.subtotal || calculateSubtotal();
        const displayTax = orderDetails?.tax || calculateTax();
        const displayTotal = orderDetails?.totalAmount || calculateTotal();
        const isCOD = paymentStatus === 'cod_success';

        return (
            <Container fluid style={{ background: colors.light, minHeight: '100vh', padding: '2rem 0' }}>
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <Card style={{ 
                                borderRadius: '20px', 
                                border: 'none', 
                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                padding: '40px'
                            }}>
                                <div style={{ 
                                    width: '80px', 
                                    height: '80px', 
                                    borderRadius: '50%', 
                                    backgroundColor: '#19535F',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '36px',
                                    margin: '0 auto 20px'
                                }}>
                                    ✓
                                </div>
                                
                                <h2 style={{ color: colors.primary, marginBottom: '20px', textAlign: 'center' }}>
                                    {isCOD ? 'Order Placed Successfully!' : 'Payment Successful!'}
                                </h2>
                                
                                <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '30px', color: colors.bg, textAlign: 'center' }}>
                                    {paymentMessage}
                                </p>

                                {/* Order Details */}
                                <div style={{ 
                                    backgroundColor: '#D7C9AA', 
                                    padding: '25px', 
                                    borderRadius: '10px',
                                    marginBottom: '30px'
                                }}>
                                    <h5 style={{ color: colors.primary, marginBottom: '20px', borderBottom: '2px solid #dee2e6', paddingBottom: '10px' }}>
                                        Order Summary
                                    </h5>
                                    
                                    {/* Order ID */}
                                    {orderDetails && (
                                        <div className="d-flex justify-content-between mb-3">
                                            <strong>Order ID:</strong>
                                            <span>#{orderDetails._id || orderDetails.orderId}</span>
                                        </div>
                                    )}
                                    
                                    {/* Products */}
                                    {displayProducts.map((product, index) => (
                                        <div key={index} className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                                            <div className="d-flex align-items-center">
                                                <img 
                                                    src={product.image} 
                                                    alt={product.productName}
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        objectFit: 'cover',
                                                        borderRadius: '8px',
                                                        marginRight: '15px'
                                                    }}
                                                    onError={(e) => {
                                                        e.target.src = '/placeholder.jpg';
                                                    }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: '600' }}>{product.productName}</div>
                                                    <small className="text-muted">
                                                        Qty: {product.quantity} × {formatCurrency(product.price)}
                                                    </small>
                                                    <br />
                                                    <small className="text-muted">
                                                        Product ID: {product.productId}
                                                    </small>
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: '600' }}>
                                                {formatCurrency(product.price * (product.quantity || 1))}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Totals */}
                                    <div className="mt-4">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Subtotal:</span>
                                            <span>{formatCurrency(displaySubtotal)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Tax (8%):</span>
                                            <span>{formatCurrency(displayTax)}</span>
                                        </div>
                                        <hr />
                                        <div className="d-flex justify-content-between fw-bold fs-5">
                                            <span>Total:</span>
                                            <span style={{ color: colors.primary }}>{formatCurrency(displayTotal)}</span>
                                        </div>
                                    </div>

                                    {/* Shipping Address */}
                                    {orderDetails?.shippingAddress && (
                                        <div className="mt-4 pt-3 border-top">
                                            <h6 style={{ color: colors.primary }}>Shipping Address</h6>
                                            <p className="mb-0" style={{ color: colors.bg }}>
                                                {orderDetails.shippingAddress}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="d-flex gap-3 justify-content-center">
                                   
                                    
                                    <Button
                                        variant="outline-primary"
                                        style={{
                                            borderColor: colors.primary,
                                            color: colors.primary,
                                            padding: '12px 30px',
                                            borderRadius: '8px'
                                        }}
                                        onClick={() => navigate('/')}
                                    >
                                        <i className="fa-solid fa-shopping-bag me-2"></i>
                                        Continue Shopping
                                    </Button>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </Container>
        );
    };

    // Payment Canceled Message
    const PaymentCanceledMessage = () => (
        <Container fluid style={{ background: colors.light, minHeight: '100vh', padding: '2rem 0' }}>
            <Container>
                <Row className="justify-content-center">
                    <Col lg={6}>
                        <Card style={{ 
                            borderRadius: '20px', 
                            border: 'none', 
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                            textAlign: 'center',
                            padding: '40px'
                        }}>
                            <div style={{ 
                                width: '80px', 
                                height: '80px', 
                                borderRadius: '50%', 
                                backgroundColor: '#dc3545',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '36px',
                                margin: '0 auto 20px'
                            }}>
                                ✕
                            </div>
                            
                            <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>
                                Payment Canceled
                            </h2>
                            
                            <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '30px', color: colors.bg }}>
                                {paymentMessage}
                            </p>

                            <div className="d-flex gap-3 justify-content-center">
                                <Button
                                    style={{
                                        backgroundColor: colors.primary,
                                        border: 'none',
                                        padding: '12px 30px'
                                    }}
                                    onClick={() => {
                                        setPaymentStatus(null);
                                        setPaymentMessage('');
                                    }}
                                >
                                    <i className="fa-solid fa-arrow-left me-2"></i>
                                    Back to Checkout
                                </Button>
                                
                                <Button
                                    variant="outline-primary"
                                    style={{
                                        borderColor: colors.primary,
                                        color: colors.primary,
                                        padding: '12px 30px'
                                    }}
                                    onClick={() => navigate('/')}
                                >
                                    <i className="fa-solid fa-home me-2"></i>
                                    Go Home
                                </Button>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </Container>
    );

    // Show payment status messages if applicable
    if (paymentStatus === 'success' || paymentStatus === 'cod_success') {
        return <PaymentSuccessMessage />;
    }

    if (paymentStatus === 'canceled') {
        return <PaymentCanceledMessage />;
    }

    if (paymentStatus === 'processing') {
        return (
            <Container fluid style={{ background: colors.light, minHeight: '100vh', padding: '2rem 0' }}>
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={6} className="text-center">
                            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                            <h3 className="mt-3">Verifying Payment...</h3>
                            <p>Please wait while we confirm your payment.</p>
                        </Col>
                    </Row>
                </Container>
            </Container>
        );
    }

    // Normal checkout flow
    if (loading) {
        return (
            <Container className="text-center mt-5">
                <div className="spinner-border text-primary"></div>
                <div className="mt-2">Loading checkout...</div>
            </Container>
        );
    }

    if (products.length === 0) {
        return (
            <Container className="text-center mt-5">
                <h2>No items to checkout</h2>
                <Button onClick={() => navigate('/')} style={{ backgroundColor: colors.primary }}>
                    Continue Shopping
                </Button>
            </Container>
        );
    }

    return (
        <Container fluid style={{ background: colors.light, minHeight: '100vh', padding: '2rem 0' }}>
            <Container>
                <Row className="g-4">
                    {/* Order Summary */}
                    <Col lg={8}>
                        <Card style={{ borderRadius: '15px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                            <Card.Header style={{ backgroundColor: colors.primary, color: 'white', borderRadius: '15px 15px 0 0' }}>
                                <h4 className="mb-0">Order Summary</h4>
                            </Card.Header>
                            <Card.Body>
                                {products.map((product, index) => (
                                    <div key={index} className="d-flex align-items-center mb-3 p-3" style={{ borderBottom: '1px solid #eee' }}>
                                        <img 
                                            src={product.image} 
                                            alt={product.productName}
                                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginRight: '15px' }}
                                            onError={(e) => {
                                                e.target.src = '/placeholder.jpg';
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <h6 style={{ color: colors.dark, marginBottom: '5px' }}>{product.productName}</h6>
                                            <p style={{ color: colors.accent, fontWeight: '600', margin: 0 }}>
                                                {formatCurrency(product.price)} × {product.quantity}
                                            </p>
                                            <small className="text-muted">Product ID: {product.productId}</small>
                                        </div>
                                        <div style={{ fontWeight: '600', color: colors.primary }}>
                                            {formatCurrency(product.price * product.quantity)}
                                        </div>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>

                        {/* Shipping Address */}
                        <Card className="mt-4" style={{ borderRadius: '15px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                            <Card.Header style={{ backgroundColor: colors.primary, color: 'white', borderRadius: '15px 15px 0 0' }}>
                                <h4 className="mb-0">Shipping Address</h4>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Full Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={shippingAddress.fullName}
                                                onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Address *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={shippingAddress.address}
                                                onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>City *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={shippingAddress.city}
                                                onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>State *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={shippingAddress.state}
                                                onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>ZIP Code *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={shippingAddress.zipCode}
                                                onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Payment Method */}
                        <Card className="mt-4" style={{ borderRadius: '15px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                            <Card.Header style={{ backgroundColor: colors.primary, color: 'white', borderRadius: '15px 15px 0 0' }}>
                                <h4 className="mb-0">Payment Method</h4>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    {/* Cash on Delivery Option */}
                                    <Col md={6}>
                                        <div style={{ 
                                            backgroundColor: '#f0f3f5', 
                                            color: colors.bg,
                                            padding: '20px', 
                                            borderRadius: '10px',
                                            border: '2px solid #dee2e6',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            textAlign: 'center'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.borderColor = colors.accent;
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.borderColor = '#dee2e6';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                        >
                                            <i className="fa-solid fa-money-bill-wave fa-2x mb-3" style={{ color: colors.accent }}></i>
                                            <h6 style={{ color: colors.bg, fontWeight: '600', marginBottom: '10px' }}>Cash on Delivery</h6>
                                            <p style={{ fontSize: '0.85rem', color: colors.bg, opacity: 0.8, marginBottom: '15px' }}>
                                                Pay when you receive your order
                                            </p>
                                            <Button
                                                onClick={handleCashOnDelivery}
                                                disabled={processing}
                                                style={{
                                                    backgroundColor: colors.accent,
                                                    border: 'none',
                                                    color: colors.bg,
                                                    width: '100%',
                                                    fontWeight: '600',
                                                    padding: '10px'
                                                }}
                                            >
                                                {processing ? 'Processing...' : 'Choose COD'}
                                            </Button>
                                        </div>
                                    </Col>

                                    {/* Pay Online Option */}
                                    <Col md={6}>
                                        <div style={{ 
                                            backgroundColor: '#e7f5ff', 
                                            color: colors.bg,
                                            padding: '20px', 
                                            borderRadius: '10px',
                                            border: '2px solid #6772e5',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            textAlign: 'center'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(103, 114, 229, 0.2)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                        >
                                            <i className="fa-brands fa-stripe fa-2x mb-3" style={{ color: '#6772e5' }}></i>
                                            <h6 style={{ color: colors.bg, fontWeight: '600', marginBottom: '10px' }}>Pay Online</h6>
                                            <p style={{ fontSize: '0.85rem', color: colors.bg, opacity: 0.8, marginBottom: '15px' }}>
                                                Secure payment via Stripe
                                            </p>
                                            <Button
                                                onClick={handleStripeCheckout}
                                                disabled={processing}
                                                style={{
                                                    backgroundColor: '#6772e5',
                                                    border: 'none',
                                                    color: 'white',
                                                    width: '100%',
                                                    fontWeight: '600',
                                                    padding: '10px'
                                                }}
                                            >
                                                {processing ? 'Processing...' : 'Pay with Card'}
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>

                                <div style={{ 
                                    backgroundColor: '#f8f9fa', 
                                    padding: '15px', 
                                    borderRadius: '8px',
                                    border: '1px solid #dee2e6',
                                    marginTop: '20px'
                                }}>
                                    <small className="text-muted">
                                        <i className="fa-solid fa-lock me-2"></i>
                                        All transactions are secure and encrypted.
                                    </small>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Order Total & Checkout */}
                    <Col lg={4}>
                        <Card style={{ position: 'sticky', top: '20px', borderRadius: '15px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                            <Card.Header style={{ backgroundColor: colors.secondary, color: 'white', borderRadius: '15px 15px 0 0' }}>
                                <h4 className="mb-0">Order Total</h4>
                            </Card.Header>
                            <Card.Body>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(calculateSubtotal())}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Tax (8%):</span>
                                    <span>{formatCurrency(calculateTax())}</span>
                                </div>
                                <hr />
                                <div className="d-flex justify-content-between mb-3" style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                                    <span>Total:</span>
                                    <span style={{ color: colors.primary }}>{formatCurrency(calculateTotal())}</span>
                                </div>
                                
                                <Button
                                    onClick={handleStripeCheckout}
                                    disabled={processing}
                                    style={{
                                        backgroundColor: processing ? colors.accent : '#6772e5',
                                        border: 'none',
                                        color: 'white',
                                        width: '100%',
                                        padding: '12px',
                                        fontWeight: '600',
                                        fontSize: '1.1rem',
                                        borderRadius: '8px'
                                    }}
                                >
                                    {processing ? (
                                        <>
                                            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-brands fa-stripe me-2"></i>
                                            Pay with Stripe - {formatCurrency(calculateTotal())}
                                        </>
                                    )}
                                </Button>
                                
                                <div className="text-center mt-3">
                                    <Button 
                                        variant="link" 
                                        onClick={() => navigate(-1)}
                                        style={{ color: colors.primary }}
                                    >
                                        ← Back to Cart
                                    </Button>
                                </div>

                                {/* Security Badges */}
                                <div className="text-center mt-3">
                                    <small className="text-muted">
                                        <i className="fa-solid fa-shield-alt me-1"></i>
                                        PCI Compliant • 
                                        <i className="fa-solid fa-lock me-1 ms-2"></i>
                                        256-bit SSL • 
                                        <i className="fa-solid fa-check me-1 ms-2"></i>
                                        Stripe Verified
                                    </small>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </Container>
    );
};

export default CheckoutPage;