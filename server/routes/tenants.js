const express = require('express');
const router = express.Router();
const { models, sequelize } = require('../models');
const { Op } = require('sequelize');

const { Tenant } = models;

// Get tenant information
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Use raw query to avoid Sequelize timestamp issues
    const tenants = await sequelize.query(
      'SELECT id, tenant_name, legal_name, subdomain, contact_address, invoice_address, contact_info, tax_info, settings, status FROM tenants WHERE id = :tenantId',
      {
        replacements: { tenantId: id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!tenants || tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = tenants[0];

    // Transform the data to match frontend expectations
    const transformedTenant = {
      id: tenant.id,
      tenantName: tenant.tenant_name,
      legalName: tenant.legal_name,
      subdomain: tenant.subdomain,
      contactAddress: tenant.contact_address || {},
      invoiceAddress: tenant.invoice_address || {},
      contactInfo: tenant.contact_info || {},
      taxInfo: tenant.tax_info || {},
      settings: tenant.settings || {},
      status: tenant.status
    };

    res.json({
      success: true,
      tenant: transformedTenant
    });

  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tenant information',
      details: error.message 
    });
  }
});

// Update tenant information
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const tenant = await Tenant.findByPk(id);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    await tenant.update(updateData);

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      tenant
    });

  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ 
      error: 'Failed to update tenant',
      details: error.message 
    });
  }
});

module.exports = router;
