import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import { Link } from 'react-router-dom';

// Colors matching the second UI theme
const colors = {
  bg: "#19535F",
  accent: "#0B7A75",
  highlight: "#D7C9AA",
  badge: "#7B2D26",
  lightBg: "#F0F3F5"
};

function CategoriesSection({ categories = [] }) {
    if (categories.length === 0) {
        return (
            <div className="py-5" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', minHeight: '50vh' }}>
                <Container>
                    <h2 className="text-center mb-4" style={{ color: colors.bg, fontWeight: '700', fontSize: '2.5rem' }}>
                        Browse Categories
                    </h2>
                    <div className="text-center py-5">
                        <p className="text-muted fs-5">No categories available at the moment</p>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div className="py-5" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', minHeight: '50vh' }}>
            {/* Animated Background Elements */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 0
            }}>
                <div style={{
                    position: 'absolute',
                    top: '25%',
                    left: '-5%',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: colors.bg,
                    mixBlendMode: 'multiply',
                    filter: 'blur(40px)',
                    opacity: 0.05,
                    animation: 'float 8s infinite ease-in-out'
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '25%',
                    right: '-5%',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: colors.accent,
                    mixBlendMode: 'multiply',
                    filter: 'blur(40px)',
                    opacity: 0.05,
                    animation: 'float 8s infinite ease-in-out 2s'
                }}></div>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '250px',
                    height: '250px',
                    borderRadius: '50%',
                    background: colors.highlight,
                    mixBlendMode: 'multiply',
                    filter: 'blur(40px)',
                    opacity: 0.05,
                    animation: 'pulse 4s infinite ease-in-out'
                }}></div>
            </div>

            <Container style={{ position: 'relative', zIndex: 1 }}>
                <h2 className="text-center mb-3" style={{ 
                    color: colors.bg, 
                    fontWeight: '700', 
                    fontSize: '2.5rem', 
                    position: 'relative' 
                }}>
                    Browse Categories
                    <div style={{ 
                        position: 'absolute', 
                        bottom: '-10px', 
                        left: '50%', 
                        transform: 'translateX(-50%)', 
                        width: '80px', 
                        height: '4px', 
                        background: `linear-gradient(90deg, ${colors.bg}, ${colors.accent})`,
                        borderRadius: '2px'
                    }}></div>
                </h2>
                <p className="text-center text-muted mb-5 fs-5">
                    Discover amazing products across different categories
                </p>
                
                <Row className="g-4 justify-content-center">
                    {categories.map((category, index) => (
                        <Col key={category._id} xs={6} sm={4} md={3} lg={2} className="d-flex justify-content-center">
                            <CategoryCard category={category} index={index} />
                        </Col>
                    ))}
                </Row>

                {/* Add CSS animations */}
                <style>
                    {`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(-20px) rotate(5deg); }
                    }
                    
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                    
                    .category-card:hover .hover-arrow {
                        opacity: 1 !important;
                        transform: translateX(0) scale(1) !important;
                    }
                    
                    .category-card:hover .border-glow {
                        opacity: 0.3 !important;
                    }
                    
                    .image-fallback {
                        display: none;
                    }
                    `}
                </style>
            </Container>
        </div>
    );
}

// Enhanced Category Card Component with BOTH Images and Animated Icons
function CategoryCard({ category, index }) {
    // Updated gradients to match second UI theme
    const gradients = [
        `linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent} 100%)`,
        `linear-gradient(135deg, ${colors.accent} 0%, #17a2b8 100%)`,
        `linear-gradient(135deg, ${colors.bg} 0%, #2C5530 100%)`,
        `linear-gradient(135deg, ${colors.badge} 0%, #C44536 100%)`,
        `linear-gradient(135deg, #2D3748 0%, #4A5568 100%)`,
        `linear-gradient(135deg, #744210 0%, ${colors.highlight} 100%)`,
        `linear-gradient(135deg, ${colors.accent} 0%, #2D936C 100%)`,
        `linear-gradient(135deg, ${colors.bg} 0%, #3A506B 100%)`
    ];

    // Colorful icons based on category name
    const getCategoryIcon = (categoryName) => {
        const icons = {
            'clothing': 'fa-shirt',
            'electronics': 'fa-laptop',
            'books': 'fa-book-open',
            'home': 'fa-house',
            'sports': 'fa-dumbbell',
            'toys': 'fa-gamepad',
            'jewelry': 'fa-gem',
            'automotive': 'fa-car',
            'furniture': 'fa-couch',
            'beauty': 'fa-spa',
            'shoes': 'fa-shoe-prints',
            'bags': 'fa-bag-shopping',
            'garden': 'fa-seedling',
            'kitchen': 'fa-utensils',
            'art': 'fa-palette',
            'music': 'fa-music',
            'pet': 'fa-paw',
            'baby': 'fa-baby',
            'tech': 'fa-microchip',
            'phone': 'fa-mobile',
            'tools': 'fa-tools',
            'health': 'fa-heart-pulse',
            'food': 'fa-utensils',
            'travel': 'fa-suitcase-rolling',
            'office': 'fa-briefcase'
        };

        const lowerName = categoryName.toLowerCase();
        for (const [key, icon] of Object.entries(icons)) {
            if (lowerName.includes(key)) {
                return icon;
            }
        }
        return 'fa-box';
    };

    const gradient = gradients[index % gradients.length];
    const categoryIcon = getCategoryIcon(category.name);
    const hasImage = category.image && category.image !== '';

    return (
        <Card 
            as={Link}
            to={`/category/${encodeURIComponent(category.name)}`}
            className="text-decoration-none text-center border-0 position-relative category-card"
            style={{
                width: '220px',
                height: '260px',
                borderRadius: '25px',
                transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                background: '#ffffff',
                overflow: 'hidden',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-15px) scale(1.08)';
                e.currentTarget.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.08)';
            }}
        >
            {/* Background Pattern with Animated Bubbles */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: gradient,
                opacity: hasImage ? 0.08 : 0.05,
                zIndex: 1
            }}></div>

            {/* Animated Floating Bubbles */}
            <div style={{
                position: 'absolute',
                top: '20%',
                left: '15%',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.3)',
                animation: 'float 6s infinite ease-in-out',
                zIndex: 2
            }}></div>
            <div style={{
                position: 'absolute',
                bottom: '25%',
                right: '20%',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.4)',
                animation: 'float 8s infinite ease-in-out 1s',
                zIndex: 2
            }}></div>
            <div style={{
                position: 'absolute',
                top: '60%',
                left: '70%',
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                animation: 'float 7s infinite ease-in-out 2s',
                zIndex: 2
            }}></div>

            {/* Main Content */}
            <div className="position-relative z-3 d-flex flex-column h-100">
                {/* Image Section with Animated Icon Overlay */}
                <div style={{ 
                    position: 'relative', 
                    height: '160px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    overflow: 'hidden'
                }}>
                    {/* Database Image Background */}
                    {hasImage && (
                        <img
                            src={category.image}
                            alt={category.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.5s ease'
                            }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                const fallback = e.target.nextElementSibling;
                                if (fallback) fallback.style.display = 'flex';
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                            }}
                        />
                    )}

                    {/* Animated Icon Bubble (Always Visible) */}
                    <div style={{
                        position: 'absolute',
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: hasImage ? 'rgba(255,255,255,0.95)' : gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: hasImage 
                            ? '0 15px 35px rgba(0, 0, 0, 0.15)' 
                            : '0 15px 35px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.4s ease',
                        border: hasImage ? `3px solid ${gradient}` : 'none',
                        animation: 'pulse 3s infinite ease-in-out'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.15) rotate(8deg)';
                        e.currentTarget.style.background = hasImage ? gradient : 'white';
                        e.currentTarget.style.color = hasImage ? 'white' : colors.bg;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                        e.currentTarget.style.background = hasImage ? 'rgba(255,255,255,0.95)' : gradient;
                        e.currentTarget.style.color = hasImage ? colors.bg : 'white';
                    }}
                    >
                        <i className={`fa-solid ${categoryIcon}`} style={{ 
                            fontSize: '2.5rem',
                            transition: 'all 0.3s ease',
                            color: hasImage ? gradient : 'white'
                        }}></i>
                    </div>

                    {/* Floating Particles Around the Bubble */}
                    <div style={{
                        position: 'absolute',
                        top: '30%',
                        right: '25%',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: gradient,
                        opacity: 0.7,
                        animation: 'float 4s infinite ease-in-out'
                    }}></div>
                    <div style={{
                        position: 'absolute',
                        bottom: '35%',
                        left: '25%',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: gradient,
                        opacity: 0.5,
                        animation: 'float 5s infinite ease-in-out 0.5s'
                    }}></div>
                    <div style={{
                        position: 'absolute',
                        top: '45%',
                        right: '15%',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: gradient,
                        opacity: 0.6,
                        animation: 'float 3.5s infinite ease-in-out 1s'
                    }}></div>

                    {/* Image Fallback (Only shows if image fails to load) */}
                    {hasImage && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: gradient,
                            color: 'white'
                        }}
                        className="image-fallback"
                        >
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <i className={`fa-solid ${categoryIcon}`} style={{ fontSize: '2rem' }}></i>
                            </div>
                        </div>
                    )}

                    {/* Dark Overlay for Images for Better Contrast */}
                    {hasImage && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
                            opacity: 0.3
                        }}></div>
                    )}
                </div>
                
                {/* Text Content */}
                <Card.Body className="d-flex flex-column justify-content-center position-relative z-3" 
                    style={{ 
                        padding: '1.5rem', 
                        flex: '1'
                    }}>
                    <Card.Title style={{ 
                        color: colors.bg, 
                        fontWeight: '800', 
                        fontSize: '1.1rem', 
                        marginBottom: '0.75rem',
                        textTransform: 'capitalize',
                        letterSpacing: '0.5px'
                    }}>
                        {category.name}
                    </Card.Title>
                    
                    {/* Item Count with Enhanced Badge */}
                    <div style={{ 
                        color: 'white', 
                        fontSize: '0.8rem', 
                        fontWeight: '700',
                        background: gradient,
                        padding: '6px 16px',
                        borderRadius: '15px',
                        display: 'inline-block',
                        margin: '0 auto',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                        border: '2px solid white'
                    }}>
                        {category.itemsCount || 0} {category.itemsCount === 1 ? 'item' : 'items'}
                    </div>
                </Card.Body>

                {/* Enhanced Hover Arrow Indicator */}
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1rem',
                    opacity: 0,
                    transform: 'translateX(15px) scale(0.8)',
                    transition: 'all 0.4s ease',
                    zIndex: 4,
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)'
                }}
                className="hover-arrow"
                >
                    <i className="fa-solid fa-arrow-right"></i>
                </div>
            </div>

            {/* Enhanced Border Glow Effect */}
            <div style={{
                position: 'absolute',
                top: '-3px',
                left: '-3px',
                right: '-3px',
                bottom: '-3px',
                borderRadius: '28px',
                background: gradient,
                opacity: 0,
                transition: 'opacity 0.4s ease',
                zIndex: 0,
                filter: 'blur(8px)'
            }}
            className="border-glow"
            ></div>
        </Card>
    );
}

export default CategoriesSection;