import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Container from 'react-bootstrap/Container';
import colors from "../../theme";

// Categories Component (for categories page)
function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                console.log("🔄 Fetching categories from API...");
                const res = await axios.get('http://localhost:3000/category');
                console.log("✅ Categories API response:", res.data);
                
                if (res.data && res.data.length > 0) {
                    setCategories(res.data);
                } else {
                    console.log("📭 No categories found in API response, using fallback data");
                    // Use the same fallback data as your homepage
                    setCategories([
                        { _id: 1, name: 'Clothing', itemsCount: 24, image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=300&h=180&fit=crop' },
                        { _id: 2, name: 'Electronics', itemsCount: 18, image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=180&fit=crop' },
                        { _id: 3, name: 'Books', itemsCount: 32, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=180&fit=crop' },
                        { _id: 4, name: 'Home & Garden', itemsCount: 15, image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=180&fit=crop' },
                        { _id: 5, name: 'Sports', itemsCount: 12, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=180&fit=crop' },
                        { _id: 6, name: 'Toys', itemsCount: 8, image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=300&h=180&fit=crop' },
                        { _id: 7, name: 'Jewelry', itemsCount: 21, image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=180&fit=crop' },
                        { _id: 8, name: 'Automotive', itemsCount: 6, image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=300&h=180&fit=crop' }
                    ]);
                }
            } catch (error) {
                console.error("❌ Categories fetch error:", error);
                // Fallback data
                setCategories([
                    { _id: 1, name: 'Clothing', itemsCount: 24, image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=300&h=180&fit=crop' },
                    { _id: 2, name: 'Electronics', itemsCount: 18, image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=180&fit=crop' },
                    { _id: 3, name: 'Books', itemsCount: 32, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=180&fit=crop' },
                    { _id: 4, name: 'Home & Garden', itemsCount: 15, image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=180&fit=crop' },
                    { _id: 5, name: 'Sports', itemsCount: 12, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=180&fit=crop' },
                    { _id: 6, name: 'Toys', itemsCount: 8, image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=300&h=180&fit=crop' },
                    { _id: 7, name: 'Jewelry', itemsCount: 21, image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=180&fit=crop' },
                    { _id: 8, name: 'Automotive', itemsCount: 6, image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=300&h=180&fit=crop' }
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="py-5" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' }}>
                <Container>
                    <h2 className="text-center mb-4" style={{ color: colors.badge, fontWeight: '700', fontSize: '2.5rem' }}>
                        Browse Categories
                    </h2>
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                        <p className="mt-3 text-muted fs-5">Loading categories...</p>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div className="py-5" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' }}>
            <Container>
                <h2 className="text-center mb-3" style={{ 
                    color: colors.badge, 
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
                        background: 'linear-gradient(90deg, #0B7A75, #D7C9AA)',
                        borderRadius: '2px'
                    }}></div>
                </h2>
                <p className="text-center text-muted mb-5 fs-5">
                    Discover amazing products across different categories
                </p>
                
                <Row className="g-4 justify-content-center">
                    {categories.map((category, index) => (
                        <Col key={category._id || index} xs={6} sm={4} md={3} lg={2} className="d-flex justify-content-center">
                            <CategoryCard category={category} index={index} />
                        </Col>
                    ))}
                </Row>

                {/* Add CSS animations */}
                <style>
                    {`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(-10px) rotate(5deg); }
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
    // Vibrant gradient colors for the animated bubbles
    const gradients = [
        'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
        'linear-gradient(135deg, #48DBFB 0%, #6F86FF 100%)',
        'linear-gradient(135deg, #FF9A8B 0%, #FF6A88 55%, #FF99AC 100%)',
        'linear-gradient(135deg, #42E695 0%, #3BB2B8 100%)',
        'linear-gradient(135deg, #FFD26F 0%, #FF7B54 100%)',
        'linear-gradient(135deg, #A78BFA 0%, #F87171 100%)',
        'linear-gradient(135deg, #60A5FA 0%, #34D399 100%)',
        'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
        'linear-gradient(135deg, #C084FC 0%, #F472B6 100%)',
        'linear-gradient(135deg, #2DD4BF 0%, #06B6D4 100%)',
        'linear-gradient(135deg, #FB7185 0%, #F43F5E 100%)',
        'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)'
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
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-15px) scale(1.08)';
                e.currentTarget.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
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
                opacity: hasImage ? 0.15 : 0.1,
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
                            ? '0 15px 35px rgba(0, 0, 0, 0.2)' 
                            : '0 15px 35px rgba(0, 0, 0, 0.25)',
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
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
                            opacity: 0.4
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
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
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
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)'
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

// Enhanced CategoryPage Component
function CategoryPage() {
    const { categoryName } = useParams();
    const [data, setData] = useState(null);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);

    // active filters
    const [sortOption, setSortOption] = useState("featured");
    const [conditionFilter, setConditionFilter] = useState("all");

    // fetch category data
    useEffect(() => {
        const fetchCategoryData = async () => {
            try {
                console.log(`🔄 Fetching products for category: ${categoryName}`);
                const res = await axios.get(`http://localhost:3000/category/${categoryName}`);
                console.log("✅ Category products response:", res.data);
                setData(res.data);
                setFiltered(res.data.results || []);
            } catch (error) {
                console.error("❌ Category fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategoryData();
    }, [categoryName]);

    // apply filters and sorting
    useEffect(() => {
        if (!data?.results) return;

        let updated = [...data.results];

        // filter by condition
        if (conditionFilter !== "all") {
            updated = updated.filter(
                (p) => p.condition && p.condition.toLowerCase() === conditionFilter.toLowerCase()
            );
        }

        // sort options
        if (sortOption === "lowToHigh") {
            updated.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sortOption === "highToLow") {
            updated.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else if (sortOption === "featured") {
            updated.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        }

        setFiltered(updated);
    }, [sortOption, conditionFilter, data]);

    if (loading) {
        return (
            <div style={{ 
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                minHeight: '100vh',
                padding: '40px 20px'
            }}>
                <Container>
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                        <p className="mt-3 fs-5 text-muted">Loading {categoryName} products...</p>
                    </div>
                </Container>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ 
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                minHeight: '100vh',
                padding: '40px 20px'
            }}>
                <Container>
                    <div className="text-center py-5">
                        <i className="fa-solid fa-exclamation-triangle text-warning" style={{ fontSize: '3rem' }}></i>
                        <h3 className="mt-3 text-danger">No data found</h3>
                        <p className="text-muted">Unable to load products for this category.</p>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div style={{ 
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            minHeight: '100vh',
            padding: '40px 20px'
        }}>
            <Container>
                {/* ===== Enhanced Header ===== */}
                <div className="text-center mb-5">
                    <h1 style={{ 
                        color: colors.badge, 
                        fontWeight: '700', 
                        fontSize: '3rem',
                        marginBottom: '1rem',
                        position: 'relative',
                        display: 'inline-block'
                    }}>
                        {data.category ? data.category.charAt(0).toUpperCase() + data.category.slice(1) : categoryName}
                        <div style={{ 
                            position: 'absolute', 
                            bottom: '-10px', 
                            left: '50%', 
                            transform: 'translateX(-50%)', 
                            width: '100px', 
                            height: '5px', 
                            background: 'linear-gradient(90deg, #0B7A75, #D7C9AA)',
                            borderRadius: '3px'
                        }}></div>
                    </h1>
                    <p className="text-muted fs-5">
                        Discover amazing {data.category ? data.category.toLowerCase() : categoryName} products
                    </p>
                </div>

                {/* ===== Enhanced Filters & Sort ===== */}
                <Card className="mb-5 border-0" style={{
                    background: 'linear-gradient(135deg, #19535F 0%, #0B7A75 100%)',
                    borderRadius: '20px',
                    boxShadow: '0 15px 40px rgba(11, 122, 117, 0.3)'
                }}>
                    <Card.Body className="p-4">
                        <Row className="align-items-center">
                            <Col md={6}>
                                <div className="d-flex flex-wrap align-items-center gap-3">
                                    <span className="text-white fw-bold fs-6">Sort By:</span>
                                    {[
                                        { key: "featured", label: "Featured" },
                                        { key: "lowToHigh", label: "Price: Low to High" },
                                        { key: "highToLow", label: "Price: High to Low" }
                                    ].map((option) => (
                                        <button
                                            key={option.key}
                                            className={`px-4 py-2 rounded-pill border-0 fw-semibold ${
                                                sortOption === option.key 
                                                    ? "bg-warning text-dark" 
                                                    : "bg-white text-dark bg-opacity-10 text-white"
                                            }`}
                                            style={{
                                                transition: 'all 0.3s ease',
                                                backdropFilter: 'blur(10px)'
                                            }}
                                            onClick={() => setSortOption(option.key)}
                                            onMouseEnter={(e) => {
                                                if (sortOption !== option.key) {
                                                    e.target.style.background = 'rgba(255,255,255,0.2)';
                                                    e.target.style.transform = 'translateY(-2px)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (sortOption !== option.key) {
                                                    e.target.style.background = 'rgba(255,255,255,0.1)';
                                                    e.target.style.transform = 'translateY(0)';
                                                }
                                            }}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="d-flex flex-wrap align-items-center gap-3">
                                    <span className="text-white fw-bold fs-6">Condition:</span>
                                    {["all", "New", "Like New", "Used"].map((cond) => (
                                        <button
                                            key={cond}
                                            className={`px-4 py-2 rounded-pill border-0 fw-semibold ${
                                                conditionFilter === cond.toLowerCase()
                                                    ? "bg-warning text-dark"
                                                    : "bg-white text-dark bg-opacity-10 text-white"
                                            }`}
                                            style={{
                                                transition: 'all 0.3s ease',
                                                backdropFilter: 'blur(10px)'
                                            }}
                                            onClick={() => setConditionFilter(cond.toLowerCase())}
                                            onMouseEnter={(e) => {
                                                if (conditionFilter !== cond.toLowerCase()) {
                                                    e.target.style.background = 'rgba(255,255,255,0.2)';
                                                    e.target.style.transform = 'translateY(-2px)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (conditionFilter !== cond.toLowerCase()) {
                                                    e.target.style.background = 'rgba(255,255,255,0.1)';
                                                    e.target.style.transform = 'translateY(0)';
                                                }
                                            }}
                                        >
                                            {cond}
                                        </button>
                                    ))}
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* ===== Enhanced Products Grid ===== */}
                {filtered.length > 0 ? (
                    <Row className="g-4">
                        {filtered.map((item, index) => (
                            <Col key={item._id || index} xs={12} sm={6} md={4} lg={3}>
                                <ProductCard item={item} index={index} />
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Card className="text-center border-0" style={{
                        background: 'rgba(255,255,255,0.8)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '20px',
                        padding: '60px 20px'
                    }}>
                        <Card.Body>
                            <i className="fa-solid fa-search text-muted" style={{ fontSize: '4rem', marginBottom: '1rem' }}></i>
                            <h4 className="text-muted mb-3">No products found</h4>
                            <p className="text-muted">
                                No products match the selected filters. Try adjusting your filters.
                            </p>
                        </Card.Body>
                    </Card>
                )}
            </Container>

            {/* Add CSS animations */}
            <style>
                {`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(5deg); }
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .product-card:hover {
                    transform: translateY(-10px) !important;
                }
                `}
            </style>
        </div>
    );
}

// Enhanced Product Card Component
function ProductCard({ item, index }) {
    const gradients = [
        'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
        'linear-gradient(135deg, #48DBFB 0%, #6F86FF 100%)',
        'linear-gradient(135deg, #FF9A8B 0%, #FF6A88 55%, #FF99AC 100%)',
        'linear-gradient(135deg, #42E695 0%, #3BB2B8 100%)'
    ];

    const gradient = gradients[index % gradients.length];

    return (
        <Card 
            as={Link}
            to={`/products/${item._id}`}
            className="text-decoration-none border-0 product-card"
            style={{
                borderRadius: '20px',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                background: '#ffffff',
                overflow: 'hidden',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.1)',
                height: '100%'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.transform = 'translateY(-10px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Product Image */}
            <div style={{ 
                position: 'relative', 
                height: '220px', 
                overflow: 'hidden' 
            }}>
                <img
                    src={item.images?.[0] || item.image || "/placeholder.jpg"}
                    alt={item.name}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                    }}
                />
                
                {/* Discount Badge */}
                {item.discount && (
                    <div style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: gradient,
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '15px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}>
                        {item.discount}% OFF
                    </div>
                )}

                {/* Condition Badge */}
                <div style={{
                    position: 'absolute',
                    top: '15px',
                    left: '15px',
                    background: 'rgba(255,255,255,0.9)',
                    color: colors.bg,
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    backdropFilter: 'blur(10px)'
                }}>
                    {item.condition || 'Good'}
                </div>
            </div>

            {/* Product Info */}
            <Card.Body className="p-4">
                <Card.Title style={{ 
                    color: colors.bg, 
                    fontWeight: '700', 
                    fontSize: '1.1rem',
                    marginBottom: '0.5rem',
                    lineHeight: '1.4',
                    height: '2.8rem',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                }}>
                    {item.name}
                </Card.Title>

                <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                        <div style={{ 
                            color: colors.accent, 
                            fontWeight: '800', 
                            fontSize: '1.3rem' 
                        }}>
                            ${item.price}
                        </div>
                        {item.originalPrice && item.originalPrice > item.price && (
                            <div style={{ 
                                color: '#6c757d', 
                                textDecoration: 'line-through',
                                fontSize: '0.9rem'
                            }}>
                                ${item.originalPrice}
                            </div>
                        )}
                    </div>
                    
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                    }}
                    >
                        <i className="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

export { Categories, CategoryPage };