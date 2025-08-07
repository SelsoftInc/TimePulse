/**
 * Timesheet Routes
 */

const express = require('express');
const router = express.Router();

// GET /api/timesheets
router.get('/', (req, res) => {
  // Mock timesheet data
  const timesheets = [
    {
      id: 1,
      employee: 'John Doe',
      week: '2025-01-20 to 2025-01-26',
      status: 'submitted',
      totalHours: 40,
      createdAt: '2025-01-26T10:00:00Z'
    },
    {
      id: 2,
      employee: 'Jane Smith',
      week: '2025-01-20 to 2025-01-26',
      status: 'approved',
      totalHours: 38,
      createdAt: '2025-01-25T15:30:00Z'
    }
  ];

  res.json(timesheets);
});

// POST /api/timesheets
router.post('/', (req, res) => {
  const { employee, week, hours, status } = req.body;
  
  const newTimesheet = {
    id: Date.now(),
    employee,
    week,
    totalHours: hours,
    status: status || 'draft',
    createdAt: new Date().toISOString()
  };

  res.status(201).json(newTimesheet);
});

// GET /api/timesheets/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  // Mock timesheet details
  const timesheet = {
    id: parseInt(id),
    employee: 'John Doe',
    week: '2025-01-20 to 2025-01-26',
    status: 'submitted',
    totalHours: 40,
    dailyHours: {
      monday: 8,
      tuesday: 8,
      wednesday: 8,
      thursday: 8,
      friday: 8,
      saturday: 0,
      sunday: 0
    },
    createdAt: '2025-01-26T10:00:00Z'
  };

  res.json(timesheet);
});

module.exports = router;
