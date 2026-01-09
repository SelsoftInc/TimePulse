'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/config/api';
import "./WorkspaceSelector.css";

const WorkspaceSelector = () => {
  const [workspace, setWorkspace] = useState({
    id: "TP",
    name: "TimePulse",
    tagline: "Loading..."
  });
  const router = useRouter();

  useEffect(() => {
    const fetchTenantName = async () => {
      try {
        // Get user info from localStorage
        const userInfo = localStorage.getItem('userInfo') || localStorage.getItem('user');
        const currentTenant = localStorage.getItem('currentTenant');
        
        if (!userInfo && !currentTenant) return;
        
        const user = userInfo ? JSON.parse(userInfo) : null;
        const tenant = currentTenant ? JSON.parse(currentTenant) : null;
        
        // Generate initials from user's first and last name
        const generateInitials = (name) => {
          if (!name) return 'U';
          const nameParts = name.trim().split(/\s+/);
          if (nameParts.length >= 2) {
            return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
          } else {
            return name.substring(0, 1).toUpperCase();
          }
        };
        
        const userName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
        
        // Fetch tenant name from database
        let tenantName = 'Workspace';
        if (tenant?.id || user?.tenantId) {
          const tenantId = tenant?.id || user?.tenantId;
          
          const response = await fetch(
            `${API_BASE}/api/tenants/${tenantId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.tenant?.tenantName) {
              tenantName = data.tenant.tenantName;
            }
          }
        }
        
        if (user) {
          setWorkspace({
            id: generateInitials(userName),
            name: userName || 'User',
            tagline: tenantName
          });
        } else if (tenant) {
          // Fallback to tenant name if no user info
          const generateAbbreviation = (name) => {
            if (!name) return 'WS';
            const words = name.trim().split(/\s+/);
            if (words.length >= 2) {
              return (words[0][0] + words[1][0]).toUpperCase();
            } else {
              return name.substring(0, 2).toUpperCase();
            }
          };
          
          setWorkspace({
            id: generateAbbreviation(tenantName),
            name: tenantName,
            tagline: tenant.subdomain || 'Workspace'
          });
        }
      } catch (error) {
        console.error('Error fetching tenant name:', error);
        // Fallback to subdomain if fetch fails
        const currentTenant = localStorage.getItem('currentTenant');
        if (currentTenant) {
          const tenant = JSON.parse(currentTenant);
          setWorkspace(prev => ({
            ...prev,
            tagline: tenant.subdomain || 'Workspace'
          }));
        }
      }
    };
    
    fetchTenantName();
  }, []);

  const handleClick = () => {
    // Navigate to the current workspace dashboard instead of workspaces page
    const currentTenant = localStorage.getItem('currentTenant');
    if (currentTenant) {
      const tenant = JSON.parse(currentTenant);
      router.push(`/${tenant.subdomain}/dashboard`);
    } else {
      // Fallback to workspaces if no current tenant
      router.push('/workspaces');
    }
  };

  return (
    <div className="workspace-selector">
      <div className="workspace-current" onClick={handleClick} style={{ cursor: 'pointer' }}>
        {/* <div className="workspace-icon">{workspace.id}</div> */}
        <div className="workspace-details">
          <div className="workspace-name !text-white bold dark:!text-gray-200">
  Hi {workspace.name.split(" ")[0]}!
</div>

<div className="workspace-tagline !text-gray-300 dark:!text-gray-400">
  {workspace.tagline}
</div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSelector;
