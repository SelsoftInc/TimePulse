/**
 * OAuth Authentication Routes
 * Handles Google OAuth user registration and onboarding
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { models } = require('../models');

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

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await models.User.findOne({
      where: { email: email.toLowerCase() },
      include: [{
        model: models.Tenant,
        as: 'tenant'
      }]
    });

    if (!user) {
      // User doesn't exist - needs onboarding
      return res.json({
        success: true,
        exists: false,
        needsOnboarding: true,
        email: email
      });
    }

    // User exists - check if active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

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

    // Return user data
    res.json({
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
    });

  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking user'
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
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create or find tenant
    let tenant;
    const subdomain = companyName 
      ? companyName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)
      : email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);

    // Check if tenant with this subdomain exists
    tenant = await models.Tenant.findOne({
      where: { subdomain: subdomain }
    });

    if (!tenant) {
      // Create new tenant
      const tenantName = companyName || `${firstName} ${lastName}'s Company`;
      console.log('[OAuth Register] Creating tenant:', tenantName);
      
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
    }

    // Generate a random password hash (user won't use it, OAuth only)
    const randomPassword = Math.random().toString(36).slice(-12);
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    // Create user
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
      status: 'active',
      googleId: googleId,
      authProvider: 'google',
      emailVerified: true,
      lastLogin: new Date()
    });
    console.log('[OAuth Register] User created successfully:', user.id);

    // Create employee record if role is employee or approver
    let employeeId = null;
    if (role.toLowerCase() === 'employee' || role.toLowerCase() === 'approver') {
      console.log('[OAuth Register] Creating employee record');
      const employee = await models.Employee.create({
        tenantId: tenant.id,
        firstName: firstName,
        lastName: lastName,
        email: email.toLowerCase(),
        phone: phoneNumber || null,
        department: department || 'General',
        title: role.toLowerCase() === 'approver' ? 'Manager' : 'Employee',
        status: 'active',
        startDate: new Date(),
        userId: user.id
      });
      employeeId = employee.id;
      console.log('[OAuth Register] Employee created successfully:', employeeId);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: tenant.id
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        tenantId: tenant.id,
        employeeId: employeeId,
        status: user.status
      },
      tenant: {
        id: tenant.id,
        tenantName: tenant.tenant_name,
        subdomain: tenant.subdomain,
        status: tenant.status
      }
    });

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
