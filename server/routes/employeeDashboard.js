const express = require('express');
const router = express.Router();
const { models } = require('../models');
const { Op } = require('sequelize');

const { Employee, Timesheet, Invoice, User } = models;

// Get employee dashboard data
router.get('/', async (req, res) => {
  try {
    const { employeeId, tenantId } = req.query;
    
    if (!employeeId || !tenantId) {
      return res.status(400).json({ 
        error: 'Employee ID and Tenant ID are required' 
      });
    }

    // Get employee details
    const employee = await Employee.findOne({
      where: { 
        id: employeeId,
        tenantId 
      },
      attributes: [
        'id', 'employeeId', 'firstName', 'lastName', 
        'email', 'phone', 'department', 'title', 
        'hourlyRate', 'status'
      ]
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Get current date info
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Get timesheet statistics
    const timesheets = await Timesheet.findAll({
      where: {
        employeeId,
        tenantId,
        weekStartDate: {
          [Op.gte]: startOfMonth
        }
      },
      attributes: [
        'id', 'weekStartDate', 'weekEndDate', 'totalHours', 
        'status', 'submittedAt', 'approvedAt'
      ],
      order: [['weekStartDate', 'DESC']]
    });

    // Calculate timesheet stats
    const totalTimesheets = timesheets.length;
    const pendingTimesheets = timesheets.filter(t => t.status === 'pending').length;
    const approvedTimesheets = timesheets.filter(t => t.status === 'approved').length;
    const rejectedTimesheets = timesheets.filter(t => t.status === 'rejected').length;
    
    // Calculate total hours this month
    const totalHoursThisMonth = timesheets.reduce((sum, t) => {
      return sum + (parseFloat(t.totalHours) || 0);
    }, 0);

    // Get current week timesheet
    const currentWeekTimesheet = timesheets.find(t => {
      const weekStart = new Date(t.weekStartDate);
      return weekStart >= startOfWeek && weekStart <= endOfWeek;
    });

    // Get recent timesheets (last 5)
    const recentTimesheets = timesheets.slice(0, 5).map(t => ({
      id: t.id,
      weekStartDate: t.weekStartDate,
      weekEndDate: t.weekEndDate,
      totalHours: t.totalHours,
      status: t.status,
      submittedAt: t.submittedAt,
      approvedAt: t.approvedAt
    }));

    // Get invoice statistics
    const invoices = await Invoice.findAll({
      where: {
        employeeId,
        tenantId,
        createdAt: {
          [Op.gte]: startOfMonth
        }
      },
      attributes: [
        'id', 'invoiceNumber', 'amount', 'status', 
        'invoiceDate', 'dueDate', 'paidDate'
      ],
      order: [['invoiceDate', 'DESC']]
    });

    // Calculate invoice stats
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(i => i.status === 'paid').length;
    const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'sent').length;
    const overdueInvoices = invoices.filter(i => {
      if (i.status === 'paid') return false;
      const dueDate = new Date(i.dueDate);
      return dueDate < now;
    }).length;

    // Calculate total earnings this month
    const totalEarningsThisMonth = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

    // Calculate pending earnings
    const pendingEarnings = invoices
      .filter(i => i.status !== 'paid')
      .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

    // Get recent invoices (last 5)
    const recentInvoices = invoices.slice(0, 5).map(i => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      amount: i.amount,
      status: i.status,
      invoiceDate: i.invoiceDate,
      dueDate: i.dueDate,
      paidDate: i.paidDate
    }));

    // Prepare dashboard response
    const dashboardData = {
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        department: employee.department,
        title: employee.title,
        hourlyRate: employee.hourlyRate,
        status: employee.status
      },
      timesheets: {
        total: totalTimesheets,
        pending: pendingTimesheets,
        approved: approvedTimesheets,
        rejected: rejectedTimesheets,
        totalHoursThisMonth,
        currentWeek: currentWeekTimesheet ? {
          id: currentWeekTimesheet.id,
          weekStartDate: currentWeekTimesheet.weekStartDate,
          weekEndDate: currentWeekTimesheet.weekEndDate,
          totalHours: currentWeekTimesheet.totalHours,
          status: currentWeekTimesheet.status
        } : null,
        recent: recentTimesheets
      },
      invoices: {
        total: totalInvoices,
        paid: paidInvoices,
        pending: pendingInvoices,
        overdue: overdueInvoices,
        totalEarningsThisMonth,
        pendingEarnings,
        recent: recentInvoices
      },
      summary: {
        hoursThisMonth: totalHoursThisMonth,
        earningsThisMonth: totalEarningsThisMonth,
        pendingEarnings: pendingEarnings,
        averageHourlyRate: employee.hourlyRate || 0,
        estimatedEarnings: totalHoursThisMonth * (employee.hourlyRate || 0)
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching employee dashboard data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      details: error.message 
    });
  }
});

// Get employee timesheet history
router.get('/timesheets', async (req, res) => {
  try {
    const { employeeId, tenantId, limit = 10, offset = 0 } = req.query;
    
    if (!employeeId || !tenantId) {
      return res.status(400).json({ 
        error: 'Employee ID and Tenant ID are required' 
      });
    }

    const timesheets = await Timesheet.findAndCountAll({
      where: {
        employeeId,
        tenantId
      },
      attributes: [
        'id', 'weekStartDate', 'weekEndDate', 'totalHours', 
        'status', 'submittedAt', 'approvedAt', 'rejectedAt',
        'approverComments'
      ],
      order: [['weekStartDate', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      timesheets: timesheets.rows,
      total: timesheets.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching timesheet history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch timesheet history',
      details: error.message 
    });
  }
});

// Get employee invoice history
router.get('/invoices', async (req, res) => {
  try {
    const { employeeId, tenantId, limit = 10, offset = 0 } = req.query;
    
    if (!employeeId || !tenantId) {
      return res.status(400).json({ 
        error: 'Employee ID and Tenant ID are required' 
      });
    }

    const invoices = await Invoice.findAndCountAll({
      where: {
        employeeId,
        tenantId
      },
      attributes: [
        'id', 'invoiceNumber', 'amount', 'status', 
        'invoiceDate', 'dueDate', 'paidDate', 'description'
      ],
      order: [['invoiceDate', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      invoices: invoices.rows,
      total: invoices.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching invoice history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invoice history',
      details: error.message 
    });
  }
});

module.exports = router;
