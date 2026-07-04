'use client';

import React, { useState, useEffect } from 'react';
import { cartService } from '../../services/cartService';
import ProtectedRoute from '../../components/ProtectedRoute';
import Link from 'next/link';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCart = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await cartService.getCart();
      setCartItems(data || []);
    } catch (err) {
      setError('Could not retrieve cart items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await cartService.removeFromCart(productId);
      setCartItems((items) => items.filter((item) => item.product.id !== productId));
    } catch (err) {
      setError('Failed to remove item from cart.');
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemove(productId);
      return;
    }
    setError('');
    try {
      await cartService.updateCartQuantity(productId, newQuantity);
      setCartItems((items) =>
        items.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: newQuantity, price: item.product.price * newQuantity }
            : item
        )
      );
    } catch (err) {
      setError(err.response?.data || 'Failed to update quantity. Please verify stock availability.');
    }
  };


  const calculateTotal = () => {
    return cartItems.reduce((acc, item) => acc + (item.price || 0), 0);
  };

  return (
    <ProtectedRoute>
      <div className="cart-container">
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '2rem' }}>Shopping Cart</h1>
        
        {error && (
          <div style={{ color: 'var(--danger-color)', marginBottom: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
            <p>Loading your cart...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Your shopping cart is empty.</p>
            <Link href="/products" className="btn btn-primary">Continue Shopping</Link>
          </div>
        ) : (
          <div>
            {cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    {item.product.imageUrl ? (
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No Image</span>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '600' }}>{item.product.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button 
                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px' }}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)', minWidth: '20px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px' }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>${item.price.toFixed(2)}</span>
                  <button onClick={() => handleRemove(item.product.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div className="cart-summary">
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '300px', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                <span style={{ fontWeight: '700' }}>${calculateTotal().toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link href="/products" className="btn btn-secondary">Continue Shopping</Link>
                <Link href="/checkout" className="btn btn-primary">Proceed to Checkout</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
