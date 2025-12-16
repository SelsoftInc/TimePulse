'use client';

import React, { useState } from 'react';

const EmailNotifications = () => {
  const [emailSettings, setEmailSettings] = useState({
    invoiceSent: true,
    paymentReminders: true,
    paymentReceived: true,
    timesheetReminders: true,
    timesheetApproved: true,
    timesheetRejected: true,
    weeklyDigest: false,
    templates: {
      invoiceSent: {
        subject: 'New Invoice #{invoice_number} from {company_name}',
        body: 'Dear {client_name},\n\nWe have issued a new invoice #{invoice_number} for {amount} due on {due_date}.\n\nThank you for your business.\n\nBest regards,\n{company_name}'
      },
      paymentReminder: {
        subject: 'Payment Reminder: Invoice #{invoice_number}',
        body: 'Dear {client_name},\n\nThis is a friendly reminder that invoice #{invoice_number} for {amount} is due on {due_date}.\n\nThank you for your prompt payment.\n\nBest regards,\n{company_name}'
      },
      timesheetReminder: {
        subject: 'Timesheet Submission Reminder',
        body: 'Dear {employee_name},\n\nThis is a reminder to submit your timesheet for the period ending {period_end_date}.\n\nThank you,\n{company_name}'
      }
    },
    activeTemplate: 'invoiceSent'
  });

  const handleToggleChange = (e) => {
    const { name, checked } = e.target;
    setEmailSettings({
      ...emailSettings,
      [name]: checked
    });
  };

  const handleTemplateSelect = (template) => {
    setEmailSettings({
      ...emailSettings,
      activeTemplate: template
    });
  };

  const handleTemplateChange = (field, value) => {
    setEmailSettings({
      ...emailSettings,
      templates: {
        ...emailSettings.templates,
        [emailSettings.activeTemplate]: {
          ...emailSettings.templates[emailSettings.activeTemplate],
          [field]: value
        }
      }
    });
  };

  const handleSave = () => {
    // Save email notification settings to backend
    console.log('Saving email notification settings:', emailSettings);
    // API call would go here
    alert('Email notification settings saved successfully!');
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Email Notifications</h3>
      
      <div className="notification-toggles">
        <div className="form-group">
          <div className="form-switch">
            <label className="switch">
              <input
                type="checkbox"
                name="invoiceSent"
                checked={emailSettings.invoiceSent}
                onChange={handleToggleChange}
              />
              <span className="slider"></span>
            </label>
            <span className="switch-label">Invoice sent notifications</span>
          </div>
        </div>
        
        <div className="form-group">
          <div className="form-switch">
            <label className="switch">
              <input
                type="checkbox"
                name="paymentReminders"
                checked={emailSettings.paymentReminders}
                onChange={handleToggleChange}
              />
              <span className="slider"></span>
            </label>
            <span className="switch-label">Payment reminder notifications</span>
          </div>
        </div>
        
        <div className="form-group">
          <div className="form-switch">
            <label className="switch">
              <input
                type="checkbox"
                name="paymentReceived"
                checked={emailSettings.paymentReceived}
                onChange={handleToggleChange}
              />
              <span className="slider"></span>
            </label>
            <span className="switch-label">Payment received notifications</span>
          </div>
        </div>
        
        <div className="form-group">
          <div className="form-switch">
            <label className="switch">
              <input
                type="checkbox"
                name="timesheetReminders"
                checked={emailSettings.timesheetReminders}
                onChange={handleToggleChange}
              />
              <span className="slider"></span>
            </label>
            <span className="switch-label">Timesheet submission reminders</span>
          </div>
        </div>
        
        <div className="form-group">
          <div className="form-switch">
            <label className="switch">
              <input
                type="checkbox"
                name="timesheetApproved"
                checked={emailSettings.timesheetApproved}
                onChange={handleToggleChange}
              />
              <span className="slider"></span>
            </label>
            <span className="switch-label">Timesheet approved notifications</span>
          </div>
        </div>
        
        <div className="form-group">
          <div className="form-switch">
            <label className="switch">
              <input
                type="checkbox"
                name="timesheetRejected"
                checked={emailSettings.timesheetRejected}
                onChange={handleToggleChange}
              />
              <span className="slider"></span>
            </label>
            <span className="switch-label">Timesheet rejected notifications</span>
          </div>
        </div>
        
        <div className="form-group">
          <div className="form-switch">
            <label className="switch">
              <input
                type="checkbox"
                name="weeklyDigest"
                checked={emailSettings.weeklyDigest}
                onChange={handleToggleChange}
              />
              <span className="slider"></span>
            </label>
            <span className="switch-label">Weekly summary digest</span>
          </div>
        </div>
      </div>
      
      <div className="email-template-editor">
        <h4 className="settings-subsection-title">Email Templates</h4>
        
        <div className="template-tabs">
          <button 
            className={`template-tab ${emailSettings.activeTemplate === 'invoiceSent' ? 'active' : ''}`}
            onClick={() => handleTemplateSelect('invoiceSent')}
          >
            Invoice Sent
          </button>
          <button 
            className={`template-tab ${emailSettings.activeTemplate === 'paymentReminder' ? 'active' : ''}`}
            onClick={() => handleTemplateSelect('paymentReminder')}
          >
            Payment Reminder
          </button>
          <button 
            className={`template-tab ${emailSettings.activeTemplate === 'timesheetReminder' ? 'active' : ''}`}
            onClick={() => handleTemplateSelect('timesheetReminder')}
          >
            Timesheet Reminder
          </button>
        </div>
        
        <div className="template-editor">
          <div className="form-group">
            <label className="form-label" htmlFor="templateSubject">Email Subject</label>
            <input
              type="text"
              className="form-control"
              id="templateSubject"
              value={emailSettings.templates[emailSettings.activeTemplate].subject}
              onChange={(e) => handleTemplateChange('subject', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="templateBody">Email Body</label>
            <textarea
              className="form-control"
              id="templateBody"
              rows="10"
              value={emailSettings.templates[emailSettings.activeTemplate].body}
              onChange={(e) => handleTemplateChange('body', e.target.value)}
            ></textarea>
          </div>
          
          <div className="template-variables">
            <h5>Available Variables:</h5>
            <div className="variable-tags">
              <span className="variable-tag">{'{company_name}'}</span>
              <span className="variable-tag">{'{client_name}'}</span>
              <span className="variable-tag">{'{invoice_number}'}</span>
              <span className="variable-tag">{'{amount}'}</span>
              <span className="variable-tag">{'{due_date}'}</span>
              <span className="variable-tag">{'{employee_name}'}</span>
              <span className="variable-tag">{'{period_end_date}'}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="button-group">
        <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        <button className="btn btn-outline-light">Cancel</button>
      </div>
    </div>
  );
};

export default EmailNotifications;
