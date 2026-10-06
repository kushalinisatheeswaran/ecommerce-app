import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-column">
          <h4 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: '800' }}>E-Com Store</h4>
          <p style={{ fontSize: '0.875rem', lineHeight: '1.6', marginTop: '0.5rem' }}>
            Your premium destination for modern high-quality electronics, fashion, beauty, and everyday lifestyle essentials.
          </p>
        </div>

        <div className="footer-column">
          <h4>Shop Catalog</h4>
          <ul>
            <li><Link href="/products">All Products</Link></li>
            <li><Link href="/products?category=Electronics">Electronics</Link></li>
            <li><Link href="/products?category=Fashion">Fashion</Link></li>
            <li><Link href="/products?category=Beauty%20%26%20Personal%20Care">Beauty & Care</Link></li>
            <li><Link href="/products?category=Home%20Appliances">Home & Living</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Customer Care</h4>
          <ul>
            <li><Link href="/orders">Order History</Link></li>
            <li><Link href="/cart">Shopping Cart</Link></li>
            <li><Link href="/login">My Account</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Portfolio Project</h4>
          <p style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
            Built with Next.js, React, and Spring Boot REST API. Designed for clean architecture and robust performance.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <div>&copy; {new Date().getFullYear()} E-Com Store. All rights reserved.</div>
        <div>Spring Boot + Next.js Portfolio Architecture</div>
      </div>
    </footer>
  );
}
