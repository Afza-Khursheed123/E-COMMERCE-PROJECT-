import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import colors from '../../theme';
import { Link } from 'react-router-dom';

function FeaturedProduct({ featuredProducts = [] }) {
    if (featuredProducts.length === 0) {
        return (
            <div className="py-5" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)' }}>
                <Container>
                    <h2 className="text-center mb-4" style={{ color: colors.badge, fontWeight: '700', fontSize: '2.5rem' }}>
                        Featured Products
                    </h2>
                    <div className="text-center py-5">
                        <p className="text-muted fs-5">No featured products available at the moment</p>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div className="py-5" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)' }}>
            <Container>
                <h2 className="text-center mb-3" style={{ color: colors.badge, fontWeight: '700', fontSize: '2.5rem', position: 'relative' }}>
                    Featured Products
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
                <p className="text-center text-muted mb-5 fs-5">
                    Discover our handpicked selection of quality items
                </p>
                
                {/* First Row */}
                {featuredProducts.slice(0, 4).length > 0 && (
                    <Row className="g-4 mb-4">
                        {featuredProducts.slice(0, 4).map(product => (
                            <Col key={product._id} xs={12} sm={6} md={3}>
                                <ProductCard product={product} />
                            </Col>
                        ))}
                    </Row>
                )}
                
                {/* Second Row */}
                {featuredProducts.slice(4, 8).length > 0 && (
                    <Row className="g-4">
                        {featuredProducts.slice(4, 8).map(product => (
                            <Col key={product._id} xs={12} sm={6} md={3}>
                                <ProductCard product={product} />
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>
        </div>
    );
}

// Product Card Component
function ProductCard({ product }) {
    return (
        <Card 
            as={Link}
            to={`/products/${product._id}`}
            className="text-decoration-none h-100 border-0 shadow-sm"
            style={{
                borderRadius: '16px',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                background: '#ffffff',
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
            }}
        >
            <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                <Card.Img 
                    variant="top" 
                    src={product.image || (product.images && product.images[0]) || 'https://via.placeholder.com/300x200.png?text=No+Image'} 
                    style={{ 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease'
                    }}
                    onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200.png?text=No+Image';
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                    }}
                />
                
                {/* Hover Overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(25, 83, 95, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0';
                }}
                >
                    <span style={{ 
                        color: 'white', 
                        background: '#D7C9AA', 
                        padding: '10px 20px', 
                        borderRadius: '25px', 
                        fontWeight: '600', 
                        fontSize: '0.9rem' 
                    }}>
                        View Details
                    </span>
                </div>

                {/* Condition Badge */}
                {product.condition && (
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: '#0B7A75',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                    }}>
                        {product.condition}
                    </div>
                )}
            </div>
            
            <Card.Body className="d-flex flex-column" style={{ padding: '1.5rem' }}>
                <Card.Title style={{ 
                    color: colors.bg, 
                    fontWeight: '700', 
                    fontSize: '1.1rem', 
                    marginBottom: '0.5rem',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: '2',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {product.name}
                </Card.Title>
                
                <div className="mb-3">
                    <span style={{ 
                        color: '#6c757d', 
                        fontSize: '0.85rem', 
                        background: '#f8f9fa', 
                        padding: '4px 8px', 
                        borderRadius: '6px',
                        textTransform: 'capitalize'
                    }}>
                        {product.category || 'General'}
                    </span>
                </div>
                
                <div className="mt-auto">
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <span style={{ color: '#28a745', fontWeight: '700', fontSize: '1.25rem' }}>
                            ${product.price}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                            <span style={{ color: '#6c757d', textDecoration: 'line-through', fontSize: '0.9rem' }}>
                                ${product.originalPrice}
                            </span>
                        )}
                    </div>
                    
                    <button 
                        className="btn w-100 border-2 d-flex align-items-center justify-content-center gap-2"
                        style={{ 
                            borderColor: '#D7C9AA', 
                            color: colors.bg, 
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            padding: '8px 16px',
                            background: 'transparent',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#D7C9AA';
                            e.target.style.color = 'white';
                            e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = colors.bg;
                            e.target.style.transform = 'translateY(0)';
                        }}
                        onClick={(e) => e.preventDefault()}
                    >
                        <i className="fa-regular fa-eye"></i> Quick View
                    </button>
                </div>
            </Card.Body>
        </Card>
    );
}

export default FeaturedProduct;