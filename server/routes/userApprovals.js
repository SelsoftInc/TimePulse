/**
 * User Approval Routes
 * Handles admin approval/rejection of OAuth user registrations
 */

const express = require('express');
const router = express.Router();
const { models, sequelize } = require('../models');
const userApprovalEmailService = require('../services/UserApprovalEmailService');

/**
 * GET /api/user-approvals/pending
 * Get all pending user approvals for a tenant
 */
router.get('/pending', async (req, res) => {
  try {
    const { tenantId } = req.query;

    console.log('[User Approvals] Fetching pending users for tenant:', tenantId);

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    // Fetch pending users using Sequelize model field names
    const pendingUsers = await models.User.findAll({
      where: {
        tenantId: tenantId,
        approvalStatus: 'pending'
      },
      attributes: [
        'id',
        'firstName',
        'lastName',
        'email',
        'role',
        'department',
        'title',
        'authProvider',
        ['created_at', 'createdAt'],  // Map database column
        'approvalStatus'
      ],
      order: [['created_at', 'DESC']],  // Use database column name
      raw: true
    });

    console.log('[User Approvals] Found pending users:', pendingUsers.length);
    if (pendingUsers.length > 0) {
      console.log('[User Approvals] Pending users data:', JSON.stringify(pendingUsers, null, 2));
    } else {
      console.log('[User Approvals] No pending users found for tenant:', tenantId);
    }

    res.json({
      success: true,
      pendingUsers,
      count: pendingUsers.length
    });

  } catch (error) {
    console.error('[User Approvals] Error fetching pending users:', error.message);
    console.error('[User Approvals] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error fetching pending users',
      error: error.message
    });
  }
});

/**
 * POST /api/user-approvals/approve/:userId
 * Approve a pending user registration
 */
router.post('/approve/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { tenantId, adminId } = req.body;

    if (!tenantId || !adminId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID and Admin ID are required'
      });
    }

    // Find the pending user
    const user = await models.User.findOne({
      where: {
        id: userId,
        tenantId: tenantId,
        approvalStatus: 'pending'
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pending user not found'
      });
    }

    // Update user status to approved
    await user.update({
      approvalStatus: 'approved',
      status: 'active',
      approvedBy: adminId,
      approvedAt: new Date()
    });

    // Create notification for the approved user
    await models.Notification.create({
      tenantId: tenantId,
      userId: user.id,
      title: 'Registration Approved',
      message: 'Your registration has been approved! You can now login to TimePulse.',
      type: 'success',
      category: 'system',
      priority: 'high',
      actionUrl: '/login',
      metadata: {
        approvedBy: adminId,
        approvedAt: new Date()
      }
    });

    // Get admin and tenant info
    const admin = await models.User.findByPk(adminId);
    const tenant = await models.Tenant.findByPk(tenantId);

    console.log(`[User Approval] User ${user.email} approved by ${admin?.email}`);

    // Send approval email to user
    try {
      const loginLink = `${process.env.FRONTEND_URL || 'https://goggly-casteless-torri.ngrok-free.dev'}/login`;
      await userApprovalEmailService.sendUserApprovedEmail({
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role,
        approvedBy: admin ? `${admin.firstName} ${admin.lastName}` : 'Administrator',
        loginLink: loginLink,
        tenantName: tenant?.tenantName || 'TimePulse'
      });
      console.log(`[User Approval] Approval email sent to ${user.email}`);
    } catch (emailError) {
      console.error('[User Approval] Failed to send approval email:', emailError.message);
      // Continue even if email fails
    }

    res.json({
      success: true,
      message: 'User approved successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        approvalStatus: user.approvalStatus,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error approving user'
    });
  }
});

/**
 * POST /api/user-approvals/reject/:userId
 * Reject a pending user registration
 */
router.post('/reject/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { tenantId, adminId, reason } = req.body;

    if (!tenantId || !adminId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID and Admin ID are required'
      });
    }

    // Find the pending user
    const user = await models.User.findOne({
      where: {
        id: userId,
        tenantId: tenantId,
        approvalStatus: 'pending'
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pending user not found'
      });
    }

    // Update user status to rejected
    await user.update({
      approvalStatus: 'rejected',
      status: 'inactive',
      approvedBy: adminId,
      approvedAt: new Date(),
      rejectionReason: reason || 'Your registration was not approved.'
    });

    // Create notification for the rejected user
    await models.Notification.create({
      tenantId: tenantId,
      userId: user.id,
      title: 'Registration Rejected',
      message: reason || 'Your registration has been rejected by an administrator.',
      type: 'error',
      category: 'system',
      priority: 'high',
      metadata: {
        rejectedBy: adminId,
        rejectedAt: new Date(),
        reason: reason
      }
    });

    // Get admin and tenant info
    const admin = await models.User.findByPk(adminId);
    const tenant = await models.Tenant.findByPk(tenantId);

    console.log(`[User Approval] User ${user.email} rejected by ${admin?.email}`);

    // Send rejection email to user
    try {
      await userApprovalEmailService.sendUserRejectedEmail({
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        rejectionReason: reason || 'Your registration was not approved at this time.',
        rejectedBy: admin ? `${admin.firstName} ${admin.lastName}` : 'Administrator',
        tenantName: tenant?.tenantName || 'TimePulse'
      });
      console.log(`[User Approval] Rejection email sent to ${user.email}`);
    } catch (emailError) {
      console.error('[User Approval] Failed to send rejection email:', emailError.message);
      // Continue even if email fails
    }

    res.json({
      success: true,
      message: 'User rejected successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        approvalStatus: user.approvalStatus,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rejecting user'
    });
  }
});

/**
 * GET /api/user-approvals/history
 * Get approval history (approved and rejected users)
 */
router.get('/history', async (req, res) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    const users = await models.User.findAll({
      where: {
        tenantId: tenantId,
        approvalStatus: ['approved', 'rejected']
      },
      include: [{
        model: models.User,
        as: 'approver',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        required: false
      }],
      attributes: [
        'id',
        'firstName',
        'lastName',
        'email',
        'role',
        'authProvider',
        'approvalStatus',
        'approvedAt',
        'rejectionReason',
        'createdAt'
      ],
      order: [['approvedAt', 'DESC']]
    });

    res.json({
      success: true,
      users,
      count: users.length
    });

  } catch (error) {
    console.error('Error fetching approval history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching approval history'
    });
  }
});

module.exports = router;
