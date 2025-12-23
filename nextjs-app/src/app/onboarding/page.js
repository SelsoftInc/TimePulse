'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import '@/components/auth/Auth.css';
import { API_BASE } from '@/config/api';
import { decryptAuthResponse } from '@/utils/encryption';

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [googleId, setGoogleId] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: '',
    phoneNumber: '',
    department: ''
  });

  useEffect(() => {
    // Get email and googleId from URL params
    const emailParam = searchParams.get('email');
    const googleIdParam = searchParams.get('googleId');
    const nameParam = searchParams.get('name');
    
    if (!emailParam) {
      router.push('/login');
      return;
    }
    
    setEmail(emailParam);
    setGoogleId(googleIdParam || '');
    
    // Pre-fill name if available
    if (nameParam) {
      const nameParts = nameParam.split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || ''
      }));
    }
  }, [searchParams, router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.role) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/oauth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          googleId: googleId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          phoneNumber: formData.phoneNumber,
          department: formData.department
        })
      });

      console.log('[Onboarding] Response status:', response.status);
      const rawData = await response.json();
      console.log('[Onboarding] Raw response data:', rawData);
      
      // Decrypt the response if encrypted
      const data = decryptAuthResponse(rawData);
      console.log('[Onboarding] Decrypted response data:', data);

      if (response.ok && data.success) {
        console.log('[Onboarding] Registration successful');
        
        // Check if approval is required
        if (data.requiresApproval) {
          console.log('[Onboarding] User requires admin approval');
          
          // Store user info for pending status display
          const userInfo = {
            id: data.user.id,
            email: data.user.email,
            name: `${data.user.firstName} ${data.user.lastName}`,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            role: data.user.role,
            tenantId: data.user.tenantId,
            approvalStatus: data.user.approvalStatus
          };
          localStorage.setItem('pendingUser', JSON.stringify(userInfo));
          
          // Redirect to pending approval page
          router.push('/pending-approval');
          return;
        }
        
        // Normal registration flow (no approval required)
        localStorage.setItem('token', data.token);
        
        const userInfo = {
          id: data.user.id,
          email: data.user.email,
          name: `${data.user.firstName} ${data.user.lastName}`,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          role: data.user.role,
          tenantId: data.user.tenantId,
          employeeId: data.user.employeeId,
          status: data.user.status
        };
        localStorage.setItem('user', JSON.stringify(userInfo));
        localStorage.setItem('userInfo', JSON.stringify(userInfo));

        // Store tenant info
        if (data.tenant) {
          const tenantInfo = {
            id: data.tenant.id,
            name: data.tenant.tenantName,
            subdomain: data.tenant.subdomain,
            status: data.tenant.status,
            role: data.user.role
          };
          localStorage.setItem('tenants', JSON.stringify([tenantInfo]));
          localStorage.setItem('currentTenant', JSON.stringify(tenantInfo));
          localStorage.setItem('currentEmployer', JSON.stringify(tenantInfo));
        }

        // Redirect based on role
        const subdomain = data.tenant?.subdomain || 'selsoft';
        const dashboardPath = data.user.role === 'employee' 
          ? `/${subdomain}/employee-dashboard`
          : `/${subdomain}/dashboard`;
        
        console.log('[Onboarding] Redirecting to:', dashboardPath);
        window.location.href = dashboardPath;
      } else {
        console.error('[Onboarding] Registration failed:', data);
        
        // Check if user already exists and should login
        if (data.userExists && data.shouldLogin) {
          console.log('[Onboarding] User already exists, redirecting to login');
          setError(data.message || 'An account with this email already exists. Redirecting to login...');
          
          // Redirect to login after 2 seconds
          setTimeout(() => {
            router.push('/login');
          }, 2000);
          return;
        }
        
        // Check if user is pending approval
        if (data.userExists && data.isPending) {
          console.log('[Onboarding] User already pending approval');
          setError(data.message || 'Your registration is already pending admin approval.');
          
          // Redirect to pending approval page after 2 seconds
          setTimeout(() => {
            router.push('/pending-approval');
          }, 2000);
          return;
        }
        
        const errorMsg = data.error || data.message || 'Registration failed. Please try again.';
        setError(errorMsg);
      }
    } catch (err) {
      console.error('[Onboarding] Error:', err);
      setError(`Failed to complete registration: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container default">
      <div className="floating-element"></div>
      <div className="floating-element"></div>
      <div className="floating-element"></div>

      <div className="auth-card" style={{ maxWidth: '600px' }}>
        <div className="auth-header">
          <img 
            src="/assets/images/jsTree/TimePulseLogoAuth.png" 
            alt="TimePulse Logo" 
            className="auth-logo" 
          />
          <h2>Complete Your Profile</h2>
          {/* <p style={{ color: '#ffffff', opacity: 1 }}>Welcome! Please provide your information to get started</p> */}
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="Enter first name"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Enter last name"
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              disabled
              className="form-control"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', cursor: 'not-allowed', color: '#ffffff' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="form-control"
              style={{ 
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            >
              <option value="">Select your role</option>
              <option value="admin">Admin - Full system access</option>
              <option value="approver">Approver - Manage and approve timesheets</option>
              <option value="employee">Employee - Submit timesheets</option>
            </select>
          </div>

          {/* <div className="info-message" style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#ffffff'
          }}>
            <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#ffffff' }}></i>
            You will be added to your company's existing workspace based on your email domain.
          </div> */}

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Enter phone number (optional)"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g., Engineering (optional)"
                className="form-control"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: '24px' }}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#ffffff', opacity: 0.7 }}>
          <p style={{ color: '#ffffff' }}>By completing registration, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
