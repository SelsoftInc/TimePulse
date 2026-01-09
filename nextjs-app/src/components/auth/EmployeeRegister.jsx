'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import './Auth.css';

const EmployeeRegister = () => {
  const { subdomain, token } = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States ',
    agreeTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteInfo, setInviteInfo] = useState(null);
  const [validToken, setValidToken] = useState(true);
  const [step, setStep] = useState(1);

  useEffect(() => {
    // In a real app, validate the token with an API call
    // For now, simulate token validation
    const validateToken = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock invite data based on token
        // In a real app, this would come from the API
        if (token && token.length > 10) {
          setInviteInfo({
            email: 'invited.employee@example.com',
            name: 'Invited Employee',
            position: 'Software Developer',
            department: 'Engineering',
            employer: {
              name: 'Selsoft Technologies',
              subdomain: subdomain
            }
          });
          
          // Pre-fill form with invite data
          setFormData(prev => ({
            ...prev,
            email: 'invited.employee@example.com',
            firstName: 'Invited',
            lastName: 'Employee'
          }));
        } else {
          setValidToken(false);
          setError('Invalid or expired invitation link');
        }
      } catch (err) {
        setValidToken(false);
        setError('Failed to validate invitation. Please contact your administrator.');
      }
    };

    validateToken();
  }, [token, subdomain]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form based on current step
    if (step === 1) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      if (!formData.agreeTerms) {
        setError('You must agree to the Terms & Privacy Policy');
        return;
      }
      
      // Move to next step
      setStep(2);
      setError('');
      return;
    }
    
    // Final submission
    setLoading(true);
    setError('');

    try {
      // Simulate API call for registration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful registration
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('userInfo', JSON.stringify({
        id: 'user-' + Math.floor(Math.random() * 1000),
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        role: 'employee'
      }));
      
      // Set employer info
      localStorage.setItem('currentEmployer', JSON.stringify({
        id: 1,
        name: inviteInfo.employer.name,
        subdomain: inviteInfo.employer.subdomain,
        role: 'employee'
      }));
      
      // Redirect to dashboard
      router.push(`/${subdomain}/dashboard`);
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <img src="/assets/images/logo.png" alt="TimePulse Logo" className="auth-logo" />
            <h2>Invalid Invitation</h2>
          </div>
          <div className="alert alert-danger">{error}</div>
          <div className="auth-footer">
            <p>Please contact your administrator for a new invitation link.</p>
            <Link href="/simple-login" className="btn btn-primary mt-3">Back to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/assets/images/logo.png" alt="TimePulse Logo" className="auth-logo" />
          <h2>Complete Your Registration</h2>
          {inviteInfo && (
            <p>Welcome to {inviteInfo.employer.name}'s TimePulse system</p>
          )}
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {step === 1 ? (
            <>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                  className="form-control"
                  readOnly={inviteInfo?.email}
                />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      placeholder="First name"
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      placeholder="Last name"
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Create a password"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm your password"
                  className="form-control"
                />
              </div>

              <div className="terms-checkbox">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                />
                <label htmlFor="agreeTerms">
                  I agree to TimePulse's <a href="/terms" className="auth-link">Terms of Service</a> and <a href="/privacy" className="auth-link">Privacy Policy</a>
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address"
                  className="form-control"
                />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="state">State</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="State"
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="zip">ZIP Code</label>
                    <input
                      type="text"
                      id="zip"
                      name="zip"
                      value={formData.zip}
                      onChange={handleChange}
                      placeholder="ZIP code"
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="form-control"
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="India">India</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="btn-primary btn-block" 
            disabled={loading}
          >
            {loading ? 'Processing...' : step === 1 ? 'Continue' : 'Complete Registration'}
          </button>

          {step === 2 && (
            <button 
              type="button" 
              className="btn-outline btn-block mt-2" 
              onClick={() => setStep(1)}
            >
              Back
            </button>
          )}
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link href="/simple-login" className="auth-link">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRegister;
