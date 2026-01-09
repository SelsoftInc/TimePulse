// Shared validation and formatting utilities
// Uses libphonenumber-js if available for E.164 parsing

let libPhone;
try {
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  libPhone = require('libphonenumber-js');
} catch (e) {
  libPhone = null;
}

export const formatPhoneInput = (raw) => {
  const s = String(raw || '');
  if (s.trim().startsWith('+')) {
    const digits = s.replace(/[^\d+]/g, '');
    const plus = digits.startsWith('+') ? '+' : '';
    const d = digits.replace(/\D/g, '').slice(0, 15);
    return plus + d;
  }
  const d = s.replace(/\D/g, '');
  const area = d.slice(0, 3);
  const mid = d.slice(3, 6);
  const last = d.slice(6, 10);
  const extra = d.slice(10);
  let out = '';
  if (area) out = `(${area}`;
  if (area && area.length === 3) out += ')';
  if (mid) out += `${area ? ' ' : ''}${mid}`;
  if (last) out += `${mid ? '-' : ''}${last}`;
  if (extra) out += ` ${extra}`;
  return out;
};

export const validatePhoneDigits = (raw) => {
  const s = String(raw || '');
  const digits = s.startsWith('+') ? s.slice(1).replace(/\D/g, '') : s.replace(/\D/g, '');
  if (digits.length === 0) return 'Phone is required';
  if (digits.length < 10) return 'Enter at least 10 digits';
  if (digits.length > 15) return 'Enter no more than 15 digits';
  return '';
};

export const toE164 = (raw, defaultCountry = 'US') => {
  if (!raw) return '';
  if (!libPhone) {
    // Fallback: if starts with + and 10-15 digits, accept as-is; else digits only
    const s = String(raw);
    if (s.trim().startsWith('+')) return '+' + s.replace(/\D/g, '').slice(0, 15);
    const d = s.replace(/\D/g, '');
    if (!d) return '';
    return `+1${d}`; // naive fallback
  }
  try {
    const { parsePhoneNumberFromString } = libPhone;
    const phone = parsePhoneNumberFromString(String(raw), defaultCountry);
    if (phone && phone.isValid()) return phone.number; // E.164
  } catch (e) {
    // ignore
  }
  return '';
};

export const formatTaxIdInput = (raw) => {
  const d = (raw || '').replace(/\D/g, '').slice(0, 9);
  const part1 = d.slice(0, 2);
  const part2 = d.slice(2);
  if (!part1) return '';
  if (!part2) return part1;
  return `${part1}-${part2}`;
};

export const validateTaxId = (raw) => {
  if (!raw) return 'Tax ID is required';
  const compact = raw.replace(/\D/g, '');
  if (compact.length !== 9) return 'Tax ID must have 9 digits (e.g., 12-3456789)';
  const formattedOk = /^\d{2}-\d{7}$/.test(raw) || /^\d{9}$/.test(raw);
  if (!formattedOk) return 'Use NN-NNNNNNN or 9 digits';
  return '';
};

export const normalizeTaxId = (raw) => {
  if (!raw) return '';
  return raw.replace(/\D/g, '').slice(0, 9);
};
