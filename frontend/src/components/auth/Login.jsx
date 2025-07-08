import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      // Check for dummy credentials
      if ((formData.email === 'test' || formData.email === 'test@example.com') && formData.password === 'test') {
        // Simulate API call for login
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock successful login
        localStorage.setItem('token', 'mock-jwt-token');
        
        // Store user info
        const userInfo = {
          id: 'user-123',
          email: formData.email === 'test' ? 'test@example.com' : formData.email,
          name: 'Demo User'
        };
        localStorage.setItem('user', JSON.stringify(userInfo));
        localStorage.setItem('userInfo', JSON.stringify(userInfo)); // App.js uses userInfo key
        
        // Create a default tenant for testing
        const defaultTenant = {
          id: 'tenant-123',
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
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setError('Invalid credentials. Try username: test, password: test');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/assets/images/logo.png" alt="TimePulse Logo" className="auth-logo" />
          <h2>Welcome to TimePulse</h2>
          <p>Sign in to your account</p>
        </div>
        
        <div className="demo-credentials">
          <p><strong>Demo Access:</strong> Use username: <code>test</code> and password: <code>test</code></p>
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
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              className="form-control"
            />
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
