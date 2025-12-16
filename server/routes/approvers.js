const express = require('express');
const router = express.Router();
const { models } = require('../models');

const { User } = models;

// Get all approvers (users with 'admin', 'manager', or 'hr' roles who can approve leaves)
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Fetch users with admin, manager, hr, or approver roles who can approve leaves
    const approvers = await User.findAll({
      where: {
        tenantId,
        role: {
          [require('sequelize').Op.in]: ['admin', 'manager', 'hr', 'approver']
        },
        status: 'active'
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'department', 'title'],
      order: [['firstName', 'ASC'], ['lastName', 'ASC']]
    });

    console.log(`✅ Found ${approvers.length} approvers for tenant ${tenantId}`);

    // Transform data for frontend
    const transformedApprovers = approvers.map(approver => ({
      id: approver.id,
      name: `${approver.firstName} ${approver.lastName}`,
      firstName: approver.firstName,
      lastName: approver.lastName,
      email: approver.email,
      role: approver.role,
      department: approver.department || 'N/A',
      title: approver.title || 'N/A'
    }));

    res.json({
      success: true,
      approvers: transformedApprovers,
      total: transformedApprovers.length
    });

  } catch (error) {
    console.error('Error fetching approvers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch approvers',
      details: error.message 
    });
  }
});

module.exports = router;
