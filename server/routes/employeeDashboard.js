const express = require('express');
const router = express.Router();
const { models } = require('../models');
const { Op } = require('sequelize');

const { Employee, Timesheet, User, Client } = models;
const Invoice = models.Invoice || null;

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
    
    // Get timesheets from last 3 months for better dashboard view
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    // Get timesheet statistics
    console.log('🔍 Fetching timesheets for:', { employeeId, tenantId, startDate: threeMonthsAgo });
    const timesheets = await Timesheet.findAll({
      where: {
        employeeId,
        tenantId,
        weekStart: {
          [Op.gte]: threeMonthsAgo
        }
      },
      attributes: [
        'id', 'weekStart', 'weekEnd', 'totalHours', 
        'status', 'submittedAt', 'approvedAt', 'clientId'
      ],
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'clientName'],
          required: false
        }
      ],
      order: [['weekStart', 'DESC']]
    });
    console.log('📊 Found timesheets:', timesheets.length);
    console.log('📋 Timesheet details:', timesheets.map(t => ({
      id: t.id,
      weekStart: t.weekStart,
      hours: t.totalHours,
      status: t.status,
      client: t.client?.clientName
    })));

    // Calculate timesheet stats (all timesheets from last 3 months)
    const totalTimesheets = timesheets.length;
    const pendingTimesheets = timesheets.filter(t => t.status === 'submitted').length;
    const approvedTimesheets = timesheets.filter(t => t.status === 'approved').length;
    const rejectedTimesheets = timesheets.filter(t => t.status === 'rejected').length;
    
    // Calculate total hours for ALL timesheets (last 3 months)
    const totalHoursAllTime = timesheets.reduce((sum, t) => {
      const hours = parseFloat(t.totalHours) || 0;
      console.log(`  Adding ${hours} hours from timesheet ${t.id}`);
      return sum + hours;
    }, 0);
    console.log('💰 Total Hours All Time:', totalHoursAllTime);
    
    // Calculate total hours THIS MONTH only
    const thisMonthTimesheets = timesheets.filter(t => {
      const weekStart = new Date(t.weekStart);
      return weekStart >= startOfMonth;
    });
    console.log('📅 This Month Timesheets:', thisMonthTimesheets.length);
    const totalHoursThisMonth = thisMonthTimesheets.reduce((sum, t) => {
      return sum + (parseFloat(t.totalHours) || 0);
    }, 0);
    console.log('💰 Total Hours This Month:', totalHoursThisMonth);

    // Get current week timesheet
    const currentWeekTimesheet = timesheets.find(t => {
      const weekStart = new Date(t.weekStart);
      return weekStart >= startOfWeek && weekStart <= endOfWeek;
    });
    
    // Calculate this week's hours
    const thisWeekHours = currentWeekTimesheet ? parseFloat(currentWeekTimesheet.totalHours) || 0 : 0;
    console.log('💰 This Week Hours:', thisWeekHours);

    // Get recent timesheets (last 5)
    const recentTimesheets = timesheets.slice(0, 5).map(t => ({
      id: t.id,
      weekStartDate: t.weekStart,
      weekEndDate: t.weekEnd,
      totalHours: t.totalHours,
      status: t.status,
      submittedAt: t.submittedAt,
      approvedAt: t.approvedAt,
      clientId: t.clientId,
      clientName: t.client?.clientName || 'N/A',
      projectName: 'N/A'
    }));

    // Get invoice statistics (if Invoice model exists)
    let invoices = [];
    let totalInvoices = 0;
    let paidInvoices = 0;
    let pendingInvoices = 0;
    let overdueInvoices = 0;
    let totalEarningsThisMonth = 0;
    let pendingEarnings = 0;
    let recentInvoices = [];

    if (Invoice) {
      try {
        invoices = await Invoice.findAll({
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
        totalInvoices = invoices.length;
        paidInvoices = invoices.filter(i => i.status === 'paid').length;
        pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'sent').length;
        overdueInvoices = invoices.filter(i => {
          if (i.status === 'paid') return false;
          const dueDate = new Date(i.dueDate);
          return dueDate < now;
        }).length;

        // Calculate total earnings this month
        totalEarningsThisMonth = invoices
          .filter(i => i.status === 'paid')
          .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

        // Calculate pending earnings
        pendingEarnings = invoices
          .filter(i => i.status !== 'paid')
          .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

        // Get recent invoices (last 5)
        recentInvoices = invoices.slice(0, 5).map(i => ({
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          amount: i.amount,
          status: i.status,
          invoiceDate: i.invoiceDate,
          dueDate: i.dueDate,
          paidDate: i.paidDate
        }));
      } catch (invoiceError) {
        console.warn('Invoice query error (non-critical):', invoiceError.message);
      }
    }

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
        totalHoursAllTime,
        totalHoursThisMonth,
        thisWeekHours,
        currentWeek: currentWeekTimesheet ? {
          id: currentWeekTimesheet.id,
          weekStartDate: currentWeekTimesheet.weekStart,
          weekEndDate: currentWeekTimesheet.weekEnd,
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

    console.log('✅ Sending dashboard response:', {
      total: totalTimesheets,
      pending: pendingTimesheets,
      approved: approvedTimesheets,
      rejected: rejectedTimesheets,
      totalHoursAllTime: totalHoursAllTime,
      totalHoursThisMonth: totalHoursThisMonth,
      recentCount: recentTimesheets.length
    });

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
        'id', 'weekStart', 'weekEnd', 'totalHours', 
        'status', 'submittedAt', 'approvedAt', 'rejectionReason'
      ],
      order: [['weekStart', 'DESC']],
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

    if (!Invoice) {
      return res.json({
        success: true,
        invoices: [],
        total: 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
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

// Get admin dashboard data (aggregated from all employees)
router.get('/admin', async (req, res) => {
  try {
    const { tenantId } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({ 
        error: 'Tenant ID is required' 
      });
    }

    console.log('🔍 Fetching admin dashboard for tenant:', tenantId);

    // Get current date info
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Get all timesheets for the tenant (last 3 months)
    const timesheets = await Timesheet.findAll({
      where: {
        tenantId,
        weekStart: {
          [Op.gte]: threeMonthsAgo
        }
      },
      attributes: [
        'id', 'weekStart', 'weekEnd', 'totalHours', 
        'status', 'submittedAt', 'approvedAt', 'clientId', 'employeeId'
      ],
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'clientName'],
          required: false
        },
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'firstName', 'lastName', 'employeeId'],
          required: false
        }
      ],
      order: [['weekStart', 'DESC']]
    });

    console.log('📊 Found timesheets for all employees:', timesheets.length);

    // Calculate timesheet stats
    const totalTimesheets = timesheets.length;
    const pendingTimesheets = timesheets.filter(t => t.status === 'submitted').length;
    const approvedTimesheets = timesheets.filter(t => t.status === 'approved').length;
    const rejectedTimesheets = timesheets.filter(t => t.status === 'rejected').length;
    
    // Calculate total hours for ALL timesheets
    const totalHoursAllTime = timesheets.reduce((sum, t) => {
      return sum + (parseFloat(t.totalHours) || 0);
    }, 0);
    
    // Calculate total hours THIS MONTH only
    const thisMonthTimesheets = timesheets.filter(t => {
      const weekStart = new Date(t.weekStart);
      return weekStart >= startOfMonth;
    });
    const totalHoursThisMonth = thisMonthTimesheets.reduce((sum, t) => {
      return sum + (parseFloat(t.totalHours) || 0);
    }, 0);

    // Calculate this week's hours
    const thisWeekTimesheets = timesheets.filter(t => {
      const weekStart = new Date(t.weekStart);
      return weekStart >= startOfWeek && weekStart <= endOfWeek;
    });
    const thisWeekHours = thisWeekTimesheets.reduce((sum, t) => {
      return sum + (parseFloat(t.totalHours) || 0);
    }, 0);

    // Get recent timesheets (last 10 for admin)
    const recentTimesheets = timesheets.slice(0, 10).map(t => ({
      id: t.id,
      weekStartDate: t.weekStart,
      weekEndDate: t.weekEnd,
      totalHours: t.totalHours,
      status: t.status,
      submittedAt: t.submittedAt,
      approvedAt: t.approvedAt,
      clientId: t.clientId,
      clientName: t.client?.clientName || 'N/A',
      projectName: 'N/A',
      employeeId: t.employeeId,
      employeeName: t.employee ? `${t.employee.firstName} ${t.employee.lastName}` : 'Unknown',
      employeeCode: t.employee?.employeeId || 'N/A'
    }));

    console.log('✅ Admin Dashboard Stats:', {
      total: totalTimesheets,
      pending: pendingTimesheets,
      approved: approvedTimesheets,
      rejected: rejectedTimesheets,
      totalHoursAllTime,
      totalHoursThisMonth,
      thisWeekHours
    });

    // Prepare dashboard response
    const dashboardData = {
      timesheets: {
        total: totalTimesheets,
        pending: pendingTimesheets,
        approved: approvedTimesheets,
        rejected: rejectedTimesheets,
        totalHoursAllTime,
        totalHoursThisMonth,
        thisWeekHours,
        recent: recentTimesheets
      },
      summary: {
        hoursThisMonth: totalHoursThisMonth,
        hoursThisWeek: thisWeekHours,
        totalEmployees: await Employee.count({ where: { tenantId } })
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch admin dashboard data',
      details: error.message 
    });
  }
});

module.exports = router;
