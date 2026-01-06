/**
 * Authentication Routes
 * Handles user login, logout, and token validation
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { models } = require('../models');
const { encryptAuthResponse } = require('../utils/encryption');

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    console.log('[Auth Login] Login attempt received');
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('[Auth Login] Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    console.log('[Auth Login] Searching for user:', email);
    
    // Find user by email
    let user;
    try {
      user = await models.User.findOne({
        where: { email: email.toLowerCase() },
        include: [{
          model: models.Tenant,
          as: 'tenant',
          required: false
        }]
      });
    } catch (dbError) {
      console.error('[Auth Login] Database error finding user:', dbError.message);
      throw new Error('Database error: ' + dbError.message);
    }

    if (!user) {
      console.log('[Auth Login] User not found, checking for account request:', email);
      
      // Check if there's a pending or rejected account request
      try {
        const accountRequest = await models.AccountRequest.findOne({
          where: { email: email.toLowerCase() }
        });
        
        if (accountRequest) {
          console.log('[Auth Login] Account request found:', accountRequest.status);
          
          if (accountRequest.status === 'rejected') {
            return res.status(403).json({
              success: false,
              message: 'Your account request was rejected',
              accountStatus: 'rejected',
              redirectTo: `/account-status?email=${encodeURIComponent(email)}`,
              rejectionReason: accountRequest.rejectionReason
            });
          }
          
          if (accountRequest.status === 'pending') {
            return res.status(403).json({
              success: false,
              message: 'Your account request is pending approval',
              accountStatus: 'pending',
              redirectTo: `/account-status?email=${encodeURIComponent(email)}`
            });
          }
        }
      } catch (requestError) {
        console.error('[Auth Login] Error checking account request:', requestError.message);
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('[Auth Login] User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    });

    // Check if user is active
    if (user.status !== 'active') {
      console.log('[Auth Login] User is not active, status:', user.status);
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Verify password
    console.log('[Auth Login] Verifying password...');
    let isPasswordValid;
    try {
      isPasswordValid = await bcrypt.compare(password, user.passwordHash || user.password_hash);
    } catch (bcryptError) {
      console.error('[Auth Login] Password verification error:', bcryptError.message);
      throw new Error('Password verification failed: ' + bcryptError.message);
    }
    
    if (!isPasswordValid) {
      console.log('[Auth Login] Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('[Auth Login] Password verified successfully');

    // Get tenant ID
    const tenantId = user.tenant_id || user.tenantId;
    console.log('[Auth Login] User tenant ID:', tenantId);

    // Generate JWT token
    console.log('[Auth Login] Generating JWT token...');
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
      console.log('[Auth Login] JWT token generated successfully');
    } catch (jwtError) {
      console.error('[Auth Login] JWT generation error:', jwtError.message);
      throw new Error('Token generation failed: ' + jwtError.message);
    }

    // Update last login
    try {
      await user.update({ lastLogin: new Date() });
      console.log('[Auth Login] Last login updated');
    } catch (updateError) {
      console.error('[Auth Login] Error updating last login:', updateError.message);
      // Non-critical, continue
    }

    // Find employee record for all users
    let employeeId = null;
    console.log('[Auth Login] Looking for employee record...');
    try {
      const employee = await models.Employee.findOne({
        where: {
          email: user.email,
          tenantId: tenantId
        }
      });
      if (employee) {
        employeeId = employee.id;
        console.log('[Auth Login] Employee record found:', employeeId);
      } else {
        console.log('[Auth Login] No employee record found');
      }
    } catch (empError) {
      console.error('[Auth Login] Error finding employee:', empError.message);
      // Non-critical, continue without employee ID
    }

    // Prepare response data
    console.log('[Auth Login] Preparing response data...');
    const responseData = {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.firstName || user.first_name,
        lastName: user.lastName || user.last_name,
        email: user.email,
        role: user.role,
        department: user.department,
        title: user.title,
        tenantId: tenantId,
        employeeId: employeeId,
        mustChangePassword: user.mustChangePassword || user.must_change_password || false
      },
      tenant: user.tenant ? {
        id: user.tenant.id,
        tenantName: user.tenant.tenantName || user.tenant.tenant_name,
        subdomain: user.tenant.subdomain,
        status: user.tenant.status
      } : null
    };

    console.log('[Auth Login] Response data prepared:', {
      hasToken: !!responseData.token,
      hasUser: !!responseData.user,
      hasTenant: !!responseData.tenant,
      userRole: responseData.user.role
    });

    // Encrypt and return response
    try {
      console.log('[Auth Login] Encrypting response...');
      const encryptedResponse = encryptAuthResponse(responseData);
      console.log('[Auth Login] ✅ Login successful, sending response');
      res.json(encryptedResponse);
    } catch (encryptError) {
      console.error('[Auth Login] Encryption error:', encryptError.message);
      // Send unencrypted response as fallback
      console.log('[Auth Login] Sending unencrypted response as fallback');
      res.json(responseData);
    }

  } catch (error) {
    console.error('[Auth Login] ❌ ERROR:', error.message);
    console.error('[Auth Login] Error stack:', error.stack);
    console.error('[Auth Login] Full error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * GET /api/auth/me
 * Get current user info from token
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await models.User.findByPk(req.user.userId, {
      include: [{
        model: models.Tenant,
        as: 'tenant'
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare response data
    const responseData = {
      success: true,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        department: user.department,
        title: user.title,
        tenantId: user.tenant_id
      },
      tenant: user.tenant ? {
        id: user.tenant.id,
        tenantName: user.tenant.tenant_name,
        subdomain: user.tenant.subdomain,
        status: user.tenant.status
      } : null
    };

    // Encrypt and return response
    const encryptedResponse = encryptAuthResponse(responseData);
    res.json(encryptedResponse);

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Middleware to authenticate JWT token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
}

module.exports = router;
