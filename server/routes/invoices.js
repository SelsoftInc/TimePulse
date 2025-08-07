/**
 * Invoice Routes
 */

const express = require('express');
const router = express.Router();

// GET /api/invoices
router.get('/', (req, res) => {
  // Mock invoice data
  const invoices = [
    {
      id: 1,
      invoiceNumber: 'INV-2025-001',
      client: 'Acme Corp',
      amount: 5000,
      status: 'paid',
      dueDate: '2025-02-15',
      createdAt: '2025-01-15T10:00:00Z'
    },
    {
      id: 2,
      invoiceNumber: 'INV-2025-002',
      client: 'Tech Solutions Inc',
      amount: 3200,
      status: 'pending',
      dueDate: '2025-02-20',
      createdAt: '2025-01-20T14:30:00Z'
    }
  ];

  res.json(invoices);
});

// POST /api/invoices
router.post('/', (req, res) => {
  const { client, amount, items, dueDate } = req.body;
  
  const newInvoice = {
    id: Date.now(),
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
    client,
    amount,
    items,
    status: 'draft',
    dueDate,
    createdAt: new Date().toISOString()
  };

  res.status(201).json(newInvoice);
});

// GET /api/invoices/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  // Mock invoice details
  const invoice = {
    id: parseInt(id),
    invoiceNumber: 'INV-2025-001',
    client: {
      name: 'Acme Corp',
      email: 'billing@acmecorp.com',
      address: '123 Business St, City, State 12345'
    },
    amount: 5000,
    items: [
      {
        description: 'Professional Services - Week 1',
        quantity: 40,
        rate: 125,
        amount: 5000
      }
    ],
    status: 'paid',
    dueDate: '2025-02-15',
    createdAt: '2025-01-15T10:00:00Z'
  };

  res.json(invoice);
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
