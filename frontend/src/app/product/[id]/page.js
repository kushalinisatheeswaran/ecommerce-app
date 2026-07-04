'use client';

import React, { useState, useEffect } from 'react';
import { productService } from '../../../services/productService';
import { cartService } from '../../../services/cartService';
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
        <p>Loading product details...</p>
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
    <div style={{ maxWidth: '1000px', margin: '4rem auto', padding: '0 1.5rem' }}>
      <Link href="/products" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', marginBottom: '2rem', gap: '0.5rem', fontWeight: '500' }}>
        ← Back to Catalog
      </Link>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '3rem', alignItems: 'start' }}>
        {/* Product Image */}
        <div style={{ 
          background: 'var(--bg-secondary)', 
          borderRadius: '16px', 
          height: '400px', 
          border: '1px solid rgba(255,255,255,0.05)',
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
            <span style={{ color: 'var(--text-secondary)' }}>No Image Available</span>
          )}
        </div>

        {/* Product Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-color)', fontWeight: '600' }}>
              {product.category}
            </span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginTop: '0.5rem' }}>{product.name}</h1>
          </div>

          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
            ${product.price.toFixed(2)}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.7' }}>
            {product.description}
          </p>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Quantity:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                <button 
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.5rem 1rem', borderRadius: '0', border: 'none' }}
                >
                  -
                </button>
                <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: '600' }}>{quantity}</span>
                <button 
                  onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.5rem 1rem', borderRadius: '0', border: 'none' }}
                >
                  +
                </button>
              </div>
              <span style={{ fontSize: '0.85rem', color: product.stockQuantity > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                {product.stockQuantity > 0 ? `${product.stockQuantity} items in stock` : 'Out of Stock'}
              </span>
            </div>

            {feedback && (
              <div style={{ 
                fontSize: '0.9rem', 
                color: feedback.status === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
                backgroundColor: feedback.status === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                padding: '0.75rem',
                borderRadius: '6px'
              }}>
                {feedback.message}
              </div>
            )}

            <button 
              onClick={handleAddToCart} 
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
              disabled={product.stockQuantity <= 0 || isAdding}
            >
              {isAdding ? 'Adding...' : product.stockQuantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
