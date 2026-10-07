'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { orderService } from '../../services/orderService';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Tab State: 'products' | 'orders'
  const [activeTab, setActiveTab] = useState('products');

  // Product Management States
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Form states
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);

  // Order Management States
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Instant Route Guard
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'ADMIN') {
        router.replace('/');
      }
    }
  }, [user, authLoading, router]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await api.get('/api/admin/products', {
        params: { page: 0, size: 100 },
      });
      setProducts(response.data.content || []);
    } catch (err) {
      setError('Could not retrieve products list.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    setError('');
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (paymentFilter !== 'ALL') params.paymentStatus = paymentFilter;
      const data = await orderService.getAllAdminOrders(params);
      setOrders(data || []);
      if (selectedOrder) {
        const updated = data.find((o) => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err) {
      setError('Could not retrieve admin orders list.');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      if (activeTab === 'products') {
        fetchProducts();
      } else if (activeTab === 'orders') {
        fetchOrders();
      }
    }
  }, [user, activeTab, statusFilter, paymentFilter]);

  if (authLoading || !user || user.role !== 'ADMIN') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'radial-gradient(circle at center, #1e1b4b 0%, #09090b 100%)',
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            border: '4px solid rgba(255,255,255,0.1)',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            borderLeftColor: '#6366f1',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem auto'
          }} />
          <p style={{ fontSize: '1.125rem', fontWeight: '500', letterSpacing: '0.025em' }}>Loading Admin Workspace...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Product Actions
  const handleEditClick = (product) => {
    setEditId(product.id);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(String(product.price));
    setStockQuantity(String(product.stockQuantity));
    setCategory(product.category);
    setImageUrl(product.imageUrl || '');
    setActive(product.active);
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setName('');
    setDescription('');
    setPrice('');
    setStockQuantity('');
    setCategory('');
    setImageUrl('');
    setActive(true);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setError('');
    setFeedback('');

    const payload = {
      name,
      description,
      price: parseFloat(price) || 0,
      stockQuantity: parseInt(stockQuantity) >= 0 ? parseInt(stockQuantity) : 0,
      category,
      imageUrl,
      active,
    };

    try {
      if (editId) {
        await api.put(`/api/admin/products/${editId}`, payload);
        setFeedback('Product updated successfully!');
      } else {
        await api.post('/api/admin/products', payload);
        setFeedback('Product created successfully!');
      }
      handleCancelEdit();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred while saving product.');
    }
  };

  const handleToggleActive = async (product) => {
    setError('');
    setFeedback('');
    try {
      const payload = {
        name: product.name,
        description: product.description || '',
        price: product.price,
        stockQuantity: product.stockQuantity,
        category: product.category,
        imageUrl: product.imageUrl || '',
        active: !product.active,
      };
      await api.put(`/api/admin/products/${product.id}`, payload);
      setFeedback(`Product "${product.name}" status updated successfully!`);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle product status.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to soft delete this product?')) return;
    setError('');
    setFeedback('');
    try {
      await api.delete(`/api/admin/products/${id}`);
      setFeedback('Product soft deleted successfully!');
      fetchProducts();
    } catch (err) {
      setError('Failed to delete product.');
    }
  };

  // Order Actions
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setError('');
    setFeedback('');
    setActionLoading(true);
    try {
      const updated = await orderService.updateOrderStatus(orderId, newStatus);
      setFeedback(`Order #${orderId} status changed to ${newStatus}`);
      setSelectedOrder(updated);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newPaymentStatus) => {
    setError('');
    setFeedback('');
    setActionLoading(true);
    try {
      const updated = await orderService.updatePaymentStatus(orderId, newPaymentStatus);
      setFeedback(`Order #${orderId} payment status updated to ${newPaymentStatus}`);
      setSelectedOrder(updated);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payment status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics calculation
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stockQuantity < 5).length;
  const totalOrdersCount = orders.length;
  const placedPendingOrdersCount = orders.filter((o) => o.status === 'PLACED' || o.status === 'PROCESSING').length;
  const deliveredOrdersCount = orders.filter((o) => o.status === 'DELIVERED').length;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      color: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
      padding: '3rem 2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header section with glassmorphism */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '2rem 3rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              background: 'linear-gradient(to right, #818cf8, #c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.25rem'
            }}>Admin Console</h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>Manage catalog inventory, order fulfillment lifecycle, and payment verification</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => router.push('/')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: '#cbd5e1',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Storefront
            </button>
          </div>
        </div>

        {/* Dashboard Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            backdropFilter: 'blur(8px)'
          }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Total Products</span>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#818cf8', marginTop: '0.25rem' }}>{totalProducts}</div>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            backdropFilter: 'blur(8px)'
          }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Low Stock Warning</span>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: lowStockProducts > 0 ? '#f87171' : '#4ade80', marginTop: '0.25rem' }}>{lowStockProducts}</div>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            backdropFilter: 'blur(8px)'
          }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Total Orders</span>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#c084fc', marginTop: '0.25rem' }}>{totalOrdersCount}</div>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            backdropFilter: 'blur(8px)'
          }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Pending Fulfillment</span>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fbbf24', marginTop: '0.25rem' }}>{placedPendingOrdersCount}</div>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            backdropFilter: 'blur(8px)'
          }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Delivered Orders</span>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#34d399', marginTop: '0.25rem' }}>{deliveredOrdersCount}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '0.75rem 1.75rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'products' ? '#6366f1' : 'transparent',
              color: '#ffffff',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
          >
            📦 Products Management
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '0.75rem 1.75rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'orders' ? '#6366f1' : 'transparent',
              color: '#ffffff',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
          >
            🛒 Orders & Fulfillment
          </button>
        </div>

        {/* Action Feedbacks */}
        {error && (
          <div style={{
            color: '#f87171',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '1.25rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            fontSize: '0.95rem'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        {feedback && (
          <div style={{
            color: '#4ade80',
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            padding: '1.25rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            fontSize: '0.95rem'
          }}>
            {feedback}
          </div>
        )}

        {/* TAB 1: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '400px 1fr',
            gap: '3rem',
            alignItems: 'start'
          }}>
            {/* Create & Edit Form */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(8px)',
              padding: '2.5rem',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem', color: '#cbd5e1' }}>
                {editId ? 'Modify Product' : 'Register Product'}
              </h2>
              <form onSubmit={handleSubmitProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.5rem' }}>Product Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Premium Wireless Headphones"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      outline: 'none',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.5rem' }}>Description</label>
                  <textarea
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      outline: 'none',
                      resize: 'none',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.5rem' }}>Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="99.99"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#ffffff',
                        outline: 'none',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.5rem' }}>Inventory</label>
                    <input
                      type="number"
                      required
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      placeholder="50"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#ffffff',
                        outline: 'none',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.5rem' }}>Category</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Electronics"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      outline: 'none',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.5rem' }}>Image URL</label>
                  <input
                    type="text"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      outline: 'none',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.25rem 0' }}>
                  <input
                    type="checkbox"
                    id="activeCheckbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: '#6366f1',
                      cursor: 'pointer'
                    }}
                  />
                  <label htmlFor="activeCheckbox" style={{ fontSize: '0.95rem', color: '#cbd5e1', cursor: 'pointer', userSelect: 'none' }}>
                    Available/Active for customers
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  {editId && (
                    <button 
                      type="button" 
                      onClick={handleCancelEdit} 
                      style={{
                        flex: 1,
                        padding: '0.85rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent',
                        color: '#cbd5e1',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    type="submit" 
                    style={{
                      flex: 2,
                      padding: '0.85rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(to right, #6366f1, #4f46e5)',
                      color: '#ffffff',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    {editId ? 'Save Changes' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>

            {/* Product Catalog Listing Table */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(8px)',
              padding: '2.5rem',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem', color: '#cbd5e1' }}>Catalog List</h2>
              {loadingProducts ? (
                <p style={{ color: '#94a3b8' }}>Retrieving live inventory...</p>
              ) : products.length === 0 ? (
                <p style={{ color: '#94a3b8' }}>No items in catalog.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Details</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Category</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Price</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Stock</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr 
                          key={product.id} 
                          style={{ 
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100'; }}
                              />
                              <div>
                                <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{product.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {product.description || 'No description provided'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1.25rem 1rem', color: '#cbd5e1', fontSize: '0.9rem' }}>{product.category}</td>
                          <td style={{ padding: '1.25rem 1rem', color: '#f1f5f9', fontWeight: '600', fontSize: '0.9rem' }}>${product.price.toFixed(2)}</td>
                          <td style={{ padding: '1.25rem 1rem', color: '#cbd5e1', fontSize: '0.9rem' }}>{product.stockQuantity}</td>
                          <td style={{ padding: '1.25rem 1rem' }}>
                            <span style={{
                              padding: '0.25rem 0.6rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              backgroundColor: product.active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: product.active ? '#4ade80' : '#f87171',
                              border: `1px solid ${product.active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
                            }}>
                              {product.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={() => handleToggleActive(product)}
                                style={{
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  background: product.active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                  color: product.active ? '#f87171' : '#4ade80',
                                  border: `1px solid ${product.active ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`
                                }}
                              >
                                {product.active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button 
                                onClick={() => handleEditClick(product)} 
                                style={{
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  background: 'rgba(255,255,255,0.05)',
                                  color: '#cbd5e1',
                                  border: '1px solid rgba(255,255,255,0.1)'
                                }}
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product.id)} 
                                style={{
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  background: 'rgba(239, 68, 68, 0.2)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.3)'
                                }}
                                disabled={!product.active}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS & FULFILLMENT MANAGEMENT */}
        {activeTab === 'orders' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: selectedOrder ? '1fr 480px' : '1fr',
            gap: '2rem',
            alignItems: 'start'
          }}>
            {/* Orders List & Filters */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(8px)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
              {/* Filtering Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#cbd5e1' }}>Customer Orders List</h2>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginRight: '0.5rem' }}>Order Status:</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.15)',
                        outline: 'none',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PLACED">PLACED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginRight: '0.5rem' }}>Payment Status:</label>
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.15)',
                        outline: 'none',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="ALL">All Payments</option>
                      <option value="PENDING">PENDING</option>
                      <option value="PAID_TEST">PAID_TEST</option>
                      <option value="FAILED">FAILED</option>
                    </select>
                  </div>
                </div>
              </div>

              {loadingOrders ? (
                <p style={{ color: '#94a3b8' }}>Loading customer orders...</p>
              ) : orders.length === 0 ? (
                <p style={{ color: '#94a3b8' }}>No customer orders found matching filter criteria.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Order Ref</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Customer</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Total</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Payment</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Order Status</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((ord) => (
                        <tr
                          key={ord.id}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            backgroundColor: selectedOrder?.id === ord.id ? 'rgba(99, 102, 241, 0.12)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '1rem', fontWeight: '800', color: '#818cf8' }}>#{ord.id}</td>
                          <td style={{ padding: '1rem', color: '#f1f5f9' }}>
                            <div style={{ fontWeight: '600' }}>{ord.shippingFullName || 'Customer'}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{ord.customerEmail || ''}</div>
                          </td>
                          <td style={{ padding: '1rem', fontWeight: '700', color: '#ffffff' }}>${ord.totalAmount.toFixed(2)}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              backgroundColor: ord.paymentStatus === 'PAID_TEST' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: ord.paymentStatus === 'PAID_TEST' ? '#4ade80' : '#fbbf24',
                              border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                              {ord.paymentStatus}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              backgroundColor: ord.status === 'DELIVERED' ? 'rgba(34, 197, 94, 0.15)' : (ord.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)'),
                              color: ord.status === 'DELIVERED' ? '#4ade80' : (ord.status === 'CANCELLED' ? '#f87171' : '#a5b4fc'),
                              border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                              {ord.status}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              style={{
                                padding: '0.4rem 0.85rem',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                background: selectedOrder?.id === ord.id ? '#6366f1' : 'rgba(255,255,255,0.05)',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                              }}
                            >
                              Inspect Details →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Selected Order Detailed Drawer View */}
            {selectedOrder && (
              <div style={{
                background: 'rgba(30, 41, 59, 0.8)',
                backdropFilter: 'blur(10px)',
                padding: '2rem',
                borderRadius: '16px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                position: 'sticky',
                top: '2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#ffffff' }}>Order #{selectedOrder.id} Details</h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                {/* Customer Snapshot */}
                <div style={{ marginBottom: '1.25rem', fontSize: '0.9rem', color: '#cbd5e1', background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ fontWeight: '700', color: '#818cf8', marginBottom: '0.35rem' }}>Customer & Shipping Address</div>
                  <p style={{ margin: '0 0 0.25rem 0' }}><strong>Name:</strong> {selectedOrder.shippingFullName}</p>
                  <p style={{ margin: '0 0 0.25rem 0' }}><strong>Email:</strong> {selectedOrder.customerEmail || 'N/A'}</p>
                  <p style={{ margin: '0 0 0.25rem 0' }}><strong>Phone:</strong> {selectedOrder.shippingPhone || 'N/A'}</p>
                  <p style={{ margin: 0 }}><strong>Address:</strong> {selectedOrder.shippingStreet}, {selectedOrder.shippingCity}, {selectedOrder.shippingState} {selectedOrder.shippingZipcode}, {selectedOrder.shippingCountry}</p>
                </div>

                {/* Items Snapshot */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontWeight: '700', color: '#818cf8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Order Items Snapshot</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {selectedOrder.items && selectedOrder.items.map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', background: 'rgba(15, 23, 42, 0.5)', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                        <span>{item.productName} (x{item.quantity})</span>
                        <span style={{ fontWeight: '700' }}>${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Subtotal:</span>
                    <span style={{ color: '#ffffff' }}>${selectedOrder.subtotal?.toFixed(2)}</span>
                  </div>
                  {selectedOrder.deliveryFee > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>Delivery Fee:</span>
                      <span style={{ color: '#ffffff' }}>${selectedOrder.deliveryFee?.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.codFee > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>COD Fee:</span>
                      <span style={{ color: '#ffffff' }}>${selectedOrder.codFee?.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.5rem', fontWeight: '800', fontSize: '1rem', color: '#4ade80' }}>
                    <span>Total Amount:</span>
                    <span>${selectedOrder.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Fulfillment Lifecycle Control */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
                  <div style={{ fontWeight: '700', color: '#818cf8', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Order Status Transition</div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {selectedOrder.status === 'PLACED' && (
                      <>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'PROCESSING')}
                          style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          Mark PROCESSING →
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'CANCELLED')}
                          style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          Cancel Order
                        </button>
                      </>
                    )}

                    {selectedOrder.status === 'PROCESSING' && (
                      <>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'SHIPPED')}
                          style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          Mark SHIPPED →
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'CANCELLED')}
                          style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          Cancel Order
                        </button>
                      </>
                    )}

                    {selectedOrder.status === 'SHIPPED' && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'DELIVERED')}
                        style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#34d399', color: '#0f172a', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Mark DELIVERED ✓
                      </button>
                    )}

                    {(selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'CANCELLED') && (
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>This order is in terminal state ({selectedOrder.status}). No further transitions allowed.</p>
                    )}
                  </div>

                  {/* Payment Status Action */}
                  <div style={{ fontWeight: '700', color: '#818cf8', fontSize: '0.9rem', marginBottom: '0.5rem', marginTop: '1rem' }}>Payment Status Management</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {selectedOrder.paymentStatus !== 'PAID_TEST' && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdatePaymentStatus(selectedOrder.id, 'PAID_TEST')}
                        style={{ padding: '0.4rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.4)', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Confirm Payment (Mark PAID_TEST)
                      </button>
                    )}
                    {selectedOrder.paymentStatus !== 'FAILED' && selectedOrder.paymentStatus !== 'PAID_TEST' && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdatePaymentStatus(selectedOrder.id, 'FAILED')}
                        style={{ padding: '0.4rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Mark Payment FAILED
                      </button>
                    )}
                    {selectedOrder.paymentStatus === 'PAID_TEST' && (
                      <p style={{ fontSize: '0.85rem', color: '#4ade80', margin: 0 }}>Payment confirmed (PAID_TEST).</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
