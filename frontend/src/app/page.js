'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  const heroRef = useRef(null);
  const rafIdRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;

    // Respect reduced motion & touch devices
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalized from -1 to +1
    const normX = ((x / rect.width) * 2 - 1);
    const normY = ((y / rect.height) * 2 - 1);

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      if (!heroRef.current) return;
      heroRef.current.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
      heroRef.current.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
      heroRef.current.style.setProperty('--norm-x', normX.toFixed(3));
      heroRef.current.style.setProperty('--norm-y', normY.toFixed(3));
      heroRef.current.style.setProperty('--glow-opacity', '1');
    });
  };

  const handleMouseLeave = () => {
    if (!heroRef.current) return;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      if (!heroRef.current) return;
      heroRef.current.style.setProperty('--norm-x', '0');
      heroRef.current.style.setProperty('--norm-y', '0');
      heroRef.current.style.setProperty('--mouse-x', '50%');
      heroRef.current.style.setProperty('--mouse-y', '50%');
      heroRef.current.style.setProperty('--glow-opacity', '0.7');
    });
  };

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [newRes, exploreRes, beautyRes, fashionRes, elecRes] = await Promise.all([
          productService.getProducts({ sort: 'createdAt,desc', page: 0, size: 4 }),
          productService.getProducts({ sort: 'price,desc', page: 0, size: 4 }),
          productService.getProducts({ category: 'Beauty & Personal Care', page: 0, size: 4 }),
          productService.getProducts({ category: 'Fashion (Men/Women)', page: 0, size: 4 }),
          productService.getProducts({ category: 'Smartphones', page: 0, size: 4 }),
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
    { title: 'Electronics', icon: '💻', count: 'Laptops, TVs & Accessories', categoryParam: 'Smartphones' },
    { title: 'Fashion', icon: '👔', count: 'Men, Women & Footwear', categoryParam: 'Fashion (Men/Women)' },
    { title: 'Beauty & Personal Care', icon: '✨', count: 'Skincare & Wellness', categoryParam: 'Beauty & Personal Care' },
    { title: 'Home Appliances', icon: '🏠', count: 'Living & Kitchen Gadgets', categoryParam: 'Home Appliances' },
    { title: 'Gaming', icon: '🎮', count: 'Consoles & Peripherals', categoryParam: 'Gaming' },
    { title: 'Books', icon: '📚', count: 'Literature & Learning', categoryParam: 'Books' },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = React.useMemo(() => {
    return [...exploreProducts, ...newArrivals]
      .filter((p, index, self) => p && p.imageUrl && self.findIndex((x) => x.id === p.id) === index)
      .slice(0, 5);
  }, [exploreProducts, newArrivals]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSlides]);

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
    <div>
      {/* 1. IMMERSIVE CINEMATIC ADVERTISING HERO */}
      <div className="hero-fluid-outer-wrapper">
        <section 
          ref={heroRef}
          className="cinematic-hero-section"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Layer 1: Dark Premium Radial/Glow Background */}
          <div className="hero-bg-base" />

          {/* Dynamic Slide-Specific Accent Glow */}
          {heroSlides.map((prod, idx) => {
            const categoryGlowClass = 
              prod?.category?.toLowerCase().includes('electronics') ? 'glow-blue' :
              prod?.category?.toLowerCase().includes('beauty') ? 'glow-pink' :
              prod?.category?.toLowerCase().includes('fashion') ? 'glow-amber' :
              prod?.category?.toLowerCase().includes('gaming') ? 'glow-purple' : 'glow-indigo';

            return (
              <div 
                key={`glow-${prod?.id || idx}`}
                className={`hero-accent-glow ${categoryGlowClass} ${idx === currentSlide ? 'active' : ''}`} 
              />
            );
          })}

          {/* Layer 2: Oversized Background Typography (Behind Product) */}
          <div className="hero-typography-layer" aria-hidden="true">
            {heroSlides.map((prod, idx) => {
              let bgWord = 'DISCOVER';
              const cat = prod?.category?.toLowerCase() || '';
              if (cat.includes('electronics')) bgWord = 'TECH';
              else if (cat.includes('beauty')) bgWord = 'BEAUTY';
              else if (cat.includes('fashion')) bgWord = 'STYLE';
              else if (cat.includes('gaming')) bgWord = 'PLAY';
              else if (cat.includes('book')) bgWord = 'CREATE';

              return (
                <div
                  key={`bgtext-${prod?.id || idx}`}
                  className={`hero-bg-word ${idx === currentSlide ? 'active' : ''}`}
                >
                  {bgWord}
                </div>
              );
            })}
          </div>

          {/* Layer 3: Layered Product & Information Stage */}
          <div className="hero-cinematic-stage">
            {/* Left Content / Info & CTA */}
            <div className="hero-stage-content">
              {heroSlides[currentSlide] && (
                <span className="hero-category-tag">
                  ✨ {heroSlides[currentSlide].category || 'Featured Collection'}
                </span>
              )}
              <h1 className="hero-headline">
                {currentSlide === 0 && 'Next-Gen Technology & Lifestyle.'}
                {currentSlide === 1 && 'Elevate Your Everyday Style.'}
                {currentSlide === 2 && 'Pure Radiance & Luxury Care.'}
                {currentSlide === 3 && 'Unmatched Performance & Play.'}
                {currentSlide >= 4 && 'Explore Premium Catalog Arrivals.'}
              </h1>
              <p className="hero-description">
                Experience curated craftsmanship, cutting-edge innovations, and exclusive prices delivered right to your doorstep.
              </p>

              <div className="hero-cta-group">
                <Link href="/products" className="btn btn-primary hero-btn-primary">
                  Shop Now
                </Link>
                <a href="#categories" className="btn btn-outline hero-btn-outline">
                  Browse Categories
                </a>
              </div>

              {/* Active Product Details & Direct Link */}
              {heroSlides[currentSlide] && (
                <div className="hero-featured-card-link">
                  <Link href={`/product/${heroSlides[currentSlide].id}`} className="hero-featured-link-box">
                    <div className="hero-featured-info">
                      <span className="hero-featured-name">{heroSlides[currentSlide].name}</span>
                      <span className="hero-featured-price">${heroSlides[currentSlide].price?.toFixed(2)}</span>
                    </div>
                    <span className="hero-featured-arrow">→</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Right Visual: Dominant Layered Product Image (Layer 4 - In Front of Text) */}
            <div className="hero-stage-visual">
              {heroSlides.map((prod, idx) => (
                <div
                  key={`prod-visual-${prod.id}`}
                  className={`hero-product-image-wrapper ${idx === currentSlide ? 'active' : ''}`}
                >
                  {prod.imageUrl ? (
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="hero-product-dominant-img"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="hero-product-fallback">
                      <span>{prod.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dots Navigation */}
          {heroSlides.length > 1 && (
            <div className="hero-slideshow-dots">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  className={`hero-dot ${idx === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1.5rem' }}>

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
              href={`/products?category=${encodeURIComponent(cat.categoryParam || cat.title)}`}
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
            <Link href={`/products?category=${encodeURIComponent('Fashion (Men/Women)')}`} style={{ color: 'var(--accent-color)', fontWeight: '600', fontSize: '0.95rem' }}>
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
    </div>
  );
}
