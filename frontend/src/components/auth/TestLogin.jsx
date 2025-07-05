import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const TestLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Simple check for test credentials
    if (username === 'test' && password === 'test') {
      // Set token
      localStorage.setItem('token', 'mock-jwt-token');
      
      // Set user info
      const userInfo = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Demo User'
      };
      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      // Create a default tenant
      const defaultTenant = {
        id: 'tenant-123',
        name: 'Demo Company',
        subdomain: 'demo',
        status: 'active',
        role: 'admin'
      };
      
      // Store tenants
      localStorage.setItem('tenants', JSON.stringify([defaultTenant]));
      
      // Navigate to workspaces
      navigate('/workspaces');
    } else {
      setError('Invalid credentials. Use username: test, password: test');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>TimePulse Test Login</h2>
          <p>Use the test credentials to login</p>
        </div>
        
        <div className="demo-credentials">
          <p><strong>Demo Access:</strong> Use username: <code>test</code> and password: <code>test</code></p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="form-control"
            />
          </div>
          
          <button type="submit" className="btn-primary btn-block">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default TestLogin;
