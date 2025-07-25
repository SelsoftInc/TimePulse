import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './ProfileSettings.css';

const ProfileSettings = () => {
  const { user, isAdmin, isEmployee, isApprover } = useAuth();
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    employeeId: '',
    startDate: '',
    manager: '',
    timezone: 'America/New_York',
    language: 'en',
    notifications: {
      emailReminders: true,
      timesheetDeadlines: true,
      approvalRequests: true,
      systemUpdates: false
    }
  });



  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfileData = async () => {
    try {
      // Simulate API call to load user profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock profile data - in real app, this would come from API
      const mockProfile = {
        firstName: 'John',
        lastName: 'Doe',
        email: user?.email || 'john.doe@company.com',
        phone: '+1 (555) 123-4567',
        department: 'Engineering',
        position: isAdmin() ? 'Senior Manager' : isApprover() ? 'Team Lead' : 'Software Developer',
        employeeId: 'EMP001',
        startDate: '2023-01-15',
        manager: isEmployee() ? 'Jane Smith' : '',
        timezone: 'America/New_York',
        language: 'en',
        notifications: {
          emailReminders: true,
          timesheetDeadlines: true,
          approvalRequests: isApprover() || isAdmin(),
          systemUpdates: isAdmin()
        }
      };
      
      setProfileData(mockProfile);
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile data:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setProfileData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [name]: checked
      }
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Simulate API call to save profile
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Saving profile data:', profileData);
      setIsEditing(false);
      setLoading(false);
      
      // Show success message
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      setLoading(false);
      alert('Error saving profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadProfileData(); // Reload original data
  };

  const getRoleBadgeClass = () => {
    if (isAdmin()) return 'role-badge admin';
    if (isApprover()) return 'role-badge approver';
    if (isEmployee()) return 'role-badge employee';
    return 'role-badge';
  };

  const getRoleDescription = () => {
    if (isAdmin()) return 'Full system access and administrative privileges';
    if (isApprover()) return 'Can approve timesheets and invoices, view reports';
    if (isEmployee()) return 'Can create and manage own timesheets';
    return 'Standard user access';
  };

  const getRoleName = () => {
    if (isAdmin()) return 'ADMIN';
    if (isApprover()) return 'APPROVER';
    if (isEmployee()) return 'EMPLOYEE';
    return 'USER';
  };

  if (loading) {
    return (
      <div className="settings-section">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-section profile-settings">
      <div className="profile-header">
        <h3 className="settings-section-title">Profile Information</h3>
        {!isEditing && (
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={() => setIsEditing(true)}
          >
            <i className="fas fa-edit"></i> Edit Profile
          </button>
        )}
      </div>

      {/* Account Overview */}
      <div className="account-overview">
        <div className="profile-avatar">
          <div className="avatar-circle">
            <i className="fas fa-user"></i>
          </div>
        </div>
        <div className="profile-info">
          <h4 className="profile-name">{profileData.firstName} {profileData.lastName}</h4>
          <p className="profile-email">{profileData.email}</p>
          <div className="profile-role">
            <span className={getRoleBadgeClass()}>
              <i className="fas fa-shield-alt"></i>
              {getRoleName()}
            </span>
            <span className="role-description">{getRoleDescription()}</span>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="form-section">
        <h4 className="form-section-title">Personal Information</h4>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input
              type="text"
              className="form-control"
              name="firstName"
              value={profileData.firstName}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input
              type="text"
              className="form-control"
              name="lastName"
              value={profileData.lastName}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={profileData.email}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-control"
              name="phone"
              value={profileData.phone}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>

      {/* Work Information */}
      <div className="form-section">
        <h4 className="form-section-title">Work Information</h4>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Employee ID</label>
            <input
              type="text"
              className="form-control"
              name="employeeId"
              value={profileData.employeeId}
              disabled
            />
            <small className="form-hint">Employee ID cannot be changed</small>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <input
              type="text"
              className="form-control"
              name="department"
              value={profileData.department}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Position</label>
            <input
              type="text"
              className="form-control"
              name="position"
              value={profileData.position}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              name="startDate"
              value={profileData.startDate}
              disabled
            />
            <small className="form-hint">Start date cannot be changed</small>
          </div>
        </div>
        
        {isEmployee() && (
          <div className="form-group">
            <label className="form-label">Manager</label>
            <input
              type="text"
              className="form-control"
              name="manager"
              value={profileData.manager}
              disabled
            />
            <small className="form-hint">Manager assignment is controlled by HR</small>
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="form-section">
        <h4 className="form-section-title">Preferences</h4>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Timezone</label>
            <select
              className="form-control"
              name="timezone"
              value={profileData.timezone}
              onChange={handleInputChange}
              disabled={!isEditing}
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Language</label>
            <select
              className="form-control"
              name="language"
              value={profileData.language}
              onChange={handleInputChange}
              disabled={!isEditing}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="form-section">
        <h4 className="form-section-title">Notification Preferences</h4>
        <div className="notification-settings">
          <div className="notification-item">
            <label className="notification-label">
              <input
                type="checkbox"
                name="emailReminders"
                checked={profileData.notifications.emailReminders}
                onChange={handleNotificationChange}
                disabled={!isEditing}
              />
              <span className="checkmark"></span>
              Email Reminders
            </label>
            <small className="notification-description">Receive general email reminders and updates</small>
          </div>
          
          <div className="notification-item">
            <label className="notification-label">
              <input
                type="checkbox"
                name="timesheetDeadlines"
                checked={profileData.notifications.timesheetDeadlines}
                onChange={handleNotificationChange}
                disabled={!isEditing}
              />
              <span className="checkmark"></span>
              Timesheet Deadline Reminders
            </label>
            <small className="notification-description">Get notified about upcoming timesheet submission deadlines</small>
          </div>
          
          {(isApprover() || isAdmin()) && (
            <div className="notification-item">
              <label className="notification-label">
                <input
                  type="checkbox"
                  name="approvalRequests"
                  checked={profileData.notifications.approvalRequests}
                  onChange={handleNotificationChange}
                  disabled={!isEditing}
                />
                <span className="checkmark"></span>
                Approval Requests
              </label>
              <small className="notification-description">Receive notifications for pending timesheet and invoice approvals</small>
            </div>
          )}
          
          {isAdmin() && (
            <div className="notification-item">
              <label className="notification-label">
                <input
                  type="checkbox"
                  name="systemUpdates"
                  checked={profileData.notifications.systemUpdates}
                  onChange={handleNotificationChange}
                  disabled={!isEditing}
                />
                <span className="checkmark"></span>
                System Updates
              </label>
              <small className="notification-description">Receive notifications about system maintenance and updates</small>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="form-actions">
          <button 
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i> Save Changes
              </>
            )}
          </button>
          <button 
            className="btn btn-outline-secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
