const express = require('express');
const router = express.Router();
const { models } = require('../models');

// Get all users for a tenant
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    
    console.log('👥 Fetching users for tenantId:', tenantId);
    
    if (!tenantId) {
      console.error('❌ No tenantId provided');
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const users = await models.User.findAll({
      where: { tenantId },
      attributes: [
        'id',
        'tenantId',
        'firstName',
        'lastName',
        'email',
        'role',
        'department',
        'title',
        'status',
        'lastLogin',
        ['created_at', 'createdAt'],
        ['updated_at', 'updatedAt']
      ],
      order: [
        ['role', 'ASC'],
        ['firstName', 'ASC']
      ],
      raw: true
    });

    const transformedUsers = users.map(u => ({
      id: u.id,
      tenantId: u.tenantId,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      department: u.department,
      title: u.title,
      status: u.status,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));

    const approvers = transformedUsers.filter(u => u.role === 'admin' || u.role === 'approver');
    
    console.log('✅ Found', transformedUsers.length, 'total users');
    console.log('✅ Found', approvers.length, 'approvers (admin/approver role)');
    console.log('📤 Approvers:', approvers.map(a => ({ id: a.id, name: `${a.firstName} ${a.lastName}`, role: a.role })));

    res.json({
      success: true,
      users: transformedUsers
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
});

// Get single user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    const user = await models.User.findOne({
      where: { id, tenantId },
      attributes: [
        'id',
        'tenantId',
        'firstName',
        'lastName',
        'email',
        'role',
        'permissions',
        'department',
        'title',
        'status',
        'lastLogin',
        'mustChangePassword',
        'createdAt',
        'updatedAt'
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        department: user.department,
        title: user.title,
        status: user.status,
        lastLogin: user.lastLogin,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user',
      details: error.message 
    });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    const updateData = req.body;

    console.log('📝 Update user request:', {
      userId: id,
      tenantId,
      updateData
    });

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const user = await models.User.findOne({
      where: { id, tenantId }
    });

    if (!user) {
      console.error('❌ User not found:', { id, tenantId });
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('👤 Found user:', {
      id: user.id,
      email: user.email,
      currentRole: user.role,
      currentStatus: user.status
    });

    // Only allow updating certain fields
    const allowedFields = ['role', 'status', 'department', 'title', 'permissions'];
    const filteredData = {};
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    console.log('🔄 Updating with data:', filteredData);

    await user.update(filteredData);

    console.log('✅ User updated successfully:', {
      id: user.id,
      newRole: user.role,
      newStatus: user.status,
      newDepartment: user.department,
      newTitle: user.title
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        title: user.title,
        status: user.status
      }
    });

  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ 
      error: 'Failed to update user',
      details: error.message 
    });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    const user = await models.User.findOne({
      where: { id, tenantId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      error: 'Failed to delete user',
      details: error.message 
    });
  }
});

module.exports = router;
