import React, { useState } from 'react';

const SecurityPrivacy = () => {
  const [securitySettings, setSecuritySettings] = useState({
    enableTwoFactor: true,
    requireStrongPasswords: true,
    passwordExpiryDays: 90,
    sessionTimeoutMinutes: 30,
    ipRestrictions: '',
    dataRetentionMonths: 24,
    roles: [
      { id: 1, name: 'Admin', permissions: ['view', 'edit', 'delete', 'approve'] },
      { id: 2, name: 'Manager', permissions: ['view', 'edit', 'approve'] },
      { id: 3, name: 'Employee', permissions: ['view', 'edit'] },
      { id: 4, name: 'Client', permissions: ['view'] }
    ],
    activeRole: 1
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSecuritySettings({
      ...securitySettings,
      [name]: value
    });
  };

  const handleToggleChange = (e) => {
    const { name, checked } = e.target;
    setSecuritySettings({
      ...securitySettings,
      [name]: checked
    });
  };

  const handleRoleSelect = (roleId) => {
    setSecuritySettings({
      ...securitySettings,
      activeRole: roleId
    });
  };

  const handlePermissionToggle = (roleId, permission) => {
    const roleIndex = securitySettings.roles.findIndex(role => role.id === roleId);
    if (roleIndex === -1) return;

    const updatedRoles = [...securitySettings.roles];
    const currentPermissions = updatedRoles[roleIndex].permissions;
    
    if (currentPermissions.includes(permission)) {
      updatedRoles[roleIndex].permissions = currentPermissions.filter(p => p !== permission);
    } else {
      updatedRoles[roleIndex].permissions = [...currentPermissions, permission];
    }
    
    setSecuritySettings({
      ...securitySettings,
      roles: updatedRoles
    });
  };

  const handleSave = () => {
    // Save security and privacy settings to backend
    console.log('Saving security and privacy settings:', securitySettings);
    // API call would go here
    alert('Security and privacy settings saved successfully!');
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Security & Privacy</h3>
      
      <div className="form-group">
        <div className="form-switch">
          <label className="switch">
            <input
              type="checkbox"
              name="enableTwoFactor"
              checked={securitySettings.enableTwoFactor}
              onChange={handleToggleChange}
            />
            <span className="slider"></span>
          </label>
          <span className="switch-label">Enable Two-Factor Authentication (2FA)</span>
        </div>
      </div>
      
      <div className="form-group">
        <div className="form-switch">
          <label className="switch">
            <input
              type="checkbox"
              name="requireStrongPasswords"
              checked={securitySettings.requireStrongPasswords}
              onChange={handleToggleChange}
            />
            <span className="slider"></span>
          </label>
          <span className="switch-label">Require strong passwords</span>
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="passwordExpiryDays">Password Expiry (days)</label>
          <input
            type="number"
            className="form-control"
            id="passwordExpiryDays"
            name="passwordExpiryDays"
            value={securitySettings.passwordExpiryDays}
            onChange={handleInputChange}
            min="0"
            max="365"
          />
          <small className="form-hint">0 = never expire</small>
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="sessionTimeoutMinutes">Session Timeout (minutes)</label>
          <input
            type="number"
            className="form-control"
            id="sessionTimeoutMinutes"
            name="sessionTimeoutMinutes"
            value={securitySettings.sessionTimeoutMinutes}
            onChange={handleInputChange}
            min="5"
            max="1440"
          />
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label" htmlFor="ipRestrictions">IP Restrictions (optional)</label>
        <textarea
          className="form-control"
          id="ipRestrictions"
          name="ipRestrictions"
          value={securitySettings.ipRestrictions}
          onChange={handleInputChange}
          placeholder="Enter IP addresses or ranges (one per line)"
          rows="3"
        ></textarea>
        <small className="form-hint">Leave blank to allow all IP addresses</small>
      </div>
      
      <div className="form-group">
        <label className="form-label" htmlFor="dataRetentionMonths">Data Retention Period (months)</label>
        <input
          type="number"
          className="form-control"
          id="dataRetentionMonths"
          name="dataRetentionMonths"
          value={securitySettings.dataRetentionMonths}
          onChange={handleInputChange}
          min="1"
        />
      </div>
      
      <div className="role-permissions-section">
        <h4 className="settings-subsection-title">Role-Based Access Control</h4>
        
        <div className="role-tabs">
          {securitySettings.roles.map(role => (
            <button
              key={role.id}
              className={`role-tab ${securitySettings.activeRole === role.id ? 'active' : ''}`}
              onClick={() => handleRoleSelect(role.id)}
            >
              {role.name}
            </button>
          ))}
        </div>
        
        <div className="permissions-grid">
          <div className="permission-row">
            <div className="permission-label">View Records</div>
            <div className="permission-radios">
              {securitySettings.roles.map(role => (
                <div 
                  key={role.id} 
                  className={`permission-radio ${securitySettings.activeRole === role.id ? 'active' : ''}`}
                  onClick={() => handlePermissionToggle(role.id, 'view')}
                >
                  <div className={`radio-circle ${role.permissions.includes('view') ? 'checked' : ''}`}></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="permission-row">
            <div className="permission-label">Edit Records</div>
            <div className="permission-radios">
              {securitySettings.roles.map(role => (
                <div 
                  key={role.id} 
                  className={`permission-radio ${securitySettings.activeRole === role.id ? 'active' : ''}`}
                  onClick={() => handlePermissionToggle(role.id, 'edit')}
                >
                  <div className={`radio-circle ${role.permissions.includes('edit') ? 'checked' : ''}`}></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="permission-row">
            <div className="permission-label">Delete Records</div>
            <div className="permission-radios">
              {securitySettings.roles.map(role => (
                <div 
                  key={role.id} 
                  className={`permission-radio ${securitySettings.activeRole === role.id ? 'active' : ''}`}
                  onClick={() => handlePermissionToggle(role.id, 'delete')}
                >
                  <div className={`radio-circle ${role.permissions.includes('delete') ? 'checked' : ''}`}></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="permission-row">
            <div className="permission-label">Approve Timesheets/Invoices</div>
            <div className="permission-radios">
              {securitySettings.roles.map(role => (
                <div 
                  key={role.id} 
                  className={`permission-radio ${securitySettings.activeRole === role.id ? 'active' : ''}`}
                  onClick={() => handlePermissionToggle(role.id, 'approve')}
                >
                  <div className={`radio-circle ${role.permissions.includes('approve') ? 'checked' : ''}`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="audit-logs-section">
        <h4 className="settings-subsection-title">Audit Logs</h4>
        <p className="audit-description">
          View a complete history of all actions taken within your tenant.
        </p>
        <button className="btn btn-outline-light">
          <i className="fa fa-history"></i> View Audit Logs
        </button>
      </div>
      
      <div className="button-group">
        <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        <button className="btn btn-outline-light">Cancel</button>
      </div>
    </div>
  );
};

export default SecurityPrivacy;
