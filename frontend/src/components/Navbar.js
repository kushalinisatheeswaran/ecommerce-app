'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { cartService } from '../services/cartService';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch actual cart count for authenticated user without duplicate polling
  useEffect(() => {
    let isMounted = true;
    if (user) {
      cartService.getCart()
        .then((items) => {
          if (isMounted && Array.isArray(items)) {
            const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
            setCartCount(totalQty);
          }
        })
        .catch(() => {
          if (isMounted) setCartCount(0);
        });
    } else {
      setCartCount(0);
    }
    return () => { isMounted = false; };
  }, [user, pathname]);

  const handleLogout = () => {
    setProfileOpen(false);
    setMobileOpen(false);
    logout();
    router.push('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  const isActive = (path) => pathname === path;

  return (
    <header className="navbar-wrapper">
      <nav className="navbar" aria-label="Main Navigation">
        {/* Left: Brand */}
        <div className="nav-brand">
          <Link href="/" className="nav-logo" onClick={() => setMobileOpen(false)}>
            <span className="nav-logo-text">MODERNA</span>
            <span className="nav-logo-dot" />
          </Link>
        </div>

        {/* Center: Navigation links */}
        <div className={`nav-menu ${mobileOpen ? 'open' : ''}`}>
          {/* Mobile search bar inside drawer */}
          <form onSubmit={handleSearchSubmit} className="nav-mobile-search">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="nav-search-input-mobile"
            />
            <button type="submit" className="nav-search-btn" aria-label="Search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>

          <Link
            href="/products"
            className={`nav-link ${isActive('/products') ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            Shop
          </Link>
          <Link
            href="/#categories"
            className="nav-link"
            onClick={() => setMobileOpen(false)}
          >
            Categories
          </Link>
          <Link
            href="/products?sort=price,asc"
            className="nav-link"
            onClick={() => setMobileOpen(false)}
          >
            Deals
          </Link>
          <Link
            href="/products?sort=createdAt,desc"
            className="nav-link"
            onClick={() => setMobileOpen(false)}
          >
            New Arrival
          </Link>

          {/* Mobile links for authenticated users */}
          {user && (
            <div className="nav-mobile-user-links">
              <Link href="/wishlist" className="nav-link" onClick={() => setMobileOpen(false)}>
                Wishlist
              </Link>
              <Link href="/orders" className="nav-link" onClick={() => setMobileOpen(false)}>
                Orders
              </Link>
              <Link href="/account" className="nav-link" onClick={() => setMobileOpen(false)}>
                Account Settings
              </Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="nav-link" onClick={() => setMobileOpen(false)}>
                  Admin Panel
                </Link>
              )}
              <button onClick={handleLogout} className="nav-link-logout-btn">
                Log Out
              </button>
            </div>
          )}
        </div>

        {/* Right: Utility cluster */}
        <div className="nav-actions">
          {/* Desktop Search pill */}
          <form onSubmit={handleSearchSubmit} className="nav-search-form" role="search">
            <div className="nav-search-pill">
              <span className="nav-search-icon" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="nav-search-input"
                aria-label="Search store products"
              />
            </div>
          </form>

          {/* Cart button with dynamic badge */}
          <Link href="/cart" className="nav-cart-btn" aria-label={`Shopping cart with ${cartCount} items`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span className="nav-cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </Link>

          {/* Profile cluster */}
          {user ? (
            <div className="nav-profile-container" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="nav-profile-avatar-btn"
                aria-label="Open user profile menu"
                aria-expanded={profileOpen}
              >
                <span className="nav-profile-avatar-initial">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </span>
              </button>

              {profileOpen && (
                <div className="nav-profile-dropdown" role="menu">
                  <div className="nav-profile-header">
                    <span className="nav-profile-signed-in">Signed in as</span>
                    <span className="nav-profile-email" title={user.email}>{user.email}</span>
                  </div>
                  <div className="nav-profile-divider" />
                  <Link
                    href="/account"
                    className="nav-profile-item"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                  >
                    Account Profile
                  </Link>
                  <Link
                    href="/wishlist"
                    className="nav-profile-item"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                  >
                    Wishlist
                  </Link>
                  <Link
                    href="/orders"
                    className="nav-profile-item"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                  >
                    Order History
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="nav-profile-item nav-profile-item-admin"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="nav-profile-divider" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="nav-profile-item nav-profile-logout"
                    role="menuitem"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-auth-buttons">
              <Link href="/login" className="btn btn-outline nav-auth-login">
                Login
              </Link>
              <Link href="/register" className="btn btn-primary nav-auth-register">
                Register
              </Link>
            </div>
          )}

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
