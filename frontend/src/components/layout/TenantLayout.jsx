import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import './TenantLayout.css';

const TenantLayout = ({ children }) => {
  const { subdomain } = useParams();
  const navigate = useNavigate();
  const [currentTenant, setCurrentTenant] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Get current tenant from localStorage
    const storedTenant = localStorage.getItem('currentTenant');
    
    if (storedTenant) {
      const parsedTenant = JSON.parse(storedTenant);
      
      // Check if the URL subdomain matches the current tenant
      if (parsedTenant.subdomain === subdomain) {
        setCurrentTenant(parsedTenant);
      } else {
        // Find the tenant that matches the subdomain
        const storedTenants = localStorage.getItem('tenants');
        if (storedTenants) {
          const parsedTenants = JSON.parse(storedTenants);
          const matchingTenant = parsedTenants.find(tenant => tenant.subdomain === subdomain);
          
          if (matchingTenant) {
            // Set the matching tenant as current
            localStorage.setItem('currentTenant', JSON.stringify(matchingTenant));
            setCurrentTenant(matchingTenant);
          } else {
            // No matching tenant found, redirect to workspaces
            navigate('/workspaces');
          }
        } else {
          // No tenants found, redirect to workspaces
          navigate('/workspaces');
        }
      }
    } else {
      // No current tenant, redirect to workspaces
      navigate('/workspaces');
    }
  }, [subdomain, navigate]);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('currentTenant');
    navigate('/login');
  };

  if (!currentTenant) {
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
