import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

import { useAuth } from '../../contexts/AuthContext';
import './TenantLayout.css';

const TenantLayout = ({ children }) => {
  const { subdomain } = useParams();
  const navigate = useNavigate();
  const { currentTenant, switchTenant, isAuthenticated, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileNavVisible, setMobileNavVisible] = React.useState(false);

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!loading && !isAuthenticated) {
      navigate('/simple-login');
      return;
    }

    // If authenticated but no current tenant or subdomain doesn't match
    if (!loading && isAuthenticated && currentTenant) {
      // Check if the URL subdomain matches the current tenant
      if (currentTenant.subdomain !== subdomain) {
        // Find the tenant that matches the subdomain
        const storedTenants = localStorage.getItem('tenants');
        if (storedTenants) {
          const parsedTenants = JSON.parse(storedTenants);
          const matchingTenant = parsedTenants.find(tenant => tenant.subdomain === subdomain);
          
          if (matchingTenant) {
            // Set the matching tenant as current
            switchTenant(matchingTenant);
          } else {
            // No matching tenant found, redirect to workspaces
            navigate('/workspaces');
          }
        } else {
          // No tenants found, redirect to workspaces
          navigate('/workspaces');
        }
      }
    } else if (!loading && isAuthenticated && !currentTenant) {
      // No current tenant, redirect to workspaces
      navigate('/workspaces');
    }
  }, [subdomain, navigate, currentTenant, isAuthenticated, loading, switchTenant]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    
    // For mobile devices, toggle visibility
    if (window.innerWidth <= 767) {
      setMobileNavVisible(!mobileNavVisible);
    }
  };
  
  // Close mobile nav when clicking outside
  const closeMobileNav = () => {
    if (window.innerWidth <= 767 && mobileNavVisible) {
      setMobileNavVisible(false);
    }
  };

  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    // Redirect to tenant-specific login page
    navigate(`/${subdomain}/login`);
  };

  if (loading || !currentTenant) {
    return <div className="loading-spinner">Loading tenant...</div>;
  }

  return (
    <div className="nk-app-root">
      <Header toggleSidebar={toggleSidebar} tenant={currentTenant} onLogout={handleLogout} />
      <div className="nk-main-container">
        {/* Mobile navigation overlay */}
        <div 
          className={`mobile-nav-overlay ${mobileNavVisible ? 'visible' : ''}`}
          onClick={closeMobileNav}
        />
        
        <Sidebar 
          collapsed={sidebarCollapsed} 
          toggleSidebar={toggleSidebar} 
          className={mobileNavVisible ? 'mobile-visible' : ''}
        />
        
        <main className={`nk-main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default TenantLayout;
