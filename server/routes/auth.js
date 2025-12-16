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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await models.User.findOne({
      where: { email: email.toLowerCase() },
      include: [{
        model: models.Tenant,
        as: 'tenant'
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Find employee record if user is an employee
    let employeeId = null;
    if (user.role === 'employee') {
      const employee = await models.Employee.findOne({
        where: {
          email: user.email,
          tenantId: user.tenant_id || user.tenantId
        }
      });
      if (employee) {
        employeeId = employee.id;
      }
    }

    // Prepare response data
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
        tenantId: user.tenantId || user.tenant_id,
        employeeId: employeeId,
        mustChangePassword: user.mustChangePassword || user.must_change_password
      },
      tenant: user.tenant ? {
        id: user.tenant.id,
        tenantName: user.tenant.tenantName || user.tenant.tenant_name,
        subdomain: user.tenant.subdomain,
        status: user.tenant.status
      } : null
    };

    // Encrypt and return response
    const encryptedResponse = encryptAuthResponse(responseData);
    res.json(encryptedResponse);

  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
