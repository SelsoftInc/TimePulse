import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../auth/Auth.css';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import TenantWorkspaceSwitcher from './TenantWorkspaceSwitcher';

const Workspaces = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch workspaces from localStorage or use mock data
    const fetchWorkspaces = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if we have tenants in localStorage
        const storedTenants = localStorage.getItem('tenants');
        
        if (storedTenants) {
          const parsedTenants = JSON.parse(storedTenants);
          // Add additional fields needed for display
          const enhancedTenants = parsedTenants.map(tenant => ({
            ...tenant,
            industry: tenant.industry || 'Technology',
            createdAt: tenant.createdAt || new Date().toISOString().split('T')[0],
            lastAccessed: tenant.lastAccessed || new Date().toISOString().split('T')[0]
          }));
          
          setWorkspaces(enhancedTenants);
        } else {
          // Use mock data if no tenants in localStorage
          const mockWorkspaces = [
            {
              id: 'ws-1',
              name: 'Demo Company',
              subdomain: 'demo',
              status: 'active',
              industry: 'Technology',
              createdAt: '2025-01-15',
              lastAccessed: '2025-07-01'
            },
            {
              id: 'ws-2',
              name: 'Test Organization',
              subdomain: 'test-org',
              status: 'trial',
              industry: 'Consulting',
              createdAt: '2025-06-10',
              lastAccessed: '2025-07-03'
            }
          ];
          
          // Store mock workspaces in localStorage for future use
          localStorage.setItem('tenants', JSON.stringify(mockWorkspaces));
          setWorkspaces(mockWorkspaces);
        }
      } catch (error) {
        console.error('Error fetching workspaces:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [navigate]);

  const handleCreateWorkspace = (newWorkspace) => {
    // Add the new workspace to the list
    setWorkspaces([...workspaces, newWorkspace]);
    setShowModal(false);
  };

  const handleSwitchWorkspace = (workspace) => {
    // Set the selected tenant in localStorage
    localStorage.setItem('currentTenant', JSON.stringify(workspace));
    
    // Navigate to the dashboard with the tenant subdomain
    navigate(`/${workspace.subdomain}/dashboard`);
  };

  if (loading) {
    return (
      <div className="workspace-container">
        <div className="loading-spinner">Loading workspaces...</div>
      </div>
    );
  }

  return (
    <div className="workspace-container">
      <div className="workspace-header">
        <div className="workspace-title">
          <h1>Your Workspaces</h1>
          <p>Select a workspace to manage your projects</p>
        </div>
      </div>

      {/* Using the TenantWorkspaceSwitcher component */}
      <TenantWorkspaceSwitcher 
        workspaces={workspaces}
        onSelect={handleSwitchWorkspace}
        onCreateNew={() => setShowModal(true)}
      />

      {/* Create Workspace Modal */}
      {showModal && (
        <CreateWorkspaceModal 
          onClose={() => setShowModal(false)}
          onCreateWorkspace={handleCreateWorkspace}
        />
      )}
    </div>
  );
};

export default Workspaces;
