import React from 'react';
import './Workspaces.css';

const EmployerWorkspaceSwitcher = ({ workspaces, onSelect, onCreateNew }) => {
  return (
    <div className="workspace-list">
      {workspaces.map(workspace => (
        <div 
          key={workspace.id} 
          className="workspace-card"
          onClick={() => onSelect(workspace)}
        >
          <div className="workspace-card-header">
            <h3>{workspace.name}</h3>
            <span className={`workspace-status ${workspace.status}`}>
              {workspace.status === 'active' ? 'Active' : 'Trial'}
            </span>
          </div>
          <div className="workspace-card-body">
            <p className="workspace-subdomain">
              <i className="fas fa-link"></i> {workspace.subdomain}
            </p>
            <p className="workspace-industry">
              <i className="fas fa-industry"></i> {workspace.industry}
            </p>
            <div className="workspace-dates">
              <p><i className="fas fa-calendar-plus"></i> Created: {workspace.createdAt}</p>
              <p><i className="fas fa-calendar-check"></i> Last accessed: {workspace.lastAccessed}</p>
            </div>
          </div>
          <div className="workspace-card-footer">
            <button className="btn btn-primary">
              <i className="fas fa-sign-in-alt"></i> Enter Workspace
            </button>
          </div>
        </div>
      ))}
      
      {/* Create new workspace card */}
      <div className="workspace-card new-workspace" onClick={onCreateNew}>
        <div className="new-workspace-content">
          <div className="new-workspace-icon">
            <i className="fas fa-plus-circle"></i>
          </div>
          <h3>Create New Employer</h3>
          <p>Set up a new employer workspace</p>
        </div>
      </div>
    </div>
  );
};

export default EmployerWorkspaceSwitcher;
