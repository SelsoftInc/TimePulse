/**
 * OAuth Authentication Routes
 * Handles Google OAuth user registration and onboarding
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { models, sequelize } = require('../models');
const { encryptAuthResponse } = require('../utils/encryption');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * POST /api/oauth/check-user
 * Check if a Google OAuth user exists in the system
 */
router.post('/check-user', async (req, res) => {
  try {
    const { email, googleId } = req.body;
    
    console.log('[OAuth Check-User] Received request for email:', email);
    console.log('[OAuth Check-User] Google ID:', googleId);

    if (!email) {
      console.log('[OAuth Check-User] ERROR: Email is missing');
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    console.log('[OAuth Check-User] Searching for user with email:', email.toLowerCase());
    const user = await models.User.findOne({
      where: { email: email.toLowerCase() },
      include: [{
        model: models.Tenant,
        as: 'tenant'
      }]
    });

    if (!user) {
      // User doesn't exist - needs onboarding
      console.log('[OAuth Check-User] User NOT found - needs onboarding');
      return res.json({
        success: true,
        exists: false,
        needsOnboarding: true,
        email: email
      });
    }
    
    console.log('[OAuth Check-User] User FOUND:', {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      approvalStatus: user.approval_status || user.approvalStatus
    });

    // User exists - check approval status (if column exists)
    const approvalStatus = user.approval_status || user.approvalStatus;
    if (approvalStatus) {
      if (approvalStatus === 'pending') {
        return res.status(403).json({
          success: false,
          isPending: true,
          message: 'Your registration is pending admin approval',
          user: {
            id: user.id,
            firstName: user.firstName || user.first_name,
            lastName: user.lastName || user.last_name,
            email: user.email,
            approvalStatus: approvalStatus
          }
        });
      }

      if (approvalStatus === 'rejected') {
        return res.status(403).json({
          success: false,
          isRejected: true,
          message: 'Your registration has been rejected',
          user: {
            id: user.id,
            email: user.email,
            approvalStatus: approvalStatus,
            rejectionReason: user.rejection_reason || user.rejectionReason
          }
        });
      }
    }

    // User exists - check if active
    if (user.status !== 'active') {
      console.log('[OAuth Check-User] User is not active, status:', user.status);
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Get tenant ID
    const tenantId = user.tenant_id || user.tenantId;
    console.log('[OAuth Check-User] User tenant ID:', tenantId);
    
    if (!tenantId) {
      console.log('[OAuth Check-User] ERROR: User has no tenant ID');
      return res.status(500).json({
        success: false,
        message: 'User account is not properly configured (missing tenant)'
      });
    }

    // Find or create employee record for all users (admin, employee, approver)
    let employeeId = null;
    console.log('[OAuth Check-User] Looking for employee record...');
    let employee;
    try {
      employee = await models.Employee.findOne({
        where: {
          email: user.email,
          tenantId: tenantId
        },
        attributes: ['id', 'email', 'firstName', 'lastName', 'tenantId', 'status']
      });
    } catch (empFindError) {
      console.error('[OAuth Check-User] Error finding employee:', empFindError.message);
      // Continue without employee record
      employee = null;
    }
    
    // If employee record doesn't exist, create one
    if (!employee) {
      console.log('[OAuth Check-User] Employee record not found, creating one for user:', user.email);
      
      try {
        // Determine title based on role
        let title = 'Employee';
        if (user.role === 'admin') {
          title = 'Administrator';
        } else if (user.role === 'approver') {
          title = 'Manager';
        }
        
        // Create employee with only essential fields
        employee = await models.Employee.create({
          tenantId: tenantId,
          firstName: user.firstName || user.first_name,
          lastName: user.lastName || user.last_name,
          email: user.email,
          department: 'General',
          title: title,
          status: 'active',
          userId: user.id
        });
        console.log('[OAuth Check-User] Employee record created:', employee.id);
      } catch (empError) {
        console.error('[OAuth Check-User] Error creating employee:', empError.message);
        console.error('[OAuth Check-User] Employee creation error details:', empError);
        // Continue without employee record - not critical for OAuth login
        employeeId = null;
      }
    }
    
    if (employee) {
      employeeId = employee.id;
      console.log('[OAuth Check-User] Employee ID:', employeeId);
    } else {
      console.log('[OAuth Check-User] No employee record available');
    }

    // Generate JWT token
    console.log('[OAuth Check-User] Generating JWT token...');
    let token;
    try {
      token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          tenantId: tenantId
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      console.log('[OAuth Check-User] JWT token generated successfully');
    } catch (jwtError) {
      console.error('[OAuth Check-User] Error generating JWT:', jwtError.message);
      throw new Error('Failed to generate authentication token');
    }

    // Update last login
    try {
      await user.update({ lastLogin: new Date() });
      console.log('[OAuth Check-User] Last login updated');
    } catch (updateError) {
      console.error('[OAuth Check-User] Error updating last login:', updateError.message);
      // Non-critical, continue
    }

    // Prepare response data
    const responseData = {
      success: true,
      exists: true,
      needsOnboarding: false,
      token,
      user: {
        id: user.id,
        firstName: user.firstName || user.first_name,
        lastName: user.lastName || user.last_name,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id || user.tenantId,
        employeeId: employeeId,
        status: user.status
      },
      tenant: user.tenant ? {
        id: user.tenant.id,
        tenantName: user.tenant.tenant_name || user.tenant.tenantName,
        subdomain: user.tenant.subdomain,
        status: user.tenant.status
      } : null
    };

    console.log('[OAuth Check-User] ✅ Returning success response for existing user');
    console.log('[OAuth Check-User] Response data:', {
      exists: responseData.exists,
      needsOnboarding: responseData.needsOnboarding,
      hasToken: !!responseData.token,
      hasUser: !!responseData.user,
      hasTenant: !!responseData.tenant,
      userRole: responseData.user.role,
      tenantSubdomain: responseData.tenant?.subdomain
    });

    // Return response (encryption is optional)
    // Try to encrypt, but if it fails, send unencrypted for backward compatibility
    try {
      const encryptedResponse = encryptAuthResponse(responseData);
      console.log('[OAuth Check-User] Response encrypted and ready to send');
      return res.json(encryptedResponse);
    } catch (encryptError) {
      console.error('[OAuth Check-User] Error encrypting response:', encryptError.message);
      // Send unencrypted response as fallback
      console.log('[OAuth Check-User] Sending unencrypted response as fallback');
      return res.json(responseData);
    }

  } catch (error) {
    console.error('[OAuth Check-User] ❌ ERROR:', error.message);
    console.error('[OAuth Check-User] Error stack:', error.stack);
    console.error('[OAuth Check-User] Full error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      needsOnboarding: false // Don't redirect to onboarding on server error
    });
  }
});

/**
 * POST /api/oauth/register
 * Register a new user from Google OAuth with onboarding data
 */
router.post('/register', async (req, res) => {
  try {
    console.log('[OAuth Register] Received request body:', req.body);
    
    const {
      email,
      googleId,
      firstName,
      lastName,
      role,
      companyName,
      phoneNumber,
      department
    } = req.body;

    console.log('[OAuth Register] Parsed fields:', {
      email,
      googleId,
      firstName,
      lastName,
      role,
      companyName,
      phoneNumber,
      department
    });

    // Validate required fields
    if (!email || !firstName || !lastName || !role) {
      console.log('[OAuth Register] Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Email, first name, last name, and role are required'
      });
    }

    // Validate role
    const validRoles = ['admin', 'employee', 'approver'];
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin, employee, or approver'
      });
    }

    // Check if user already exists
    const existingUser = await models.User.findOne({
      where: { email: email.toLowerCase() },
      include: [{
        model: models.Tenant,
        as: 'tenant'
      }]
    });

    if (existingUser) {
      console.log('[OAuth Register] User already exists:', email);
      
      // Check if user is active
      if (existingUser.status === 'active') {
        // User exists and is active - they should login instead
        return res.status(409).json({
          success: false,
          userExists: true,
          shouldLogin: true,
          message: 'An account with this email already exists. Please use the login page to sign in.',
          email: email
        });
      } else if (existingUser.approvalStatus === 'pending') {
        // User exists but pending approval
        return res.status(409).json({
          success: false,
          userExists: true,
          isPending: true,
          message: 'Your registration is already pending admin approval.',
          email: email
        });
      } else {
        // User exists but inactive or rejected
        return res.status(409).json({
          success: false,
          userExists: true,
          message: 'An account with this email already exists but is not active. Please contact support.',
          email: email
        });
      }
    }

    // Find existing tenant by email domain
    // OAuth users should join the existing company tenant, not create a new one
    let tenant;
    const emailDomain = email.split('@')[1]; // e.g., "selsoftinc.com"
    
    console.log('[OAuth Register] Looking for tenant with email domain:', emailDomain);
    
    // First, try to find tenant by checking existing users with same email domain
    const existingUserWithSameDomain = await models.User.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('email')),
        'LIKE',
        `%@${emailDomain.toLowerCase()}`
      ),
      include: [{
        model: models.Tenant,
        as: 'tenant',
        required: true
      }]
    });

    if (existingUserWithSameDomain && existingUserWithSameDomain.tenant) {
      tenant = existingUserWithSameDomain.tenant;
      console.log('[OAuth Register] Found existing tenant by email domain:', tenant.tenant_name);
    } else {
      // If no existing tenant found, try to find by subdomain from company name
      const subdomain = companyName 
        ? companyName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)
        : emailDomain.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);

      tenant = await models.Tenant.findOne({
        where: { subdomain: subdomain }
      });

      if (!tenant) {
        // Create new tenant only if no existing tenant found
        const tenantName = companyName || emailDomain.split('.')[0];
        console.log('[OAuth Register] Creating new tenant:', tenantName);
        
        tenant = await models.Tenant.create({
          tenant_name: tenantName,
          tenantName: tenantName,
          legalName: tenantName,
          subdomain: subdomain,
          status: 'active',
          plan_type: 'free',
          max_users: 10,
          settings: {}
        });
        console.log('[OAuth Register] Tenant created successfully:', tenant.id);
      } else {
        console.log('[OAuth Register] Found existing tenant by subdomain:', tenant.tenant_name);
      }
    }

    // Generate a random password hash (user won't use it, OAuth only)
    const randomPassword = Math.random().toString(36).slice(-12);
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    // Create user with pending approval status
    console.log('[OAuth Register] Creating user with tenant ID:', tenant.id);
    const user = await models.User.create({
      email: email.toLowerCase(),
      firstName: firstName,
      lastName: lastName,
      first_name: firstName,
      last_name: lastName,
      passwordHash: passwordHash,
      role: role.toLowerCase(),
      tenant_id: tenant.id,
      tenantId: tenant.id,
      status: 'inactive', // Set to inactive until approved
      approvalStatus: 'pending', // Require admin approval (use model field name)
      googleId: googleId,
      authProvider: 'google',
      emailVerified: true,
      lastLogin: new Date()
    });
    console.log('[OAuth Register] User created successfully with pending status:', user.id);

    // Create employee record for all roles (admin, employee, approver)
    // This ensures they appear in employee lists and can be assigned as approvers
    let employeeId = null;
    console.log('[OAuth Register] Creating employee record for role:', role.toLowerCase());
    
    // Determine title based on role
    let title = 'Employee';
    if (role.toLowerCase() === 'admin') {
      title = 'Administrator';
    } else if (role.toLowerCase() === 'approver') {
      title = 'Manager';
    }
    
    const employee = await models.Employee.create({
      tenantId: tenant.id,
      firstName: firstName,
      lastName: lastName,
      email: email.toLowerCase(),
      phone: phoneNumber || null,
      department: department || 'General',
      title: title,
      status: 'active',
      startDate: new Date(),
      userId: user.id
    });
    employeeId = employee.id;
    console.log('[OAuth Register] Employee created successfully:', employeeId);

    // Create notifications for all admin users in the tenant
    try {
      const adminUsers = await models.User.findAll({
        where: {
          tenantId: tenant.id,
          role: 'admin',
          status: 'active'
        }
      });

      console.log(`[OAuth Register] Found ${adminUsers.length} admin users to notify`);

      // Create notification for each admin
      if (models.Notification) {
        for (const admin of adminUsers) {
          await models.Notification.create({
            tenantId: tenant.id,
            userId: admin.id,
            title: 'New User Registration Pending Approval',
            message: `${firstName} ${lastName} (${email}) has registered via Google OAuth and is awaiting approval.`,
            type: 'warning',
            category: 'approval',
            priority: 'high',
            actionUrl: '/user-approvals',
            metadata: {
              userId: user.id,
              pendingUserId: user.id, // Keep for backward compatibility
              pendingUserEmail: email,
              pendingUserName: `${firstName} ${lastName}`,
              pendingUserRole: role,
              registrationDate: new Date()
            }
          });
        }
        console.log('[OAuth Register] Notifications created for admins');
      }
    } catch (notificationError) {
      console.error('[OAuth Register] Failed to create notifications:', notificationError.message);
      // Continue with registration even if notifications fail
    }

    // Generate JWT token (user can't login until approved, but we return it for the response)
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: tenant.id,
        approvalStatus: 'pending'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Prepare response data
    const responseData = {
      success: true,
      message: 'Registration submitted successfully. Awaiting admin approval.',
      requiresApproval: true,
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        tenantId: tenant.id,
        employeeId: employeeId,
        status: user.status,
        approvalStatus: 'pending'
      },
      tenant: {
        id: tenant.id,
        tenantName: tenant.tenant_name,
        subdomain: tenant.subdomain,
        status: tenant.status
      }
    };

    // Encrypt and return response
    try {
      const encryptedResponse = encryptAuthResponse(responseData);
      return res.status(201).json(encryptedResponse);
    } catch (encryptError) {
      console.error('[OAuth Register] Error encrypting response:', encryptError.message);
      // Send unencrypted response as fallback
      console.log('[OAuth Register] Sending unencrypted response as fallback');
      return res.status(201).json(responseData);
    }

  } catch (error) {
    console.error('OAuth registration error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
