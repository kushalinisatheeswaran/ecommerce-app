'use client';

import React, { useState, useEffect } from 'react';
import { productService } from '../../../services/productService';
import { cartService } from '../../../services/cartService';
import { wishlistService } from '../../../services/wishlistService';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProductDetailPage({ params }) {
  const { user } = useAuth();
  const router = useRouter();
  const productId = React.use(params).id;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await productService.getProductById(productId);
        if (data) {
          setProduct(data);
        } else {
          setError('Product not found.');
        }
      } catch (err) {
        setError('Error retrieving product details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (user && productId) {
      wishlistService.checkWishlisted(productId)
        .then((res) => setIsWishlisted(res))
        .catch(() => setIsWishlisted(false));
    }
  }, [user, productId]);

  const handleToggleWishlist = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(productId);
        setIsWishlisted(false);
      } else {
        await wishlistService.addToWishlist(productId);
        setIsWishlisted(true);
      }
    } catch (err) {
      console.error('Error toggling wishlist on detail page', err);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsAdding(true);
    setFeedback(null);
    try {
      await cartService.addToCart(product.id, quantity);
      setFeedback({ status: 'success', message: `Added ${quantity} item(s) to cart!` });
    } catch (err) {
      setFeedback({ status: 'error', message: err.response?.data?.message || 'Failed to add item to cart.' });
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--danger-color)', marginBottom: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '1.5rem', borderRadius: '8px' }}>
          {error || 'An error occurred.'}
        </div>
        <Link href="/products" className="btn btn-secondary">Back to Catalog</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '3rem auto', padding: '0 1.5rem' }}>
      <Link href="/products" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', marginBottom: '2rem', gap: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>
        ← Back to Product Catalog
      </Link>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
        gap: '3rem', 
        alignItems: 'start',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Product Image */}
        <div style={{ 
          background: '#f1f5f9', 
          borderRadius: '12px', 
          height: '420px', 
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>No Image Available</span>
          )}
        </div>

        {/* Product Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-color)', fontWeight: '700' }}>
              {product.category}
            </span>
            <h1 style={{ fontSize: '2.25rem', fontWeight: '800', marginTop: '0.35rem', color: 'var(--text-primary)' }}>{product.name}</h1>
          </div>

          <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            ${product.price.toFixed(2)}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7' }}>
            {product.description}
          </p>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Quantity:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <button 
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.5rem 1rem', borderRadius: '0', border: 'none' }}
                >
                  -
                </button>
                <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: '700', backgroundColor: '#ffffff' }}>{quantity}</span>
                <button 
                  onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.5rem 1rem', borderRadius: '0', border: 'none' }}
                >
                  +
                </button>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: product.stockQuantity > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of Stock'}
              </span>
            </div>

            {feedback && (
              <div style={{ 
                fontSize: '0.9rem', 
                color: feedback.status === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
                backgroundColor: feedback.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                padding: '0.75rem 1rem',
                borderRadius: '8px'
              }}>
                {feedback.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={handleAddToCart} 
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.9rem', fontSize: '1.05rem' }}
                disabled={product.stockQuantity <= 0 || isAdding}
              >
                {isAdding ? 'Adding...' : product.stockQuantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleToggleWishlist}
                className="btn btn-outline"
                aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                style={{
                  padding: '0.9rem 1.25rem',
                  fontSize: '1.25rem',
                  color: isWishlisted ? '#ef4444' : 'var(--text-secondary)',
                  borderColor: isWishlisted ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)',
                }}
                title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                {isWishlisted ? '♥ Saved' : '♡ Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
