'use client';

import React, { useState } from 'react';

const SowSettings = () => {
  const [sowSettings, setSowSettings] = useState({
    defaultRates: [
      { role: 'Developer', rate: 125 },
      { role: 'Designer', rate: 110 },
      { role: 'Project Manager', rate: 150 },
      { role: 'QA Engineer', rate: 95 }
    ],
    overtimeMultiplier: 1,
    enableOvertime: true,
    approvalWorkflow: 'manual',
    requireClientApproval: true,
    sowTemplate: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSowSettings({
      ...sowSettings,
      [name]: value
    });
  };

  const handleToggleChange = (e) => {
    const { name, checked } = e.target;
    setSowSettings({
      ...sowSettings,
      [name]: checked
    });
  };

  const handleRateChange = (index, field, value) => {
    const updatedRates = [...sowSettings.defaultRates];
    updatedRates[index] = {
      ...updatedRates[index],
      [field]: field === 'rate' ? parseFloat(value) : value
    };
    setSowSettings({
      ...sowSettings,
      defaultRates: updatedRates
    });
  };

  const addNewRole = () => {
    setSowSettings({
      ...sowSettings,
      defaultRates: [
        ...sowSettings.defaultRates,
        { role: '', rate: 0 }
      ]
    });
  };

  const removeRole = (index) => {
    const updatedRates = [...sowSettings.defaultRates];
    updatedRates.splice(index, 1);
    setSowSettings({
      ...sowSettings,
      defaultRates: updatedRates
    });
  };

  const handleTemplateUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        setSowSettings({
          ...sowSettings,
          sowTemplate: {
            name: file.name,
            size: file.size,
            type: file.type,
            content: event.target.result
          }
        });
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Save SOW settings to backend
    console.log('Saving SOW settings:', sowSettings);
    // API call would go here
    alert('SOW settings saved successfully!');
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Statement of Work (SOW) Settings</h3>
      
      <div className="form-group">
        <label className="form-label">Default Billing Rates</label>
        <div className="rate-table">
          <table className="table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Hourly Rate ($)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sowSettings.defaultRates.map((rate, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      value={rate.role}
                      onChange={(e) => handleRateChange(index, 'role', e.target.value)}
                      placeholder="Enter role"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control"
                      value={rate.rate}
                      onChange={(e) => handleRateChange(index, 'rate', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-light"
                      onClick={() => removeRole(index)}
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn btn-sm btn-outline-light" onClick={addNewRole}>
            <i className="fa fa-plus"></i> Add Role
          </button>
        </div>
      </div>
      
      <div className="form-group">
        <div className="form-switch">
          <label className="switch">
            <input
              type="checkbox"
              name="enableOvertime"
              checked={sowSettings.enableOvertime}
              onChange={handleToggleChange}
            />
            <span className="slider"></span>
          </label>
          <span className="switch-label">Enable overtime billing</span>
        </div>
      </div>
      
      {sowSettings.enableOvertime && (
        <div className="form-group">
          <label className="form-label" htmlFor="overtimeMultiplier">Overtime Multiplier</label>
          <input
            type="number"
            className="form-control"
            id="overtimeMultiplier"
            name="overtimeMultiplier"
            value={sowSettings.overtimeMultiplier}
            onChange={handleInputChange}
            min="1"
            step="0.1"
            placeholder="1.5"
          />
          <small className="form-hint">Standard rate × multiplier = overtime rate</small>
        </div>
      )}
      
      <div className="form-group">
        <label className="form-label" htmlFor="approvalWorkflow">Approval Workflow</label>
        <select
          className="form-select"
          id="approvalWorkflow"
          name="approvalWorkflow"
          value={sowSettings.approvalWorkflow}
          onChange={handleInputChange}
        >
          <option value="auto">Auto-approve</option>
          <option value="manual">Manual approval</option>
          <option value="manager">Manager approval</option>
          <option value="client">Client approval</option>
        </select>
      </div>
      
      <div className="form-group">
        <div className="form-switch">
          <label className="switch">
            <input
              type="checkbox"
              name="requireClientApproval"
              checked={sowSettings.requireClientApproval}
              onChange={handleToggleChange}
            />
            <span className="slider"></span>
          </label>
          <span className="switch-label">Require client approval for invoices</span>
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label">SOW Template</label>
        <div className="template-upload-container">
          {sowSettings.sowTemplate ? (
            <div className="template-preview">
              <div className="template-info">
                <i className="fa fa-file-alt"></i>
                <span>{sowSettings.sowTemplate.name}</span>
                <small>{Math.round(sowSettings.sowTemplate.size / 1024)} KB</small>
              </div>
              <button 
                className="btn btn-sm btn-outline-light" 
                onClick={() => setSowSettings({...sowSettings, sowTemplate: null})}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="file-upload" onClick={() => document.getElementById('templateUpload').click()}>
              <div className="file-upload-icon">
                <i className="fa fa-file-upload"></i>
              </div>
              <div className="file-upload-text">Upload SOW template document</div>
              <div className="file-upload-hint">Supported formats: DOCX, PDF. Max file size: 5MB</div>
            </div>
          )}
          <input
            type="file"
            id="templateUpload"
            accept=".docx,.pdf"
            style={{ display: 'none' }}
            onChange={handleTemplateUpload}
          />
        </div>
      </div>
      
      <div className="button-group">
        <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        <button className="btn btn-outline-light">Cancel</button>
      </div>
    </div>
  );
};

export default SowSettings;
