'use client';

import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function AdminPage() {
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

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getProducts(0, 100);
      setProducts(data.content || []);
    } catch (err) {
      setError('Could not retrieve products list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEditClick = (product) => {
    setEditId(product.id);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(String(product.price));
    setStockQuantity(String(product.stockQuantity));
    setCategory(product.category);
    setImageUrl(product.imageUrl || '');
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setName('');
    setDescription('');
    setPrice('');
    setStockQuantity('');
    setCategory('');
    setImageUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFeedback('');

    const payload = {
      name,
      description,
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity),
      category,
      imageUrl,
    };

    try {
      if (editId) {
        await productService.updateProduct(editId, payload);
        setFeedback('Product updated successfully!');
      } else {
        await productService.createProduct(payload);
        setFeedback('Product created successfully!');
      }
      handleCancelEdit();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred while saving product.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to soft delete this product?')) return;
    setError('');
    setFeedback('');
    try {
      await productService.deleteProduct(id);
      setFeedback('Product soft deleted successfully!');
      fetchProducts();
    } catch (err) {
      setError('Failed to delete product.');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div style={{ maxWidth: '1200px', margin: '4rem auto', padding: '0 1.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2.5rem' }}>Admin Dashboard</h1>

        {error && (
          <div style={{ color: 'var(--danger-color)', marginBottom: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}>
            {error}
          </div>
        )}
        {feedback && (
          <div style={{ color: 'var(--success-color)', marginBottom: '1.5rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '1rem', borderRadius: '8px' }}>
            {feedback}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem', alignItems: 'start' }}>
          {/* Create / Edit Form */}
          <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>
              {editId ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                {editId && (
                  <button type="button" onClick={handleCancelEdit} className="btn btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>

          {/* Catalog Listing */}
          <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>Product Catalog</h2>
            {loading ? (
              <p>Loading...</p>
            ) : products.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No items in catalog.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {products.map((product) => (
                  <div 
                    key={product.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '1rem', 
                      borderBottom: '1px solid rgba(255,255,255,0.05)' 
                    }}
                  >
                    <div>
                      <h4 style={{ fontWeight: '600' }}>
                        {product.name}{' '}
                        <span style={{ fontSize: '0.8rem', fontWeight: '400', color: product.active ? 'var(--success-color)' : 'var(--danger-color)' }}>
                          ({product.active ? 'Active' : 'Inactive'})
                        </span>
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Price: ${product.price.toFixed(2)} | Stock: {product.stockQuantity}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleEditClick(product)} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} disabled={!product.active}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
