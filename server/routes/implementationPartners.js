const express = require('express');
const router = express.Router();
const { models, sequelize } = require('../models');

const { ImplementationPartner } = models;

// Basic validators
function validateImplementationPartnerPayload(payload) {
  const errors = {};
  if (!payload.name) errors.name = 'Implementation Partner name is required';
  if (payload.email && !/.+@.+\..+/.test(String(payload.email))) {
    errors.email = 'Email is invalid';
  }
  return errors;
}

// List implementation partners
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    const implementationPartners = await ImplementationPartner.findAll({ 
      where: { tenantId }, 
      order: [['name', 'ASC']] 
    });

    res.json({ success: true, implementationPartners, total: implementationPartners.length });
  } catch (err) {
    console.error('Error fetching implementation partners:', err);
    res.status(500).json({ error: 'Failed to fetch implementation partners', details: err.message });
  }
});

// Get implementation partner by id
router.get('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    const { id } = req.params;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    const implementationPartner = await ImplementationPartner.findOne({ where: { id, tenantId } });
    if (!implementationPartner) return res.status(404).json({ error: 'Implementation Partner not found' });

    res.json({ success: true, implementationPartner });
  } catch (err) {
    console.error('Error fetching implementation partner:', err);
    res.status(500).json({ error: 'Failed to fetch implementation partner', details: err.message });
  }
});

// Create implementation partner
router.post('/', async (req, res) => {
  try {
    const { tenantId, ...payload } = req.body;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    const errors = validateImplementationPartnerPayload(payload);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    // Check for duplicate name within tenant
    const existingPartner = await ImplementationPartner.findOne({
      where: { tenantId, name: payload.name }
    });
    if (existingPartner) {
      return res.status(400).json({ error: 'Implementation Partner with this name already exists' });
    }

    const implementationPartner = await ImplementationPartner.create({
      ...payload,
      tenantId
    });

    res.status(201).json({ success: true, implementationPartner });
  } catch (err) {
    console.error('Error creating implementation partner:', err);
    res.status(500).json({ error: 'Failed to create implementation partner', details: err.message });
  }
});

// Update implementation partner
router.put('/:id', async (req, res) => {
  try {
    const { tenantId, ...payload } = req.body;
    const { id } = req.params;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    const errors = validateImplementationPartnerPayload(payload);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const implementationPartner = await ImplementationPartner.findOne({ where: { id, tenantId } });
    if (!implementationPartner) return res.status(404).json({ error: 'Implementation Partner not found' });

    // Check for duplicate name within tenant (excluding current record)
    if (payload.name && payload.name !== implementationPartner.name) {
      const existingPartner = await ImplementationPartner.findOne({
        where: { tenantId, name: payload.name, id: { [sequelize.Sequelize.Op.ne]: id } }
      });
      if (existingPartner) {
        return res.status(400).json({ error: 'Implementation Partner with this name already exists' });
      }
    }

    await implementationPartner.update(payload);
    res.json({ success: true, implementationPartner });
  } catch (err) {
    console.error('Error updating implementation partner:', err);
    res.status(500).json({ error: 'Failed to update implementation partner', details: err.message });
  }
});

// Delete implementation partner
router.delete('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    const { id } = req.params;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    const implementationPartner = await ImplementationPartner.findOne({ where: { id, tenantId } });
    if (!implementationPartner) return res.status(404).json({ error: 'Implementation Partner not found' });

    // Check if any employees are assigned to this implementation partner
    const { Employee } = models;
    const assignedEmployees = await Employee.count({ where: { implPartnerId: id, tenantId } });
    if (assignedEmployees > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete implementation partner. There are employees assigned to this partner.',
        assignedEmployees 
      });
    }

    await implementationPartner.destroy();
    res.json({ success: true, message: 'Implementation Partner deleted successfully' });
  } catch (err) {
    console.error('Error deleting implementation partner:', err);
    res.status(500).json({ error: 'Failed to delete implementation partner', details: err.message });
  }
});

// Soft delete implementation partner
router.patch('/:id/soft-delete', async (req, res) => {
  try {
    const { tenantId } = req.query;
    const { id } = req.params;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    const implementationPartner = await ImplementationPartner.findOne({ where: { id, tenantId } });
    if (!implementationPartner) return res.status(404).json({ error: 'Implementation Partner not found' });

    await implementationPartner.update({ status: 'inactive' });
    res.json({ success: true, message: 'Implementation Partner deactivated successfully' });
  } catch (err) {
    console.error('Error soft deleting implementation partner:', err);
    res.status(500).json({ error: 'Failed to deactivate implementation partner', details: err.message });
  }
});

// Restore implementation partner
router.patch('/:id/restore', async (req, res) => {
  try {
    const { tenantId } = req.query;
    const { id } = req.params;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    const implementationPartner = await ImplementationPartner.findOne({ where: { id, tenantId } });
    if (!implementationPartner) return res.status(404).json({ error: 'Implementation Partner not found' });

    await implementationPartner.update({ status: 'active' });
    res.json({ success: true, message: 'Implementation Partner restored successfully' });
  } catch (err) {
    console.error('Error restoring implementation partner:', err);
    res.status(500).json({ error: 'Failed to restore implementation partner', details: err.message });
  }
});

module.exports = router;
