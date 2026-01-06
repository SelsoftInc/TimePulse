const express = require('express');
const router = express.Router();
const { models, sequelize } = require('../models');
const DataEncryptionService = require('../services/DataEncryptionService');
const { encryptAuthResponse } = require('../utils/encryption');

const { ImplementationPartner } = models;

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
function validateImplementationPartnerPayload(payload) {
  const errors = {};
  if (!payload.name) errors.name = 'Implementation Partner name is required';
  if (payload.email && !/.+@.+\..+/.test(String(payload.email))) {
    errors.email = 'Email is invalid';
  }
  // Phone is OPTIONAL - only validate if provided
  if (payload.phone) {
    const phoneMsg = validatePhone(payload.phone);
    if (phoneMsg) errors.phone = phoneMsg;
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

    // Decrypt implementation partner data before sending to frontend
    const decryptedPartners = implementationPartners.map(partner => {
      const plainPartner = partner.toJSON ? partner.toJSON() : partner;
      const decrypted = DataEncryptionService.decryptImplementationPartnerData(plainPartner);
      
      // Extract address fields from JSONB
      if (plainPartner.address) {
        decrypted.address = plainPartner.address.street || '';
        decrypted.city = plainPartner.address.city || '';
        decrypted.state = plainPartner.address.state || '';
        decrypted.zip = plainPartner.address.zip || '';
        decrypted.country = plainPartner.address.country || '';
      }
      
      return decrypted;
    });

    res.json({ success: true, implementationPartners: decryptedPartners, total: decryptedPartners.length });
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

    const plainPartner = implementationPartner.toJSON ? implementationPartner.toJSON() : implementationPartner;
    
    // Decrypt implementation partner data before sending to frontend
    const decryptedPartner = DataEncryptionService.decryptImplementationPartnerData(plainPartner);

    // Extract address fields from JSONB
    if (plainPartner.address) {
      decryptedPartner.address = plainPartner.address.street || '';
      decryptedPartner.city = plainPartner.address.city || '';
      decryptedPartner.state = plainPartner.address.state || '';
      decryptedPartner.zip = plainPartner.address.zip || '';
      decryptedPartner.country = plainPartner.address.country || '';
    }

    res.json({ success: true, implementationPartner: decryptedPartner });
  } catch (err) {
    console.error('Error fetching implementation partner:', err);
    res.status(500).json({ error: 'Failed to fetch implementation partner', details: err.message });
  }
});

// Create implementation partner
router.post('/', async (req, res) => {
  try {
    const { tenantId, address, city, state, zip, country, ...payloadData } = req.body;
    let payload = payloadData;
    
    console.log('📥 Creating implementation partner with data:', { tenantId, ...payloadData, address, city, state, zip, country });
    
    if (!tenantId) {
      console.error('❌ Tenant ID is missing');
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const errors = validateImplementationPartnerPayload(payload);
    if (Object.keys(errors).length > 0) {
      console.error('❌ Validation failed:', errors);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    // Encrypt implementation partner data before saving to database
    console.log('🔐 Encrypting implementation partner data...');
    payload = DataEncryptionService.encryptImplementationPartnerData(payload);
    console.log('✅ Encryption complete');

    // Check for duplicate name within tenant (using encrypted name)
    const existingPartner = await ImplementationPartner.findOne({
      where: { tenantId, name: payload.name }
    });
    if (existingPartner) {
      console.warn('⚠️ Duplicate implementation partner name detected');
      return res.status(400).json({ error: 'Implementation Partner with this name already exists' });
    }

    // Construct address JSONB object
    const addressObj = {
      street: address || '',
      city: city || '',
      state: state || '',
      zip: zip || '',
      country: country || ''
    };

    console.log('💾 Creating implementation partner in database...');
    const implementationPartner = await ImplementationPartner.create({
      ...payload,
      address: addressObj,
      tenantId
    });

    console.log('✅ Implementation partner created successfully with ID:', implementationPartner.id);

    // Decrypt implementation partner data for response
    const decryptedPartner = DataEncryptionService.decryptImplementationPartnerData(
      implementationPartner.toJSON ? implementationPartner.toJSON() : implementationPartner
    );

    // Add address fields back to response
    if (implementationPartner.address) {
      decryptedPartner.address = implementationPartner.address.street || '';
      decryptedPartner.city = implementationPartner.address.city || '';
      decryptedPartner.state = implementationPartner.address.state || '';
      decryptedPartner.zip = implementationPartner.address.zip || '';
      decryptedPartner.country = implementationPartner.address.country || '';
    }

    res.status(201).json({ success: true, implementationPartner: decryptedPartner });
  } catch (err) {
    console.error('❌ Error creating implementation partner:', err);
    console.error('Error stack:', err.stack);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create implementation partner';
    if (err.name === 'SequelizeValidationError') {
      errorMessage = 'Validation error: ' + err.errors.map(e => e.message).join(', ');
    } else if (err.name === 'SequelizeUniqueConstraintError') {
      errorMessage = 'Implementation Partner with this information already exists';
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    res.status(500).json({ 
      error: errorMessage, 
      details: err.message,
      validationErrors: err.errors ? err.errors.map(e => ({ field: e.path, message: e.message })) : undefined
    });
  }
});

// Update implementation partner
router.put('/:id', async (req, res) => {
  try {
    const { tenantId, address, city, state, zip, country, ...payloadData } = req.body;
    let payload = payloadData;
    const { id } = req.params;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID is required' });

    const errors = validateImplementationPartnerPayload(payload);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const implementationPartner = await ImplementationPartner.findOne({ where: { id, tenantId } });
    if (!implementationPartner) return res.status(404).json({ error: 'Implementation Partner not found' });

    // Encrypt implementation partner data before checking duplicate
    const encryptedPayload = DataEncryptionService.encryptImplementationPartnerData(payload);

    // Check for duplicate name within tenant (excluding current record)
    if (payload.name && encryptedPayload.name !== implementationPartner.name) {
      const existingPartner = await ImplementationPartner.findOne({
        where: { tenantId, name: encryptedPayload.name, id: { [sequelize.Sequelize.Op.ne]: id } }
      });
      if (existingPartner) {
        return res.status(400).json({ error: 'Implementation Partner with this name already exists' });
      }
    }

    // Construct address JSONB object
    const addressObj = {
      street: address || '',
      city: city || '',
      state: state || '',
      zip: zip || '',
      country: country || ''
    };

    await implementationPartner.update({
      ...encryptedPayload,
      address: addressObj
    });
    
    // Decrypt implementation partner data for response
    const plainPartner = implementationPartner.toJSON ? implementationPartner.toJSON() : implementationPartner;
    const decryptedPartner = DataEncryptionService.decryptImplementationPartnerData(plainPartner);
    
    // Extract address fields from JSONB
    if (plainPartner.address) {
      decryptedPartner.address = plainPartner.address.street || '';
      decryptedPartner.city = plainPartner.address.city || '';
      decryptedPartner.state = plainPartner.address.state || '';
      decryptedPartner.zip = plainPartner.address.zip || '';
      decryptedPartner.country = plainPartner.address.country || '';
    }
    
    res.json({ success: true, implementationPartner: decryptedPartner });
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
