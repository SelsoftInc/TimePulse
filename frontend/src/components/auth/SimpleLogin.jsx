import React, { useState } from 'react';
import './Auth.css';

const SimpleLogin = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSimpleLogin = () => {
    setIsLoggingIn(true);
    console.log('Simple login button clicked');
    
    try {
      // Clear any existing data first
      localStorage.clear();
      
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
      
      // Create mock workspaces/tenants
      const mockWorkspaces = [
        {
          id: 'tenant-123',
          name: 'Demo Company',
          subdomain: 'demo',
          status: 'active',
          role: 'admin',
          industry: 'Technology',
          createdAt: '2025-01-15',
          lastAccessed: '2025-07-05'
        },
        {
          id: 'tenant-456',
          name: 'Test Organization',
          subdomain: 'test-org',
          status: 'trial',
          role: 'admin',
          industry: 'Consulting',
          createdAt: '2025-06-10',
          lastAccessed: '2025-07-03'
        }
      ];
      
      // Store tenant and current tenant
      localStorage.setItem('tenants', JSON.stringify(mockWorkspaces));
      localStorage.setItem('currentTenant', JSON.stringify(defaultTenant));
      
      console.log('Authentication data set, navigating to workspaces');
      
      // Use window.location for a full page reload to ensure app state is reset
      window.location.href = '/workspaces';
    } catch (error) {
      console.error('Error during login:', error);
      setIsLoggingIn(false);
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
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Logging in...' : 'Access Demo Account'}
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
