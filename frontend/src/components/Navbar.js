'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (path) => pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link href="/" className="nav-logo">
          E-Com Store
        </Link>
      </div>

      <div className={`nav-menu ${mobileOpen ? 'open' : ''}`}>
        <Link 
          href="/" 
          className={`nav-link ${isActive('/') ? 'active' : ''}`}
          onClick={() => setMobileOpen(false)}
        >
          Home
        </Link>
        <Link 
          href="/products" 
          className={`nav-link ${isActive('/products') ? 'active' : ''}`}
          onClick={() => setMobileOpen(false)}
        >
          All Products
        </Link>
        {user ? (
          <>
            <Link 
              href="/wishlist" 
              className={`nav-link ${isActive('/wishlist') ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              Wishlist
            </Link>
            <Link 
              href="/account" 
              className={`nav-link ${isActive('/account') ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              Account
            </Link>
            <Link 
              href="/cart" 
              className={`nav-link ${isActive('/cart') ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              Cart
            </Link>
            <Link 
              href="/orders" 
              className={`nav-link ${isActive('/orders') ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              Orders
            </Link>
            {user.role === 'ADMIN' && (
              <Link 
                href="/admin" 
                className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                Admin Panel
              </Link>
            )}
          </>
        ) : null}
      </div>

      <div className="nav-actions">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              href="/account"
              style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'none' }}
              className="user-email-badge"
            >
              👤 {user.email}
            </Link>
            <button 
              onClick={handleLogout} 
              className="btn btn-outline" 
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
            >
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/login" className="btn btn-outline" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
              Login
            </Link>
            <Link href="/register" className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
              Register
            </Link>
          </div>
        )}

        <button 
          className="mobile-nav-toggle" 
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
}
