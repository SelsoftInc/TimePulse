// Country phone codes and validation rules
export const COUNTRY_PHONE_CODES = {
  'United States': {
    code: '+1',
    placeholder: '(555) 456-7890',
    minDigits: 10,
    maxDigits: 10,
    format: '(###) ###-####'
  },
  'India': {
    code: '+91',
    placeholder: '98765 43210',
    minDigits: 10,
    maxDigits: 10,
    format: '##### #####'
  },
  'Canada': {
    code: '+1',
    placeholder: '(555) 456-7890',
    minDigits: 10,
    maxDigits: 10,
    format: '(###) ###-####'
  },
  'United Kingdom': {
    code: '+44',
    placeholder: '7911 123456',
    minDigits: 10,
    maxDigits: 11,
    format: '#### ######'
  },
  'Australia': {
    code: '+61',
    placeholder: '412 345 678',
    minDigits: 9,
    maxDigits: 9,
    format: '### ### ###'
  },
  'Germany': {
    code: '+49',
    placeholder: '151 23456789',
    minDigits: 10,
    maxDigits: 11,
    format: '### ########'
  },
  'Singapore': {
    code: '+65',
    placeholder: '8123 4567',
    minDigits: 8,
    maxDigits: 8,
    format: '#### ####'
  },
  'United Arab Emirates': {
    code: '+971',
    placeholder: '50 123 4567',
    minDigits: 9,
    maxDigits: 9,
    format: '## ### ####'
  }
};

// Get country code for a country
export const getCountryCode = (country) => {
  return COUNTRY_PHONE_CODES[country]?.code || '+1';
};

// Get phone placeholder for a country
export const getPhonePlaceholder = (country) => {
  return COUNTRY_PHONE_CODES[country]?.placeholder || '(555) 456-7890';
};

// Validate phone number for a specific country
export const validatePhoneForCountry = (phone, country) => {
  if (!phone) return { isValid: false, message: 'Phone number is required' };
  
  const countryConfig = COUNTRY_PHONE_CODES[country];
  if (!countryConfig) {
    // Fallback validation
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return { isValid: false, message: 'Phone must have at least 10 digits' };
    if (digits.length > 15) return { isValid: false, message: 'Phone must have no more than 15 digits' };
    return { isValid: true, message: '' };
  }

  // Extract digits only
  const digits = phone.replace(/\D/g, '');
  
  // Check if it starts with country code
  const countryCodeDigits = countryConfig.code.replace(/\D/g, '');
  let phoneDigits = digits;
  
  if (digits.startsWith(countryCodeDigits)) {
    phoneDigits = digits.substring(countryCodeDigits.length);
  }

  if (phoneDigits.length < countryConfig.minDigits) {
    return { 
      isValid: false, 
      message: `Phone must have ${countryConfig.minDigits} digits for ${country}` 
    };
  }
  
  if (phoneDigits.length > countryConfig.maxDigits) {
    return { 
      isValid: false, 
      message: `Phone must have ${countryConfig.maxDigits} digits for ${country}` 
    };
  }

  return { isValid: true, message: '' };
};

// Format phone number with country code
export const formatPhoneWithCountryCode = (phone, country) => {
  if (!phone) return '';
  
  const countryCode = getCountryCode(country);
  const digits = phone.replace(/\D/g, '');
  const countryCodeDigits = countryCode.replace(/\D/g, '');
  
  // If phone is just country code or incomplete, return empty string
  if (digits === countryCodeDigits || digits.length < 10) {
    return '';
  }
  
  // If already has country code, return as is
  if (digits.startsWith(countryCodeDigits)) {
    return `${countryCode}${digits.substring(countryCodeDigits.length)}`;
  }
  
  // Add country code
  return `${countryCode}${digits}`;
};

// Extract phone number without country code for display
export const extractPhoneNumber = (phone, country) => {
  if (!phone) return '';
  
  const countryCode = getCountryCode(country);
  const countryCodeDigits = countryCode.replace(/\D/g, '');
  const digits = phone.replace(/\D/g, '');
  
  if (digits.startsWith(countryCodeDigits)) {
    return digits.substring(countryCodeDigits.length);
  }
  
  return digits;
};
