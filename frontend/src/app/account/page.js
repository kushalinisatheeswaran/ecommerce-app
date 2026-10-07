'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import Link from 'next/link';
import { userService } from '../../services/userService';

export default function AccountPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit Profile Form State
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
  });
  const [profileMsg, setProfileMsg] = useState({ status: '', message: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  // Change Password Form State
  const [pwdData, setPwdData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwdMsg, setPwdMsg] = useState({ status: '', message: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await userService.getCurrentProfile();
      setProfile(data);
      populateForm(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load profile information.');
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data) => {
    setFormData({
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      phone: data.phone || '',
      street: data.address?.street || '',
      city: data.address?.city || '',
      state: data.address?.state || '',
      zipcode: data.address?.zipcode || '',
      country: data.address?.country || '',
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg({ status: '', message: '' });
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipcode: formData.zipcode,
          country: formData.country,
        },
      };
      const updated = await userService.updateProfile(payload);
      setProfile(updated);
      populateForm(updated);
      setEditing(false);
      setProfileMsg({ status: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => setProfileMsg({ status: '', message: '' }), 4000);
    } catch (err) {
      setProfileMsg({ status: 'error', message: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      setPwdMsg({ status: 'error', message: 'New passwords do not match.' });
      return;
    }
    if (pwdData.newPassword.length < 6) {
      setPwdMsg({ status: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }
    setPwdSaving(true);
    setPwdMsg({ status: '', message: '' });
    try {
      await userService.changePassword(pwdData.currentPassword, pwdData.newPassword);
      setPwdMsg({ status: 'success', message: 'Password changed successfully!' });
      setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwdMsg({ status: '', message: '' }), 4000);
    } catch (err) {
      setPwdMsg({ status: 'error', message: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '1.5rem' }}>My Account</h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading account profile...</div>
        ) : error ? (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', borderRadius: '8px' }}>
            {error}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Left Column: Quick Nav & Profile Overview */}
            <div>
              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '1.75rem',
                border: '1px solid var(--border-color)',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Account Overview</h2>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--accent-color)'
                  }}>
                    {profile?.role}
                  </span>
                </div>

                <div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div><strong>Name:</strong> {profile?.firstName} {profile?.lastName}</div>
                  <div><strong>Email:</strong> {profile?.email} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Read-Only)</span></div>
                  <div><strong>Phone:</strong> {profile?.phone || 'Not provided'}</div>
                  <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <strong>Shipping Address:</strong>
                    {profile?.address?.street ? (
                      <div style={{ marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        {profile.address.street}<br />
                        {profile.address.city}{profile.address.state ? `, ${profile.address.state}` : ''} {profile.address.zipcode}<br />
                        {profile.address.country}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>No address saved yet.</div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setEditing(!editing)}
                  className="btn btn-outline"
                  style={{ width: '100%', marginTop: '1.25rem' }}
                >
                  {editing ? 'Cancel Editing' : 'Edit Profile & Address'}
                </button>
              </div>

              {/* Quick Navigation Links */}
              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid var(--border-color)'
              }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Link href="/orders" className="btn btn-outline" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                    📦 View Order History
                  </Link>
                  <Link href="/wishlist" className="btn btn-outline" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                    ❤️ View Saved Wishlist
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Edit Forms */}
            <div>
              {/* Profile / Address Edit Form */}
              {editing && (
                <div style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  padding: '1.75rem',
                  border: '1px solid var(--border-color)',
                  marginBottom: '2rem'
                }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.25rem' }}>Update Profile Details</h2>

                  {profileMsg.message && (
                    <div style={{
                      padding: '0.75rem',
                      borderRadius: '6px',
                      marginBottom: '1rem',
                      fontSize: '0.9rem',
                      background: profileMsg.status === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: profileMsg.status === 'success' ? 'var(--success-color)' : 'var(--danger-color)'
                    }}>
                      {profileMsg.message}
                    </div>
                  )}

                  <form onSubmit={handleProfileSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>First Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: '700', marginTop: '1rem', marginBottom: '0.75rem' }}>Shipping Address</h4>

                    <div className="form-group">
                      <label>Street Address</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>City</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>State</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Zipcode</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.zipcode}
                          onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Country</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={profileSaving}>
                      {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                  </form>
                </div>
              )}

              {/* Change Password Form */}
              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '1.75rem',
                border: '1px solid var(--border-color)'
              }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.25rem' }}>Change Password</h2>

                {pwdMsg.message && (
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    background: pwdMsg.status === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: pwdMsg.status === 'success' ? 'var(--success-color)' : 'var(--danger-color)'
                  }}>
                    {pwdMsg.message}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={pwdData.currentPassword}
                      onChange={(e) => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>New Password (min 6 characters)</label>
                    <input
                      type="password"
                      className="form-control"
                      value={pwdData.newPassword}
                      onChange={(e) => setPwdData({ ...pwdData, newPassword: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={pwdData.confirmPassword}
                      onChange={(e) => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={pwdSaving}>
                    {pwdSaving ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
