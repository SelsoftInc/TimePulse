import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { apiFetch } from '../../config/api';
import './Settings.css';
import './UserManagement.css';

const UserManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [saving, setSaving] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Default role options as fallback
  const defaultRoleOptions = [
    { value: 'admin', label: 'Admin', badge: 'danger' },
    { value: 'manager', label: 'Manager', badge: 'primary' },
    { value: 'approver', label: 'Approver', badge: 'info' },
    { value: 'employee', label: 'Employee', badge: 'secondary' },
    { value: 'accountant', label: 'Accountant', badge: 'warning' },
    { value: 'hr', label: 'HR', badge: 'success' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active', badge: 'success' },
    { value: 'inactive', label: 'Inactive', badge: 'warning' },
    { value: 'suspended', label: 'Suspended', badge: 'danger' }
  ];

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, [user?.tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      console.log('📋 Fetching user roles from API...');
      
      const response = await apiFetch('/api/lookups/user_role', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }

      const data = await response.json();
      console.log('✅ Roles fetched:', data);

      if (data.success && data.lookups && data.lookups.length > 0) {
        // Map lookups to role options format
        const roles = data.lookups.map(lookup => ({
          value: lookup.code,
          label: lookup.label,
          badge: getRoleBadge(lookup.code)
        }));
        setRoleOptions(roles);
        console.log('✅ Role options set:', roles);
      } else {
        console.log('⚠️  No roles found in API, using defaults');
        setRoleOptions(defaultRoleOptions);
      }
    } catch (error) {
      console.error('❌ Error fetching roles:', error);
      console.log('⚠️  Using default role options');
      setRoleOptions(defaultRoleOptions);
    } finally {
      setLoadingRoles(false);
    }
  };

  const getRoleBadge = (roleCode) => {
    const badgeMap = {
      'admin': 'danger',
      'manager': 'primary',
      'approver': 'info',
      'employee': 'secondary',
      'accountant': 'warning',
      'hr': 'success'
    };
    return badgeMap[roleCode] || 'secondary';
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/users?tenantId=${user.tenantId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) {
      console.error('No user selected for editing');
      toast.error('No user selected');
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Saving user changes:', {
        userId: editingUser.id,
        role: editingUser.role,
        status: editingUser.status,
        department: editingUser.department,
        title: editingUser.title
      });

      const response = await apiFetch(`/api/users/${editingUser.id}?tenantId=${user.tenantId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: editingUser.role,
          status: editingUser.status,
          department: editingUser.department,
          title: editingUser.title
        })
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Update failed:', errorData);
        throw new Error(errorData.error || 'Failed to update user');
      }

      const data = await response.json();
      console.log('✅ User updated successfully:', data);

      // Update the local state immediately
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === editingUser.id 
            ? { ...u, 
                role: editingUser.role, 
                status: editingUser.status,
                department: editingUser.department,
                title: editingUser.title 
              }
            : u
        )
      );

      toast.success('User updated successfully');
      setShowEditModal(false);
      setEditingUser(null);
      
      // Refresh users list from server to ensure consistency
      await fetchUsers();
    } catch (error) {
      console.error('❌ Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(filteredUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = searchTerm === '' || 
      u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <div>
          <h2>User management</h2>
          <p className="subtitle">Manage your team members and their account permissions here.</p>
        </div>
      </div>

      <div className="user-management-controls">
        <div className="controls-left">
          <h3 className="user-count">All users <span className="count">{users.length}</span></h3>
        </div>
        <div className="controls-right">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-filters" onClick={() => setShowFilters(!showFilters)}>
            <i className="fas fa-filter"></i> Filters
          </button>
          <button className="btn-add-user" onClick={() => toast.info('Add user feature coming soon')}>
            <i className="fas fa-plus"></i> Add user
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Role</label>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="all">All Roles</option>
              {roleOptions.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>User name</th>
              <th>Access</th>
              <th>Last active</th>
              <th>Date added</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(u.id)}
                    onChange={() => handleSelectUser(u.id)}
                  />
                </td>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{u.firstName} {u.lastName}</div>
                      <div className="user-email">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="access-badges">
                    <span className={`access-badge badge-${u.role}`}>{u.role}</span>
                  </div>
                </td>
                <td className="date-col">
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                </td>
                <td className="date-col">
                  {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="actions-col">
                  <button className="btn-more" onClick={() => handleEditUser(u)}>
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <p>No users found</p>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit User</h5>
                <button type="button" className="close" onClick={() => setShowEditModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={`${editingUser.firstName} ${editingUser.lastName}`}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={editingUser.email}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    className="form-control"
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  >
                    {roleOptions.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingUser.department || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingUser.title || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="form-control"
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSaveUser}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
