/**
 * Password Reset Routes
 * Handles password reset requests and password changes
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { models } = require('../models');
const { sendPasswordResetEmail } = require('../utils/emailService');

const { User, Tenant } = models;

/**
 * Request password reset
 * POST /api/password-reset/request
 */
router.post('/request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log('🔐 Password reset requested for:', email);

    // Find user by email (across all tenants)
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Tenant,
        as: 'tenant',
        attributes: ['id', 'tenantName', 'subdomain']
      }]
    });

    // Always return success to prevent email enumeration
    if (!user) {
      console.log('⚠️ User not found for email:', email);
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Token expires in 1 hour
    const resetPasswordExpires = new Date(Date.now() + 3600000);

    // Save token to database
    await user.update({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: resetPasswordExpires
    });

    console.log('✅ Reset token generated for user:', user.id);

    // Get tenant information
    const companyName = user.tenant ? user.tenant.tenantName : 'Your Company';
    const subdomain = user.tenant ? user.tenant.subdomain : 'selsoft';
    
    // Construct reset URL
    const resetUrl = `${process.env.APP_URL || 'https://goggly-casteless-torri.ngrok-free.dev'}/reset-password`;

    // Send password reset email
    try {
      await sendPasswordResetEmail({
        to: user.email,
        employeeName: `${user.firstName} ${user.lastName}`,
        resetToken: resetToken,
        companyName: companyName,
        resetUrl: resetUrl
      });
      console.log('✅ Password reset email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('❌ Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    });
  }
});

/**
 * Verify reset token
 * POST /api/password-reset/verify-token
 */
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    // Hash the token to compare with database
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      where: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      email: user.email
    });
  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    });
  }
});

/**
 * Reset password with token
 * POST /api/password-reset/reset
 */
router.post('/reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Hash the token to compare with database
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      where: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    console.log('🔐 Resetting password for user:', user.id);

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    await user.update({
      passwordHash: passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      mustChangePassword: false // Clear the flag since they're setting a new password
    });

    console.log('✅ Password reset successfully for user:', user.id);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    });
  }
});

/**
 * Change password (for logged-in users with temporary password)
 * POST /api/password-reset/change-password
 * Requires authentication
 */
router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'User ID, current password, and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Find user
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    console.log('🔐 Changing password for user:', user.id);

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await user.update({
      passwordHash: passwordHash,
      mustChangePassword: false // Clear the flag
    });

    console.log('✅ Password changed successfully for user:', user.id);

    res.json({
      success: true,
      message: 'Password has been changed successfully.'
    });
  } catch (error) {
    console.error('❌ Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    });
  }
});

module.exports = router;
