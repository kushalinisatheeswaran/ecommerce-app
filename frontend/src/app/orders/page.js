'use client';

import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import ProtectedRoute from '../../components/ProtectedRoute';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await orderService.getOrders();
        setOrders(data || []);
      } catch (err) {
        setError('Failed to retrieve order history.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: '960px', margin: '3rem auto', padding: '0 1.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '2rem' }}>Order History</h1>

        {error && (
          <div style={{ color: 'var(--danger-color)', marginBottom: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>You have not placed any orders yet.</p>
            <Link href="/products" className="btn btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {orders.map((order) => (
              <div 
                key={order.id} 
                style={{ 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '16px', 
                  padding: '1.75rem', 
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Header: Order ID, Date, Order Status & Payment Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Order Reference:</span>
                    <span style={{ fontWeight: '800', fontSize: '1.1rem', marginLeft: '0.35rem', color: 'var(--text-primary)' }}>#{order.id}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '1rem' }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ 
                      padding: '0.3rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      backgroundColor: order.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                      color: order.status === 'DELIVERED' ? 'var(--success-color)' : 'var(--accent-color)',
                      border: '1px solid var(--border-color)'
                    }}>
                      ORDER: {order.status}
                    </span>

                    <span style={{ 
                      padding: '0.3rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      backgroundColor: order.paymentStatus === 'PAID_TEST' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                      color: order.paymentStatus === 'PAID_TEST' ? 'var(--success-color)' : '#d97706',
                      border: '1px solid var(--border-color)'
                    }}>
                      PAYMENT: {order.paymentStatus || 'PENDING'}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {order.items && order.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                        {item.productName ? item.productName : `Product #${item.productId}`} <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>(Qty: {item.quantity})</span>
                      </span>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Payment & Delivery Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.9rem', border: '1px solid var(--border-color)' }}>
                  <div>
                    <strong style={{ color: 'var(--accent-color)', display: 'block', marginBottom: '0.25rem' }}>Payment Details</strong>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                      Method: {order.paymentMethod === 'CARD' ? `Credit/Debit Card (**** ${order.cardLast4 || '4242'})` : 'Cash on Delivery'}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--accent-color)', display: 'block', marginBottom: '0.25rem' }}>Delivery Address</strong>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                      {order.shippingFullName ? `${order.shippingFullName} - ` : ''}
                      {order.shippingStreet ? `${order.shippingStreet}, ${order.shippingCity}, ${order.shippingCountry}` : 'Saved Address'}
                    </p>
                  </div>
                </div>

                {/* Total Summary */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  <span>Total Amount:</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
