'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import "./WorkspaceSelector.css";

const WorkspaceSelector = () => {
  const [workspace, setWorkspace] = useState({
    id: "TP",
    name: "TimePulse",
    tagline: "Loading..."
  });
  const router = useRouter();

  useEffect(() => {
    // Get user info from localStorage
    const userInfo = localStorage.getItem('userInfo') || localStorage.getItem('user');
    const currentTenant = localStorage.getItem('currentTenant');
    
    if (userInfo) {
      const user = JSON.parse(userInfo);
      
      // Generate initials from user's first and last name
      const generateInitials = (name) => {
        if (!name) return 'U';
        const nameParts = name.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          // First letter of first name and last name
          return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        } else {
          // First letter of name
          return name.substring(0, 1).toUpperCase();
        }
      };
      
      const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const tenant = currentTenant ? JSON.parse(currentTenant) : null;
      
      setWorkspace({
        id: generateInitials(userName),
        name: userName || 'User',
        tagline: tenant?.subdomain || 'Workspace'
      });
    } else if (currentTenant) {
      // Fallback to tenant name if no user info
      const tenant = JSON.parse(currentTenant);
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
        id: generateAbbreviation(tenant.name),
        name: tenant.name,
        tagline: tenant.subdomain || 'Workspace'
      });
    }
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
