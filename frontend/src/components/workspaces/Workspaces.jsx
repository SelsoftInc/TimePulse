import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../auth/Auth.css';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import EmployerWorkspaceSwitcher from './EmployerWorkspaceSwitcher';

const Workspaces = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/simple-login');
      return;
    }
    
    console.log('Workspaces component - User is authenticated');

    // Fetch workspaces from localStorage or use mock data
    const fetchWorkspaces = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if we have employers in localStorage
        const storedEmployers = localStorage.getItem('employers') || localStorage.getItem('tenants');
        
        if (storedEmployers) {
          const parsedEmployers = JSON.parse(storedEmployers);
          // Add additional fields needed for display
          const enhancedEmployers = parsedEmployers.map(employer => ({
            ...employer,
            industry: employer.industry || 'Technology',
            createdAt: employer.createdAt || new Date().toISOString().split('T')[0],
            lastAccessed: employer.lastAccessed || new Date().toISOString().split('T')[0]
          }));
          
          setWorkspaces(enhancedEmployers);
        } else {
          // Use mock data if no employers in localStorage
          const mockWorkspaces = [
            {
              id: 'ws-1',
              name: 'Selsoft',
              subdomain: 'selsoft',
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
          localStorage.setItem('employers', JSON.stringify(mockWorkspaces));
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
    // Set the selected employer in localStorage
    localStorage.setItem('currentEmployer', JSON.stringify(workspace));
    
    // Use window.location for full page reload to ensure proper role-based rendering
    window.location.href = `/${workspace.subdomain}/dashboard`;
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
          <h1>Your Employers</h1>
          <p>Select an employer workspace to manage your projects</p>
        </div>
      </div>

      {/* Using the EmployerWorkspaceSwitcher component */}
      <EmployerWorkspaceSwitcher 
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
