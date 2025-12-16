/**
 * Encryption Utility
 * Handles encryption of sensitive data for API responses
 */

const CryptoJS = require('crypto-js');

// Encryption key - should be stored in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'timepulse-default-encryption-key-2024';

/**
 * Encrypt data using AES encryption
 * @param {Object|String} data - Data to encrypt
 * @returns {String} - Encrypted string
 */
function encryptData(data) {
  try {
    // Convert data to JSON string if it's an object
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Encrypt using AES
    const encrypted = CryptoJS.AES.encrypt(dataString, ENCRYPTION_KEY).toString();
    
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Encrypt response data for authentication and OAuth endpoints
 * @param {Object} responseData - Response data object
 * @returns {Object} - Object with encrypted data
 */
function encryptAuthResponse(responseData) {
  try {
    // Encrypt the entire response data
    const encryptedData = encryptData(responseData);
    
    return {
      encrypted: true,
      data: encryptedData
    };
  } catch (error) {
    console.error('Auth response encryption error:', error);
    throw new Error('Failed to encrypt authentication response');
  }
}

/**
 * Decrypt data using AES decryption (for testing purposes)
 * @param {String} encryptedData - Encrypted string
 * @returns {Object|String} - Decrypted data
 */
function decryptData(encryptedData) {
  try {
    // Decrypt using AES
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
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

module.exports = {
  encryptData,
  encryptAuthResponse,
  decryptData
};
