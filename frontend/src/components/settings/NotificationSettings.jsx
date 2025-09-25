import React, { useState } from 'react';
import './Settings.css';

const NotificationSettings = () => {
  // Mock notification settings
  const [emailNotifications, setEmailNotifications] = useState({
    timeEntryReminders: true,
    approvalRequests: true,
    weeklyReports: true,
    projectUpdates: false,
    systemAnnouncements: true
  });

  const [pushNotifications, setPushNotifications] = useState({
    timeEntryReminders: false,
    approvalRequests: true,
    projectUpdates: true,
    systemAnnouncements: false
  });

  const [emailFrequency, setEmailFrequency] = useState('daily');

  const handleEmailToggle = (setting) => {
    setEmailNotifications({
      ...emailNotifications,
      [setting]: !emailNotifications[setting]
    });
    // In a real app, this would trigger an API call to update the settings
  };

  const handlePushToggle = (setting) => {
    setPushNotifications({
      ...pushNotifications,
      [setting]: !pushNotifications[setting]
    });
    // In a real app, this would trigger an API call to update the settings
  };

  const handleFrequencyChange = (frequency) => {
    setEmailFrequency(frequency);
    // In a real app, this would trigger an API call to update the settings
  };

  return (
    <div className="settings-content">
      <div className="settings-section">
        <h2 className="settings-title">Notification Preferences</h2>
        
        {/* Email Notifications */}
        <div className="card">
          <div className="card-inne">
            <h3>Email Notifications</h3>
            <p className="text-muted">Configure which email notifications you'd like to receive</p>
            
            <div className="notification-list">
              <div className="notification-item">
                <div className="notification-info">
                  <h5>Time Entry Reminders</h5>
                  <p>Receive reminders to submit your time entries</p>
                </div>
                <div className="notification-toggle">
                  <div className="custom-control custom-switch">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="email-time-entry"
                      checked={emailNotifications.timeEntryReminders}
                      onChange={() => handleEmailToggle('timeEntryReminders')}
                    />
                    <label className="custom-control-label" htmlFor="email-time-entry"></label>
                  </div>
                </div>
              </div>
              
              <div className="notification-item">
                <div className="notification-info">
                  <h5>Approval Requests</h5>
                  <p>Receive notifications for time entry approval requests</p>
                </div>
                <div className="notification-toggle">
                  <div className="custom-control custom-switch">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="email-approvals"
                      checked={emailNotifications.approvalRequests}
                      onChange={() => handleEmailToggle('approvalRequests')}
                    />
                    <label className="custom-control-label" htmlFor="email-approvals"></label>
                  </div>
                </div>
              </div>
              
              <div className="notification-item">
                <div className="notification-info">
                  <h5>Weekly Reports</h5>
                  <p>Receive weekly summary reports of time tracking data</p>
                </div>
                <div className="notification-toggle">
                  <div className="custom-control custom-switch">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="email-reports"
                      checked={emailNotifications.weeklyReports}
                      onChange={() => handleEmailToggle('weeklyReports')}
                    />
                    <label className="custom-control-label" htmlFor="email-reports"></label>
                  </div>
                </div>
              </div>
              
              <div className="notification-item">
                <div className="notification-info">
                  <h5>Project Updates</h5>
                  <p>Receive notifications about project changes and updates</p>
                </div>
                <div className="notification-toggle">
                  <div className="custom-control custom-switch">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="email-projects"
                      checked={emailNotifications.projectUpdates}
                      onChange={() => handleEmailToggle('projectUpdates')}
                    />
                    <label className="custom-control-label" htmlFor="email-projects"></label>
                  </div>
                </div>
              </div>
              
              <div className="notification-item">
                <div className="notification-info">
                  <h5>System Announcements</h5>
                  <p>Receive important system announcements and updates</p>
                </div>
                <div className="notification-toggle">
                  <div className="custom-control custom-switch">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="email-system"
                      checked={emailNotifications.systemAnnouncements}
                      onChange={() => handleEmailToggle('systemAnnouncements')}
                    />
                    <label className="custom-control-label" htmlFor="email-system"></label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="notification-frequency mt-4">
              <h4>Email Digest Frequency</h4>
              <div className="btn-group">
                <button 
                  className={`btn ${emailFrequency === 'realtime' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleFrequencyChange('realtime')}
                >
                  Real-time
                </button>
                <button 
                  className={`btn ${emailFrequency === 'daily' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleFrequencyChange('daily')}
                >
                  Daily
                </button>
                <button 
                  className={`btn ${emailFrequency === 'weekly' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleFrequencyChange('weekly')}
                >
                  Weekly
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Push Notifications */}
        <div className="card mt-4">
          <div className="card-inne">
            <h3>Push Notifications</h3>
            <p className="text-muted">Configure which browser push notifications you'd like to receive</p>
            
            <div className="notification-list">
              <div className="notification-item">
                <div className="notification-info">
                  <h5>Time Entry Reminders</h5>
                  <p>Receive reminders to submit your time entries</p>
                </div>
                <div className="notification-toggle">
                  <div className="custom-control custom-switch">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="push-time-entry"
                      checked={pushNotifications.timeEntryReminders}
                      onChange={() => handlePushToggle('timeEntryReminders')}
                    />
                    <label className="custom-control-label" htmlFor="push-time-entry"></label>
                  </div>
                </div>
              </div>
              
              <div className="notification-item">
                <div className="notification-info">
                  <h5>Approval Requests</h5>
                  <p>Receive notifications for time entry approval requests</p>
                </div>
                <div className="notification-toggle">
                  <div className="custom-control custom-switch">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="push-approvals"
                      checked={pushNotifications.approvalRequests}
                      onChange={() => handlePushToggle('approvalRequests')}
                    />
                    <label className="custom-control-label" htmlFor="push-approvals"></label>
                  </div>
                </div>
              </div>
              
              <div className="notification-item">
                <div className="notification-info">
                  <h5>Project Updates</h5>
                  <p>Receive notifications about project changes and updates</p>
                </div>
                <div className="notification-toggle">
                  <div className="custom-control custom-switch">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="push-projects"
                      checked={pushNotifications.projectUpdates}
                      onChange={() => handlePushToggle('projectUpdates')}
                    />
                    <label className="custom-control-label" htmlFor="push-projects"></label>
                  </div>
                </div>
              </div>
              
              <div className="notification-item">
                <div className="notification-info">
                  <h5>System Announcements</h5>
                  <p>Receive important system announcements and updates</p>
                </div>
                <div className="notification-toggle">
                  <div className="custom-control custom-switch">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="push-system"
                      checked={pushNotifications.systemAnnouncements}
                      onChange={() => handlePushToggle('systemAnnouncements')}
                    />
                    <label className="custom-control-label" htmlFor="push-system"></label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <button className="btn btn-primary">Save Changes</button>
          <button className="btn btn-outline-secondary ml-2">Reset to Default</button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
