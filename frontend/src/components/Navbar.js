'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (path) => pathname === path;

  return (
    <nav className="navbar">
      <Link href="/products" className="nav-logo">
        E-Com Store
      </Link>
      <div className="nav-links">
        <Link href="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>
          Products
        </Link>
        {user ? (
          <>
            <Link href="/cart" className={`nav-link ${isActive('/cart') ? 'active' : ''}`}>
              Cart
            </Link>
            <Link href="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>
              Orders
            </Link>
            {user.role === 'ADMIN' && (
              <Link href="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                Admin Panel
              </Link>
            )}
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              ({user.email})
            </span>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`}>
              Login
            </Link>
            <Link href="/register" className={`nav-link ${isActive('/register') ? 'active' : ''}`}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
