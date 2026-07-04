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
      <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '2rem' }}>Order History</h1>

        {error && (
          <div style={{ color: 'var(--danger-color)', marginBottom: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        {loading ? (

          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
            <p>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>You have not placed any orders yet.</p>
            <Link href="/products" className="btn btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {orders.map((order) => (
              <div 
                key={order.id} 
                style={{ 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '12px', 
                  padding: '1.5rem', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Order ID:</span>
                    <span style={{ fontWeight: '600', marginLeft: '0.25rem' }}>#{order.id}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status:</span>
                    <span style={{ 
                      fontWeight: '700', 
                      fontSize: '0.85rem',
                      marginLeft: '0.25rem',
                      color: order.status === 'DELIVERED' ? 'var(--success-color)' : 'var(--accent-color)',
                      textTransform: 'uppercase'
                    }}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  {order.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Product #{item.productId} (x{item.quantity})
                      </span>
                      <span>${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', fontWeight: '700', fontSize: '1.1rem' }}>
                  <span>Total Paid:</span>
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
