/**
 * Decryption Utility
 * Handles decryption of encrypted API responses
 */

import CryptoJS from 'crypto-js';

// Decryption key - must match the backend encryption key
const DECRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'timepulse-default-encryption-key-2024';

/**
 * Decrypt data using AES decryption
 * @param {String} encryptedData - Encrypted string
 * @returns {Object|String} - Decrypted data
 */
export function decryptData(encryptedData) {
  try {
    // Decrypt using AES
    const bytes = CryptoJS.AES.decrypt(encryptedData, DECRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      throw new Error('Decryption resulted in empty string');
    }
    
    // Try to parse as JSON, otherwise return as string
    try {
      return JSON.parse(decryptedString);
    } catch {
      return decryptedString;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Decrypt authentication response from API
 * @param {Object} response - Response object from API
 * @returns {Object} - Decrypted response data
 */
export function decryptAuthResponse(response) {
  try {
    // Check if response is encrypted
    if (response.encrypted && response.data) {
      console.log('[Decryption] Attempting to decrypt encrypted response...');
      const decryptedData = decryptData(response.data);
      console.log('[Decryption] Successfully decrypted response');
      return decryptedData;
    }
    
    // If not encrypted, return as is (for backward compatibility)
    console.log('[Decryption] Response is not encrypted, returning as-is');
    return response;
  } catch (error) {
    console.error('[Decryption] Auth response decryption error:', error);
    console.error('[Decryption] Error details:', error.message);
    // Return original response instead of throwing error (backward compatibility)
    console.log('[Decryption] Returning original response as fallback');
    return response;
  }
}

/**
 * Decrypt general API response (for employees, vendors, clients, etc.)
 * @param {Object} response - Response object from API
 * @returns {Object} - Decrypted response data
 */
export function decryptApiResponse(response) {
  try {
    // Check if response is encrypted
    if (response.encrypted && response.data) {
      const decryptedData = decryptData(response.data);
      return decryptedData;
    }
    
    // If not encrypted, return as is (for backward compatibility)
    return response;
  } catch (error) {
    console.error('API response decryption error:', error);
    // Return original response if decryption fails (backward compatibility)
    return response;
  }
}

/**
 * Encrypt data using AES encryption (for testing purposes)
 * @param {Object|String} data - Data to encrypt
 * @returns {String} - Encrypted string
 */
export function encryptData(data) {
  try {
    // Convert data to JSON string if it's an object
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Encrypt using AES
    const encrypted = CryptoJS.AES.encrypt(dataString, DECRYPTION_KEY).toString();
    
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}
