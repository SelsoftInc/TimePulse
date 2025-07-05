import React from "react";
import "./WorkspaceSelector.css";

const WorkspaceSelector = () => {
  // For now, we'll just have a single workspace (Acme Corp)
  const workspace = {
    id: "DE",
    name: "Acme Corp",
    tagline: "Tap to create"
  };

  return (
    <div className="workspace-selector">
      <div className="workspace-current">
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
