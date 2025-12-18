'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import './EmployerLayout.css';

const EmployerLayout = ({ children }) => {
  // These variables are used for context in child components
  // and for potential future features like employer-specific styling
  const { subdomain } = useParams();
  const { currentEmployer } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return true;
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState !== null) return savedSidebarState === 'true';
    return true;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 991);
  
  // Handle window resize to detect mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 991;
      setIsMobile(mobile);
      // Close mobile menu when switching to desktop
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Toggle sidebar collapsed state (desktop) or mobile menu (mobile)
  const toggleSidebar = () => {
    if (isMobile) {
      // On mobile, toggle the mobile menu
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      // On desktop, toggle collapsed state
      const newState = !sidebarCollapsed;
      setSidebarCollapsed(newState);
      localStorage.setItem('sidebarCollapsed', newState.toString());
    }
  };
  
  // Close mobile menu when clicking overlay
  const closeMobileMenu = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };
  
  // Log employer info for debugging purposes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Rendering employer layout for: ${subdomain}`, currentEmployer);
    }
  }, [subdomain, currentEmployer]);
  
  return (
    <div className={`nk-body bg-sky-800 npc-default has-sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="nk-app-root">
        <div className="nk-main">
          {/* Sidebar overlay for mobile */}
          {isMobile && mobileMenuOpen && (
            <div 
              className="sidebar-overlay active" 
              onClick={closeMobileMenu}
            />
          )}
          
          <Sidebar 
            collapsed={sidebarCollapsed} 
            toggleSidebar={toggleSidebar}
            mobileVisible={mobileMenuOpen}
            isMobile={isMobile}
          />
          
          <div className="nk-wrap">
            <Header toggleSidebar={toggleSidebar} />
            <div className="nk-content">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerLayout;
