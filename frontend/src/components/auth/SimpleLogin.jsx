import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const SimpleLogin = () => {
  const navigate = useNavigate();

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('User already authenticated, redirecting to workspaces');
      navigate('/workspaces');
    }
  }, [navigate]);

  const handleSimpleLogin = () => {
    console.log('Simple login button clicked');
    
    try {
      // Set token
      localStorage.setItem('token', 'mock-jwt-token');
      
      // Set user info
      const userInfo = {
        id: 'user-123',
        email: 'demo@timepulse.com',
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
      
      // Store tenant and current tenant
      localStorage.setItem('tenants', JSON.stringify([defaultTenant]));
      localStorage.setItem('currentTenant', JSON.stringify(defaultTenant));
      
      console.log('Authentication data set, navigating to workspaces');
      
      // Dispatch a custom event to notify the app about authentication change
      window.dispatchEvent(new Event('auth-change'));
      
      // Force a small delay before navigation to ensure localStorage is updated
      setTimeout(() => {
        navigate('/workspaces');
      }, 100);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card simple-login">
        <div className="auth-header">
          <h2>TimePulse Simple Login</h2>
          <p>One-click access to the demo account</p>
        </div>

        
        <div className="simple-login-content">
          <p>Click the button below to instantly access the TimePulse demo with pre-configured settings.</p>
          
          <button 
            onClick={handleSimpleLogin} 
            className="btn-primary btn-block btn-lg"
          >
            Access Demo Account
          </button>
          
          <div className="simple-login-info">
            <p><strong>Note:</strong> This is a simplified login for demonstration purposes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleLogin;
