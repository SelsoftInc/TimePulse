import React, { useState } from 'react';

const TimeRegion = () => {
  const [timeSettings, setTimeSettings] = useState({
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    firstDayOfWeek: 'sunday',
    language: 'en-US',
    currency: 'USD',
    currencySymbolPosition: 'before'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTimeSettings({
      ...timeSettings,
      [name]: value
    });
  };

  const handleSave = () => {
    // Save time and region settings to backend
    console.log('Saving time and region settings:', timeSettings);
    // API call would go here
    alert('Time and region settings saved successfully!');
  };

  // Common timezones for dropdown
  const timezones = [
    { value: 'America/New_York', label: '(UTC-05:00) Eastern Time (US & Canada)' },
    { value: 'America/Chicago', label: '(UTC-06:00) Central Time (US & Canada)' },
    { value: 'America/Denver', label: '(UTC-07:00) Mountain Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time (US & Canada)' },
    { value: 'America/Anchorage', label: '(UTC-09:00) Alaska' },
    { value: 'Pacific/Honolulu', label: '(UTC-10:00) Hawaii' },
    { value: 'Europe/London', label: '(UTC+00:00) London, Edinburgh, Dublin' },
    { value: 'Europe/Paris', label: '(UTC+01:00) Paris, Madrid, Rome, Berlin' },
    { value: 'Asia/Tokyo', label: '(UTC+09:00) Tokyo, Osaka' },
    { value: 'Australia/Sydney', label: '(UTC+10:00) Sydney, Melbourne' }
  ];

  // Date format options
  const dateFormats = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g., 12/31/2025)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g., 31/12/2025)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g., 2025-12-31)' },
    { value: 'MMM D, YYYY', label: 'MMM D, YYYY (e.g., Dec 31, 2025)' },
    { value: 'D MMM YYYY', label: 'D MMM YYYY (e.g., 31 Dec 2025)' }
  ];

  // Language options
  const languages = [
    { value: 'en-US', label: 'English (United States)' },
    { value: 'en-GB', label: 'English (United Kingdom)' },
    { value: 'es-ES', label: 'Spanish (Spain)' },
    { value: 'fr-FR', label: 'French (France)' },
    { value: 'de-DE', label: 'German (Germany)' },
    { value: 'it-IT', label: 'Italian (Italy)' },
    { value: 'ja-JP', label: 'Japanese (Japan)' },
    { value: 'zh-CN', label: 'Chinese (Simplified)' }
  ];

  // Currency options
  const currencies = [
    { value: 'USD', label: 'USD - US Dollar ($)' },
    { value: 'EUR', label: 'EUR - Euro (€)' },
    { value: 'GBP', label: 'GBP - British Pound (£)' },
    { value: 'CAD', label: 'CAD - Canadian Dollar (C$)' },
    { value: 'AUD', label: 'AUD - Australian Dollar (A$)' },
    { value: 'JPY', label: 'JPY - Japanese Yen (¥)' },
    { value: 'INR', label: 'INR - Indian Rupee (₹)' },
    { value: 'CNY', label: 'CNY - Chinese Yuan (¥)' }
  ];

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Time & Region</h3>
      
      <div className="form-group">
        <label className="form-label" htmlFor="timezone">Time Zone</label>
        <select
          className="form-select"
          id="timezone"
          name="timezone"
          value={timeSettings.timezone}
          onChange={handleInputChange}
        >
          {timezones.map(tz => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="dateFormat">Date Format</label>
          <select
            className="form-select"
            id="dateFormat"
            name="dateFormat"
            value={timeSettings.dateFormat}
            onChange={handleInputChange}
          >
            {dateFormats.map(format => (
              <option key={format.value} value={format.value}>{format.label}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="timeFormat">Time Format</label>
          <select
            className="form-select"
            id="timeFormat"
            name="timeFormat"
            value={timeSettings.timeFormat}
            onChange={handleInputChange}
          >
            <option value="12h">12-hour (e.g., 2:30 PM)</option>
            <option value="24h">24-hour (e.g., 14:30)</option>
          </select>
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label" htmlFor="firstDayOfWeek">First Day of Week</label>
        <select
          className="form-select"
          id="firstDayOfWeek"
          name="firstDayOfWeek"
          value={timeSettings.firstDayOfWeek}
          onChange={handleInputChange}
        >
          <option value="sunday">Sunday</option>
          <option value="monday">Monday</option>
          <option value="saturday">Saturday</option>
        </select>
      </div>
      
      <div className="form-group">
        <label className="form-label" htmlFor="language">Language</label>
        <select
          className="form-select"
          id="language"
          name="language"
          value={timeSettings.language}
          onChange={handleInputChange}
        >
          {languages.map(lang => (
            <option key={lang.value} value={lang.value}>{lang.label}</option>
          ))}
        </select>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="currency">Currency</label>
          <select
            className="form-select"
            id="currency"
            name="currency"
            value={timeSettings.currency}
            onChange={handleInputChange}
          >
            {currencies.map(curr => (
              <option key={curr.value} value={curr.value}>{curr.label}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="currencySymbolPosition">Currency Symbol Position</label>
          <select
            className="form-select"
            id="currencySymbolPosition"
            name="currencySymbolPosition"
            value={timeSettings.currencySymbolPosition}
            onChange={handleInputChange}
          >
            <option value="before">Before amount ($100.00)</option>
            <option value="after">After amount (100.00$)</option>
          </select>
        </div>
      </div>
      
      <div className="button-group">
        <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        <button className="btn btn-outline-light">Cancel</button>
      </div>
    </div>
  );
};

export default TimeRegion;
