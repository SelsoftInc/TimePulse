import React, { useState } from 'react';
import './Settings.css';

const IntegrationSettings = () => {
  // Mock integration data
  const [integrations, setIntegrations] = useState([
    { 
      id: 'slack', 
      name: 'Slack', 
      description: 'Connect TimePulse with Slack to receive notifications and submit time entries directly from Slack.',
      icon: 'fab fa-slack',
      connected: true,
      workspace: 'Selsoft Workspace',
      lastSync: '2025-07-01T14:30:00'
    },
    { 
      id: 'jira', 
      name: 'Jira', 
      description: 'Sync projects and tasks from Jira to TimePulse for seamless time tracking.',
      icon: 'fab fa-jira',
      connected: false,
      workspace: null,
      lastSync: null
    },
    { 
      id: 'github', 
      name: 'GitHub', 
      description: 'Link GitHub repositories to TimePulse projects for developer time tracking.',
      icon: 'fab fa-github',
      connected: true,
      workspace: 'selvaonline',
      lastSync: '2025-07-05T09:15:00'
    },
    { 
      id: 'google-calendar', 
      name: 'Google Calendar', 
      description: 'Sync TimePulse events with your Google Calendar for better scheduling.',
      icon: 'fab fa-google',
      connected: false,
      workspace: null,
      lastSync: null
    },
    { 
      id: 'asana', 
      name: 'Asana', 
      description: 'Import tasks from Asana to track time against your Asana projects.',
      icon: 'fas fa-tasks',
      connected: false,
      workspace: null,
      lastSync: null
    }
  ]);

  const toggleConnection = (integrationId) => {
    setIntegrations(integrations.map(integration => {
      if (integration.id === integrationId) {
        // In a real app, this would trigger an API call to connect/disconnect
        if (integration.connected) {
          // Disconnect
          return {
            ...integration,
            connected: false,
            workspace: null,
            lastSync: null
          };
        } else {
          // Connect (mock data)
          return {
            ...integration,
            connected: true,
            workspace: integration.id === 'slack' ? 'Selsoft Workspace' : 
                      integration.id === 'github' ? 'selvaonline' : 
                      'Connected Account',
            lastSync: new Date().toISOString()
          };
        }
      }
      return integration;
    }));
  };

  const formatLastSync = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="settings-content">
      <div className="settings-section">
        <h2 className="settings-title">Integrations</h2>
        <p className="settings-description">
          Connect TimePulse with your favorite tools to streamline your workflow.
        </p>
        
        <div className="integration-list">
          {integrations.map(integration => (
            <div key={integration.id} className="card mb-4 integration-card">
              <div className="card-inner">
                <div className="integration-header">
                  <div className="integration-icon">
                    <i className={integration.icon}></i>
                  </div>
                  <div className="integration-info">
                    <h3>{integration.name}</h3>
                    <p>{integration.description}</p>
                  </div>
                  <div className="integration-status">
                    <button 
                      className={`btn ${integration.connected ? 'btn-danger' : 'btn-primary'}`}
                      onClick={() => toggleConnection(integration.id)}
                    >
                      {integration.connected ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                </div>
                
                {integration.connected && (
                  <div className="integration-details">
                    <div className="integration-detail-item">
                      <span className="detail-label">Connected to:</span>
                      <span className="detail-value">{integration.workspace}</span>
                    </div>
                    <div className="integration-detail-item">
                      <span className="detail-label">Last synced:</span>
                      <span className="detail-value">{formatLastSync(integration.lastSync)}</span>
                    </div>
                    <div className="integration-actions mt-3">
                      <button className="btn btn-sm btn-outline-primary mr-2">
                        <i className="fas fa-sync-alt mr-1"></i> Sync Now
                      </button>
                      <button className="btn btn-sm btn-outline-secondary">
                        <i className="fas fa-cog mr-1"></i> Configure
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="card mt-4">
          <div className="card-inner">
            <h3>API Access</h3>
            <p>Use the TimePulse API to build custom integrations with your internal tools.</p>
            
            <div className="api-keys">
              <h4>API Keys</h4>
              <div className="api-key-item">
                <div className="api-key-info">
                  <div className="api-key-name">Production API Key</div>
                  <div className="api-key-value">••••••••••••••••••••••••••••••</div>
                </div>
                <div className="api-key-actions">
                  <button className="btn btn-sm btn-outline-primary mr-2">Show</button>
                  <button className="btn btn-sm btn-outline-primary mr-2">Copy</button>
                  <button className="btn btn-sm btn-outline-danger">Regenerate</button>
                </div>
              </div>
              
              <div className="api-key-item mt-3">
                <div className="api-key-info">
                  <div className="api-key-name">Development API Key</div>
                  <div className="api-key-value">••••••••••••••••••••••••••••••</div>
                </div>
                <div className="api-key-actions">
                  <button className="btn btn-sm btn-outline-primary mr-2">Show</button>
                  <button className="btn btn-sm btn-outline-primary mr-2">Copy</button>
                  <button className="btn btn-sm btn-outline-danger">Regenerate</button>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h4>Webhooks</h4>
              <p>Configure webhooks to receive real-time updates from TimePulse.</p>
              <button className="btn btn-outline-primary">
                <i className="fas fa-plus mr-1"></i> Add Webhook
              </button>
            </div>
            
            <div className="mt-4">
              <h4>API Documentation</h4>
              <p>Learn how to integrate with TimePulse using our comprehensive API documentation.</p>
              <a href="#" className="btn btn-outline-primary">
                <i className="fas fa-book mr-1"></i> View Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationSettings;
