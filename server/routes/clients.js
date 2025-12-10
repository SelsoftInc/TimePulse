const express = require('express');
const router = express.Router();
const { models, sequelize } = require('../models');
const { Op } = require('sequelize');
const DataEncryptionService = require('../services/DataEncryptionService');
const { encryptAuthResponse } = require('../utils/encryption');

const { Client, Tenant } = models;

// Simple validators
function validatePhone(phone) {
  if (phone == null || phone === '') return 'Phone is required';
  const s = String(phone).trim();
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

function validateTaxId(taxId) {
  if (!taxId) return 'Tax ID is required';
  const compact = String(taxId).replace(/\D/g, '');
  if (compact.length !== 9) return 'Tax ID must have exactly 9 digits';
  if (!/^\d{9}$/.test(compact)) return 'Tax ID must be numeric';
  return '';
}

function validateClientPayload(payload) {
  const errors = {};
  if (!payload.clientName && !payload.name) {
    errors.clientName = 'Client name is required';
  }
  if (!payload.contactPerson) {
    errors.contactPerson = 'Contact person is required';
  }
  if (!payload.email) {
    errors.email = 'Email is required';
  } else {
    const emailOk = /.+@.+\..+/.test(String(payload.email));
    if (!emailOk) errors.email = 'Email is invalid';
  }
  const phoneMsg = validatePhone(payload.phone);
  if (phoneMsg) errors.phone = phoneMsg;
  const taxMsg = validateTaxId(payload.taxId);
  if (taxMsg) errors.taxId = taxMsg;
  return errors;
}

// Normalizers
let libPhone;
try {
  libPhone = require('libphonenumber-js');
} catch (e) {
  libPhone = null;
}

function toE164(raw, defaultCountry = 'US') {
  if (!raw) return '';
  if (!libPhone) {
    const s = String(raw);
    if (s.trim().startsWith('+')) return '+' + s.replace(/\D/g, '').slice(0, 15);
    const d = s.replace(/\D/g, '');
    if (!d) return '';
    return `+1${d}`;
  }
  try {
    const { parsePhoneNumberFromString } = libPhone;
    const phone = parsePhoneNumberFromString(String(raw), defaultCountry);
    if (phone && phone.isValid()) return phone.number; // E.164
  } catch (e) {
    // ignore
  }
  return '';
}

function normalizeTaxId(raw) {
  if (!raw) return '';
  return String(raw).replace(/\D/g, '').slice(0, 9);
}

// Get all clients for a tenant
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    
    console.log('📋 Fetching clients for tenantId:', tenantId);
    
    if (!tenantId) {
      console.error('❌ No tenantId provided');
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Use raw query to avoid Sequelize timestamp issues
    let clients;
    let hasClientType = true;
    try {
      clients = await sequelize.query(
        'SELECT id, tenant_id, client_name, legal_name, contact_person, email, phone, billing_address, shipping_address, tax_id, payment_terms, hourly_rate, status, client_type FROM clients WHERE tenant_id = :tenantId',
        {
          replacements: { tenantId },
          type: sequelize.QueryTypes.SELECT
        }
      );
    } catch (err) {
      // Fallback if client_type column does not exist yet
      console.warn('clients: falling back without client_type column:', err.code || err.message);
      hasClientType = false;
      clients = await sequelize.query(
        'SELECT id, tenant_id, client_name, legal_name, contact_person, email, phone, billing_address, shipping_address, tax_id, payment_terms, hourly_rate, status FROM clients WHERE tenant_id = :tenantId',
        {
          replacements: { tenantId },
          type: sequelize.QueryTypes.SELECT
        }
      );
    }

    // Aggregate: employees assigned to each client for this tenant
    let employeeCounts = [];
    try {
      employeeCounts = await sequelize.query(
        `SELECT client_id, COUNT(*) AS employee_count
         FROM employees
         WHERE tenant_id = :tenantId AND client_id IS NOT NULL
         GROUP BY client_id`,
        { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
      );
    } catch (err) {
      console.warn('clients: employee count query failed:', err.message);
    }

    // Aggregate: total billed from invoices per client for this tenant
    let invoiceTotals = [];
    try {
      invoiceTotals = await sequelize.query(
        `SELECT client_id, COALESCE(SUM(total_amount), 0) AS total_billed
         FROM invoices
         WHERE tenant_id = :tenantId AND client_id IS NOT NULL
         GROUP BY client_id`,
        { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
      );
    } catch (err) {
      console.warn('clients: invoice totals query failed:', err.message);
    }

    const employeeCountMap = Object.fromEntries(
      employeeCounts.map(r => [String(r.client_id), Number(r.employee_count)])
    );
    const totalBilledMap = Object.fromEntries(
      invoiceTotals.map(r => [String(r.client_id), Number(r.total_billed)])
    );

    // Transform the data to match frontend expectations
    const transformedClients = clients.map(client => ({
      id: client.id,
      name: client.client_name,
      legalName: client.legal_name,
      contactPerson: client.contact_person,
      email: client.email,
      phone: client.phone,
      status: client.status || 'active',
      billingAddress: client.billing_address,
      shippingAddress: client.shipping_address,
      taxId: client.tax_id,
      paymentTerms: client.payment_terms,
      hourlyRate: client.hourly_rate,
      clientType: hasClientType ? (client.client_type || 'external') : 'external',
      employeeCount: employeeCountMap[String(client.id)] || 0,
      totalBilled: totalBilledMap[String(client.id)] || 0
    }));

    console.log('✅ Found', transformedClients.length, 'clients for tenant:', tenantId);
    console.log('📤 Sending clients:', transformedClients.map(c => ({ id: c.id, name: c.name })));

    // Decrypt client data before sending to frontend
    const decryptedClients = transformedClients.map(client => 
      DataEncryptionService.decryptClientData(client)
    );

    res.json({
      success: true,
      clients: decryptedClients,
      total: decryptedClients.length
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ 
      error: 'Failed to fetch clients',
      details: error.message 
    });
  }
});

// Get single client by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    const client = await Client.findOne({
      where: { 
        id,
        tenantId 
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Transform the data
    const transformedClient = {
      id: client.id,
      name: client.clientName,
      legalName: client.legalName,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone,
      status: client.status || 'active',
      billingAddress: client.billingAddress,
      shippingAddress: client.shippingAddress,
      taxId: client.taxId,
      paymentTerms: client.paymentTerms,
      hourlyRate: client.hourlyRate,
      clientType: client.clientType || 'external'
    };

    // Decrypt client data before sending to frontend
    const decryptedClient = DataEncryptionService.decryptClientData(transformedClient);

    res.json({
      success: true,
      client: decryptedClient
    });

  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ 
      error: 'Failed to fetch client',
      details: error.message 
    });
  }
});

// Create new client
router.post('/', async (req, res) => {
  try {
    let clientData = req.body;

    const validationErrors = validateClientPayload(clientData);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }
    // Normalize
    clientData.phone = toE164(clientData.phone);
    clientData.taxId = normalizeTaxId(clientData.taxId);
    
    // Encrypt client data before saving to database
    clientData = DataEncryptionService.encryptClientData(clientData);
    
    // Create the client record
    const client = await Client.create(clientData);

    // Decrypt client data for response
    const decryptedClient = DataEncryptionService.decryptClientData(
      client.toJSON ? client.toJSON() : client
    );

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      client: decryptedClient
    });

  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ 
      error: 'Failed to create client',
      details: error.message 
    });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    let updateData = req.body;

    const validationErrors = validateClientPayload(updateData);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }
    // Normalize
    updateData.phone = toE164(updateData.phone);
    updateData.taxId = normalizeTaxId(updateData.taxId);

    const client = await Client.findOne({
      where: { id, tenantId }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Encrypt client data before updating in database
    updateData = DataEncryptionService.encryptClientData(updateData);

    await client.update(updateData);

    // Decrypt client data for response
    const decryptedClient = DataEncryptionService.decryptClientData(
      client.toJSON ? client.toJSON() : client
    );

    res.json({
      success: true,
      message: 'Client updated successfully',
      client: decryptedClient
    });

  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ 
      error: 'Failed to update client',
      details: error.message 
    });
  }
});

// Delete client
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    const client = await Client.findOne({
      where: { id, tenantId }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await client.destroy();

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ 
      error: 'Failed to delete client',
      details: error.message 
    });
  }
});

module.exports = router;
