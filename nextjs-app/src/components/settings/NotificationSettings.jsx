'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { API_BASE } from '@/config/api';
import "./Settings.css";

const NotificationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [emailNotifications, setEmailNotifications] = useState({
    timeEntryReminders: true,
    approvalRequests: true,
    weeklyReports: true,
    projectUpdates: false,
    systemAnnouncements: true});

  const [pushNotifications, setPushNotifications] = useState({
    timeEntryReminders: false,
    approvalRequests: true,
    projectUpdates: true,
    systemAnnouncements: false});

  const [emailFrequency, setEmailFrequency] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch notification preferences on mount
  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    try {
      setLoading(true);
      const userId = user?.id || JSON.parse(localStorage.getItem('userInfo') || '{}').id;
      
      if (!userId) {
        console.error('No user ID found');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/settings/notification-preferences/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences');
      }

      const data = await response.json();
      
      if (data.success) {
        const prefs = data.preferences;
        setEmailNotifications({
          timeEntryReminders: prefs.emailTimeEntryReminders,
          approvalRequests: prefs.emailApprovalRequests,
          weeklyReports: prefs.emailWeeklyReports,
          projectUpdates: prefs.emailProjectUpdates,
          systemAnnouncements: prefs.emailSystemAnnouncements
        });
        setPushNotifications({
          timeEntryReminders: prefs.pushTimeEntryReminders,
          approvalRequests: prefs.pushApprovalRequests,
          projectUpdates: prefs.pushProjectUpdates,
          systemAnnouncements: prefs.pushSystemAnnouncements
        });
        setEmailFrequency(prefs.emailDigestFrequency);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast.error('Failed to load notification preferences', { title: 'Error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailToggle = (setting) => {
    setEmailNotifications({
      ...emailNotifications,
      [setting]: !emailNotifications[setting]});
  };

  const handlePushToggle = (setting) => {
    setPushNotifications({
      ...pushNotifications,
      [setting]: !pushNotifications[setting]});
  };

  const handleFrequencyChange = (frequency) => {
    setEmailFrequency(frequency);
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const userId = user?.id || JSON.parse(localStorage.getItem('userInfo') || '{}').id;
      
      if (!userId) {
        toast.error('User not found', { title: 'Error' });
        return;
      }

      const preferences = {
        emailTimeEntryReminders: emailNotifications.timeEntryReminders,
        emailApprovalRequests: emailNotifications.approvalRequests,
        emailWeeklyReports: emailNotifications.weeklyReports,
        emailProjectUpdates: emailNotifications.projectUpdates,
        emailSystemAnnouncements: emailNotifications.systemAnnouncements,
        emailDigestFrequency: emailFrequency,
        pushTimeEntryReminders: pushNotifications.timeEntryReminders,
        pushApprovalRequests: pushNotifications.approvalRequests,
        pushProjectUpdates: pushNotifications.projectUpdates,
        pushSystemAnnouncements: pushNotifications.systemAnnouncements
      };

      const response = await fetch(`${API_BASE}/api/settings/notification-preferences/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error('Failed to save notification preferences');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Notification preferences saved successfully', { title: 'Success' });
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save notification preferences', { title: 'Error' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setEmailNotifications({
      timeEntryReminders: true,
      approvalRequests: true,
      weeklyReports: true,
      projectUpdates: false,
      systemAnnouncements: true
    });
    setPushNotifications({
      timeEntryReminders: false,
      approvalRequests: true,
      projectUpdates: true,
      systemAnnouncements: false
    });
    setEmailFrequency('daily');
    toast.info('Settings reset to defaults', { title: 'Reset' });
  };

  if (loading) {
    return (
      <div className="settings-content">
        <div className="loading-state">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p>Loading notification preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-content">
      <div className="settings-section">
        <h2 className="settings-title">Notification Preferences</h2>

        {/* Email Notifications */}
        <div className="card">
          <div className="card-inne">
            <h3>Email Notifications</h3>
            <p className="text-muted">
              Configure which email notifications you'd like to receive
            </p>

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
                      onChange={() => handleEmailToggle("timeEntryReminders")}
                    />
                    <label
                      className="custom-control-label"
                      htmlFor="email-time-entry"
                    ></label>
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
                      onChange={() => handleEmailToggle("approvalRequests")}
                    />
                    <label
                      className="custom-control-label"
                      htmlFor="email-approvals"
                    ></label>
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
                      onChange={() => handleEmailToggle("weeklyReports")}
                    />
                    <label
                      className="custom-control-label"
                      htmlFor="email-reports"
                    ></label>
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
                      onChange={() => handleEmailToggle("projectUpdates")}
                    />
                    <label
                      className="custom-control-label"
                      htmlFor="email-projects"
                    ></label>
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
                      onChange={() => handleEmailToggle("systemAnnouncements")}
                    />
                    <label
                      className="custom-control-label"
                      htmlFor="email-system"
                    ></label>
                  </div>
                </div>
              </div>
            </div>

            <div className="notification-frequency mt-4">
              <h4>Email Digest Frequency</h4>
              <div className="btn-group">
                <button
                  className={`btn ${
                    emailFrequency === "realtime"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => handleFrequencyChange("realtime")}
                >
                  Real-time
                </button>
                <button
                  className={`btn ${
                    emailFrequency === "daily"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => handleFrequencyChange("daily")}
                >
                  Daily
                </button>
                <button
                  className={`btn ${
                    emailFrequency === "weekly"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => handleFrequencyChange("weekly")}
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
            <p className="text-muted">
              Configure which browser push notifications you'd like to receive
            </p>

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
                      onChange={() => handlePushToggle("timeEntryReminders")}
                    />
                    <label
                      className="custom-control-label"
                      htmlFor="push-time-entry"
                    ></label>
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
                      onChange={() => handlePushToggle("approvalRequests")}
                    />
                    <label
                      className="custom-control-label"
                      htmlFor="push-approvals"
                    ></label>
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
                      onChange={() => handlePushToggle("projectUpdates")}
                    />
                    <label
                      className="custom-control-label"
                      htmlFor="push-projects"
                    ></label>
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
                      onChange={() => handlePushToggle("systemAnnouncements")}
                    />
                    <label
                      className="custom-control-label"
                      htmlFor="push-system"
                    ></label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button 
            className="btn btn-primary" 
            onClick={handleSaveChanges}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            className="btn btn-outline-secondary ml-2"
            onClick={handleResetToDefault}
            disabled={saving}
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
