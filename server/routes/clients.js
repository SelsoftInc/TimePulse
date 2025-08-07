const express = require('express');
const router = express.Router();
const { models, sequelize } = require('../models');
const { Op } = require('sequelize');

const { Client, Tenant } = models;

// Get all clients for a tenant
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Use raw query to avoid Sequelize timestamp issues
    const clients = await sequelize.query(
      'SELECT id, tenant_id, client_name, legal_name, contact_person, email, phone, billing_address, shipping_address, tax_id, payment_terms, hourly_rate, status FROM clients WHERE tenant_id = :tenantId',
      {
        replacements: { tenantId },
        type: sequelize.QueryTypes.SELECT
      }
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
      // Calculate employee count (placeholder for now)
      employeeCount: 0,
      totalBilled: 0
    }));

    res.json({
      success: true,
      clients: transformedClients,
      total: transformedClients.length
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
      hourlyRate: client.hourlyRate
    };

    res.json({
      success: true,
      client: transformedClient
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
    const clientData = req.body;
    
    // Create the client record
    const client = await Client.create(clientData);

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      client
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
    const updateData = req.body;

    const client = await Client.findOne({
      where: { id, tenantId }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await client.update(updateData);

    res.json({
      success: true,
      message: 'Client updated successfully',
      client
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
