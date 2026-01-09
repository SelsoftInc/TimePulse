/**
 * Python Engine Email Service Proxy
 * Integrates with Python FastAPI engine for sending emails via Gmail
 */

const axios = require('axios');

// Python engine base URL
const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000';

/**
 * Send notification email via Python engine
 * @param {Object} options - Email options
 * @param {string} options.toEmail - Recipient Email
 * @param {string} options.recipientName - Recipient's name
 * @param {string} options.subject - Email subject
 * @param {string} options.body - Email body content
 * @returns {Promise<Object>} Response with success status
 */
const sendNotificationEmail = async ({ toEmail, recipientName, subject, body }) => {
  try {
    console.log('📧 Sending notification email via Python engine:', {
      to: toEmail,
      subject
    });

    const response = await axios.post(
      `${PYTHON_ENGINE_URL}/api/v1/gmail/notification`,
      {
        to_email: toEmail,
        recipient_name: recipientName,
        subject: subject || 'TimePulse Notification',
        body: body
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    console.log('✅ Notification email sent successfully via Python engine');
    return {
      success: true,
      message: response.data.message,
      timestamp: response.data.timestamp
    };
  } catch (error) {
    console.error('❌ Error sending notification email via Python engine:', error.message);
    
    // Check if Python engine is not running
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️ Python engine is not running. Please start the engine at:', PYTHON_ENGINE_URL);
      return {
        success: false,
        message: 'Email service is currently unavailable. Please try again later.',
        error: 'Python engine not available'
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send notification email',
      error: error.message
    };
  }
};

/**
 * Send forgot password email via Python engine
 * @param {Object} options - Email options
 * @param {string} options.toEmail - Recipient Email
 * @param {string} options.recipientName - Recipient's name
 * @param {string} options.resetLink - Password reset link with token
 * @returns {Promise<Object>} Response with success status
 */
const sendForgotPasswordEmail = async ({ toEmail, recipientName, resetLink }) => {
  try {
    console.log('🔐 Sending forgot password email via Python engine:', {
      to: toEmail,
      resetLink: resetLink.substring(0, 50) + '...'
    });

    const response = await axios.post(
      `${PYTHON_ENGINE_URL}/api/v1/gmail/forgot-password`,
      {
        to_email: toEmail,
        recipient_name: recipientName,
        reset_link: resetLink
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    console.log('✅ Forgot password email sent successfully via Python engine');
    return {
      success: true,
      message: response.data.message,
      timestamp: response.data.timestamp
    };
  } catch (error) {
    console.error('❌ Error sending forgot password email via Python engine:', error.message);
    
    // Check if Python engine is not running
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️ Python engine is not running. Please start the engine at:', PYTHON_ENGINE_URL);
      return {
        success: false,
        message: 'Email service is currently unavailable. Please try again later.',
        error: 'Python engine not available'
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send password reset email',
      error: error.message
    };
  }
};

/**
 * Check if Python engine is available
 * @returns {Promise<boolean>} True if engine is available
 */
const checkEngineHealth = async () => {
  try {
    const response = await axios.get(`${PYTHON_ENGINE_URL}/health`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    console.error('⚠️ Python engine health check failed:', error.message);
    return false;
  }
};

module.exports = {
  sendNotificationEmail,
  sendForgotPasswordEmail,
  checkEngineHealth,
  PYTHON_ENGINE_URL
};
