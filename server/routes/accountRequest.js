/**
 * Account Request Routes
 * Handles user account creation requests and approval workflow
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { models } = require('../models');

const { AccountRequest, User, Tenant, Employee } = models;

  // =============================================
  // GET ROLES - Fetch available roles
  // =============================================
  router.get('/roles', async (req, res) => {
    try {
      const roles = [
        { value: 'employee', label: 'Employee' },
        { value: 'approver', label: 'Approver' },
        { value: 'manager', label: 'Manager' },
        { value: 'admin', label: 'Admin' },
        { value: 'hr', label: 'HR' },
        { value: 'accountant', label: 'Accountant' },
      ];

      console.log('📋 Fetched roles:', roles.length);
      res.json({ success: true, roles });
    } catch (error) {
      console.error('❌ Error fetching roles:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch roles' });
    }
  });

  // =============================================
  // GET APPROVERS - Fetch available approvers/admins
  // =============================================
  router.get('/approvers', async (req, res) => {
    try {
      const { tenantId } = req.query;

      let whereClause = {
        role: ['admin', 'approver', 'manager'],
        status: 'active',
        approvalStatus: 'approved',
      };

      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      const approvers = await User.findAll({
        where: whereClause,
        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'tenantId'],
        include: [
          {
            model: Tenant,
            as: 'tenant',
            attributes: ['id', 'tenantName', 'subdomain'],
          },
        ],
        order: [['firstName', 'ASC']],
      });

      const formattedApprovers = approvers.map((approver) => ({
        id: approver.id,
        name: `${approver.firstName} ${approver.lastName}`,
        email: approver.email,
        role: approver.role,
        tenantId: approver.tenantId,
        tenantName: approver.tenant?.tenantName || 'Unknown',
      }));

      console.log('👥 Fetched approvers:', formattedApprovers.length);
      res.json({ success: true, approvers: formattedApprovers });
    } catch (error) {
      console.error('❌ Error fetching approvers:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch approvers' });
    }
  });

  // =============================================
  // CREATE ACCOUNT REQUEST
  // =============================================
  router.post(
    '/create',
    [
      body('firstName').trim().notEmpty().withMessage('First name is required'),
      body('lastName').trim().notEmpty().withMessage('Last name is required'),
      body('email').isEmail().withMessage('Valid email is required'),
      body('phone').trim().notEmpty().withMessage('Phone number is required'),
      body('countryCode').trim().notEmpty().withMessage('Country code is required'),
      body('password')
        .trim()
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/(?=.*[a-z])/).withMessage('Password must contain at least one lowercase letter')
        .matches(/(?=.*[A-Z])/).withMessage('Password must contain at least one uppercase letter')
        .matches(/(?=.*\d)/).withMessage('Password must contain at least one number')
        .matches(/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/).withMessage('Password must contain at least one special character'),
      body('requestedRole').isIn(['admin', 'manager', 'approver', 'employee', 'accountant', 'hr']).withMessage('Valid role is required'),
      body('requestedApproverId').optional().isUUID().withMessage('Valid approver ID is required'),
    ],
    async (req, res) => {
      try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ success: false, errors: errors.array() });
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

        console.log('📝 Creating account request:', { email, requestedRole });

        // Check if email already exists in users
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
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
          return res.status(400).json({
            success: false,
            message: 'A pending account request already exists for this email',
          });
        }

        // Hash password before storing
        const passwordHash = await bcrypt.hash(password, 10);

        // Get approver details if provided
        let approver = null;
        let tenantId = null;
        if (requestedApproverId) {
          approver = await User.findOne({
            where: { id: requestedApproverId },
            include: [{ model: Tenant, as: 'tenant' }],
          });
          if (approver) {
            tenantId = approver.tenantId;
          }
        }

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
          companyName,
          department,
          tenantId,
          status: 'pending',
          metadata: {
            requestedAt: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          },
        });

        console.log('✅ Account request created:', accountRequest.id);

        // Create notification for the selected approver only
        try {
          if (requestedApproverId) {
            // Notify only the selected approver
            const selectedApprover = await User.findByPk(requestedApproverId, {
              attributes: ['id', 'firstName', 'lastName', 'email', 'tenantId'],
            });

            if (selectedApprover) {
              // Create notification in database
              const { Notification } = models;
              await Notification.create({
                userId: selectedApprover.id,
                tenantId: selectedApprover.tenantId,
                type: 'account_request',
                title: 'New Account Request',
                message: `${firstName} ${lastName} has requested an account with role: ${requestedRole}`,
                metadata: {
                  accountRequestId: accountRequest.id,
                  requesterEmail: email,
                  requesterName: `${firstName} ${lastName}`,
                  requestedRole: requestedRole,
                },
                priority: 'high',
                readAt: null,
              });

              console.log(`📬 Notification created for selected approver: ${selectedApprover.firstName} ${selectedApprover.lastName} (${selectedApprover.email})`);
              
              // Send WebSocket notification if available
              if (global.wsService) {
                global.wsService.sendNotification(selectedApprover.id, {
                  type: 'account_request',
                  title: 'New Account Request',
                  message: `${firstName} ${lastName} has requested an account`,
                  accountRequestId: accountRequest.id,
                });
                console.log(`🔔 WebSocket notification sent to approver`);
              }
            } else {
              console.log('⚠️ Selected approver not found');
            }
          } else {
            // If no specific approver selected, notify all admins
            const admins = await User.findAll({
              where: {
                role: 'admin',
                status: 'active',
                approvalStatus: 'approved',
              },
              attributes: ['id', 'firstName', 'lastName', 'email', 'tenantId'],
            });

            const { Notification } = models;
            for (const admin of admins) {
              await Notification.create({
                userId: admin.id,
                tenantId: admin.tenantId,
                type: 'account_request',
                title: 'New Account Request',
                message: `${firstName} ${lastName} has requested an account with role: ${requestedRole}`,
                metadata: {
                  accountRequestId: accountRequest.id,
                  requesterEmail: email,
                  requesterName: `${firstName} ${lastName}`,
                  requestedRole: requestedRole,
                },
                priority: 'high',
                readAt: null,
              });
            }

            console.log(`✅ Notified ${admins.length} admin(s)`);
          }
        } catch (notifError) {
          console.error('⚠️ Error creating notifications:', notifError);
          // Don't fail the request if notifications fail
        }

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
            approverName: approver ? `${approver.firstName} ${approver.lastName}` : null,
            tenantName: approver?.tenant?.tenantName || null,
          },
        });
      } catch (error) {
        console.error('❌ Error creating account request:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to create account request',
          error: error.message,
        });
      }
    }
  );

  // =============================================
  // GET ACCOUNT REQUEST BY ID
  // =============================================
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      console.log('🔍 [Account Request] Fetching request by ID:', id);

      const accountRequest = await AccountRequest.findByPk(id);

      if (!accountRequest) {
        console.log('❌ [Account Request] Request not found:', id);
        return res.status(404).json({
          success: false,
          message: 'Account request not found',
        });
      }

      console.log('✅ [Account Request] Found request:', {
        id: accountRequest.id,
        email: accountRequest.email,
        status: accountRequest.status,
      });

      res.json({
        success: true,
        request: {
          id: accountRequest.id,
          firstName: accountRequest.firstName,
          lastName: accountRequest.lastName,
          email: accountRequest.email,
          phone: accountRequest.phone,
          countryCode: accountRequest.countryCode,
          requestedRole: accountRequest.requestedRole,
          companyName: accountRequest.companyName,
          department: accountRequest.department,
          status: accountRequest.status,
          createdAt: accountRequest.createdAt,
          approvedAt: accountRequest.approvedAt,
          rejectedAt: accountRequest.rejectedAt,
          rejectionReason: accountRequest.rejectionReason,
        },
      });
    } catch (error) {
      console.error('❌ Error fetching account request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch account request',
        error: error.message,
      });
    }
  });

  // =============================================
  // CHECK REQUEST STATUS
  // =============================================
  router.get('/status/:email', async (req, res) => {
    try {
      const { email } = req.params;
      console.log('🔍 [Account Request] Checking status for:', email);

      const accountRequest = await AccountRequest.findOne({
        where: { email },
        order: [['created_at', 'DESC']], // Fixed: Use snake_case for database column
      });

      if (!accountRequest) {
        console.log('❌ [Account Request] No request found for:', email);
        return res.status(404).json({
          success: false,
          message: 'No account request found for this email',
        });
      }

      console.log('✅ [Account Request] Found request:', {
        id: accountRequest.id,
        status: accountRequest.status,
        requestedRole: accountRequest.requestedRole,
      });

      // Fetch approver details if requestedApproverId exists
      let approverName = null;
      if (accountRequest.requestedApproverId) {
        try {
          const approver = await User.findByPk(accountRequest.requestedApproverId, {
            attributes: ['id', 'firstName', 'lastName', 'email'],
          });
          if (approver) {
            approverName = `${approver.firstName} ${approver.lastName}`;
          }
        } catch (err) {
          console.error('⚠️ Error fetching approver:', err);
        }
      }

      // Fetch approved by details if approvedBy exists
      let approvedByName = null;
      if (accountRequest.approvedBy) {
        try {
          const approvedBy = await User.findByPk(accountRequest.approvedBy, {
            attributes: ['id', 'firstName', 'lastName', 'email'],
          });
          if (approvedBy) {
            approvedByName = `${approvedBy.firstName} ${approvedBy.lastName}`;
          }
        } catch (err) {
          console.error('⚠️ Error fetching approved by user:', err);
        }
      }

      res.json({
        success: true,
        request: {
          id: accountRequest.id,
          firstName: accountRequest.firstName,
          lastName: accountRequest.lastName,
          email: accountRequest.email,
          status: accountRequest.status,
          requestedRole: accountRequest.requestedRole,
          approverName: approverName,
          approvedBy: approvedByName,
          approvedAt: accountRequest.approvedAt,
          rejectedAt: accountRequest.rejectedAt,
          rejectionReason: accountRequest.rejectionReason,
          createdAt: accountRequest.createdAt,
        },
      });
    } catch (error) {
      console.error('❌ Error checking request status:', error);
      console.error('❌ Error stack:', error.stack); // Added detailed error logging
      res.status(500).json({
        success: false,
        message: 'Failed to check request status',
        error: error.message,
      });
    }
  });

  // =============================================
  // GET PENDING REQUESTS (Admin/Approver only)
  // =============================================
  router.get('/pending', async (req, res) => {
    try {
      console.log('📋 [Account Request] Fetching pending requests...');
      
      const pendingRequests = await AccountRequest.findAll({
        where: { status: 'pending' },
        order: [['createdAt', 'DESC']],
      });

      console.log(`✅ Found ${pendingRequests.length} pending requests`);

      // Fetch related data separately to avoid association errors
      const formattedRequests = await Promise.all(
        pendingRequests.map(async (request) => {
          let approverName = 'Not specified';
          let tenantName = 'Not assigned';

          // Fetch approver details if exists
          if (request.requestedApproverId) {
            try {
              const approver = await User.findByPk(request.requestedApproverId, {
                attributes: ['firstName', 'lastName'],
              });
              if (approver) {
                approverName = `${approver.firstName} ${approver.lastName}`;
              }
            } catch (err) {
              console.error('⚠️ Error fetching approver:', err);
            }
          }

          // Fetch tenant details if exists
          if (request.tenantId) {
            try {
              const tenant = await Tenant.findByPk(request.tenantId, {
                attributes: ['tenantName'],
              });
              if (tenant) {
                tenantName = tenant.tenantName;
              }
            } catch (err) {
              console.error('⚠️ Error fetching tenant:', err);
            }
          }

          return {
            id: request.id,
            name: `${request.firstName} ${request.lastName}`,
            firstName: request.firstName,
            lastName: request.lastName,
            email: request.email,
            phone: `${request.countryCode} ${request.phone}`,
            requestedRole: request.requestedRole,
            department: request.department,
            companyName: request.companyName,
            approverName: approverName,
            tenantName: tenantName,
            createdAt: request.createdAt,
          };
        })
      );

      res.json({
        success: true,
        requests: formattedRequests,
        count: formattedRequests.length,
      });
    } catch (error) {
      console.error('❌ Error fetching pending requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending requests',
      });
    }
  });

  // =============================================
  // APPROVE REQUEST (Admin/Approver only)
  // =============================================
  router.post('/approve/:requestId', async (req, res) => {
    try {
      const { requestId } = req.params;
      const { approverId, tenantId } = req.body;

      console.log('✅ Approving request:', requestId);

      const accountRequest = await AccountRequest.findByPk(requestId);
      if (!accountRequest) {
        return res.status(404).json({
          success: false,
          message: 'Account request not found',
        });
      }

      if (accountRequest.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Request has already been processed',
        });
      }

      // Use the password hash stored during account request creation
      const passwordHash = accountRequest.passwordHash;

      // Get or create tenant
      let tenant;
      if (tenantId) {
        tenant = await Tenant.findByPk(tenantId);
      } else if (accountRequest.companyName) {
        // Create new tenant
        const subdomain = accountRequest.companyName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 20);
        
        tenant = await Tenant.create({
          tenantName: accountRequest.companyName,
          legalName: accountRequest.companyName,
          subdomain: subdomain + '-' + Date.now().toString(36),
          status: 'active',
        });
      }

      // Create user account
      const newUser = await User.create({
        tenantId: tenant?.id || accountRequest.tenantId,
        firstName: accountRequest.firstName,
        lastName: accountRequest.lastName,
        email: accountRequest.email,
        passwordHash,
        role: accountRequest.requestedRole,
        department: accountRequest.department,
        status: 'active',
        approvalStatus: 'approved',
        approvedBy: approverId,
        approvedAt: new Date(),
        mustChangePassword: false,
      });

      // Create employee record if role is employee or approver
      if (['employee', 'approver'].includes(accountRequest.requestedRole)) {
        await Employee.create({
          tenantId: tenant?.id || accountRequest.tenantId,
          userId: newUser.id,
          firstName: accountRequest.firstName,
          lastName: accountRequest.lastName,
          email: accountRequest.email,
          phone: `${accountRequest.countryCode}${accountRequest.phone}`,
          department: accountRequest.department,
          status: 'active',
          approverId: accountRequest.requestedApproverId,
        });
      }

      // Update account request
      await accountRequest.update({
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date(),
        userId: newUser.id,
      });

      console.log('✅ Account approved and user created:', newUser.id);

      res.json({
        success: true,
        message: 'Account request approved successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
        },
      });
    } catch (error) {
      console.error('❌ Error approving request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve request',
        error: error.message,
      });
    }
  });

  // =============================================
  // REJECT REQUEST (Admin/Approver only)
  // =============================================
  router.post('/reject/:requestId', async (req, res) => {
    try {
      const { requestId } = req.params;
      const { rejectedBy, reason } = req.body;

      console.log('❌ Rejecting request:', requestId);

      const accountRequest = await AccountRequest.findByPk(requestId);
      if (!accountRequest) {
        return res.status(404).json({
          success: false,
          message: 'Account request not found',
        });
      }

      if (accountRequest.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Request has already been processed',
        });
      }

      await accountRequest.update({
        status: 'rejected',
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: reason,
      });

      console.log('✅ Account request rejected');

      res.json({
        success: true,
        message: 'Account request rejected',
      });
    } catch (error) {
      console.error('❌ Error rejecting request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject request',
      });
    }
  });

module.exports = router;
