const express = require('express');
const router = express.Router();
const { models, sequelize } = require('../models');

const { Vendor } = models;

// Basic validators
function validateVendorPayload(payload) {
  const errors = {};
  if (!payload.name) errors.name = 'Vendor name is required';
  if (payload.email && !/.+@.+\..+/.test(String(payload.email))) {
    errors.email = 'Email is invalid';
  }
  return errors;
}

// List vendors
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    const vendors = await Vendor.findAll({ where: { tenantId }, order: [['name', 'ASC']] });

    res.json({ success: true, vendors, total: vendors.length });
  } catch (err) {
    console.error('Error fetching vendors:', err);
    res.status(500).json({ error: 'Failed to fetch vendors', details: err.message });
  }
});

// Get vendor by id
router.get('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    const { id } = req.params;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    const vendor = await Vendor.findOne({ where: { id, tenantId } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    res.json({ success: true, vendor });
  } catch (err) {
    console.error('Error fetching vendor:', err);
    res.status(500).json({ error: 'Failed to fetch vendor', details: err.message });
  }
});

// Create vendor
router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};
    const errors = validateVendorPayload(payload);
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const created = await Vendor.create(payload);
    res.status(201).json({ success: true, vendor: created });
  } catch (err) {
    console.error('Error creating vendor:', err);
    res.status(500).json({ error: 'Failed to create vendor', details: err.message });
  }
});

// Update vendor
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    const payload = req.body || {};
    const errors = validateVendorPayload({ ...payload, name: payload.name || 'x' }); // allow partial but keep name if provided
    if (payload.email && errors.email) {
      return res.status(400).json({ error: 'Validation failed', details: { email: errors.email } });
    }

    const vendor = await Vendor.findOne({ where: { id, tenantId } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    await vendor.update(payload);
    res.json({ success: true, vendor });
  } catch (err) {
    console.error('Error updating vendor:', err);
    res.status(500).json({ error: 'Failed to update vendor', details: err.message });
  }
});

// Delete vendor
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    const vendor = await Vendor.findOne({ where: { id, tenantId } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    await vendor.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting vendor:', err);
    res.status(500).json({ error: 'Failed to delete vendor', details: err.message });
  }
});

module.exports = router;
