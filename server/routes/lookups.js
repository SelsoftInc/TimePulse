const express = require('express');
const router = express.Router();
const { models } = require('../models');

const { Lookup } = models;

// Get lookups by category
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { tenantId } = req.query;
    
    // Build where clause
    const whereClause = {
      category,
      isActive: true
    };
    
    // If tenantId is provided, get tenant-specific lookups or global ones
    if (tenantId) {
      whereClause[models.Sequelize.Op.or] = [
        { tenantId: null }, // Global lookups
        { tenantId } // Tenant-specific lookups
      ];
    } else {
      whereClause.tenantId = null; // Only global lookups
    }
    
    const lookups = await Lookup.findAll({
      where: whereClause,
      order: [['displayOrder', 'ASC'], ['label', 'ASC']],
      attributes: ['id', 'code', 'label', 'value', 'displayOrder']
    });

    res.json({
      success: true,
      category,
      lookups,
      total: lookups.length
    });

  } catch (error) {
    console.error('Error fetching lookups:', error);
    res.status(500).json({ 
      error: 'Failed to fetch lookups',
      details: error.message 
    });
  }
});

// Get all lookup categories
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    
    const whereClause = { isActive: true };
    if (tenantId) {
      whereClause[models.Sequelize.Op.or] = [
        { tenantId: null },
        { tenantId }
      ];
    } else {
      whereClause.tenantId = null;
    }
    
    const lookups = await Lookup.findAll({
      where: whereClause,
      order: [['category', 'ASC'], ['displayOrder', 'ASC']],
      attributes: ['id', 'category', 'code', 'label', 'value', 'displayOrder']
    });

    // Group by category
    const groupedLookups = lookups.reduce((acc, lookup) => {
      if (!acc[lookup.category]) {
        acc[lookup.category] = [];
      }
      acc[lookup.category].push({
        id: lookup.id,
        code: lookup.code,
        label: lookup.label,
        value: lookup.value,
        displayOrder: lookup.displayOrder
      });
      return acc;
    }, {});

    res.json({
      success: true,
      lookups: groupedLookups,
      categories: Object.keys(groupedLookups)
    });

  } catch (error) {
    console.error('Error fetching all lookups:', error);
    res.status(500).json({ 
      error: 'Failed to fetch lookups',
      details: error.message 
    });
  }
});

// Create a new lookup (admin only)
router.post('/', async (req, res) => {
  try {
    const { category, code, label, value, displayOrder, tenantId } = req.body;
    
    if (!category || !code || !label) {
      return res.status(400).json({ 
        error: 'Category, code, and label are required' 
      });
    }

    // Check if lookup already exists
    const existing = await Lookup.findOne({
      where: { category, code, tenantId: tenantId || null }
    });

    if (existing) {
      return res.status(409).json({ 
        error: 'Lookup with this category and code already exists' 
      });
    }

    const lookup = await Lookup.create({
      category,
      code,
      label,
      value,
      displayOrder: displayOrder || 0,
      tenantId: tenantId || null
    });

    res.status(201).json({
      success: true,
      lookup
    });

  } catch (error) {
    console.error('Error creating lookup:', error);
    res.status(500).json({ 
      error: 'Failed to create lookup',
      details: error.message 
    });
  }
});

// Update a lookup (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { label, value, displayOrder, isActive } = req.body;
    
    const lookup = await Lookup.findByPk(id);
    
    if (!lookup) {
      return res.status(404).json({ error: 'Lookup not found' });
    }

    await lookup.update({
      label: label || lookup.label,
      value: value !== undefined ? value : lookup.value,
      displayOrder: displayOrder !== undefined ? displayOrder : lookup.displayOrder,
      isActive: isActive !== undefined ? isActive : lookup.isActive
    });

    res.json({
      success: true,
      lookup
    });

  } catch (error) {
    console.error('Error updating lookup:', error);
    res.status(500).json({ 
      error: 'Failed to update lookup',
      details: error.message 
    });
  }
});

// Delete a lookup (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const lookup = await Lookup.findByPk(id);
    
    if (!lookup) {
      return res.status(404).json({ error: 'Lookup not found' });
    }

    // Soft delete by setting isActive to false
    await lookup.update({ isActive: false });

    res.json({
      success: true,
      message: 'Lookup deactivated successfully'
    });

  } catch (error) {
    console.error('Error deleting lookup:', error);
    res.status(500).json({ 
      error: 'Failed to delete lookup',
      details: error.message 
    });
  }
});

module.exports = router;
