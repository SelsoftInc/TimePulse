import React, { useState, useEffect } from 'react';
import './InvoiceSettings.css';

const InvoiceSettings = () => {
  const [invoiceSettings, setInvoiceSettings] = useState({
    // Company Information
    companyName: '',
    companyAddress: '',
    companyCity: '',
    companyState: '',
    companyZip: '',
    companyCountry: 'United States',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    taxId: '',
    
    // Invoice Preferences
    invoiceNumberPrefix: 'INV-',
    nextInvoiceNumber: '001',
    invoiceNumberFormat: 'sequential', // sequential, date-based, custom
    
    // Payment Terms
    defaultPaymentTerms: 'Net 30',
    customPaymentDays: 30,
    lateFeeEnabled: false,
    lateFeePercentage: 1.5,
    lateFeeGracePeriod: 5,
    
    // Currency & Formatting
    currency: 'USD',
    currencySymbol: '$',
    currencyPosition: 'before', // before, after
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    
    // Invoice Display
    showHours: true,
    showRates: true,
    showTaxes: true,
    showDiscounts: false,
    logoUrl: '',
    
    // Email Settings
    emailSubject: 'Invoice #{invoice_number} from {company_name}',
    emailTemplate: 'Dear {client_name},\n\nPlease find attached invoice #{invoice_number} for services rendered.\n\nThank you for your business!\n\nBest regards,\n{company_name}',
    
    // Email Styling
    emailHeaderColor: '#0d6efd',
    emailAccentColor: '#6c757d', 
    emailBackgroundColor: '#ffffff',
    emailTextColor: '#212529',
    emailFontFamily: 'Arial, sans-serif',
    emailFontSize: '14',
    emailButtonColor: '#0d6efd',
    emailButtonTextColor: '#ffffff',
    emailLogoSize: 'medium', // small, medium, large
    emailHeaderStyle: 'modern', // classic, modern, minimal
    
    // Automation
    autoSendInvoices: false,
    sendReminders: true,
    reminderDays: [7, 3, 1], // days before due date
    
    // Integration
    quickbooksEnabled: false,
    quickbooksCompanyId: '',
    
    // Configured flag
    isConfigured: false
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('company');

  useEffect(() => {
    loadInvoiceSettings();
  }, []);

  const loadInvoiceSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app, this would fetch from API
      const savedSettings = localStorage.getItem('invoiceSettings');
      if (savedSettings) {
        setInvoiceSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading invoice settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInvoiceSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Mark as configured
      const updatedSettings = {
        ...invoiceSettings,
        isConfigured: true
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage (in real app, this would be API call)
      localStorage.setItem('invoiceSettings', JSON.stringify(updatedSettings));
      setInvoiceSettings(updatedSettings);
      
      alert('Invoice settings saved successfully!');
    } catch (error) {
      console.error('Error saving invoice settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'company', label: 'Company Info', icon: 'fas fa-building' },
    { id: 'invoice', label: 'Invoice Setup', icon: 'fas fa-file-invoice' },
    { id: 'payment', label: 'Invoice Cycle', icon: 'fas fa-credit-card' },
    { id: 'display', label: 'Display Options', icon: 'fas fa-eye' },
    { id: 'email', label: 'Email Templates', icon: 'fas fa-envelope' },
    { id: 'automation', label: 'Automation', icon: 'fas fa-robot' }
  ];

  if (loading && !invoiceSettings.companyName) {
    return (
      <div className="invoice-settings-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading invoice settings...</p>
      </div>
    );
  }

  return (
    <div className="invoice-settings">
      <div className="settings-header">
        <h2 className="settings-title">
          <i className="fas fa-file-invoice mr-2"></i>
          Invoice Settings
        </h2>
        <p className="settings-subtitle">
          Configure your invoice preferences, company information, and automation settings
        </p>
      </div>

      <div className="settings-tabs">
        <nav className="nav nav-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="settings-content">
        {activeTab === 'company' && (
          <div className="settings-section">
            <h3 className="section-title">Company Information</h3>
            <p className="section-description">This information will appear on your invoices</p>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="companyName">Company Name *</label>
                <input
                  type="text"
                  className="form-control"
                  id="companyName"
                  name="companyName"
                  value={invoiceSettings.companyName}
                  onChange={handleInputChange}
                  placeholder="Enter your company name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="companyEmail">Company Email *</label>
                <input
                  type="email"
                  className="form-control"
                  id="companyEmail"
                  name="companyEmail"
                  value={invoiceSettings.companyEmail}
                  onChange={handleInputChange}
                  placeholder="company@example.com"
                  required
                />
              </div>
              
              <div className="form-group full-width">
                <label className="form-label" htmlFor="companyAddress">Address</label>
                <input
                  type="text"
                  className="form-control"
                  id="companyAddress"
                  name="companyAddress"
                  value={invoiceSettings.companyAddress}
                  onChange={handleInputChange}
                  placeholder="Street address"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="companyCity">City</label>
                <input
                  type="text"
                  className="form-control"
                  id="companyCity"
                  name="companyCity"
                  value={invoiceSettings.companyCity}
                  onChange={handleInputChange}
                  placeholder="City"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="companyState">State</label>
                <input
                  type="text"
                  className="form-control"
                  id="companyState"
                  name="companyState"
                  value={invoiceSettings.companyState}
                  onChange={handleInputChange}
                  placeholder="State"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="companyZip">ZIP Code</label>
                <input
                  type="text"
                  className="form-control"
                  id="companyZip"
                  name="companyZip"
                  value={invoiceSettings.companyZip}
                  onChange={handleInputChange}
                  placeholder="ZIP"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="companyPhone">Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  id="companyPhone"
                  name="companyPhone"
                  value={invoiceSettings.companyPhone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="taxId">Tax ID</label>
                <input
                  type="text"
                  className="form-control"
                  id="taxId"
                  name="taxId"
                  value={invoiceSettings.taxId}
                  onChange={handleInputChange}
                  placeholder="Tax ID Number"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoice' && (
          <div className="settings-section">
            <h3 className="section-title">Invoice Setup</h3>
            <p className="section-description">Configure invoice numbering and formatting</p>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="invoiceNumberPrefix">Invoice Number Prefix</label>
                <input
                  type="text"
                  className="form-control"
                  id="invoiceNumberPrefix"
                  name="invoiceNumberPrefix"
                  value={invoiceSettings.invoiceNumberPrefix}
                  onChange={handleInputChange}
                  placeholder="INV-"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="nextInvoiceNumber">Next Invoice Number</label>
                <input
                  type="text"
                  className="form-control"
                  id="nextInvoiceNumber"
                  name="nextInvoiceNumber"
                  value={invoiceSettings.nextInvoiceNumber}
                  onChange={handleInputChange}
                  placeholder="001"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="currency">Currency</label>
                <select
                  className="form-select"
                  id="currency"
                  name="currency"
                  value={invoiceSettings.currency}
                  onChange={handleInputChange}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="settings-section">
            <h3 className="section-title">Invoice Cycle</h3>
            <p className="section-description">Set default invoice cycle and late fee policies</p>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="defaultPaymentTerms">Default Invoice Cycle</label>
                <select
                  className="form-select"
                  id="defaultPaymentTerms"
                  name="defaultPaymentTerms"
                  value={invoiceSettings.defaultPaymentTerms}
                  onChange={handleInputChange}
                >
                  <option value="Due upon receipt">Due upon receipt</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>
              
              <div className="form-group full-width">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="lateFeeEnabled"
                    name="lateFeeEnabled"
                    checked={invoiceSettings.lateFeeEnabled}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="lateFeeEnabled">
                    Enable late fees
                  </label>
                </div>
              </div>
              
              {invoiceSettings.lateFeeEnabled && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="lateFeePercentage">Late Fee Percentage</label>
                    <input
                      type="number"
                      className="form-control"
                      id="lateFeePercentage"
                      name="lateFeePercentage"
                      value={invoiceSettings.lateFeePercentage}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="lateFeeGracePeriod">Grace Period (days)</label>
                    <input
                      type="number"
                      className="form-control"
                      id="lateFeeGracePeriod"
                      name="lateFeeGracePeriod"
                      value={invoiceSettings.lateFeeGracePeriod}
                      onChange={handleInputChange}
                      min="0"
                      max="30"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'display' && (
          <div className="settings-section">
            <h3 className="section-title">Display Options</h3>
            <p className="section-description">Choose what information to show on invoices</p>
            
            <div className="form-grid">
              <div className="form-group full-width">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="showHours"
                    name="showHours"
                    checked={invoiceSettings.showHours}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="showHours">
                    Show hours worked
                  </label>
                </div>
              </div>
              
              <div className="form-group full-width">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="showRates"
                    name="showRates"
                    checked={invoiceSettings.showRates}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="showRates">
                    Show hourly rates
                  </label>
                </div>
              </div>
              
              <div className="form-group full-width">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="showTaxes"
                    name="showTaxes"
                    checked={invoiceSettings.showTaxes}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="showTaxes">
                    Show taxes
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="settings-section">
            <h3 className="section-title">Email Templates & Styling</h3>
            <p className="section-description">Customize email templates and visual appearance for invoice delivery</p>
            
            {/* Email Content Section */}
            <div className="subsection">
              <h4 className="subsection-title">Email Content</h4>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label" htmlFor="emailSubject">Email Subject</label>
                  <input
                    type="text"
                    className="form-control"
                    id="emailSubject"
                    name="emailSubject"
                    value={invoiceSettings.emailSubject}
                    onChange={handleInputChange}
                    placeholder="Invoice #{invoice_number} from {company_name}"
                  />
                  <small className="form-hint">Available variables: &#123;invoice_number&#125;, &#123;company_name&#125;, &#123;client_name&#125;, &#123;due_date&#125;, &#123;amount&#125;</small>
                </div>
                
                <div className="form-group full-width">
                  <label className="form-label" htmlFor="emailTemplate">Email Template</label>
                  <textarea
                    className="form-control"
                    id="emailTemplate"
                    name="emailTemplate"
                    value={invoiceSettings.emailTemplate}
                    onChange={handleInputChange}
                    rows="6"
                    placeholder="Email template content..."
                  />
                  <small className="form-hint">Use the same variables as above in your email content</small>
                </div>
              </div>
            </div>

            {/* Email Styling Section */}
            <div className="subsection">
              <h4 className="subsection-title">Email Styling & Appearance</h4>
              
              {/* Header Style */}
              <div className="form-group">
                <label className="form-label" htmlFor="emailHeaderStyle">Header Style</label>
                <select
                  className="form-control"
                  id="emailHeaderStyle"
                  name="emailHeaderStyle"
                  value={invoiceSettings.emailHeaderStyle}
                  onChange={handleInputChange}
                >
                  <option value="classic">Classic</option>
                  <option value="modern">Modern</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>

              {/* Color Settings */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="emailHeaderColor">Header Color</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      className="form-control color-picker"
                      id="emailHeaderColor"
                      name="emailHeaderColor"
                      value={invoiceSettings.emailHeaderColor}
                      onChange={handleInputChange}
                    />
                    <input
                      type="text"
                      className="form-control color-text"
                      value={invoiceSettings.emailHeaderColor}
                      onChange={handleInputChange}
                      name="emailHeaderColor"
                      placeholder="#0d6efd"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="emailAccentColor">Accent Color</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      className="form-control color-picker"
                      id="emailAccentColor"
                      name="emailAccentColor"
                      value={invoiceSettings.emailAccentColor}
                      onChange={handleInputChange}
                    />
                    <input
                      type="text"
                      className="form-control color-text"
                      value={invoiceSettings.emailAccentColor}
                      onChange={handleInputChange}
                      name="emailAccentColor"
                      placeholder="#6c757d"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="emailButtonColor">Button Color</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      className="form-control color-picker"
                      id="emailButtonColor"
                      name="emailButtonColor"
                      value={invoiceSettings.emailButtonColor}
                      onChange={handleInputChange}
                    />
                    <input
                      type="text"
                      className="form-control color-text"
                      value={invoiceSettings.emailButtonColor}
                      onChange={handleInputChange}
                      name="emailButtonColor"
                      placeholder="#0d6efd"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="emailBackgroundColor">Background Color</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      className="form-control color-picker"
                      id="emailBackgroundColor"
                      name="emailBackgroundColor"
                      value={invoiceSettings.emailBackgroundColor}
                      onChange={handleInputChange}
                    />
                    <input
                      type="text"
                      className="form-control color-text"
                      value={invoiceSettings.emailBackgroundColor}
                      onChange={handleInputChange}
                      name="emailBackgroundColor"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>

              {/* Typography Settings */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="emailFontFamily">Font Family</label>
                  <select
                    className="form-control"
                    id="emailFontFamily"
                    name="emailFontFamily"
                    value={invoiceSettings.emailFontFamily}
                    onChange={handleInputChange}
                  >
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Helvetica, sans-serif">Helvetica</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Times New Roman, serif">Times New Roman</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                    <option value="Trebuchet MS, sans-serif">Trebuchet MS</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="emailFontSize">Font Size (px)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="emailFontSize"
                    name="emailFontSize"
                    value={invoiceSettings.emailFontSize}
                    onChange={handleInputChange}
                    min="10"
                    max="20"
                    placeholder="14"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="emailLogoSize">Logo Size</label>
                  <select
                    className="form-control"
                    id="emailLogoSize"
                    name="emailLogoSize"
                    value={invoiceSettings.emailLogoSize}
                    onChange={handleInputChange}
                  >
                    <option value="small">Small (100px)</option>
                    <option value="medium">Medium (150px)</option>
                    <option value="large">Large (200px)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Email Preview Section */}
            <div className="subsection">
              <h4 className="subsection-title">Email Preview</h4>
              <div className="email-preview">
                <div 
                  className="email-preview-container"
                  style={{
                    backgroundColor: invoiceSettings.emailBackgroundColor,
                    fontFamily: invoiceSettings.emailFontFamily,
                    fontSize: `${invoiceSettings.emailFontSize}px`,
                    color: invoiceSettings.emailTextColor
                  }}
                >
                  <div 
                    className="email-header"
                    style={{
                      backgroundColor: invoiceSettings.emailHeaderColor,
                      color: invoiceSettings.emailButtonTextColor
                    }}
                  >
                    <h3 style={{ margin: 0, padding: '20px' }}>Invoice from Your Company</h3>
                  </div>
                  
                  <div className="email-body" style={{ padding: '20px' }}>
                    <p><strong>Subject:</strong> {invoiceSettings.emailSubject.replace('{invoice_number}', 'INV-001').replace('{company_name}', 'Your Company')}</p>
                    
                    <div className="email-content">
                      {invoiceSettings.emailTemplate
                        .replace('{client_name}', 'John Doe')
                        .replace('{invoice_number}', 'INV-001')
                        .replace('{company_name}', 'Your Company')
                        .replace('{due_date}', 'July 30, 2025')
                        .replace('{amount}', '$1,250.00')
                        .split('\n')
                        .map((line, index) => (
                          <p key={index} style={{ margin: '10px 0' }}>{line}</p>
                        ))
                      }
                    </div>
                    
                    <button 
                      className="email-button"
                      style={{
                        backgroundColor: invoiceSettings.emailButtonColor,
                        color: invoiceSettings.emailButtonTextColor,
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        marginTop: '20px'
                      }}
                    >
                      View Invoice
                    </button>
                  </div>
                  
                  <div 
                    className="email-footer"
                    style={{
                      backgroundColor: invoiceSettings.emailAccentColor,
                      color: invoiceSettings.emailButtonTextColor,
                      padding: '15px 20px',
                      fontSize: '12px',
                      textAlign: 'center'
                    }}
                  >
                    This email was sent from Your Company's invoice system.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="settings-section">
            <h3 className="section-title">Automation Settings</h3>
            <p className="section-description">Configure automatic invoice sending and reminders</p>
            
            <div className="form-grid">
              <div className="form-group full-width">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="autoSendInvoices"
                    name="autoSendInvoices"
                    checked={invoiceSettings.autoSendInvoices}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="autoSendInvoices">
                    Automatically send invoices when created
                  </label>
                </div>
              </div>
              
              <div className="form-group full-width">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="sendReminders"
                    name="sendReminders"
                    checked={invoiceSettings.sendReminders}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="sendReminders">
                    Send payment reminders
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="settings-footer">
        <button 
          className="btn btn-primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </button>
        <button className="btn btn-outline-secondary ml-3">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default InvoiceSettings;
