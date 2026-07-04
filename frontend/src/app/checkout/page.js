'use client';

import React, { useState, useEffect } from 'react';
import { cartService } from '../../services/cartService';
import { orderService } from '../../services/orderService';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const data = await cartService.getCart();
        setCartItems(data || []);
      } catch (err) {
        setError('Could not load cart details.');
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  const calculateTotal = () => {
    return cartItems.reduce((acc, item) => acc + (item.price || 0), 0);
  };

  const handlePlaceOrder = async () => {
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await orderService.createOrder();
      setSuccess('Order placed successfully! Redirecting to order history...');
      setTimeout(() => {
        router.push('/orders');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place the order. Please check stock levels.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}>
          <p>Loading checkout details...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '2rem', textAlign: 'center' }}>Checkout</h1>

        {error && (
          <div style={{ color: 'var(--danger-color)', marginBottom: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ color: 'var(--success-color)', marginBottom: '1.5rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '1rem', borderRadius: '8px' }}>
            {success}
          </div>
        )}

        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '700' }}>Order Summary</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
            {cartItems.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {item.product.name} (x{item.quantity})
                </span>
                <span style={{ fontWeight: '600' }}>${item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '700', marginBottom: '2rem' }}>
            <span>Total Amount:</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/cart" className="btn btn-secondary" style={{ flex: 1 }}>Back to Cart</Link>
            <button 
              onClick={handlePlaceOrder} 
              className="btn btn-primary" 
              style={{ flex: 1 }}
              disabled={cartItems.length === 0 || submitting}
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
