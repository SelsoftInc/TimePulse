/**
 * Invoice Routes
 */

const express = require('express');
const router = express.Router();
const { models } = require('../models');
const { Op } = require('sequelize');

// GET /api/invoices?tenantId=...
router.get('/', async (req, res) => {
  try {
    const { tenantId, status } = req.query;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'tenantId is required' });
    }

    const whereClause = { tenantId };
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const invoices = await models.Invoice.findAll({
      where: whereClause,
      include: [
        { 
          model: models.Vendor, 
          as: 'vendor', 
          attributes: ['id', 'name', 'email', 'phone'],
          required: false 
        },
        { 
          model: models.Client, 
          as: 'client', 
          attributes: ['id', 'clientName', 'email'],
          required: false 
        },
        { 
          model: models.Employee, 
          as: 'employee', 
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false 
        },
        { 
          model: models.User, 
          as: 'approver', 
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false 
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const formattedInvoices = invoices.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      vendor: inv.vendor?.name || 'N/A',
      client: inv.client?.clientName || 'N/A',
      employee: inv.employee ? `${inv.employee.firstName} ${inv.employee.lastName}` : 'N/A',
      week: inv.weekStart && inv.weekEnd ? `${new Date(inv.weekStart).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })} - ${new Date(inv.weekEnd).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}` : 'N/A',
      weekStart: inv.weekStart,
      weekEnd: inv.weekEnd,
      total: parseFloat(inv.total),
      status: inv.status,
      lineItems: inv.lineItems || [],
      attachments: inv.attachments || [],
      discrepancies: inv.discrepancies,
      notes: inv.notes,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      approvedBy: inv.approver ? `${inv.approver.firstName} ${inv.approver.lastName}` : null,
      approvedAt: inv.approvedAt,
      paidAt: inv.paidAt,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt
    }));

    res.json({ success: true, invoices: formattedInvoices });
  } catch (error) {
    console.error('❌ Error fetching invoices:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invoices', error: error.message });
  }
});

// POST /api/invoices
router.post('/', async (req, res) => {
  try {
    const { 
      tenantId, 
      vendorId, 
      clientId, 
      employeeId, 
      timesheetId,
      weekStart,
      weekEnd,
      lineItems, 
      total,
      subtotal,
      tax,
      dueDate,
      notes,
      attachments,
      quickbooksSync
    } = req.body;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'tenantId is required' });
    }

    // Generate invoice number
    const lastInvoice = await models.Invoice.findOne({
      where: { tenantId },
      order: [['created_at', 'DESC']]
    });

    let invoiceNumber;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-').pop());
      invoiceNumber = `INV-${String(lastNumber + 1).padStart(4, '0')}`;
    } else {
      invoiceNumber = 'INV-1023';
    }

    const newInvoice = await models.Invoice.create({
      tenantId,
      invoiceNumber,
      vendorId,
      clientId,
      employeeId,
      timesheetId,
      weekStart,
      weekEnd,
      lineItems: lineItems || [],
      subtotal: subtotal || 0,
      tax: tax || 0,
      total: total || 0,
      status: 'draft',
      dueDate,
      notes,
      attachments: attachments || [],
      quickbooksSync: quickbooksSync || false
    });

    res.status(201).json({ success: true, invoice: newInvoice });
  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to create invoice', error: error.message });
  }
});

// GET /api/invoices/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'tenantId is required' });
    }

    const invoice = await models.Invoice.findOne({
      where: { id, tenantId },
      include: [
        { 
          model: models.Vendor, 
          as: 'vendor', 
          attributes: ['id', 'name', 'email', 'phone', 'address'],
          required: false 
        },
        { 
          model: models.Client, 
          as: 'client', 
          attributes: ['id', 'clientName', 'email', 'billingAddress'],
          required: false 
        },
        { 
          model: models.Employee, 
          as: 'employee', 
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false 
        },
        { 
          model: models.Timesheet, 
          as: 'timesheet',
          required: false 
        },
        { 
          model: models.User, 
          as: 'approver', 
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false 
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, invoice });
  } catch (error) {
    console.error('❌ Error fetching invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invoice', error: error.message });
  }
});

// PUT /api/invoices/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, status, notes, lineItems, total, subtotal, tax, approvedBy } = req.body;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'tenantId is required' });
    }

    const invoice = await models.Invoice.findOne({
      where: { id, tenantId }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (lineItems) updateData.lineItems = lineItems;
    if (total !== undefined) updateData.total = total;
    if (subtotal !== undefined) updateData.subtotal = subtotal;
    if (tax !== undefined) updateData.tax = tax;
    
    if (status === 'approved') {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    } else if (status === 'paid') {
      updateData.paidAt = new Date();
    }

    await invoice.update(updateData);

    res.json({ success: true, invoice });
  } catch (error) {
    console.error('❌ Error updating invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to update invoice', error: error.message });
  }
});

// POST /api/invoices/:id/approve
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, approvedBy, notes } = req.body;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'tenantId is required' });
    }

    const invoice = await models.Invoice.findOne({
      where: { id, tenantId }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    await invoice.update({
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
      notes: notes || invoice.notes
    });

    res.json({ success: true, invoice });
  } catch (error) {
    console.error('❌ Error approving invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to approve invoice', error: error.message });
  }
});

// POST /api/invoices/:id/reject
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, rejectionReason } = req.body;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'tenantId is required' });
    }

    const invoice = await models.Invoice.findOne({
      where: { id, tenantId }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    await invoice.update({
      status: 'rejected',
      rejectionReason
    });

    res.json({ success: true, invoice });
  } catch (error) {
    console.error('❌ Error rejecting invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to reject invoice', error: error.message });
  }
});

// POST /api/invoices/generate-from-timesheet
router.post('/generate-from-timesheet', (req, res) => {
  const { timesheetData, clientInfo } = req.body;
  
  try {
    // Transform timesheet data to invoice format
    const invoice = {
      id: Date.now(),
      invoiceNumber: `INV-${Date.now()}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      
      client: {
        name: clientInfo?.name || timesheetData?.results?.Entry?.[0]?.Vendor_Name || 'Unknown Client',
        email: clientInfo?.email || '',
        address: clientInfo?.address || ''
      },
      
      items: [
        {
          description: `Professional Services - ${timesheetData?.results?.Entry?.[0]?.Duration || 'Period'}`,
          quantity: parseFloat(timesheetData?.results?.Entry?.[0]?.Total_Hours || 0),
          rate: clientInfo?.hourlyRate || 125,
          amount: (parseFloat(timesheetData?.results?.Entry?.[0]?.Total_Hours || 0) * (clientInfo?.hourlyRate || 125))
        }
      ],
      
      subtotal: (parseFloat(timesheetData?.results?.Entry?.[0]?.Total_Hours || 0) * (clientInfo?.hourlyRate || 125)),
      tax: 0,
      total: (parseFloat(timesheetData?.results?.Entry?.[0]?.Total_Hours || 0) * (clientInfo?.hourlyRate || 125)),
      
      status: 'draft',
      notes: `Invoice generated from timesheet analysis.`,
      
      metadata: {
        sourceTimesheet: timesheetData,
        processingCost: timesheetData?.cost || ''
      }
    };

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({
      error: 'Failed to generate invoice',
      message: error.message
    });
  }
});

module.exports = router;
