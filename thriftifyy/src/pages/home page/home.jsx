import HeroSection from './hero.jsx'
import CategoriesSection from './homecategories.jsx'
import FeaturedProduct from './featuredproducts.jsx'
import Working from './working.jsx'
import Faqs from './faqs.jsx'

import { useState, useEffect } from 'react';
import api from '../../api.js';

function Home() {
    const [categories, setCategories] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [recentlyAdded, setRecentlyAdded] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const res = await api.get("/home");
                console.log("📦 Home API data:", res.data);

                setCategories(res.data.categories || []);
                setFeaturedProducts(res.data.featured || []);
                setRecentlyAdded(res.data.recentlyAdded || []);
                setLoading(false);
            } catch (err) {
                console.error("Home fetch error:", err);
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
                setFeaturedProducts([
                    { _id: 1, name: 'Vintage Jacket', price: 45, condition: 'Excellent', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=200&fit=crop' },
                    { _id: 2, name: 'Designer Handbag', price: 85, condition: 'Like New', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&h=200&fit=crop' },
                    { _id: 3, name: 'Smart Watch', price: 120, condition: 'Good', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop' },
                    { _id: 4, name: 'Camera Lens', price: 200, condition: 'Excellent', image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=300&h=200&fit=crop' },
                    { _id: 5, name: 'Books Collection', price: 35, condition: 'Good', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=200&fit=crop' },
                    { _id: 6, name: 'Sneakers', price: 65, condition: 'Like New', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=200&fit=crop' },
                    { _id: 7, name: 'Headphones', price: 90, condition: 'Excellent', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop' },
                    { _id: 8, name: 'Gaming Console', price: 250, condition: 'Good', image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300&h=200&fit=crop' }
                ]);
                setLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100 text-muted">
                <div className="text-center">
                    <div className="spinner-border mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading homepage data...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <HeroSection />
            <FeaturedProduct featuredProducts={featuredProducts} />
            <Working />
            <CategoriesSection categories={categories} />
            <Faqs />
        </>
    );
}

export default Home;