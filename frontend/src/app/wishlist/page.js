'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import Link from 'next/link';
import { wishlistService } from '../../services/wishlistService';
import { cartService } from '../../services/cartService';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState({});

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const data = await wishlistService.getWishlist();
      setItems(data);
    } catch (err) {
      setError('Failed to load your wishlist items.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await wishlistService.removeFromWishlist(productId);
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    } catch (err) {
      setActionMsg((prev) => ({ ...prev, [productId]: 'Error removing item' }));
    }
  };

  const handleMoveToCart = async (productId, stockQuantity) => {
    if (stockQuantity <= 0) {
      setActionMsg((prev) => ({ ...prev, [productId]: 'Item is out of stock' }));
      return;
    }

    try {
      await cartService.addToCart(productId, 1);
      // Remove from wishlist after successful add to cart
      await wishlistService.removeFromWishlist(productId);
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    } catch (err) {
      setActionMsg((prev) => ({ ...prev, [productId]: err.response?.data?.message || 'Error moving to cart' }));
    }
  };

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '1.5rem' }}>
          My Wishlist {items.length > 0 && `(${items.length})`}
        </h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading wishlist items...</div>
        ) : error ? (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', borderRadius: '8px' }}>
            {error}
          </div>
        ) : items.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❤️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Your wishlist is empty</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Explore our catalog and click the heart icon on any product to save it here.</p>
            <Link href="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {items.map((item) => (
              <div className="product-card" key={item.id}>
                <Link href={`/product/${item.productId}`} className="product-image-container">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span>No Image Available</span>
                  )}
                </Link>

                <div className="product-info">
                  <span className="product-category">{item.category}</span>
                  <Link href={`/product/${item.productId}`} className="product-name">
                    {item.productName}
                  </Link>

                  <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    {item.stockQuantity > 0 ? (
                      <span style={{ color: 'var(--success-color)', fontWeight: '600' }}>In Stock ({item.stockQuantity})</span>
                    ) : (
                      <span style={{ color: 'var(--danger-color)', fontWeight: '600' }}>Out of Stock</span>
                    )}
                  </div>

                  {actionMsg[item.productId] && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--danger-color)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      padding: '0.35rem',
                      borderRadius: '4px',
                      marginBottom: '0.5rem'
                    }}>
                      {actionMsg[item.productId]}
                    </div>
                  )}

                  <div className="product-footer">
                    <span className="product-price">${item.price?.toFixed(2)}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleRemove(item.productId)}
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 0.65rem', fontSize: '0.85rem' }}
                        title="Remove from Wishlist"
                      >
                        🗑️
                      </button>
                      <button
                        onClick={() => handleMoveToCart(item.productId, item.stockQuantity)}
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                        disabled={item.stockQuantity <= 0}
                      >
                        Move to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
