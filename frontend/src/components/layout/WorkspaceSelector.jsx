import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./WorkspaceSelector.css";

const WorkspaceSelector = () => {
  const [workspace, setWorkspace] = useState({
    id: "TP",
    name: "TimePulse",
    tagline: "Loading..."
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Get current tenant from localStorage
    const currentTenant = localStorage.getItem('currentTenant');
    if (currentTenant) {
      const tenant = JSON.parse(currentTenant);
      // Generate abbreviation from company name instead of tenant ID
      const generateAbbreviation = (name) => {
        if (!name) return 'WS';
        const words = name.trim().split(/\s+/);
        if (words.length >= 2) {
          // Use first letter of first two words
          return (words[0][0] + words[1][0]).toUpperCase();
        } else {
          // Use first two letters of single word
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
    navigate('/workspaces');
  };

  return (
    <div className="workspace-selector">
      <div className="workspace-current" onClick={handleClick} style={{ cursor: 'pointer' }}>
        <div className="workspace-icon">{workspace.id}</div>
        <div className="workspace-details">
          <div className="workspace-name">{workspace.name}</div>
          <div className="workspace-tagline">{workspace.tagline}</div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSelector;
