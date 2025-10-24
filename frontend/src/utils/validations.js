/**
 * Validation utilities for the TimePulse application
 */

// Phone number validation (exactly 10 digits)
export const validatePhoneNumber = (phone) => {
  if (!phone) {
    return { isValid: false, message: "Phone number is required" };
  }

  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, "");

  if (cleanPhone.length !== 10) {
    return { isValid: false, message: "Phone number must be exactly 10 digits" };
  }

  // Check if it's all the same digit (like 1111111111)
  if (/^(\d)\1{9}$/.test(cleanPhone)) {
    return { isValid: false, message: "Phone number cannot be all the same digits" };
  }

  return { isValid: true, message: "Valid phone number" };
};

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

// Zip code validation (exactly 5 digits)
export const validateZipCode = (zipCode) => {
  if (!zipCode) {
    return { isValid: false, message: "Zip code is required" };
  }

  const cleanZip = zipCode.replace(/\D/g, "");

  if (cleanZip.length !== 5) {
    return { isValid: false, message: "Zip code must be exactly 5 digits" };
  }

  return { isValid: true, message: "Valid zip code" };
};

// Email validation
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, message: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Please enter a valid email address" };
  }

  return { isValid: true, message: "Valid email" };
};

// Name validation (first name, last name, etc.)
export const validateName = (name, fieldName = "Name") => {
  if (!name) {
    return { isValid: false, message: `${fieldName} is required` };
  }

  if (name.trim().length < 2) {
    return { isValid: false, message: `${fieldName} must be at least 2 characters long` };
  }

  if (name.trim().length > 50) {
    return { isValid: false, message: `${fieldName} must be less than 50 characters` };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes, numbers, periods, commas)
  if (!/^[a-zA-Z0-9\s\-'.,&]+$/.test(name.trim())) {
    return { isValid: false, message: `${fieldName} contains invalid characters` };
  }

  return { isValid: true, message: "Valid name" };
};

// Password validation
export const validatePassword = (password) => {
  if (!password) return { isValid: false, message: "Password is required" };

  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      message: "Password must be less than 128 characters",
    };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one number",
    };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one special character",
    };
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
      message: `Please enter a valid ${fieldName.toLowerCase()}`,
    };
  }

  // Check if date is not in the future (for certain validations)
  if (dateObj > new Date()) {
    return {
      isValid: false,
      message: `${fieldName} cannot be in the future`,
    };
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
      message: "Start date cannot be after end date",
    };
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
      message: `${fieldName} is required`,
    };
  }

  return { isValid: true, message: "Valid" };
};

// Number validation
export const validateNumber = (value, fieldName, min = null, max = null) => {
  if (value === null || value === undefined || value === "") {
    return {
      isValid: false,
      message: `${fieldName} is required`,
    };
  }

  const num = Number(value);

  if (isNaN(num)) {
    return {
      isValid: false,
      message: `${fieldName} must be a valid number`,
    };
  }

  if (min !== null && num < min) {
    return {
      isValid: false,
      message: `${fieldName} must be at least ${min}`,
    };
  }

  if (max !== null && num > max) {
    return {
      isValid: false,
      message: `${fieldName} must be at most ${max}`,
    };
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
      message: "Please enter a valid URL",
    };
  }
};

// Tax ID validation (SSN format: XXX-XX-XXXX)
export const validateTaxId = (taxId) => {
  if (!taxId) return { isValid: false, message: "Tax ID is required" };

  const cleanTaxId = taxId.replace(/\D/g, "");

  if (cleanTaxId.length !== 9) {
    return {
      isValid: false,
      message: "Tax ID must be 9 digits",
    };
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
