'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Instant Route Guard
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'ADMIN') {
        router.replace('/');
      }
    }
  }, [user, authLoading, router]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/products', {
        params: { page: 0, size: 100 },
      });
      setProducts(response.data.content || []);
    } catch (err) {
      setError('Could not retrieve products list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchProducts();
    }
  }, [user]);

  // If loading auth or user is not authorized, render a loading screen (redirection happens via useEffect)
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

  const handleSubmit = async (e) => {
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

  const handleDelete = async (id) => {
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      color: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
      padding: '4rem 2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header section with glassmorphism */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '2rem 3rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '3rem',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
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
            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>Manage your product inventory, stock status, and visibility</p>
          </div>
          <button 
            onClick={() => router.push('/')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            Storefront
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
            fontSize: '0.95rem',
            lineHeight: '1.5'
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
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                  placeholder="Provide details about features, specifications..."
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
            {loading ? (
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
                          transition: 'background-color 0.2s',
                          cursor: 'default'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
                              onClick={() => handleDelete(product.id)} 
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
      </div>
    </div>
  );
}
