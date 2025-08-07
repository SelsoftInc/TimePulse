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
      'SELECT id, tenant_name, legal_name, subdomain, contact_address, invoice_address, contact_info, tax_info, settings, logo, status FROM tenants WHERE id = :tenantId',
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
      logo: tenant.logo || null,
      status: tenant.status
    };
    
    console.log('🔍 GET tenant - Logo in DB:', !!tenant.logo);
    console.log('📦 GET tenant - Logo in response:', !!transformedTenant.logo);

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
    
    console.log('🔄 Tenant update request for ID:', id);
    console.log('📦 Update data received:', Object.keys(updateData));
    console.log('🖼️ Logo in update data:', !!updateData.logo);
    if (updateData.logo) {
      console.log('📏 Logo length:', updateData.logo.length);
    }

    const tenant = await Tenant.findByPk(id);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    console.log('💾 Updating tenant with data...');
    await tenant.update(updateData);
    console.log('✅ Tenant updated successfully');
    
    // Verify the logo was saved
    const updatedTenant = await Tenant.findByPk(id);
    console.log('🔍 Logo saved to DB:', !!updatedTenant.logo);

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
