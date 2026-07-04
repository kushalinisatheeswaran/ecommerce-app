'use client';

import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { cartService } from '../../services/cartService';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [size] = useState(6);
  const [sort, setSort] = useState('price,asc');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({});

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      if (search.trim()) {
        const searchResults = await productService.searchProducts(search);
        data = {
          content: searchResults,
          totalPages: 1,
        };
      } else {
        data = await productService.getProducts(page, size, sort);
      }
      setProducts(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError('Could not fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchProducts();
  };

  const handleAddToCart = async (productId) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      await cartService.addToCart(productId, 1);
      setFeedback((prev) => ({ ...prev, [productId]: { status: 'success', message: 'Added to cart!' } }));
      setTimeout(() => {
        setFeedback((prev) => ({ ...prev, [productId]: null }));
      }, 2000);
    } catch (err) {
      setFeedback((prev) => ({
        ...prev,
        [productId]: { status: 'error', message: err.response?.data?.message || 'Out of stock or error' },
      }));
      setTimeout(() => {
        setFeedback((prev) => ({ ...prev, [productId]: null }));
      }, 3000);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Catalog</h1>
        
        {/* Search & Sort Controls */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Search products..."
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '200px', padding: '0.5rem 1rem' }}
            />
            <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Search</button>
          </form>

          <select
            className="form-input"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(0);
            }}
            style={{ width: '160px', padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            <option value="price,asc">Price: Low to High</option>
            <option value="price,desc">Price: High to Low</option>
            <option value="name,asc">Name: A to Z</option>
            <option value="name,desc">Name: Z to A</option>
          </select>
        </div>
      </header>

      {error && (
        <div style={{ color: 'var(--danger-color)', marginBottom: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <p>Loading catalog items...</p>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No products found.</p>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((product) => (
              <div className="product-card" key={product.id}>
                <Link href={`/product/${product.id}`} className="product-image-container">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span>No Image</span>
                  )}
                </Link>
                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <Link href={`/product/${product.id}`} className="product-name">
                    {product.name}
                  </Link>
                  <p className="product-desc">{product.description}</p>
                  
                  {feedback[product.id] && (
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: feedback[product.id].status === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
                      marginBottom: '0.5rem',
                      backgroundColor: feedback[product.id].status === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      padding: '0.5rem',
                      borderRadius: '4px'
                    }}>
                      {feedback[product.id].message}
                    </div>
                  )}

                  <div className="product-footer">
                    <span className="product-price">${product.price.toFixed(2)}</span>
                    <button 
                      onClick={() => handleAddToCart(product.id)} 
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      disabled={product.stockQuantity <= 0}
                    >
                      {product.stockQuantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {!search.trim() && totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setPage((p) => Math.max(0, p - 1))} 
                disabled={page === 0}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem' }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Page {page + 1} of {totalPages}
              </span>
              <button 
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} 
                disabled={page === totalPages - 1}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
