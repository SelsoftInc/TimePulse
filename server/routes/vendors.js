const express = require('express');
const router = express.Router();
const { models, sequelize } = require('../models');
const DataEncryptionService = require('../services/DataEncryptionService');
const { encryptAuthResponse } = require('../utils/encryption');

const { Vendor } = models;

// Phone validator - OPTIONAL field
function validatePhone(phone) {
  // Phone is OPTIONAL - return empty string if not provided
  if (phone == null || phone === '') return '';
  const s = String(phone).trim();
  // If phone is just a country code (e.g., '+1'), treat as empty
  if (s.match(/^\+\d{1,3}$/)) return '';
  
  if (s.startsWith('+')) {
    const digits = s.slice(1).replace(/\D/g, '');
    if (digits.length < 10) return 'Phone must have at least 10 digits';
    if (digits.length > 15) return 'Phone must have no more than 15 digits';
    return '';
  }
  const digits = s.replace(/\D/g, '');
  if (digits.length < 10) return 'Phone must have at least 10 digits';
  if (digits.length > 15) return 'Phone must have no more than 15 digits';
  return '';
}

// Basic validators
function validateVendorPayload(payload) {
  const errors = {};
  if (!payload.name) errors.name = 'Vendor name is required';
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email))) {
    errors.email = 'Email is invalid';
  }
  // Phone is OPTIONAL - only validate if provided
  if (payload.phone) {
    const phoneMsg = validatePhone(payload.phone);
    if (phoneMsg) errors.phone = phoneMsg;
  }
  return errors;
}

// Validate only the fields being updated (for partial updates)
function validateVendorUpdatePayload(payload) {
  const errors = {};
  
  // Only validate fields that are present in the payload
  if (payload.name !== undefined) {
    if (!payload.name) {
      errors.name = 'Vendor name cannot be empty';
    }
  }
  
  if (payload.email !== undefined) {
    if (!payload.email) {
      errors.email = 'Email cannot be empty';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email))) {
      errors.email = 'Email is invalid';
    }
  }
  
  // Phone is OPTIONAL - only validate if provided and not empty
  if (payload.phone !== undefined && payload.phone) {
    const phoneMsg = validatePhone(payload.phone);
    if (phoneMsg) errors.phone = phoneMsg;
  }
  
  return errors;
}

// List vendors
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    const vendors = await Vendor.findAll({ where: { tenantId }, order: [['name', 'ASC']] });

    // Decrypt vendor data before sending to frontend
    const decryptedVendors = vendors.map(vendor => {
      const plainVendor = vendor.toJSON ? vendor.toJSON() : vendor;
      return DataEncryptionService.decryptVendorData(plainVendor);
    });

    const responseData = { success: true, vendors: decryptedVendors, total: decryptedVendors.length };
    res.json(encryptAuthResponse(responseData));
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

    // Decrypt vendor data before sending to frontend
    const decryptedVendor = DataEncryptionService.decryptVendorData(
      vendor.toJSON ? vendor.toJSON() : vendor
    );

    const responseData = { success: true, vendor: decryptedVendor };
    res.json(encryptAuthResponse(responseData));
  } catch (err) {
    console.error('Error fetching vendor:', err);
    res.status(500).json({ error: 'Failed to fetch vendor', details: err.message });
  }
});

// Create vendor
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating vendor with payload:', JSON.stringify(req.body, null, 2));
    
    let payload = req.body || {};
    const errors = validateVendorPayload(payload);
    if (Object.keys(errors).length) {
      console.error('❌ Validation errors:', errors);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    console.log('🔒 Encrypting vendor data...');
    // Encrypt vendor data before saving to database
    payload = DataEncryptionService.encryptVendorData(payload);
    console.log('✅ Vendor data encrypted');

    console.log('💾 Saving vendor to database...');
    const created = await Vendor.create(payload);
    console.log('✅ Vendor created with ID:', created.id);
    
    // Decrypt vendor data for response
    console.log('🔓 Decrypting vendor data for response...');
    const decryptedVendor = DataEncryptionService.decryptVendorData(
      created.toJSON ? created.toJSON() : created
    );
    console.log('✅ Vendor data decrypted');
    
    const responseData = { success: true, vendor: decryptedVendor };
    res.status(201).json(encryptAuthResponse(responseData));
  } catch (err) {
    console.error('❌ Error creating vendor:', err);
    console.error('Error stack:', err.stack);
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    if (err.errors) {
      console.error('Sequelize validation errors:', err.errors);
    }
    res.status(500).json({ 
      error: 'Failed to create vendor', 
      details: err.message,
      name: err.name,
      validationErrors: err.errors ? err.errors.map(e => ({ field: e.path, message: e.message })) : null
    });
  }
});

// Update vendor
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    let payload = req.body || {};
    
    console.log('📝 Updating vendor with payload:', JSON.stringify(payload, null, 2));
    
    // Use partial validation for updates (only validate provided fields)
    const errors = validateVendorUpdatePayload(payload);
    if (Object.keys(errors).length > 0) {
      console.error('❌ Validation errors:', errors);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const vendor = await Vendor.findOne({ where: { id, tenantId } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    // Encrypt vendor data before updating in database
    payload = DataEncryptionService.encryptVendorData(payload);

    await vendor.update(payload);
    
    // Decrypt vendor data for response
    const decryptedVendor = DataEncryptionService.decryptVendorData(
      vendor.toJSON ? vendor.toJSON() : vendor
    );
    
    const responseData = { success: true, vendor: decryptedVendor };
    res.json(encryptAuthResponse(responseData));
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
    const responseData = { success: true };
    res.json(encryptAuthResponse(responseData));
  } catch (err) {
    console.error('Error deleting vendor:', err);
    res.status(500).json({ error: 'Failed to delete vendor', details: err.message });
  }
});

module.exports = router;
