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
      setWorkspace({
        id: tenant.id.substring(0, 2).toUpperCase(),
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
