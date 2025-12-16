'use client';

import React, { useState } from 'react';
import { PAYMENT_TERMS_OPTIONS } from '../../config/lookups';

const InvoicePreferences = () => {
  const [invoicePrefs, setInvoicePrefs] = useState({
    frequency: 'monthly',
    currency: 'USD',
    paymentTerms: 'net30',
    customPaymentDays: 30,
    dueDateOffset: 30,
    invoiceNumberPrefix: 'INV-',
    nextInvoiceNumber: '001',
    showHours: true,
    showRates: true
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoicePrefs({
      ...invoicePrefs,
      [name]: value
    });
  };

  const handleToggleChange = (e) => {
    const { name, checked } = e.target;
    setInvoicePrefs({
      ...invoicePrefs,
      [name]: checked
    });
  };

  const handleSave = () => {
    // Save invoice preferences to backend
    console.log('Saving invoice preferences:', invoicePrefs);
    // API call would go here
    alert('Invoice preferences saved successfully!');
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Invoice Preferences</h3>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="frequency">Invoice Frequency</label>
          <select
            className="form-select"
            id="frequency"
            name="frequency"
            value={invoicePrefs.frequency}
            onChange={handleInputChange}
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="currency">Currency</label>
          <select
            className="form-select"
            id="currency"
            name="currency"
            value={invoicePrefs.currency}
            onChange={handleInputChange}
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="JPY">JPY - Japanese Yen</option>
          </select>
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="paymentTerms">Default Invoice Cycle</label>
          <select
            className="form-select"
            id="paymentTerms"
            name="paymentTerms"
            value={invoicePrefs.paymentTerms}
            onChange={handleInputChange}
          >
            {PAYMENT_TERMS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
            <option value="custom">Custom</option>
          </select>
          <small className="text-muted">Defines when invoices are created after timesheet approval (e.g., Net 30).</small>
        </div>
        
        {invoicePrefs.paymentTerms === 'custom' && (
          <div className="form-group">
            <label className="form-label" htmlFor="customPaymentDays">Custom Payment Days</label>
            <input
              type="number"
              className="form-control"
              id="customPaymentDays"
              name="customPaymentDays"
              value={invoicePrefs.customPaymentDays}
              onChange={handleInputChange}
              min="1"
              max="365"
            />
          </div>
        )}
        
        <div className="form-group">
          <label className="form-label" htmlFor="dueDateOffset">Default Due Date (days after invoice)</label>
          <input
            type="number"
            className="form-control"
            id="dueDateOffset"
            name="dueDateOffset"
            value={invoicePrefs.dueDateOffset}
            onChange={handleInputChange}
            min="0"
            max="365"
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="invoiceNumberPrefix">Invoice Number Prefix</label>
          <input
            type="text"
            className="form-control"
            id="invoiceNumberPrefix"
            name="invoiceNumberPrefix"
            value={invoicePrefs.invoiceNumberPrefix}
            onChange={handleInputChange}
            placeholder="e.g., INV-"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="nextInvoiceNumber">Next Invoice Number</label>
          <input
            type="text"
            className="form-control"
            id="nextInvoiceNumber"
            name="nextInvoiceNumber"
            value={invoicePrefs.nextInvoiceNumber}
            onChange={handleInputChange}
            placeholder="e.g., 001"
          />
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label">Invoice Display Options</label>
        <div className="form-switch">
          <label className="switch">
            <input
              type="checkbox"
              name="showHours"
              checked={invoicePrefs.showHours}
              onChange={handleToggleChange}
            />
            <span className="slider"></span>
          </label>
          <span className="switch-label">Show hours on invoices</span>
        </div>
      </div>
      
      <div className="form-group">
        <div className="form-switch">
          <label className="switch">
            <input
              type="checkbox"
              name="showRates"
              checked={invoicePrefs.showRates}
              onChange={handleToggleChange}
            />
            <span className="slider"></span>
          </label>
          <span className="switch-label">Show hourly rates on invoices</span>
        </div>
      </div>
      
      <div className="button-group">
        <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        <button className="btn btn-outline-light">Cancel</button>
      </div>
    </div>
  );
};

export default InvoicePreferences;
