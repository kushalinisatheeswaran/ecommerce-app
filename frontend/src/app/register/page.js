'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [zipcode, setZipcode] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      password,
      address: street ? { street, city, state, country, zipcode } : null,
    };

    try {
      const res = await register(payload);
      setSuccess(res.message || 'Registration successful! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Registration failed. Please make sure data is correct.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ minHeight: '100vh', padding: '3rem 2rem' }}>
      <div className="auth-card" style={{ maxWidth: '600px' }}>
        <h2 className="auth-title">Create Account</h2>
        {error && (
          <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontSize: '0.875rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '6px' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ color: 'var(--success-color)', marginBottom: '1rem', fontSize: '0.875rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '0.75rem', borderRadius: '6px' }}>
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
            />
          </div>

          <h3 style={{ fontSize: '1rem', margin: '1.5rem 0 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>Shipping Address (Optional)</h3>
          
          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input
              type="text"
              className="form-input"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                className="form-input"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input
                type="text"
                className="form-input"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Zipcode</label>
              <input
                type="text"
                className="form-input"
                value={zipcode}
                onChange={(e) => setZipcode(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--accent-color)', fontWeight: '600' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
