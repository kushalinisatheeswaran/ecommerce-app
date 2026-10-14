import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-column">
          <div className="footer-brand">
            <span className="footer-brand-title">MODERNA</span>
            <span className="footer-brand-dot" />
          </div>
          <p className="footer-description">
            Your destination for curated luxury technology, contemporary fashion, and everyday essentials engineered for modern living.
          </p>
        </div>

        <div className="footer-column">
          <h4 className="footer-heading">Shop Catalog</h4>
          <ul className="footer-links">
            <li><Link href="/products">All Products</Link></li>
            <li><Link href="/products?category=Smartphones">Electronics</Link></li>
            <li><Link href="/products?category=Fashion">Fashion</Link></li>
            <li><Link href="/products?category=Beauty%20%26%20Personal%20Care">Beauty & Care</Link></li>
            <li><Link href="/products?category=Home%20Appliances">Home & Appliances</Link></li>
            <li><Link href="/products?category=Gaming">Gaming</Link></li>
            <li><Link href="/products?category=Books">Books</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4 className="footer-heading">Customer Care</h4>
          <ul className="footer-links">
            <li><Link href="/orders">Order History</Link></li>
            <li><Link href="/cart">Shopping Cart</Link></li>
            <li><Link href="/wishlist">Saved Items</Link></li>
            <li><Link href="/account">My Account</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4 className="footer-heading">About MODERNA</h4>
          <p className="footer-text-secondary">
            Built with Next.js and Spring Boot REST architecture. Designed with high-performance responsive engineering and sleek dark aesthetics.
          </p>
          <div className="footer-badge">
            <span className="footer-badge-dot" />
            <span>Encrypted & Verified Checkout</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div>&copy; {new Date().getFullYear()} MODERNA Inc. All rights reserved.</div>
        <div className="footer-bottom-links">
          <span>Privacy Policy</span>
          <span>•</span>
          <span>Terms of Service</span>
          <span>•</span>
          <span>Security</span>
        </div>
      </div>
    </footer>
  );
}
