'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { API_BASE } from '@/config/api';
import { COUNTRY_OPTIONS, getCountryCode, getPhoneMaxLength } from '@/config/lookups';
import { validatePhoneNumber } from '@/utils/validations';
import './ProfileSettings.css';

const ProfileSettings = () => {
  const { user, isAdmin, isEmployee, isApprover } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'United States',
    alternativeMobile: '',
    alternativeCountry: 'United States',
    panNumber: '',
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
  const [phoneError, setPhoneError] = useState('');
  const [altPhoneError, setAltPhoneError] = useState('');

  useEffect(() => {
    loadProfileData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      const userId = user?.id || JSON.parse(localStorage.getItem('userInfo') || '{}').id;
      
      if (!userId) {
        console.error('No user ID found');
        setLoading(false);
        return;
      }

      console.log('📥 Fetching profile for user ID:', userId);

      // Fetch user profile from settings API
      const response = await fetch(`${API_BASE}/api/settings/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        console.log('✅ Profile data received from backend:', {
          phone: data.user.phone,
          country: data.user.country,
          alternativeMobile: data.user.alternativeMobile,
          alternativeCountry: data.user.alternativeCountry,
          panNumber: data.user.panNumber,
          position: data.user.employee?.position
        });
        
        const userData = data.user;
        const employeeData = userData.employee;
        
        const realProfile = {
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          country: userData.country || 'United States',
          alternativeMobile: userData.alternativeMobile || '',
          alternativeCountry: userData.alternativeCountry || 'United States',
          panNumber: userData.panNumber || '',
          department: employeeData?.department || '',
          position: employeeData?.position || '',
          employeeId: userData.employeeId || '',
          startDate: employeeData?.startDate ? new Date(employeeData.startDate).toISOString().split('T')[0] : '',
          manager: '',
          timezone: userData.settings?.timezone || 'America/New_York',
          language: userData.settings?.language || 'en',
          notifications: {
            emailReminders: userData.settings?.notifications?.emailReminders !== undefined ? userData.settings.notifications.emailReminders : true,
            timesheetDeadlines: userData.settings?.notifications?.timesheetDeadlines !== undefined ? userData.settings.notifications.timesheetDeadlines : true,
            approvalRequests: userData.settings?.notifications?.approvalRequests !== undefined ? userData.settings.notifications.approvalRequests : (isApprover() || isAdmin()),
            systemUpdates: userData.settings?.notifications?.systemUpdates !== undefined ? userData.settings.notifications.systemUpdates : isAdmin()
          }
        };
        
        console.log('✅ Mapped profile data to state:', {
          phone: realProfile.phone,
          country: realProfile.country,
          alternativeMobile: realProfile.alternativeMobile,
          alternativeCountry: realProfile.alternativeCountry,
          panNumber: realProfile.panNumber,
          position: realProfile.position
        });
        setProfileData(realProfile);
      } else {
        console.error('Failed to fetch profile data:', data.error);
        toast.error('Failed to load profile data', { title: 'Error' });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Failed to load profile data', { title: 'Error' });
      // Fallback to basic user data from auth context
      setProfileData(prev => ({
        ...prev,
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || ''
      }));
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Update state with new value
    setProfileData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };

      // Validate phone when country or phone changes (using newData to avoid stale state)
      if (name === 'country' || name === 'phone') {
        const phoneToValidate = name === 'phone' ? value : newData.phone;
        const countryToUse = name === 'country' ? value : newData.country;
        if (phoneToValidate) {
          const validation = validatePhoneNumber(phoneToValidate, countryToUse);
          setPhoneError(validation.error || '');
        }
      }

      // Validate alternative mobile (using newData to avoid stale state)
      if (name === 'alternativeCountry' || name === 'alternativeMobile') {
        const phoneToValidate = name === 'alternativeMobile' ? value : newData.alternativeMobile;
        const countryToUse = name === 'alternativeCountry' ? value : newData.alternativeCountry;
        if (phoneToValidate) {
          const validation = validatePhoneNumber(phoneToValidate, countryToUse);
          setAltPhoneError(validation.error || '');
        } else {
          setAltPhoneError('');
        }
      }

      return newData;
    });
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

  const validatePAN = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  const validatePhone = (phone, country) => {
    if (!phone) return false;
    const validation = validatePhoneNumber(phone, country);
    return validation.isValid;
  };

  const handleSave = async () => {
    try {
      // Validate mandatory fields
      if (!profileData.firstName || !profileData.firstName.trim()) {
        toast.error('First Name is required');
        return;
      }
      if (!profileData.lastName || !profileData.lastName.trim()) {
        toast.error('Last Name is required');
        return;
      }
      if (!profileData.email || !profileData.email.trim()) {
        toast.error('Email Address is required');
        return;
      }
      if (!profileData.phone || !profileData.phone.trim()) {
        toast.error('Phone Number is required');
        return;
      }
      if (!validatePhone(profileData.phone, profileData.country)) {
        toast.error(phoneError || 'Please enter a valid phone number');
        return;
      }
      if (!profileData.department || !profileData.department.trim()) {
        toast.error('Department is required');
        return;
      }
      if (!profileData.position || !profileData.position.trim()) {
        toast.error('Position is required');
        return;
      }
      if (!profileData.panNumber || !profileData.panNumber.trim()) {
        toast.error('PAN Number is required');
        return;
      }
      if (!validatePAN(profileData.panNumber)) {
        toast.error('Please enter a valid PAN number.');
        return;
      }
      // Validate alternative mobile if provided
      if (profileData.alternativeMobile && profileData.alternativeMobile.trim() && !validatePhone(profileData.alternativeMobile, profileData.alternativeCountry)) {
        toast.error(altPhoneError || 'Please enter a valid alternative mobile number');
        return;
      }

      setLoading(true);
      
      const userId = user?.id || JSON.parse(localStorage.getItem('userInfo') || '{}').id;
      
      if (!userId) {
        toast.error('User not found', { title: 'Error' });
        return;
      }

      // Prepare update payload - capture current state at time of save
      const updatePayload = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        country: profileData.country,
        alternativeMobile: profileData.alternativeMobile,
        alternativeCountry: profileData.alternativeCountry,
        panNumber: profileData.panNumber,
        department: profileData.department,
        position: profileData.position,
        settings: {
          timezone: profileData.timezone,
          language: profileData.language,
          notifications: profileData.notifications
        }
      };

      console.log('💾 Saving profile data to backend:', {
        phone: updatePayload.phone,
        country: updatePayload.country,
        alternativeMobile: updatePayload.alternativeMobile,
        alternativeCountry: updatePayload.alternativeCountry,
        panNumber: updatePayload.panNumber,
        position: updatePayload.position
      });

      // Save profile data to settings API
      const response = await fetch(`${API_BASE}/api/settings/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      console.log('✅ Profile updated successfully:', result);
      
      // Update localStorage with new data
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      userInfo.firstName = profileData.firstName;
      userInfo.lastName = profileData.lastName;
      userInfo.email = profileData.email;
      userInfo.phone = profileData.phone;
      userInfo.department = profileData.department;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      // IMPORTANT: Keep the state as-is (don't reload from backend)
      // The profileData already contains the values we just saved
      // Reloading from backend causes race condition with stale data
      console.log('✅ Keeping current state - data already reflects saved values:', {
        phone: profileData.phone,
        country: profileData.country,
        panNumber: profileData.panNumber
      });
      
      setIsEditing(false);
      setLoading(false);
      
      // Show success message AFTER state is updated
      toast.success('Your profile has been updated successfully!', {
        title: 'Profile Updated'
      });
      
    } catch (error) {
      console.error('Error saving profile:', error);
      setLoading(false);
      toast.error(error.message, {
        title: 'Error Saving Profile'
      });
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
    <div className="profile-settings">
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
    <h4 className="profile-name">
      {profileData.firstName} {profileData.lastName}
    </h4>

    <div className="email-and-badge">
      <p className="profile-email">{profileData.email}</p>
      <span className={getRoleBadgeClass()}>
        <i className="fas fa-shield-alt"></i>
        {getRoleName()}
      </span>
    </div>

    <span className="role-description">{getRoleDescription()}</span>
  </div>
</div>


      {/* Personal Information */}
      <div className="form-section">
        <h4 className="form-section-title">Personal Information</h4>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input
              type="text"
              className="form-control"
              name="firstName"
              value={profileData.firstName}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name *</label>
            <input
              type="text"
              className="form-control"
              name="lastName"
              value={profileData.lastName}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={profileData.email}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Country *</label>
            <select
              className="form-control"
              name="country"
              value={profileData.country}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
            >
              {COUNTRY_OPTIONS.map(country => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <div className="phone-input-wrapper">
              <span className="country-code">{getCountryCode(profileData.country)}</span>
              <input
                type="tel"
                className="form-control phone-input"
                name="phone"
                value={profileData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                maxLength={getPhoneMaxLength(profileData.country)}
                required
              />
            </div>
            {phoneError && <small className="form-error">{phoneError}</small>}
          </div>
          <div className="form-group">
            <label className="form-label">Alternative Country</label>
            <select
              className="form-control"
              name="alternativeCountry"
              value={profileData.alternativeCountry}
              onChange={handleInputChange}
              disabled={!isEditing}
            >
              {COUNTRY_OPTIONS.map(country => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Alternative Mobile Number</label>
            <div className="phone-input-wrapper">
              <span className="country-code">{getCountryCode(profileData.alternativeCountry)}</span>
              <input
                type="tel"
                className="form-control phone-input"
                name="alternativeMobile"
                value={profileData.alternativeMobile}
                onChange={handleInputChange}
                disabled={!isEditing}
                maxLength={getPhoneMaxLength(profileData.alternativeCountry)}
              />
            </div>
            {altPhoneError && <small className="form-error">{altPhoneError}</small>}
          </div>
          <div className="form-group">
            <label className="form-label">PAN Number *</label>
            <input
              type="text"
              className="form-control"
              name="panNumber"
              value={profileData.panNumber}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="ABCDE1234F"
              maxLength="10"
              style={{ textTransform: 'uppercase' }}
              required
            />
            <small className="form-hint">Format: ABCDE1234F (10 characters)</small>
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
            <label className="form-label">Department *</label>
            <input
              type="text"
              className="form-control"
              name="department"
              value={profileData.department}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Position *</label>
            <input
              type="text"
              className="form-control"
              name="position"
              value={profileData.position}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
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
            <label className="form-label">Manager *</label>
            <input
              type="text"
              className="form-control"
              name="manager"
              value={profileData.manager}
              disabled
              required
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
