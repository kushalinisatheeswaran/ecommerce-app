'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { productService } from '../../services/productService';
import { cartService } from '../../services/cartService';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ProductsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialSort = searchParams.get('sort') || 'price,asc';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [size] = useState(8);
  const [sort, setSort] = useState(initialSort);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await productService.getCategories();
        setCategories(cats || []);
      } catch (err) {
        console.error('Could not fetch categories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    setCategory(searchParams.get('category') || '');
    setSearch(searchParams.get('search') || '');
    if (searchParams.get('sort')) {
      setSort(searchParams.get('sort'));
    }
  }, [searchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await productService.getProducts({
        search: search.trim() || undefined,
        category: category || undefined,
        minPrice: minPrice !== '' ? minPrice : undefined,
        maxPrice: maxPrice !== '' ? maxPrice : undefined,
        sort,
        page,
        size,
      });
      setProducts(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, sort, category]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSort('price,asc');
    setPage(0);
    router.push('/products');
  };

  const handleAddToCart = async (productId) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      await cartService.addToCart(productId, 1);
      setFeedback((prev) => ({ ...prev, [productId]: { status: 'success', message: 'Added!' } }));
      setTimeout(() => {
        setFeedback((prev) => ({ ...prev, [productId]: null }));
      }, 2000);
    } catch (err) {
      setFeedback((prev) => ({
        ...prev,
        [productId]: { status: 'error', message: err.response?.data?.message || 'Out of stock' },
      }));
      setTimeout(() => {
        setFeedback((prev) => ({ ...prev, [productId]: null }));
      }, 3000);
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      
      {/* Header Title Banner */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.25rem' }}>Product Catalog</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Browse our full range of products with filters, sorting, and price ranges.
        </p>
      </div>

      {/* Filter Toolbar Container */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
        marginBottom: '2.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Search Box */}
          <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
            <label className="form-label">Search</label>
            <input
              type="text"
              placeholder="Search keyword..."
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Dropdown */}
          <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
            <label className="form-label">Category</label>
            <select
              className="form-input"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(0);
              }}
              style={{ cursor: 'pointer' }}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Min Price */}
          <div style={{ width: '100px' }}>
            <label className="form-label">Min ($)</label>
            <input
              type="number"
              placeholder="0"
              className="form-input"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min="0"
            />
          </div>

          {/* Max Price */}
          <div style={{ width: '100px' }}>
            <label className="form-label">Max ($)</label>
            <input
              type="number"
              placeholder="1000"
              className="form-input"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min="0"
            />
          </div>

          {/* Sort Selection */}
          <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
            <label className="form-label">Sort By</label>
            <select
              className="form-input"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(0);
              }}
              style={{ cursor: 'pointer' }}
            >
              <option value="price,asc">Price: Low to High</option>
              <option value="price,desc">Price: High to Low</option>
              <option value="name,asc">Name: A to Z</option>
              <option value="name,desc">Name: Z to A</option>
              <option value="createdAt,desc">Newest First</option>
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end', marginTop: 'auto' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
              Apply Filters
            </button>
            <button type="button" onClick={handleResetFilters} className="btn btn-secondary" style={{ padding: '0.65rem 1rem' }}>
              Reset
            </button>
          </div>

        </form>
      </div>

      {error && (
        <div style={{ color: 'var(--danger-color)', marginBottom: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading catalog items...</p>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No products found matching your search criteria.</p>
          <button onClick={handleResetFilters} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            Clear Search & Filters
          </button>
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
                    <span>No Image Available</span>
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
                      backgroundColor: feedback[product.id].status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      padding: '0.4rem',
                      borderRadius: '4px'
                    }}>
                      {feedback[product.id].message}
                    </div>
                  )}

                  <div className="product-footer">
                    <div>
                      <span className="product-price">${product.price.toFixed(2)}</span>
                      {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#d97706', fontWeight: '600' }}>
                          Only {product.stockQuantity} left
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => handleAddToCart(product.id)} 
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
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
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setPage((p) => Math.max(0, p - 1))} 
                disabled={page === 0}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1.25rem' }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Page {page + 1} of {totalPages}
              </span>
              <button 
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} 
                disabled={page === totalPages - 1}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1.25rem' }}
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

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
        <p>Loading products catalog...</p>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
