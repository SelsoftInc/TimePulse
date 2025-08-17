import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { API_BASE } from '../../config/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

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

    try {
      // Check for demo credentials first
      if ((formData.email === 'test' || formData.email === 'test@example.com') && formData.password === 'test') {
        // Simulate API call for login
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock successful login
        localStorage.setItem('token', 'mock-jwt-token');
        
        // Store user info
        const userInfo = {
          id: 'user-123',
          email: formData.email === 'test' ? 'test@example.com' : formData.email,
          name: 'Demo User',
          tenantId: '6d872133-6fab-4804-9abf-187ece5d7d40'
        };
        localStorage.setItem('user', JSON.stringify(userInfo));
        localStorage.setItem('userInfo', JSON.stringify(userInfo)); // App.js uses userInfo key
        
        // Create a default tenant for testing using real tenant ID
        const defaultTenant = {
          id: '6d872133-6fab-4804-9abf-187ece5d7d40',
          name: 'Selsoft',
          subdomain: 'selsoft',
          status: 'active',
          role: 'admin'
        };
        
        // Store the tenant info but don't set as current tenant yet
        // This will direct the user to the workspace selection screen
        localStorage.setItem('tenants', JSON.stringify([defaultTenant]));
        
        // Redirect to workspaces page
        navigate('/workspaces');
      } else {
        // Try real authentication with backend
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Store authentication token
          localStorage.setItem('token', data.token);
          
          // Store user info
          const userInfo = {
            id: data.user.id,
            email: data.user.email,
            name: `${data.user.firstName} ${data.user.lastName}`,
            role: data.user.role,
            tenantId: data.user.tenantId
          };
          localStorage.setItem('user', JSON.stringify(userInfo));
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
          
          // Store tenant info
          if (data.tenant) {
            const tenantInfo = {
              id: data.tenant.id,
              name: data.tenant.tenantName,
              subdomain: data.tenant.subdomain,
              status: 'active',
              role: data.user.role
            };
            localStorage.setItem('tenants', JSON.stringify([tenantInfo]));
            localStorage.setItem('currentTenant', JSON.stringify(tenantInfo));
          }
          
          // Redirect to dashboard
          navigate('/selsoft/dashboard');
        } else {
          setError(data.message || 'Invalid credentials. For demo access, use username: test, password: test');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. For demo access, use username: test, password: test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/assets/images/logo-text.svg" alt="TimePulse Logo" className="auth-logo" />
          <h2>Welcome to TimePulse</h2>
          <p>Sign in to your account</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Username or Email</label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter username or email"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="form-control password-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-footer">
            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember Me</label>
            </div>
            <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
          </div>

          <button 
            type="submit" 
            className="btn-primary btn-block" 
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div className="social-login">
          <button className="btn-social btn-google">
            <i className="fab fa-google"></i> Sign in with Google
          </button>
          <button className="btn-social btn-microsoft">
            <i className="fab fa-microsoft"></i> Sign in with Microsoft
          </button>
        </div>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register" className="auth-link">Create Account</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
