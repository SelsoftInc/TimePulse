/**
 * Validation utilities for the TimePulse application
 */

// --- Phone ---
// Accepts:
// - Phone number with or without country code
// - If country provided, validates based on country-specific rules
export const validatePhoneNumber = (phone, country) => {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }

  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // If already in E.164 format
  const e164Pattern = /^\+[1-9]\d{1,14}$/;
  if (e164Pattern.test(cleaned)) {
    return { isValid: true };
  }
  
  // Validate digits only (for input without country code)
  const digitsOnly = cleaned.replace(/\D/g, '');
  
  if (!digitsOnly || digitsOnly.length === 0) {
    return { isValid: false, error: 'Phone number must contain digits' };
  }
  
  // Country-specific validation
  if (country) {
    const minLength = getPhoneMinLength(country);
    const maxLength = getPhoneMaxLength(country);
    
    if (digitsOnly.length < minLength) {
      return { isValid: false, error: `Phone number must be at least ${minLength} digits` };
    }
    
    if (digitsOnly.length > maxLength) {
      return { isValid: false, error: `Phone number must be at most ${maxLength} digits` };
    }
  } else {
    // Generic validation without country
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      return { isValid: false, error: 'Phone number must be between 7 and 15 digits' };
    }
  }
  
  return { isValid: true };
};

// Helper function to get minimum phone length
function getPhoneMinLength(country) {
  const minLengths = {
    'United States': 10,
    'India': 10,
    'Canada': 10,
    'United Kingdom': 10,
    'Australia': 9,
    'Germany': 10,
    'Singapore': 8,
    'United Arab Emirates': 9
  };
  return minLengths[country] || 7;
}

// Helper function to get maximum phone length
function getPhoneMaxLength(country) {
  const maxLengths = {
    'United States': 10,
    'India': 10,
    'Canada': 10,
    'United Kingdom': 11,
    'Australia': 9,
    'Germany': 11,
    'Singapore': 8,
    'United Arab Emirates': 9
  };
  return maxLengths[country] || 15;
}

// Format phone number for display (XXX) XXX-XXXX
export const formatPhoneNumber = (phone) => {
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length === 10) {
    return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(
      3,
      6
    )}-${cleanPhone.slice(6)}`;
  }
  return phone;
};

// --- Postal / ZIP ---
// Backward compatible signature: validateZipCode(zip) defaults to US
export const validateZipCode = (zipCode, country = 'United States') => {
  const value = String(zipCode || '').trim();

  // UAE typically has no postal code; allow empty
  if (country === 'United Arab Emirates') {
    if (!value) return { isValid: true, message: "Valid" };
    if (value.length > 20) return { isValid: false, message: "Postal code is too long" };
    return { isValid: true, message: "Valid" };
  }

  if (!value) {
    return { isValid: false, message: `${getPostalFieldLabel(country)} is required` };
  }

  switch (country) {
    case 'United States': {
      // 5 digits or ZIP+4 (12345-6789)
      if (!/^\d{5}(-\d{4})?$/.test(value)) {
        return { isValid: false, message: "ZIP Code must be 5 digits or 9 digits (e.g., 12345 or 12345-6789)" };
      }
      return { isValid: true, message: "Valid" };
    }
    case 'India': {
      if (!/^\d{6}$/.test(value)) {
        return { isValid: false, message: "PIN Code must be exactly 6 digits" };
      }
      return { isValid: true, message: "Valid" };
    }
    case 'Canada': {
      // A1A 1A1 (allow optional space)
      if (!/^[A-Za-z]\d[A-Za-z][ ]?\d[A-Za-z]\d$/.test(value)) {
        return { isValid: false, message: "Postal Code must be in format A1A 1A1" };
      }
      return { isValid: true, message: "Valid" };
    }
    case 'United Kingdom': {
      // Simplified UK postcode validation (covers common cases)
      if (!/^[A-Za-z]{1,2}\d[A-Za-z\d]?[ ]?\d[A-Za-z]{2}$/.test(value)) {
        return { isValid: false, message: "Postcode must be a valid UK format (e.g., SW1A 1AA)" };
      }
      return { isValid: true, message: "Valid" };
    }
    case 'Australia': {
      if (!/^\d{4}$/.test(value)) {
        return { isValid: false, message: "Postcode must be exactly 4 digits" };
      }
      return { isValid: true, message: "Valid" };
    }
    case 'Singapore': {
      if (!/^\d{6}$/.test(value)) {
        return { isValid: false, message: "Postal Code must be exactly 6 digits" };
      }
      return { isValid: true, message: "Valid" };
    }
    case 'Germany': {
      if (!/^\d{5}$/.test(value)) {
        return { isValid: false, message: "Postleitzahl must be exactly 5 digits" };
      }
      return { isValid: true, message: "Valid" };
    }
    default: {
      // Generic fallback: at least 3 chars
      if (value.length < 3) {
        return { isValid: false, message: `${getPostalFieldLabel(country)} is too short` };
      }
      return { isValid: true, message: "Valid" };
    }
  }
};

export const formatPostalInput = (raw, country = 'United States') => {
  const v = String(raw || '');
  if (country === 'United States') {
    const digits = v.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  if (country === 'India' || country === 'Singapore') {
    return v.replace(/\D/g, '').slice(0, 6);
  }
  if (country === 'Germany') {
    return v.replace(/\D/g, '').slice(0, 5);
  }
  if (country === 'Australia') {
    return v.replace(/\D/g, '').slice(0, 4);
  }
  if (country === 'Canada') {
    // Allow alphanumeric, format as A1A 1A1
    const compact = v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    if (compact.length <= 3) return compact;
    return `${compact.slice(0, 3)} ${compact.slice(3)}`;
  }
  if (country === 'United Kingdom') {
    // Keep alphanumeric and a single space
    return v.toUpperCase().replace(/[^A-Za-z0-9 ]/g, '').replace(/\s+/g, ' ').slice(0, 8);
  }
  if (country === 'United Arab Emirates') {
    return v.slice(0, 20);
  }
  return v.slice(0, 20);
};

// Email validation (layered basic syntax rules)
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, message: "Email is required" };
  }
  const value = String(email).trim();

  // Must contain exactly one @
  const parts = value.split('@');
  if (parts.length !== 2) {
    return { isValid: false, message: "Email must contain a single @" };
  }
  const [local, domain] = parts;
  if (!local || !domain) {
    return { isValid: false, message: "Email is invalid" };
  }
  // Local part rules
  if (local.startsWith('.') || local.endsWith('.')) {
    return { isValid: false, message: "Email local part cannot start or end with a period" };
  }
  if (local.includes('..')) {
    return { isValid: false, message: "Email local part cannot contain consecutive periods" };
  }
  // Allowed local chars (basic)
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) {
    return { isValid: false, message: "Email contains invalid characters" };
  }
  // Domain must contain a dot and TLD length >=2
  if (!/\./.test(domain)) {
    return { isValid: false, message: "Email domain must contain a period" };
  }
  const lastDot = domain.lastIndexOf('.');
  const tld = domain.slice(lastDot + 1);
  if (!tld || tld.length < 2) {
    return { isValid: false, message: "Email must have a valid top-level domain" };
  }
  // Domain allowed chars
  if (!/^[A-Za-z0-9.-]+$/.test(domain) || domain.includes('..') || domain.startsWith('-') || domain.endsWith('-')) {
    return { isValid: false, message: "Email domain is invalid" };
  }
  return { isValid: true, message: "Valid email" };
};

// Name validation (supports first/middle/last formats)
// Allowed: letters, numbers, spaces, hyphens, apostrophes, periods, commas
export const validateName = (value, fieldName = 'Name', options = {}) => {
  const { requireAtLeastTwoWords = false } = options;
  
  if (!value || typeof value !== 'string') {
    return { isValid: false, message: `${fieldName} is required` };
  }

  const trimmed = value.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, message: `${fieldName} cannot be empty` };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes, numbers, periods, commas)
  if (!/^[a-zA-Z0-9\s\-'.,]+$/.test(trimmed)) {
    return { isValid: false, message: `${fieldName} contains invalid characters` };
  }

  // Prevent consecutive spaces
  if (/\s{2,}/.test(trimmed)) {
    return { isValid: false, message: `${fieldName} cannot contain consecutive spaces` };
  }

  // Optional: require at least 2 words (e.g., full name)
  if (options.requireAtLeastTwoWords) {
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length < 2) {
      return { isValid: false, message: `${fieldName} must include first and last name` };
    }
  }

  return { isValid: true, message: "Valid name" };
};

function getPostalFieldLabel(country) {
  switch (country) {
    case 'United States':
      return 'ZIP Code';
    case 'India':
      return 'PIN Code';
    case 'Canada':
    case 'United Kingdom':
    case 'Australia':
    case 'Singapore':
    case 'Germany':
      return 'Postal Code';
    case 'United Arab Emirates':
      return 'Postal Code';
    default:
      return 'Postal Code';
  }
}

// Password validation
export const validatePassword = (password) => {
  if (!password) return { isValid: false, message: "Password is required" };

  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long"};
  }

  if (password.length > 128) {
    return {
      isValid: false,
      message: "Password must be less than 128 characters"};
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter"};
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter"};
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one number"};
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one special character"};
  }

  return { isValid: true, message: "Valid password" };
};

// Date validation
export const validateDate = (date, fieldName = "Date") => {
  if (!date) return { isValid: false, message: `${fieldName} is required` };

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return {
      isValid: false,
      message: `Please enter a valid ${fieldName.toLowerCase()}`};
  }

  // Check if date is not in the future (for certain validations)
  if (dateObj > new Date()) {
    return {
      isValid: false,
      message: `${fieldName} cannot be in the future`};
  }

  return { isValid: true, message: "Valid date" };
};

// Date range validation
export const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return {
      isValid: false,
      message: "Start date cannot be after end date"};
  }

  return { isValid: true, message: "Valid date range" };
};

// Weekend validation
export const validateWeekdays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const isWeekend = (date) => {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
  };

  if (isWeekend(start) || isWeekend(end)) {
    return { isValid: false, message: "Dates cannot be weekends (Saturday/Sunday)" };
  }

  // Check if any date in the range is a weekend
  let currentDate = new Date(start);
  while (currentDate <= end) {
    if (isWeekend(currentDate)) {
      return { isValid: false, message: "Date range cannot include weekends (Saturday/Sunday)" };
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { isValid: true, message: "Valid weekdays" };
};

// Required field validation
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return {
      isValid: false,
      message: `${fieldName} is required`};
  }

  return { isValid: true, message: "Valid" };
};

// Number validation
export const validateNumber = (value, fieldName, min = null, max = null) => {
  if (value === null || value === undefined || value === "") {
    return {
      isValid: false,
      message: `${fieldName} is required`};
  }

  const num = Number(value);

  if (isNaN(num)) {
    return {
      isValid: false,
      message: `${fieldName} must be a valid number`};
  }

  if (min !== null && num < min) {
    return {
      isValid: false,
      message: `${fieldName} must be at least ${min}`};
  }

  if (max !== null && num > max) {
    return {
      isValid: false,
      message: `${fieldName} must be at most ${max}`};
  }

  return { isValid: true, message: "Valid number" };
};

// URL validation
export const validateURL = (url, fieldName = "URL") => {
  if (!url) return { isValid: false, message: `${fieldName} is required` };

  try {
    new URL(url);
    return { isValid: true, message: "Valid URL" };
  } catch {
    return {
      isValid: false,
      message: "Please enter a valid URL"};
  }
};

// Tax ID validation (SSN format: XXX-XX-XXXX)
export const validateTaxId = (taxId) => {
  if (!taxId) return { isValid: false, message: "Tax ID is required" };

  const cleanTaxId = taxId.replace(/\D/g, "");

  if (cleanTaxId.length !== 9) {
    return {
      isValid: false,
      message: "Tax ID must be 9 digits"};
  }

  return { isValid: true, message: "Valid tax ID" };
};

// Format tax ID for display (XXX-XX-XXXX)
export const formatTaxId = (taxId) => {
  const cleanTaxId = taxId.replace(/\D/g, "");
  if (cleanTaxId.length === 9) {
    return `${cleanTaxId.slice(0, 3)}-${cleanTaxId.slice(
      3,
      5
    )}-${cleanTaxId.slice(5)}`;
  }
  return taxId;
};

// Generic form validation helper
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isValid = true;

  for (const [field, rules] of Object.entries(validationRules)) {
    const value = formData[field];

    for (const rule of rules) {
      const result = rule(value, field);
      if (!result.isValid) {
        errors[field] = result.message;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  }

  return { isValid, errors };
};
