'use client';

import React, { useState, useEffect } from 'react';
import { cartService } from '../../services/cartService';
import { orderService } from '../../services/orderService';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { validateLuhn, validateExpiryDate, validateCVV } from '../../utils/cardValidation';

export default function CheckoutPage() {
  const router = useRouter();

  // Core state
  const [step, setStep] = useState(1); // 1: Summary, 2: Payment, 3: Address, 4: Review, 5: Success
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState(''); // 'CASH_ON_DELIVERY' | 'CARD'
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  });
  const [cardErrors, setCardErrors] = useState({});

  // Address State
  const [addressData, setAddressData] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: ''
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);

  // Fetch initial cart & user profile address
  useEffect(() => {
    const initCheckout = async () => {
      setLoading(true);
      setError('');
      try {
        const cart = await cartService.getCart();
        setCartItems(cart || []);

        try {
          const userProfile = await orderService.getCurrentUser();
          if (userProfile) {
            setAddressData({
              fullName: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim(),
              phone: userProfile.phone || '',
              street: userProfile.address?.street || '',
              city: userProfile.address?.city || '',
              state: userProfile.address?.state || '',
              zipcode: userProfile.address?.zipcode || '',
              country: userProfile.address?.country || ''
            });
          }
        } catch {
          // Profile fetch optional fallback
        }
      } catch (err) {
        setError('Could not load cart details. Please return to cart.');
      } finally {
        setLoading(false);
      }
    };
    initCheckout();
  }, []);

  // Calculations
  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + (item.price || 0), 0);
  };

  const subtotal = calculateSubtotal();
  const discountAmount = 0.00;
  const deliveryFee = subtotal >= 100 ? 0.00 : 10.00; // Free delivery over $100
  const codFee = paymentMethod === 'CASH_ON_DELIVERY' ? 3.50 : 0.00;
  const totalAmount = subtotal - discountAmount + deliveryFee + codFee;

  // Validation Handlers
  const handleNextStep2To3 = () => {
    setError('');
    setCardErrors({});

    if (!paymentMethod) {
      setError('Please select a payment method to proceed.');
      return;
    }

    if (paymentMethod === 'CARD') {
      const errors = {};
      const cleanCardNum = cardData.cardNumber.replace(/\s+/g, '');

      if (!cleanCardNum) {
        errors.cardNumber = 'Card number is required.';
      } else if (!validateLuhn(cleanCardNum)) {
        errors.cardNumber = 'Invalid card number. Please check digits.';
      }

      if (!cardData.cardName.trim()) {
        errors.cardName = 'Name on card is required.';
      }

      if (!cardData.expiry.trim()) {
        errors.expiry = 'Expiry date is required (MM/YY).';
      } else if (!validateExpiryDate(cardData.expiry)) {
        errors.expiry = 'Invalid or expired date (Format: MM/YY).';
      }

      if (!cardData.cvv.trim()) {
        errors.cvv = 'CVV is required.';
      } else if (!validateCVV(cardData.cvv)) {
        errors.cvv = 'CVV must be 3 or 4 digits.';
      }

      if (Object.keys(errors).length > 0) {
        setCardErrors(errors);
        return;
      }
    }

    setStep(3);
  };

  const handleNextStep3To4 = () => {
    setError('');
    setAddressErrors({});
    const errors = {};

    if (!addressData.fullName.trim()) errors.fullName = 'Full name is required.';
    if (!addressData.phone.trim()) errors.phone = 'Phone number is required.';
    if (!addressData.street.trim()) errors.street = 'Street address is required.';
    if (!addressData.city.trim()) errors.city = 'City is required.';
    if (!addressData.state.trim()) errors.state = 'State / Province is required.';
    if (!addressData.zipcode.trim()) errors.zipcode = 'Postal / ZIP Code is required.';
    if (!addressData.country.trim()) errors.country = 'Country is required.';

    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      return;
    }

    setStep(4);
  };

  // Final Order Submission (Step 4 -> 5)
  const handleConfirmOrder = async () => {
    setError('');
    setSubmitting(true);

    try {
      const cleanCardNum = cardData.cardNumber.replace(/\s+/g, '');
      const cardLast4 = cleanCardNum.length >= 4 ? cleanCardNum.slice(-4) : '4242';

      const payload = {
        paymentMethod,
        cardLast4: paymentMethod === 'CARD' ? cardLast4 : null,
        fullName: addressData.fullName.trim(),
        phone: addressData.phone.trim(),
        street: addressData.street.trim(),
        city: addressData.city.trim(),
        state: addressData.state.trim(),
        zipcode: addressData.zipcode.trim(),
        country: addressData.country.trim(),
        saveAddressToProfile
      };

      const res = await orderService.createOrder(payload);
      setPlacedOrder(res);
      setStep(5);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please check stock availability or form inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <p>Loading checkout environment...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (cartItems.length === 0 && step !== 5) {
    return (
      <ProtectedRoute>
        <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '3rem 2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Your Cart is Empty</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Please add products to your cart before proceeding to checkout.</p>
            <Link href="/products" className="btn btn-primary">Browse Products</Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 1.5rem' }}>
        
        {/* Step Indicator Bar */}
        {step < 5 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '2.5rem',
            position: 'relative',
            background: 'var(--bg-secondary)',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {[
              { num: 1, label: '1. Items' },
              { num: 2, label: '2. Payment' },
              { num: 3, label: '3. Delivery' },
              { num: 4, label: '4. Review' }
            ].map((s) => (
              <div 
                key={s.num} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  fontWeight: step === s.num ? '700' : '500',
                  color: step === s.num ? 'var(--accent-color)' : step > s.num ? 'var(--success-color)' : 'var(--text-secondary)',
                  opacity: step >= s.num ? 1 : 0.6
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: step === s.num ? 'var(--accent-color)' : step > s.num ? 'var(--success-color)' : 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: '700'
                }}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div style={{ color: 'var(--danger-color)', marginBottom: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* STEP 1: CHECKOUT ITEMS SUMMARY */}
        {step === 1 && (
          <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>Order Items Summary</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
              {cartItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.product.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Item</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '1rem' }}>{item.product.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Price: ${item.product.price.toFixed(2)} × Qty: {item.quantity}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                    ${item.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Discount</span>
                <span>${discountAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Estimated Delivery Fee</span>
                <span>{deliveryFee === 0 ? <strong style={{ color: 'var(--success-color)' }}>FREE</strong> : `$${deliveryFee.toFixed(2)}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem', fontSize: '1.25rem', fontWeight: '800' }}>
                <span>Estimated Total</span>
                <span>${(subtotal - discountAmount + deliveryFee).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <Link href="/cart" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>Return to Cart</Link>
              <button onClick={() => setStep(2)} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Proceed to Payment Method</button>
            </div>
          </div>
        )}

        {/* STEP 2: PAYMENT METHOD SELECTION */}
        {step === 2 && (
          <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>Choose Payment Method</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
              
              {/* Option 1: Cash on Delivery */}
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1.5rem',
                borderRadius: '12px',
                border: paymentMethod === 'CASH_ON_DELIVERY' ? '2px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.08)',
                background: paymentMethod === 'CASH_ON_DELIVERY' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(0,0,0,0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="CASH_ON_DELIVERY" 
                  checked={paymentMethod === 'CASH_ON_DELIVERY'} 
                  onChange={() => setPaymentMethod('CASH_ON_DELIVERY')}
                  style={{ marginTop: '0.25rem', accentColor: 'var(--accent-color)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Cash on Delivery (COD)</div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Pay with cash when your items arrive at your doorstep.
                  </p>

                  {paymentMethod === 'CASH_ON_DELIVERY' && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <ul style={{ paddingLeft: '1.25rem', margin: 0, lineHeight: '1.6' }}>
                        <li>Payment must be made in full upon parcel delivery.</li>
                        <li>Please ensure an authorized receiver is available at the delivery location.</li>
                        <li>Verify package seal before taking delivery.</li>
                        <li>Applicable COD Fee: <strong>$3.50</strong></li>
                      </ul>
                    </div>
                  )}
                </div>
              </label>

              {/* Option 2: Credit / Debit Card */}
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1.5rem',
                borderRadius: '12px',
                border: paymentMethod === 'CARD' ? '2px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.08)',
                background: paymentMethod === 'CARD' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(0,0,0,0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="CARD" 
                  checked={paymentMethod === 'CARD'} 
                  onChange={() => setPaymentMethod('CARD')}
                  style={{ marginTop: '0.25rem', accentColor: 'var(--accent-color)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Credit / Debit Card</div>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '600' }}>
                      TEST SIMULATION
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Instant mock card payment simulation. No real bank charges will occur.
                  </p>

                  {paymentMethod === 'CARD' && (
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        🔒 <strong>Test Mode Security Notice:</strong> Real card credentials are never stored or logged. Format and Luhn algorithm validation occur strictly in local memory.
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#cbd5e1' }}>Card Number</label>
                          <input 
                            type="text"
                            placeholder="4532 0123 4567 8910"
                            maxLength="23"
                            value={cardData.cardNumber}
                            onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#09090b', border: cardErrors.cardNumber ? '1px solid var(--danger-color)' : '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '0.95rem' }}
                          />
                          {cardErrors.cardNumber && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{cardErrors.cardNumber}</span>}
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#cbd5e1' }}>Name on Card</label>
                          <input 
                            type="text"
                            placeholder="John Doe"
                            value={cardData.cardName}
                            onChange={(e) => setCardData({ ...cardData, cardName: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#09090b', border: cardErrors.cardName ? '1px solid var(--danger-color)' : '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '0.95rem' }}
                          />
                          {cardErrors.cardName && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{cardErrors.cardName}</span>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#cbd5e1' }}>Expiry (MM/YY)</label>
                            <input 
                              type="text"
                              placeholder="12/28"
                              maxLength="5"
                              value={cardData.expiry}
                              onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#09090b', border: cardErrors.expiry ? '1px solid var(--danger-color)' : '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '0.95rem' }}
                            />
                            {cardErrors.expiry && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{cardErrors.expiry}</span>}
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#cbd5e1' }}>CVV</label>
                            <input 
                              type="password"
                              placeholder="123"
                              maxLength="4"
                              value={cardData.cvv}
                              onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#09090b', border: cardErrors.cvv ? '1px solid var(--danger-color)' : '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '0.95rem' }}
                            />
                            {cardErrors.cvv && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{cardErrors.cvv}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </label>

            </div>

            {/* Price Summary Breakdown for Step 2 */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? <strong style={{ color: 'var(--success-color)' }}>FREE</strong> : `$${deliveryFee.toFixed(2)}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <span>COD Fee</span>
                <span>${codFee.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem', fontWeight: '700', fontSize: '1.15rem' }}>
                <span>Current Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <button onClick={() => setStep(1)} className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>Back to Items</button>
              <button onClick={handleNextStep2To3} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Continue to Delivery</button>
            </div>
          </div>
        )}

        {/* STEP 3: DELIVERY ADDRESS */}
        {step === 3 && (
          <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>Delivery Address</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#cbd5e1' }}>Full Name *</label>
                <input 
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={addressData.fullName}
                  onChange={(e) => setAddressData({ ...addressData, fullName: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: addressErrors.fullName ? '1px solid var(--danger-color)' : '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '0.95rem' }}
                />
                {addressErrors.fullName && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{addressErrors.fullName}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#cbd5e1' }}>Phone Number *</label>
                <input 
                  type="text"
                  placeholder="+94 77 123 4567"
                  value={addressData.phone}
                  onChange={(e) => setAddressData({ ...addressData, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: addressErrors.phone ? '1px solid var(--danger-color)' : '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '0.95rem' }}
                />
                {addressErrors.phone && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{addressErrors.phone}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#cbd5e1' }}>Street Address *</label>
                <input 
                  type="text"
                  placeholder="123 Main Street, Apt 4B"
                  value={addressData.street}
                  onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: addressErrors.street ? '1px solid var(--danger-color)' : '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '0.95rem' }}
                />
                {addressErrors.street && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{addressErrors.street}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#cbd5e1' }}>City *</label>
                  <input 
                    type="text"
                    placeholder="Colombo"
                    value={addressData.city}
                    onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: addressErrors.city ? '1px solid var(--danger-color)' : '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '0.95rem' }}
                  />
                  {addressErrors.city && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{addressErrors.city}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#cbd5e1' }}>State / Province *</label>
                  <input 
                    type="text"
                    placeholder="Western Province"
                    value={addressData.state}
                    onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: addressErrors.state ? '1px solid var(--danger-color)' : '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '0.95rem' }}
                  />
                  {addressErrors.state && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{addressErrors.state}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#cbd5e1' }}>Postal / ZIP Code *</label>
                  <input 
                    type="text"
                    placeholder="00100"
                    value={addressData.zipcode}
                    onChange={(e) => setAddressData({ ...addressData, zipcode: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: addressErrors.zipcode ? '1px solid var(--danger-color)' : '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '0.95rem' }}
                  />
                  {addressErrors.zipcode && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{addressErrors.zipcode}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#cbd5e1' }}>Country *</label>
                  <input 
                    type="text"
                    placeholder="Sri Lanka"
                    value={addressData.country}
                    onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: addressErrors.country ? '1px solid var(--danger-color)' : '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '0.95rem' }}
                  />
                  {addressErrors.country && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{addressErrors.country}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="saveProfileCheckbox"
                  checked={saveAddressToProfile}
                  onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)' }}
                />
                <label htmlFor="saveProfileCheckbox" style={{ fontSize: '0.9rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  Save this address to my user profile for future orders
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <button onClick={() => setStep(2)} className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>Back to Payment</button>
              <button onClick={handleNextStep3To4} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Proceed to Review</button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW ORDER */}
        {step === 4 && (
          <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>Review Your Order</h2>

            {/* Section 1: Order Items */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--accent-color)', marginBottom: '0.75rem' }}>Order Items</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {cartItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.95rem' }}>
                    <span>{item.product.name} (x{item.quantity})</span>
                    <span style={{ fontWeight: '600' }}>${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Selected Payment Method */}
            <div style={{ marginBottom: '1.75rem', background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '10px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--accent-color)', marginBottom: '0.5rem' }}>Payment Method</h3>
              <p style={{ fontWeight: '600', margin: 0 }}>
                {paymentMethod === 'CASH_ON_DELIVERY' ? '💵 Cash on Delivery (COD)' : `💳 Credit / Debit Card (Test Payment - Card ending in **** ${cardData.cardNumber.replace(/\s+/g, '').slice(-4) || '4242'})`}
              </p>
            </div>

            {/* Section 3: Delivery Address */}
            <div style={{ marginBottom: '1.75rem', background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '10px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--accent-color)', marginBottom: '0.5rem' }}>Delivery Address</h3>
              <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600' }}>{addressData.fullName} ({addressData.phone})</p>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {addressData.street}, {addressData.city}, {addressData.state} {addressData.zipcode}, {addressData.country}
              </p>
            </div>

            {/* Section 4: Final Price Summary */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <span>Discount</span>
                <span>${discountAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? <strong style={{ color: 'var(--success-color)' }}>FREE</strong> : `$${deliveryFee.toFixed(2)}`}</span>
              </div>
              {paymentMethod === 'CASH_ON_DELIVERY' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  <span>COD Handling Fee</span>
                  <span>${codFee.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem', fontSize: '1.3rem', fontWeight: '800' }}>
                <span>Final Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <button onClick={() => setStep(3)} className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }} disabled={submitting}>Back to Address</button>
              <button onClick={handleConfirmOrder} className="btn btn-primary" style={{ padding: '0.85rem 2.5rem', fontSize: '1.1rem', fontWeight: '700' }} disabled={submitting}>
                {submitting ? 'Creating Order...' : 'Place Order Now'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: ORDER SUCCESS CONFIRMATION */}
        {step === 5 && placedOrder && (
          <div style={{ background: 'var(--bg-secondary)', padding: '3rem 2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <div style={{ width: '70px', height: '70px', background: 'rgba(34, 197, 94, 0.15)', color: 'var(--success-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem auto' }}>
              ✓
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Order Placed Successfully!</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Thank you for your purchase. Your order has been registered.</p>

            <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>Order ID</span>
                  <strong style={{ fontSize: '1.1rem' }}>#{placedOrder.id}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>Order Date</span>
                  <strong>{new Date(placedOrder.createdAt || Date.now()).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>Payment Method</span>
                  <strong>{placedOrder.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'Credit / Debit Card (Test)'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>Payment Status</span>
                  <span style={{ 
                    color: placedOrder.paymentStatus === 'PAID_TEST' ? 'var(--success-color)' : 'var(--accent-color)', 
                    fontWeight: '700',
                    fontSize: '0.9rem' 
                  }}>
                    {placedOrder.paymentStatus}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Delivery Address</span>
                <p style={{ margin: 0, fontWeight: '600' }}>{placedOrder.shippingFullName} ({placedOrder.shippingPhone})</p>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {placedOrder.shippingStreet}, {placedOrder.shippingCity}, {placedOrder.shippingState} {placedOrder.shippingZipcode}, {placedOrder.shippingCountry}
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800' }}>
                <span>Total Amount Paid</span>
                <span>${placedOrder.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
              <Link href="/orders" className="btn btn-secondary" style={{ padding: '0.85rem 2rem' }}>View My Orders</Link>
              <Link href="/products" className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>Continue Shopping</Link>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
