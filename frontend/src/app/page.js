'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [newArrivals, setNewArrivals] = useState([]);
  const [exploreProducts, setExploreProducts] = useState([]);
  const [beautyProducts, setBeautyProducts] = useState([]);
  const [fashionProducts, setFashionProducts] = useState([]);
  const [electronicsProducts, setElectronicsProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [newRes, exploreRes, beautyRes, fashionRes, elecRes] = await Promise.all([
          productService.getProducts({ sort: 'createdAt,desc', page: 0, size: 4 }),
          productService.getProducts({ sort: 'price,desc', page: 0, size: 4 }),
          productService.getProducts({ category: 'Beauty & Personal Care', page: 0, size: 4 }),
          productService.getProducts({ category: 'Fashion', page: 0, size: 4 }),
          productService.getProducts({ category: 'Electronics', page: 0, size: 4 }),
        ]);

        setNewArrivals(newRes.content || []);
        setExploreProducts(exploreRes.content || []);
        setBeautyProducts(beautyRes.content || []);
        setFashionProducts(fashionRes.content || []);
        setElectronicsProducts(elecRes.content || []);
      } catch (err) {
        console.error('Error loading homepage catalog sections', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleAddToCart = async (productId) => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      await cartService.addToCart(productId, 1);
      setFeedback((prev) => ({ ...prev, [productId]: { status: 'success', message: 'Added!' } }));
      setTimeout(() => {
        setFeedback((prev) => ({ ...prev, [productId]: null }));
      }, 2000);
    } catch (err) {
      setFeedback((prev) => ({
        ...prev,
        [productId]: { status: 'error', message: err.response?.data?.message || 'Error adding item' },
      }));
      setTimeout(() => {
        setFeedback((prev) => ({ ...prev, [productId]: null }));
      }, 3000);
    }
  };

  const curatingCategories = [
    { title: 'Electronics', icon: '💻', count: 'Laptops, TVs & Accessories' },
    { title: 'Fashion', icon: '👔', count: 'Men, Women & Footwear' },
    { title: 'Beauty & Personal Care', icon: '✨', count: 'Skincare & Wellness' },
    { title: 'Home Appliances', icon: '🏠', count: 'Living & Kitchen Gadgets' },
    { title: 'Gaming', icon: '🎮', count: 'Consoles & Peripherals' },
    { title: 'Books', icon: '📚', count: 'Literature & Learning' },
  ];

  const renderProductRow = (productsList) => (
    <div className="product-grid">
      {productsList.map((product) => (
        <div className="product-card" key={product.id}>
          <Link href={`/product/${product.id}`} className="product-image-container">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span>No Image Available</span>
            )}
          </Link>
          <div className="product-info">
            <span className="product-category">{product.category}</span>
            <Link href={`/product/${product.id}`} className="product-name">
              {product.name}
            </Link>
            <p className="product-desc">{product.description}</p>
            
            {feedback[product.id] && (
              <div style={{ 
                fontSize: '0.8rem', 
                color: feedback[product.id].status === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
                marginBottom: '0.5rem',
                backgroundColor: feedback[product.id].status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                padding: '0.4rem',
                borderRadius: '4px'
              }}>
                {feedback[product.id].message}
              </div>
            )}

            <div className="product-footer">
              <span className="product-price">${product.price.toFixed(2)}</span>
              <button 
                onClick={() => handleAddToCart(product.id)} 
                className="btn btn-primary"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                disabled={product.stockQuantity <= 0}
              >
                {product.stockQuantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1.5rem' }}>
      
      {/* 1. HERO SECTION */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        color: '#ffffff',
        borderRadius: '20px',
        padding: '4rem 3rem',
        marginTop: '2rem',
        marginBottom: '3.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2.5rem',
        alignItems: 'center',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div>
          <span style={{ 
            fontSize: '0.85rem', 
            fontWeight: '700', 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em', 
            color: '#a5b4fc', 
            backgroundColor: 'rgba(165, 180, 252, 0.1)',
            padding: '0.35rem 0.85rem',
            borderRadius: '20px',
            display: 'inline-block',
            marginBottom: '1rem'
          }}>
            Next-Gen Marketplace
          </span>
          <h1 style={{ fontSize: '2.8rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '1.25rem' }}>
            Discover products for every part of your day.
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '2rem' }}>
            Explore our curated catalog featuring electronics, fashion, beauty, books, and home appliances with real-time stock and dynamic sorting.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/products" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
              Shop Now
            </Link>
            <a href="#categories" className="btn btn-outline" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
              Browse Categories
            </a>
          </div>
        </div>

        {/* RIGHT SIDE: ANIMATED FLOATING PRODUCT COLLAGE */}
        <div className="hero-visual-wrapper">
          <div className="hero-glow-orb" />
          <div className="hero-collage-container">
            {(() => {
              const heroItems = [...newArrivals, ...exploreProducts]
                .filter((p, index, self) => p && p.imageUrl && self.findIndex((x) => x.id === p.id) === index)
                .slice(0, 4);

              const cardClasses = [
                'hero-card-primary',
                'hero-card-secondary',
                'hero-card-tertiary',
                'hero-card-quaternary',
              ];

              const fallbackIcons = ['💻', '🎧', '✨', '👔'];

              if (heroItems.length > 0) {
                return heroItems.map((prod, idx) => (
                  <Link
                    key={prod.id}
                    href={`/product/${prod.id}`}
                    className={`hero-card ${cardClasses[idx % 4]}`}
                  >
                    <div className="hero-card-img-box">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <span className="hero-card-badge">{prod.category}</span>
                    <span className="hero-card-title">{prod.name}</span>
                    <span className="hero-card-price">${prod.price.toFixed(2)}</span>
                  </Link>
                ));
              }

              return fallbackIcons.map((icon, idx) => (
                <div key={idx} className={`hero-card ${cardClasses[idx]}`}>
                  <div className="hero-card-img-box" style={{ fontSize: '2.5rem' }}>
                    {icon}
                  </div>
                  <span className="hero-card-title">Featured Item</span>
                </div>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* 2. SHOP BY CATEGORY */}
      <section id="categories" style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Shop by Category</h2>
          <Link href="/products" style={{ color: 'var(--accent-color)', fontWeight: '600', fontSize: '0.95rem' }}>
            View Catalog →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
          {curatingCategories.map((cat) => (
            <Link 
              key={cat.title} 
              href={`/products?category=${encodeURIComponent(cat.title)}`}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '1.5rem 1.25rem',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>{cat.icon}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.25rem' }}>{cat.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cat.count}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>New Arrivals</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Recently added products in store</p>
            </div>
            <Link href="/products?sort=createdAt,desc" style={{ color: 'var(--accent-color)', fontWeight: '600', fontSize: '0.95rem' }}>
              View All →
            </Link>
          </div>
          {renderProductRow(newArrivals)}
        </section>
      )}

      {/* 4. POPULAR PICKS / EXPLORE */}
      {exploreProducts.length > 0 && (
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Explore Recommended Picks</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Top items selected from our active catalog</p>
            </div>
            <Link href="/products" style={{ color: 'var(--accent-color)', fontWeight: '600', fontSize: '0.95rem' }}>
              Browse All →
            </Link>
          </div>
          {renderProductRow(exploreProducts)}
        </section>
      )}

      {/* 5. BEAUTY & CARE */}
      {beautyProducts.length > 0 && (
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Beauty & Personal Care</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Self care & wellness products</p>
            </div>
            <Link href={`/products?category=${encodeURIComponent('Beauty & Personal Care')}`} style={{ color: 'var(--accent-color)', fontWeight: '600', fontSize: '0.95rem' }}>
              View Category →
            </Link>
          </div>
          {renderProductRow(beautyProducts)}
        </section>
      )}

      {/* 6. FASHION */}
      {fashionProducts.length > 0 && (
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Fashion Essentials</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Modern clothing and apparel</p>
            </div>
            <Link href={`/products?category=${encodeURIComponent('Fashion')}`} style={{ color: 'var(--accent-color)', fontWeight: '600', fontSize: '0.95rem' }}>
              View Category →
            </Link>
          </div>
          {renderProductRow(fashionProducts)}
        </section>
      )}

      {/* CTA SECTION */}
      <section style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '3rem',
        textAlign: 'center',
        marginBottom: '4rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.75rem' }}>Looking for something specific?</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
          Use our advanced search, category filters, and price ranges to find exact products in our store catalog.
        </p>
        <Link href="/products" className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
          Explore Full Catalog
        </Link>
      </section>

    </div>
  );
}
