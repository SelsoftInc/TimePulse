/**
 * Account Request Routes - SIMPLIFIED VERSION
 * Handles user account creation requests with minimal complexity
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { models } = require('../models');

const { User, AccountRequest, Tenant, Notification, Employee } = models;

/**
 * POST /api/account-request/create
 * Create a new account request - SIMPLIFIED
 */
router.post(
  '/create',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('countryCode').trim().notEmpty().withMessage('Country code is required'),
    body('password')
      .trim()
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/(?=.*[a-z])/).withMessage('Password must contain at least one lowercase letter')
      .matches(/(?=.*[A-Z])/).withMessage('Password must contain at least one uppercase letter')
      .matches(/(?=.*\d)/).withMessage('Password must contain at least one number')
      .matches(/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/).withMessage('Password must contain at least one special character'),
    body('requestedRole').isIn(['admin', 'manager', 'approver', 'employee', 'accountant', 'hr']).withMessage('Valid role is required'),
  ],
  async (req, res) => {
    try {
      console.log('🚀 [Account Request] Received request');
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ [Account Request] Validation errors:', errors.array());
        return res.status(400).json({ 
          success: false, 
          errors: errors.array(),
          message: errors.array()[0].msg 
        });
      }

      const {
        firstName,
        lastName,
        email,
        phone,
        countryCode,
        password,
        requestedRole,
        requestedApproverId,
        companyName,
        department,
      } = req.body;

      console.log('📝 [Account Request] Creating for:', email, '| Role:', requestedRole);

      // Check if email already exists in users
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        console.log('❌ [Account Request] Email already exists:', email);
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }

      // Check if there's already a pending request
      const existingRequest = await AccountRequest.findOne({
        where: { email, status: 'pending' },
      });
      if (existingRequest) {
        console.log('❌ [Account Request] Pending request exists:', email);
        return res.status(400).json({
          success: false,
          message: 'A pending account request already exists for this email',
        });
      }

      console.log('🔐 [Account Request] Hashing password...');
      // Hash password before storing
      const passwordHash = await bcrypt.hash(password, 10);
      console.log('✅ [Account Request] Password hashed');

      // Get tenant ID if approver is provided
      let tenantId = null;
      if (requestedApproverId) {
        console.log('🔍 [Account Request] Looking up approver:', requestedApproverId);
        const approver = await User.findOne({
          where: { id: requestedApproverId },
          attributes: ['id', 'tenantId'],
        });
        if (approver) {
          tenantId = approver.tenantId;
          console.log('✅ [Account Request] Found approver, tenant:', tenantId);
        }
      }

      console.log('💾 [Account Request] Creating database record...');
      // Create account request
      const accountRequest = await AccountRequest.create({
        firstName,
        lastName,
        email,
        phone,
        countryCode,
        passwordHash,
        requestedRole,
        requestedApproverId: requestedApproverId || null,
        companyName: companyName || null,
        department: department || null,
        tenantId,
        status: 'pending',
        metadata: {
          requestedAt: new Date().toISOString(),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      console.log('✅ [Account Request] Created successfully:', accountRequest.id);

      // Create notification for selected approver only
      try {
        console.log('📢 [Account Request] Creating notification for selected approver...');
        
        if (requestedApproverId) {
          // Find the specific approver selected by the user
          const approver = await User.findOne({
            where: {
              id: requestedApproverId,
              status: 'active',
            },
            attributes: ['id', 'tenantId', 'firstName', 'lastName', 'email'],
          });

          if (approver) {
            console.log(`📢 [Account Request] Found selected approver: ${approver.email}`);

            const notification = await Notification.create({
              tenantId: approver.tenantId,
              userId: approver.id,
              title: 'New User Registration Pending Approval',
              message: `${firstName} ${lastName} (${email}) has registered as ${requestedRole} and is awaiting your approval.`,
              type: 'warning',
              category: 'approval',
              priority: 'high',
              actionUrl: '/admin/account-approvals',
              metadata: {
                accountRequestId: accountRequest.id,
                pendingUserEmail: email,
                pendingUserName: `${firstName} ${lastName}`,
                requestedRole: requestedRole,
                submittedAt: new Date().toISOString(),
              },
            });
            console.log(`✅ [Account Request] Notification created for approver: ${approver.email}`);
          } else {
            console.log('⚠️ [Account Request] Selected approver not found or inactive');
          }
        } else {
          console.log('⚠️ [Account Request] No approver selected, skipping notification');
        }
      } catch (notifError) {
        console.error('❌ [Account Request] Error creating notification:', notifError.message);
        // Don't fail the request if notification fails
      }

      // Send success response
      res.status(201).json({
        success: true,
        message: 'Account request submitted successfully',
        requestId: accountRequest.id,
        data: {
          id: accountRequest.id,
          firstName: accountRequest.firstName,
          lastName: accountRequest.lastName,
          email: accountRequest.email,
          status: accountRequest.status,
        },
      });

      console.log('📤 [Account Request] Response sent to client');

    } catch (error) {
      console.error('❌ [Account Request] Error:', error.message);
      console.error('❌ [Account Request] Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to create account request',
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/account-request/:id
 * Get account request details by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 [Account Request] Fetching request by ID:', id);

    const accountRequest = await AccountRequest.findOne({
      where: { id },
      attributes: {
        include: ['id', 'first_name', 'last_name', 'email', 'status', 'created_at', 'requested_role', 'company_name', 'department', 'phone', 'country_code']
      },
      raw: true,
    });

    if (!accountRequest) {
      console.log('❌ [Account Request] No request found for ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Account request not found',
      });
    }

    console.log('✅ [Account Request] Found request:', accountRequest);

    // Map database columns to camelCase for frontend
    const response = {
      id: accountRequest.id,
      firstName: accountRequest.first_name,
      lastName: accountRequest.last_name,
      email: accountRequest.email,
      status: accountRequest.status,
      createdAt: accountRequest.created_at,
      requestedRole: accountRequest.requested_role,
      companyName: accountRequest.company_name,
      department: accountRequest.department,
      phone: accountRequest.phone,
      countryCode: accountRequest.country_code,
    };

    res.json({
      success: true,
      request: response,
    });
  } catch (error) {
    console.error('❌ [Account Request] Fetch error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account request',
      error: error.message,
    });
  }
});

/**
 * GET /api/account-request/status/:email
 * Check status of account request
 */
router.get('/status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('🔍 [Account Request] Checking status for:', email);

    const accountRequest = await AccountRequest.findOne({
      where: { email },
      order: [['created_at', 'DESC']],
      attributes: {
        include: ['id', 'first_name', 'last_name', 'email', 'status', 'created_at', 'requested_role', 'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_reason']
      },
      raw: true,
    });

    if (!accountRequest) {
      console.log('❌ [Account Request] No request found for:', email);
      return res.status(404).json({
        success: false,
        message: 'No account request found for this email',
      });
    }

    console.log('✅ [Account Request] Found request:', accountRequest);

    // Map database columns to camelCase for frontend
    const response = {
      id: accountRequest.id,
      firstName: accountRequest.first_name,
      lastName: accountRequest.last_name,
      email: accountRequest.email,
      status: accountRequest.status,
      createdAt: accountRequest.created_at,
      requestedRole: accountRequest.requested_role,
      approvedBy: accountRequest.approved_by,
      approvedAt: accountRequest.approved_at,
      rejectedBy: accountRequest.rejected_by,
      rejectedAt: accountRequest.rejected_at,
      rejectionReason: accountRequest.rejection_reason,
    };

    res.json({
      success: true,
      request: response,
    });
  } catch (error) {
    console.error('❌ [Account Request] Status check error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to check request status',
      error: error.message,
    });
  }
});

/**
 * POST /api/account-request/approve/:id
 * Approve an account request
 */
router.post('/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, adminId } = req.body;

    console.log('✅ [Account Request] Approving request:', id);
    console.log('✅ [Account Request] Admin ID:', adminId);

    const accountRequest = await AccountRequest.findOne({
      where: { id, status: 'pending' }
    });

    if (!accountRequest) {
      return res.status(404).json({
        success: false,
        message: 'Account request not found or already processed'
      });
    }

    // Create user account
    const passwordHash = accountRequest.passwordHash;
    
    const newUser = await User.create({
      tenantId: tenantId,
      firstName: accountRequest.firstName,
      lastName: accountRequest.lastName,
      email: accountRequest.email,
      passwordHash: passwordHash,
      role: accountRequest.requestedRole,
      phone: accountRequest.phone,
      status: 'active',
      approvalStatus: 'approved',
    });

    console.log('✅ [Account Request] User created:', newUser.id);

    // Create Employee record for dashboard access
    try {
      const employee = await Employee.create({
        id: newUser.id, // Use same ID as user for consistency
        tenantId: tenantId,
        userId: newUser.id,
        firstName: accountRequest.firstName,
        lastName: accountRequest.lastName,
        email: accountRequest.email,
        phone: accountRequest.phone,
        department: accountRequest.department || 'General',
        title: accountRequest.requestedRole.charAt(0).toUpperCase() + accountRequest.requestedRole.slice(1),
        status: 'active',
        approverId: accountRequest.requestedApproverId,
      });
      console.log('✅ [Account Request] Employee record created:', employee.id);
    } catch (empError) {
      console.error('⚠️ [Account Request] Failed to create employee record:', empError.message);
      // Continue even if employee creation fails
    }

    // Update account request status
    await accountRequest.update({
      status: 'approved',
      approvedBy: adminId,
      approvedAt: new Date(),
      userId: newUser.id,
    });

    console.log('✅ [Account Request] User and employee created, request approved:', newUser.id);

    res.json({
      success: true,
      message: 'Account request approved successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: `${newUser.firstName} ${newUser.lastName}`,
      },
    });
  } catch (error) {
    console.error('❌ [Account Request] Approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve account request',
      error: error.message,
    });
  }
});

/**
 * POST /api/account-request/reject/:id
 * Reject an account request
 */
router.post('/reject/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, reason } = req.body;

    console.log('❌ [Account Request] Rejecting request:', id);
    console.log('❌ [Account Request] Admin ID:', adminId);
    console.log('❌ [Account Request] Reason:', reason);

    const accountRequest = await AccountRequest.findOne({
      where: { id, status: 'pending' }
    });

    if (!accountRequest) {
      return res.status(404).json({
        success: false,
        message: 'Account request not found or already processed'
      });
    }

    // Update account request status
    await accountRequest.update({
      status: 'rejected',
      rejectedBy: adminId,
      rejectedAt: new Date(),
      rejectionReason: reason,
    });

    console.log('✅ [Account Request] Request rejected:', id);

    res.json({
      success: true,
      message: 'Account request rejected successfully',
    });
  } catch (error) {
    console.error('❌ [Account Request] Rejection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject account request',
      error: error.message,
    });
  }
});

/**
 * GET /api/account-request/roles
 * Get available roles for account requests
 */
router.get('/roles', (req, res) => {
  res.json({
    success: true,
    roles: [
      { value: 'employee', label: 'Employee' },
      { value: 'manager', label: 'Manager' },
      { value: 'approver', label: 'Approver' },
      { value: 'hr', label: 'HR' },
      { value: 'accountant', label: 'Accountant' },
      { value: 'admin', label: 'Admin' },
    ],
  });
});

module.exports = router;
