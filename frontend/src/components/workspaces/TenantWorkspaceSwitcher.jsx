import React from 'react';
import '../auth/Auth.css';

const TenantWorkspaceSwitcher = ({ workspaces, onSelect, onCreateNew }) => {
  // Function to get appropriate status class for badge
  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'active': return 'tenant-badge-success';
      case 'trial': return 'tenant-badge-warning';
      case 'expired': return 'tenant-badge-danger';
      default: return 'tenant-badge-gray';
    }
  };

  return (
    <div className="tenant-workspace-switcher">
      <h2 className="tenant-switcher-title">My Workspaces</h2>
      
      <div className="tenant-workspace-list">
        <div className="tenant-workspace-card create-tenant-workspace" onClick={onCreateNew}>
          <div className="tenant-workspace-card-body">
            <div className="tenant-workspace-icon">
              <i className="fas fa-plus-circle"></i>
            </div>
            <div className="tenant-workspace-info">
              <h4>Create New Workspace</h4>
              <p>Set up a new tenant environment</p>
            </div>
          </div>
        </div>
        
        {workspaces.map((workspace) => (
          <div 
            key={workspace.id} 
            className="tenant-workspace-card" 
            onClick={() => onSelect(workspace)}
          >
            <div className="tenant-workspace-card-body">
              <div className="tenant-workspace-icon">
                <i className="fas fa-building"></i>
              </div>
              <div className="tenant-workspace-info">
                <h4>{workspace.name}</h4>
                <p>{workspace.subdomain}.timepulse.ai</p>
                <span className={`tenant-workspace-badge ${getStatusClass(workspace.status)}`}>
                  {workspace.status}
                </span>
              </div>
              <div className="workspace-actions">
                <button 
                  className="btn-primary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(workspace);
                  }}
                >
                  <i className="fas fa-arrow-right"></i> Switch
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TenantWorkspaceSwitcher;
