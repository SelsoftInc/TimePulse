/**
 * Response Encryption Middleware
 * Automatically encrypts API responses for specified routes
 */

const { encryptAuthResponse } = require('../utils/encryption');

/**
 * Middleware to encrypt JSON responses
 * Usage: router.get('/endpoint', encryptResponse, (req, res) => { ... });
 */
function encryptResponse(req, res, next) {
  // Store the original json method
  const originalJson = res.json.bind(res);
  
  // Override the json method
  res.json = function(data) {
    // Only encrypt successful responses (not errors)
    if (data && !data.error && res.statusCode < 400) {
      const encryptedData = encryptAuthResponse(data);
      return originalJson(encryptedData);
    }
    // For errors, send as-is
    return originalJson(data);
  };
  
  next();
}

/**
 * Middleware to conditionally encrypt responses based on route pattern
 * Automatically applies to all routes in a router
 */
function autoEncryptResponses(req, res, next) {
  // Store the original json method
  const originalJson = res.json.bind(res);
  
  // Override the json method
  res.json = function(data) {
    // Skip encryption for error responses
    if (res.statusCode >= 400 || (data && data.error)) {
      return originalJson(data);
    }
    
    // Encrypt successful responses
    try {
      const encryptedData = encryptAuthResponse(data);
      return originalJson(encryptedData);
    } catch (error) {
      console.error('Response encryption error:', error);
      // Fallback to unencrypted response if encryption fails
      return originalJson(data);
    }
  };
  
  next();
}

/**
 * Helper function to send encrypted response
 * Usage: sendEncrypted(res, data);
 */
function sendEncrypted(res, data, statusCode = 200) {
  try {
    const encryptedData = encryptAuthResponse(data);
    return res.status(statusCode).json(encryptedData);
  } catch (error) {
    console.error('Failed to encrypt response:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = {
  encryptResponse,
  autoEncryptResponses,
  sendEncrypted
};
