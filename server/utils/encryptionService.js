/**
 * Encryption Service
 * Provides AES-256-GCM encryption/decryption for sensitive data
 * Used for encrypting Timesheet and Invoice data before storing in database
 */

const crypto = require('crypto');

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

class EncryptionService {
  constructor() {
    // Get encryption key from environment variable
    this.encryptionKey = process.env.ENCRYPTION_KEY;
    
    if (!this.encryptionKey) {
      console.warn('⚠️ ENCRYPTION_KEY not set in environment. Using default key (NOT SECURE FOR PRODUCTION)');
      // Default key for development only - should be replaced in production
      this.encryptionKey = 'default-encryption-key-change-in-production-32-chars-minimum';
    }
    
    // Derive a 32-byte key from the encryption key
    this.key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
  }

  /**
   * Encrypt a string value
   * @param {string} text - Plain text to encrypt
   * @returns {string} Encrypted text in format: iv:authTag:encryptedData
   */
  encrypt(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(IV_LENGTH);
      
      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
      
      // Encrypt the text
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get the auth tag
      const authTag = cipher.getAuthTag();
      
      // Return iv:authTag:encryptedData format
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('❌ Encryption error:', error.message);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt an encrypted string
   * @param {string} encryptedText - Encrypted text in format: iv:authTag:encryptedData
   * @returns {string} Decrypted plain text
   */
  decrypt(encryptedText) {
    if (!encryptedText || typeof encryptedText !== 'string') {
      return encryptedText;
    }

    try {
      // Split the encrypted text into components
      const parts = encryptedText.split(':');
      
      if (parts.length !== 3) {
        // If not in expected format, return as-is (might be unencrypted legacy data)
        console.warn('⚠️ Data not in encrypted format, returning as-is');
        return encryptedText;
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt the text
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('❌ Decryption error:', error.message);
      // Return original text if decryption fails (might be legacy unencrypted data)
      return encryptedText;
    }
  }

  /**
   * Encrypt an object's specified fields
   * @param {Object} obj - Object to encrypt
   * @param {Array<string>} fields - Array of field names to encrypt
   * @returns {Object} Object with encrypted fields
   */
  encryptObject(obj, fields) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const encrypted = { ...obj };
    
    for (const field of fields) {
      if (encrypted[field] !== null && encrypted[field] !== undefined) {
        if (typeof encrypted[field] === 'string') {
          encrypted[field] = this.encrypt(encrypted[field]);
        } else if (typeof encrypted[field] === 'object') {
          // For JSON objects, stringify then encrypt
          encrypted[field] = this.encrypt(JSON.stringify(encrypted[field]));
        }
      }
    }
    
    return encrypted;
  }

  /**
   * Decrypt an object's specified fields
   * @param {Object} obj - Object to decrypt
   * @param {Array<string>} fields - Array of field names to decrypt
   * @returns {Object} Object with decrypted fields
   */
  decryptObject(obj, fields) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const decrypted = { ...obj };
    
    for (const field of fields) {
      if (decrypted[field] !== null && decrypted[field] !== undefined) {
        const decryptedValue = this.decrypt(decrypted[field]);
        
        // Try to parse as JSON if it looks like JSON
        if (decryptedValue && typeof decryptedValue === 'string' && 
            (decryptedValue.startsWith('{') || decryptedValue.startsWith('['))) {
          try {
            decrypted[field] = JSON.parse(decryptedValue);
          } catch (e) {
            // If parsing fails, keep as string
            decrypted[field] = decryptedValue;
          }
        } else {
          decrypted[field] = decryptedValue;
        }
      }
    }
    
    return decrypted;
  }

  /**
   * Encrypt numeric values (convert to string, encrypt, then store)
   * @param {number} value - Numeric value to encrypt
   * @returns {string} Encrypted value
   */
  encryptNumber(value) {
    if (value === null || value === undefined) {
      return value;
    }
    return this.encrypt(String(value));
  }

  /**
   * Decrypt numeric values (decrypt, then convert back to number)
   * @param {string} encryptedValue - Encrypted numeric value
   * @returns {number} Decrypted numeric value
   */
  decryptNumber(encryptedValue) {
    if (!encryptedValue) {
      return encryptedValue;
    }
    const decrypted = this.decrypt(encryptedValue);
    return parseFloat(decrypted);
  }

  /**
   * Generate a secure random encryption key
   * @returns {string} Random encryption key
   */
  static generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Export singleton instance
module.exports = new EncryptionService();
