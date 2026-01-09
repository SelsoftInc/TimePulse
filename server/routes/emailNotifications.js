/**
 * Email Notifications Routes
 * Handles sending notification emails via Python engine
 */

const express = require('express');
const router = express.Router();
const pythonEmailService = require('../services/pythonEmailService');
const { models } = require('../models');

const { User, Tenant } = models;

/**
 * Send notification email to a user
 * POST /api/email-notifications/send
 */
router.post('/send', async (req, res) => {
  try {
    const { userId, tenantId, subject, body } = req.body;

    if (!userId || !tenantId || !body) {
      return res.status(400).json({
        success: false,
        message: 'userId, tenantId, and body are required'
      });
    }

    console.log('📧 Sending notification email to user:', userId);

    // Find user
    const user = await User.findOne({
      where: { id: userId, tenantId },
      include: [{
        model: Tenant,
        as: 'tenant',
        attributes: ['id', 'tenantName', 'subdomain']
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Send notification email via Python engine
    const result = await pythonEmailService.sendNotificationEmail({
      toEmail: user.email,
      recipientName: `${user.firstName} ${user.lastName}`,
      subject: subject || 'TimePulse Notification',
      body: body
    });

    if (result.success) {
      console.log('✅ Notification email sent successfully to:', user.email);
      return res.json({
        success: true,
        message: 'Notification email sent successfully',
        timestamp: result.timestamp
      });
    } else {
      console.error('❌ Failed to send notification email:', result.message);
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to send notification email'
      });
    }
  } catch (error) {
    console.error('❌ Email notification error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while sending notification email'
    });
  }
});

/**
 * Send notification email to multiple users
 * POST /api/email-notifications/send-bulk
 */
router.post('/send-bulk', async (req, res) => {
  try {
    const { userIds, tenantId, subject, body } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !tenantId || !body) {
      return res.status(400).json({
        success: false,
        message: 'userIds (array), tenantId, and body are required'
      });
    }

    console.log('📧 Sending bulk notification emails to', userIds.length, 'users');

    // Find all users
    const users = await User.findAll({
      where: {
        id: userIds,
        tenantId
      },
      include: [{
        model: Tenant,
        as: 'tenant',
        attributes: ['id', 'tenantName', 'subdomain']
      }]
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No users found'
      });
    }

    // Send emails to all users
    const results = await Promise.allSettled(
      users.map(user =>
        pythonEmailService.sendNotificationEmail({
          toEmail: user.email,
          recipientName: `${user.firstName} ${user.lastName}`,
          subject: subject || 'TimePulse Notification',
          body: body
        })
      )
    );

    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`✅ Bulk email results: ${successful} sent, ${failed} failed`);

    res.json({
      success: true,
      message: `Sent ${successful} emails successfully, ${failed} failed`,
      details: {
        total: users.length,
        successful,
        failed
      }
    });
  } catch (error) {
    console.error('❌ Bulk email notification error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while sending bulk notification emails'
    });
  }
});

/**
 * Check Python engine health
 * GET /api/email-notifications/health
 */
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await pythonEmailService.checkEngineHealth();
    
    res.json({
      success: true,
      engineAvailable: isHealthy,
      engineUrl: pythonEmailService.PYTHON_ENGINE_URL,
      message: isHealthy 
        ? 'Python email engine is available' 
        : 'Python email engine is not available'
    });
  } catch (error) {
    console.error('❌ Engine health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check engine health'
    });
  }
});

module.exports = router;
