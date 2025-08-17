// Centralized lookups for countries, states, tax ID labels/placeholders and payment terms

export const COUNTRY_OPTIONS = [
  'United States',
  'India',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'Singapore',
  'United Arab Emirates'
];

export const STATES_BY_COUNTRY = {
  'United States': [
    'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'
  ],
  'India': [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'
  ],
  'Canada': [
    'Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Northwest Territories','Nova Scotia','Nunavut','Ontario','Prince Edward Island','Quebec','Saskatchewan','Yukon'
  ],
  'United Kingdom': [
    'England','Scotland','Wales','Northern Ireland'
  ],
  'Australia': [
    'Australian Capital Territory','New South Wales','Northern Territory','Queensland','South Australia','Tasmania','Victoria','Western Australia'
  ]
};

export const TAX_ID_LABELS = {
  'United States': 'Tax ID / EIN',
  'India': 'GSTIN',
  'United Kingdom': 'VAT Number',
  'Canada': 'GST/HST Number (or BN)',
  'Australia': 'ABN',
  'Germany': 'USt-IdNr',
  'Singapore': 'UEN',
  'United Arab Emirates': 'TRN'
};

export const TAX_ID_PLACEHOLDERS = {
  'United States': 'Enter Tax ID or EIN',
  'India': 'Enter GSTIN',
  'United Kingdom': 'Enter VAT Number',
  'Canada': 'Enter GST/HST Number or BN',
  'Australia': 'Enter ABN',
  'Germany': 'Enter USt-IdNr',
  'Singapore': 'Enter UEN',
  'United Arab Emirates': 'Enter TRN'
};

export const getPostalLabel = (country) => {
  if (country === 'India') return 'PIN Code';
  if (country === 'United States') return 'ZIP Code';
  return 'Postal Code';
};

export const getPostalPlaceholder = (country) => {
  if (country === 'India') return 'Enter PIN code';
  if (country === 'United States') return 'Enter ZIP code';
  return 'Enter postal code';
};

// Standard payment terms used across the app
export const PAYMENT_TERMS_OPTIONS = [
  { value: 'net30', label: 'Net 30' },
  { value: 'net60', label: 'Net 60' },
  { value: 'net90', label: 'Net 90' }
];

// Basic tax id validation per country
export function validateCountryTaxId(country, value) {
  if (!value) return null; // optional here; enforce if needed elsewhere
  const v = value.trim();
  switch (country) {
    case 'India': {
      // GSTIN: 15 chars: 2 digits, 5 letters, 4 digits, 1 letter, 1 alnum, 'Z', 1 alnum
      const re = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
      return re.test(v) ? null : 'Invalid GSTIN format (expected 15 characters).';
    }
    case 'United States': {
      // EIN: 9 digits, may include hyphen after first two
      const re = /^(?:\d{2}-?\d{7})$/;
      return re.test(v) ? null : 'Invalid EIN format (expected 9 digits, e.g., 12-3456789).';
    }
    case 'United Kingdom': {
      // VAT numbers vary; provide very light check (7-12 alphanumerics)
      const re = /^[A-Za-z0-9]{7,12}$/;
      return re.test(v) ? null : 'Invalid VAT number format.';
    }
    case 'Australia': {
      // ABN: 11 digits
      const re = /^\d{11}$/;
      return re.test(v) ? null : 'Invalid ABN format (expected 11 digits).';
    }
    default:
      return null;
  }
}
