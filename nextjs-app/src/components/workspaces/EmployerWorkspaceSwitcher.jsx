'use client';

import React from 'react';
import "./Workspaces.css";
// Using Font Awesome for better icons
import { FaArrowRight, FaPlusCircle } from 'react-icons/fa';

const EmployerWorkspaceSwitcher = ({ workspaces, onSelect, onCreateNew }) => {
  return (
    <div className="workspace-list">
      {workspaces.map((workspace) => (
        <div key={workspace.id} className="workspace-card">
          <div className="workspace-card-content">
            <div
              className="workspace-card-header"
              onClick={() => onSelect(workspace)}
            >
              <div className="workspace-logo">
                <span className="workspace-initial">
                  {workspace.name
                    ? workspace.name.charAt(0).toUpperCase()
                    : "W"}
                </span>
              </div>
              <div className="workspace-header-content">
                <h3>{workspace.name || "Unnamed Workspace"}</h3>
                <span
                  className={`workspace-status ${
                    workspace.status || "inactive"
                  }`}
                >
                  {workspace.status === "active" ? "ACTIVE" : "TRIAL"}
                </span>
              </div>
            </div>

            <div
              className="workspace-info-grid"
              onClick={() => onSelect(workspace)}
            >
              <div className="workspace-info-row">
                <div className="workspace-info-item">
                  <span>{workspace.subdomain || "N/A"}</span>
                </div>
                <div className="workspace-info-item">
                  <span>{workspace.industry || "N/A"}</span>
                </div>
              </div>

              <div className="workspace-info-row">
                <div className="workspace-date-item">
                  <span className="date-label">Created:</span>
                  <span className="date-value">
                    {workspace.createdAt || "N/A"}
                  </span>
                </div>
                <div className="workspace-date-item">
                  <span className="date-label">Last access:</span>
                  <span className="date-value">
                    {workspace.lastAccessed || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="workspace-card-footer">
            <button
              className="workspace-enter-btn"
              onClick={() => onSelect(workspace)}
            >
              Enter Workspace <FaArrowRight className="btn-icon" />
            </button>
          </div>
        </div>
      ))}

      {/* Create new workspace card */}
      <div className="workspace-card new-workspace" onClick={onCreateNew}>
        <div className="new-workspace-content">
          <div className="new-workspace-icon">
            <FaPlusCircle />
          </div>
          <h3>Create New Employer</h3>
          <p>Set up a new employer workspace</p>
        </div>
      </div>
    </div>
  );
};

export default EmployerWorkspaceSwitcher;
