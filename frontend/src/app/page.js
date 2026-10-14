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
    let isMounted = true;
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [newRes, exploreRes, beautyRes, fashionRes, elecRes] = await Promise.all([
          productService.getProducts({ sort: 'createdAt,desc', page: 0, size: 4 }),
          productService.getProducts({ sort: 'price,desc', page: 0, size: 4 }),
          productService.getProducts({ category: 'Beauty & Personal Care', page: 0, size: 4 }),
          productService.getProducts({ category: 'Fashion', page: 0, size: 4 }),
          productService.getProducts({ category: 'Smartphones', page: 0, size: 4 }),
        ]);

        if (isMounted) {
          setNewArrivals(newRes?.content || []);
          setExploreProducts(exploreRes?.content || []);
          setBeautyProducts(beautyRes?.content || []);
          setFashionProducts(fashionRes?.content || []);
          setElectronicsProducts(elecRes?.content || []);
        }
      } catch (err) {
        console.error('Error loading homepage catalog data', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHomeData();
    return () => { isMounted = false; };
  }, []);

  const handleAddToCart = async (productId) => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      await cartService.addToCart(productId, 1);
      setFeedback((prev) => ({ ...prev, [productId]: { status: 'success', message: 'Added to cart' } }));
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

  // Six visual category cards mapped to existing backend categories where available
  const categoryCards = [
    {
      id: 'electronics',
      title: 'Electronics',
      subtitle: 'Smartphones, Audio & Tech',
      href: '/products?category=Smartphones',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'fashion',
      title: 'Fashion',
      subtitle: 'Contemporary Apparel & Style',
      href: '/products?category=Fashion',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'beauty',
      title: 'Beauty',
      subtitle: 'Luxury Skincare & Care',
      href: `/products?category=${encodeURIComponent('Beauty & Personal Care')}`,
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'home-appliances',
      title: 'Home Appliances',
      subtitle: 'Living & Kitchen Innovations',
      href: `/products?category=${encodeURIComponent('Home Appliances')}`,
      image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'gaming',
      title: 'Gaming',
      subtitle: 'Consoles, Gears & Peripherals',
      href: '/products?category=Gaming',
      image: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'books',
      title: 'Books',
      subtitle: 'Curated Literature & Prints',
      href: '/products?category=Books',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const renderProductRow = (productsList) => (
    <div className="product-grid">
      {productsList.map((product) => (
        <article className="product-card" key={product.id}>
          <Link href={`/product/${product.id}`} className="product-image-container">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="product-card-img"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <span className="product-no-img">No Image Available</span>
            )}
            <span className="product-category-badge">{product.category}</span>
          </Link>

          <div className="product-info">
            <Link href={`/product/${product.id}`} className="product-name" title={product.name}>
              {product.name}
            </Link>
            <p className="product-desc">{product.description}</p>

            {feedback[product.id] && (
              <div
                className={`product-feedback ${feedback[product.id].status === 'success' ? 'feedback-success' : 'feedback-error'
                  }`}
                role="status"
              >
                {feedback[product.id].message}
              </div>
            )}

            <div className="product-footer">
              <div className="product-price-wrapper">
                <span className="product-price-currency">$</span>
                <span className="product-price">{product.price.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={() => handleAddToCart(product.id)}
                className="btn btn-primary product-add-btn"
                disabled={product.stockQuantity <= 0}
                aria-label={`Add ${product.name} to cart`}
              >
                {product.stockQuantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  return (
    <div className="home-page-container">
      {/* 1. HERO BANNER */}
      <section className="hero-banner-section" aria-label="Featured Showcase">
        <div className="hero-banner-card">
          {/* Subtle Ambient Lighting Gradients */}
          <div className="hero-ambient-glow hero-glow-violet" aria-hidden="true" />
          <div className="hero-ambient-glow hero-glow-cyan" aria-hidden="true" />

          <div className="hero-content-grid">
            {/* Left Content */}
            <div className="hero-left-content">
              <div className="hero-pill-tag">
                <span className="hero-pill-dot" />
                <span>Next Generation Storefront</span>
              </div>
              <h1 className="hero-heading">
                Experience the Future of Shopping.
              </h1>
              <p className="hero-subtitle">
                Discover thoughtfully selected products across technology, fashion, beauty, and everyday essentials. Find something you&apos;ll love.
              </p>
              <div className="hero-action-row">
                <Link href="/products" className="btn btn-primary hero-cta-btn">
                  <span>Shop Now</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <a href="#categories" className="btn btn-outline hero-secondary-btn">
                  Explore Categories
                </a>
              </div>
            </div>

            {/* Right Product Showcase (Wireless Headphones Visual) */}
            <div className="hero-right-showcase" aria-hidden="true">
              <div className="hero-showcase-backdrop">
                <div className="hero-showcase-halo" />
                <img
                  src="https://plus.unsplash.com/premium_photo-1679513691474-73102089c117?auto=format&fit=crop&w=1000&q=80"
                  alt="Premium Wireless Headphones"
                  className="hero-headphones-img"
                  loading="eager"
                />
                <div className="hero-showcase-chip">
                  <span className="hero-chip-brand">FLAGSHIP AUDIO</span>
                  <span className="hero-chip-desc">Acoustic Clarity & ANC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT WRAPPER */}
      <div className="content-container">
        {/* 2. SHOP BY CATEGORY - EXACTLY SIX CARDS (3x2 GRID) */}
        <section id="categories" className="section-block category-showcase-section" aria-labelledby="category-heading">
          <div className="section-header">
            <div>
              <span className="section-eyebrow">Curated Collections</span>
              <h2 id="category-heading" className="section-title">Shop by Category</h2>
            </div>
            <Link href="/products" className="section-link">
              View All Products <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <div className="category-grid-3x2">
            {categoryCards.map((cat) => (
              <Link
                key={cat.id}
                href={cat.href}
                className="category-card"
                aria-label={`Browse ${cat.title} category`}
              >
                {/* Background Image with Dark Contrast Overlay */}
                <div
                  className="category-card-bg"
                  style={{ backgroundImage: `url(${cat.image})` }}
                  role="img"
                  aria-label={cat.title}
                />
                <div className="category-card-overlay" />

                {/* Frosted Glass Pill Label */}
                <div className="category-card-label">
                  <div className="category-label-text-group">
                    <h3 className="category-card-title">{cat.title}</h3>
                    <p className="category-card-subtitle">{cat.subtitle}</p>
                  </div>
                  <span className="category-explore-badge">
                    Explore <span aria-hidden="true">&rarr;</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. NEW ARRIVALS */}
        {newArrivals.length > 0 && (
          <section className="section-block" aria-labelledby="new-arrivals-heading">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Fresh in Store</span>
                <h2 id="new-arrivals-heading" className="section-title">New Arrivals</h2>
              </div>
              <Link href="/products?sort=createdAt,desc" className="section-link">
                View All <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
            {renderProductRow(newArrivals)}
          </section>
        )}

        {/* 4. EXPLORE RECOMMENDED PICKS */}
        {exploreProducts.length > 0 && (
          <section className="section-block" aria-labelledby="explore-picks-heading">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Handpicked for You</span>
                <h2 id="explore-picks-heading" className="section-title">Explore Recommended Picks</h2>
              </div>
              <Link href="/products" className="section-link">
                Browse All <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
            {renderProductRow(exploreProducts)}
          </section>
        )}

        {/* 5. BEAUTY & CARE */}
        {beautyProducts.length > 0 && (
          <section className="section-block" aria-labelledby="beauty-heading">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Self-Care & Wellness</span>
                <h2 id="beauty-heading" className="section-title">Beauty & Personal Care</h2>
              </div>
              <Link href={`/products?category=${encodeURIComponent('Beauty & Personal Care')}`} className="section-link">
                View Category <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
            {renderProductRow(beautyProducts)}
          </section>
        )}

        {/* 6. FASHION ESSENTIALS */}
        {fashionProducts.length > 0 && (
          <section className="section-block" aria-labelledby="fashion-heading">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Wardrobe Classics</span>
                <h2 id="fashion-heading" className="section-title">Fashion Essentials</h2>
              </div>
              <Link href="/products?category=Fashion" className="section-link">
                View Category <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
            {renderProductRow(fashionProducts)}
          </section>
        )}

        {/* 7. BOTTOM CALL TO ACTION */}
        <section className="cta-banner-section" aria-labelledby="cta-heading">
          <div className="cta-ambient-glow" aria-hidden="true" />
          <div className="cta-content">
            <h2 id="cta-heading" className="cta-heading">Looking for something specific?</h2>
            <p className="cta-description">
              Use our catalog filters, real-time search, and price sorting to discover exact items across all departments.
            </p>
            <Link href="/products" className="btn btn-primary cta-btn">
              Explore Full Catalog
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
