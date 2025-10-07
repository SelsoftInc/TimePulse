/**
 * Timesheet Routes - DB backed
 */

const express = require('express');
const router = express.Router();
const { models } = require('../models');
const { Op } = require('sequelize');

// Helpers
// Format date as YYYY-MM-DD in local time to avoid UTC shift issues
const toDateOnly = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const getWeekRangeMonToSun = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun - 6 Sat
  const diffToMon = (day === 0 ? -6 : 1) - day; // move to Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { weekStart: toDateOnly(monday), weekEnd: toDateOnly(sunday) };
};

// GET /api/timesheets/employees/by-email/:email?tenantId=...
// Get employee by email (fallback for when employeeId is not in user object)
router.get('/employees/by-email/:email', async (req, res, next) => {
  try {
    const { email } = req.params;
    const { tenantId } = req.query;
    
    if (!tenantId || !email) {
      return res.status(400).json({ success: false, message: 'tenantId and email are required' });
    }

    const employee = await models.Employee.findOne({
      where: {
        email: email.toLowerCase(),
        tenantId
      },
      attributes: ['id', 'firstName', 'lastName', 'email']
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({
      success: true,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/timesheets/current?tenantId=...
// Ensures a draft timesheet exists for each employee for the current week
router.get('/current', async (req, res, next) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ success: false, message: 'tenantId is required' });

    const { weekStart, weekEnd } = getWeekRangeMonToSun(new Date());

    // Get employees for tenant
    const employees = await models.Employee.findAll({
      where: { tenantId },
      attributes: ['id', 'firstName', 'lastName', 'employeeId', 'clientId', 'title', 'status']
    });

    // Ensure a timesheet exists for each employee for this week
    const ensurePromises = employees.map((emp) =>
      models.Timesheet.findOrCreate({
        where: { tenantId, employeeId: emp.id, weekStart, weekEnd },
        defaults: {
          tenantId,
          employeeId: emp.id,
          clientId: emp.clientId || null,
          weekStart,
          weekEnd,
          dailyHours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
          totalHours: 0,
          status: 'draft'
        }
      })
    );
    await Promise.all(ensurePromises);

    // Fetch with joins for response
    let rows = [];
    try {
      rows = await models.Timesheet.findAll({
        where: { tenantId, weekStart, weekEnd },
        include: [
          { model: models.Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'title'] },
          { model: models.Client, as: 'client', attributes: ['id', 'clientName'] },
          { model: models.User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email', 'role'], required: false }
        ],
        order: [[{ model: models.Employee, as: 'employee' }, 'firstName', 'ASC']]
      });
    } catch (dbErr) {
      // Graceful fallback if DB schema doesn't match expected column names (e.g., 42703 missing column)
      const code = dbErr?.original?.code || dbErr?.parent?.code;
      if (code === '42703') {
        return res.json({ success: true, weekStart, weekEnd, timesheets: [] });
      }
      throw dbErr;
    }

    const result = rows.map((r) => ({
      id: r.id,
      employee: {
        id: r.employee?.id,
        name: `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
        role: r.employee?.title || 'Employee'
      },
      client: r.client?.clientName || 'No client assigned',
      project: r.client ? `Project for ${r.client.clientName}` : 'No project assigned',
      week: `${new Date(r.weekStart).toLocaleString('en-US', { month: 'short' })} ${new Date(r.weekStart).getDate()} - ${new Date(r.weekEnd).toLocaleString('en-US', { month: 'short' })} ${new Date(r.weekEnd).getDate()}`,
      weekStart: r.weekStart,
      weekEnd: r.weekEnd,
      hours: Number(r.totalHours).toFixed(1),
      status: { label: r.status.replace('_', ' ').toUpperCase(), color: r.status === 'approved' ? 'success' : r.status === 'submitted' ? 'warning' : 'secondary' },
      dailyHours: r.dailyHours
    }));

    res.json({ success: true, weekStart, weekEnd, timesheets: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/timesheets/pending-approval?tenantId=...&reviewerId=...
// Get timesheets pending approval for a specific reviewer
router.get('/pending-approval', async (req, res, next) => {
  try {
    const { tenantId, reviewerId } = req.query;
    
    console.log('📡 /api/timesheets/pending-approval called');
    console.log('  Query params:', { tenantId, reviewerId });
    
    if (!tenantId) {
      console.error('❌ Missing tenantId');
      return res.status(400).json({ success: false, message: 'tenantId is required' });
    }

    const whereClause = {
      tenantId,
      status: 'submitted'
    };

    // If reviewerId is provided, filter by it
    if (reviewerId) {
      whereClause.reviewerId = reviewerId;
    }

    console.log('  Where clause:', whereClause);

    const timesheets = await models.Timesheet.findAll({
      where: whereClause,
      include: [
        { 
          model: models.Employee, 
          as: 'employee', 
          attributes: ['id', 'firstName', 'lastName', 'email', 'department', 'title'] 
        },
        { 
          model: models.Client, 
          as: 'client', 
          attributes: ['id', 'clientName', 'clientType'],
          required: false
        },
        { 
          model: models.User, 
          as: 'reviewer', 
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'], 
          required: false 
        }
      ],
      order: [['submitted_at', 'DESC']]
    });

    console.log(`  Found ${timesheets.length} timesheets with status 'submitted'`);

    const formattedTimesheets = timesheets.map(ts => ({
      id: ts.id,
      employeeName: `${ts.employee?.firstName || ''} ${ts.employee?.lastName || ''}`.trim(),
      employeeEmail: ts.employee?.email,
      department: ts.employee?.department,
      weekRange: `${new Date(ts.weekStart).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} To ${new Date(ts.weekEnd).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      weekStart: ts.weekStart,
      weekEnd: ts.weekEnd,
      status: ts.status,
      billableProjectHrs: Number(ts.totalHours).toFixed(2),
      timeOffHolidayHrs: '0.00',
      totalTimeHours: Number(ts.totalHours).toFixed(2),
      attachments: ts.attachments || [],
      notes: ts.notes || '',
      submittedDate: ts.submittedAt ? new Date(ts.submittedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
      clientName: ts.client?.clientName || 'No Client',
      clientType: ts.client?.clientType || 'N/A',
      reviewer: ts.reviewer ? {
        name: `${ts.reviewer.firstName} ${ts.reviewer.lastName}`,
        email: ts.reviewer.email,
        role: ts.reviewer.role
      } : null
    }));

    console.log(`  Returning ${formattedTimesheets.length} formatted timesheets`);
    res.json({ success: true, timesheets: formattedTimesheets });
  } catch (err) {
    console.error('❌ Error in /api/timesheets/pending-approval:', err);
    next(err);
  }
});

// GET /api/timesheets/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await models.Timesheet.findByPk(id, {
      include: [
        { model: models.Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'title'] },
        { model: models.Client, as: 'client', attributes: ['id', 'clientName'] }
      ]
    });
    if (!row) return res.status(404).json({ success: false, message: 'Timesheet not found' });
    res.json({ success: true, timesheet: row });
  } catch (err) {
    next(err);
  }
});

// PUT /api/timesheets/:id - update hours/status
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { dailyHours, status, clientId, notes, attachments, reviewerId, approvedBy, rejectionReason } = req.body || {};

    const row = await models.Timesheet.findByPk(id);
    if (!row) return res.status(404).json({ success: false, message: 'Timesheet not found' });

    if (dailyHours && typeof dailyHours === 'object') {
      const total = ['mon','tue','wed','thu','fri','sat','sun']
        .map((k) => Number(dailyHours[k] || 0))
        .reduce((a, b) => a + b, 0);
      row.dailyHours = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, ...dailyHours };
      row.totalHours = Number(total.toFixed(2));
    }
    if (status) {
      row.status = status;
      if (status === 'submitted') {
        row.submittedAt = new Date();
      } else if (status === 'approved') {
        row.approvedAt = new Date();
        if (approvedBy) row.approvedBy = approvedBy;
      } else if (status === 'rejected') {
        if (rejectionReason) row.rejectionReason = rejectionReason;
      }
    }
    if (clientId !== undefined) row.clientId = clientId || null;
    if (notes !== undefined) row.notes = notes;
    if (attachments !== undefined) row.attachments = attachments;
    if (reviewerId !== undefined) row.reviewerId = reviewerId || null;

    await row.save();
    res.json({ success: true, timesheet: row, message: 'Timesheet updated successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/timesheets/employee/:employeeId/current?tenantId=...
// Get current week's timesheet for a specific employee
router.get('/employee/:employeeId/current', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { tenantId } = req.query;
    
    if (!tenantId) return res.status(400).json({ success: false, message: 'tenantId is required' });

    const { weekStart, weekEnd } = getWeekRangeMonToSun(new Date());

    // Get employee details
    const employee = await models.Employee.findOne({
      where: { id: employeeId, tenantId },
      include: [
        { model: models.Client, as: 'client', attributes: ['id', 'clientName'] }
      ]
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Find or create timesheet for current week
    const [timesheet, created] = await models.Timesheet.findOrCreate({
      where: { 
        tenantId, 
        employeeId, 
        weekStart, 
        weekEnd 
      },
      defaults: {
        tenantId,
        employeeId,
        clientId: employee.clientId || null,
        weekStart,
        weekEnd,
        dailyHours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
        totalHours: 0,
        status: 'draft'
      }
    });

    // Format response
    const response = {
      id: timesheet.id,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email
      },
      client: employee.client ? {
        id: employee.client.id,
        name: employee.client.clientName
      } : null,
      weekStart: timesheet.weekStart,
      weekEnd: timesheet.weekEnd,
      weekLabel: `${new Date(timesheet.weekStart).toLocaleString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(timesheet.weekEnd).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      dailyHours: timesheet.dailyHours,
      totalHours: Number(timesheet.totalHours),
      status: timesheet.status,
      notes: timesheet.notes,
      attachments: timesheet.attachments || [],
      submittedAt: timesheet.submittedAt,
      created: created
    };

    res.json({ success: true, timesheet: response });
  } catch (err) {
    next(err);
  }
});

// GET /api/timesheets/employee/:employeeId/all?tenantId=...
// Get all timesheets for a specific employee
router.get('/employee/:employeeId/all', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { tenantId } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'tenantId is required' });
    }

    const timesheets = await models.Timesheet.findAll({
      where: { 
        tenantId,
        employeeId 
      },
      include: [
        { model: models.Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'title'] },
        { model: models.Client, as: 'client', attributes: ['id', 'clientName'] },
        { model: models.User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email', 'role'], required: false }
      ],
      order: [['weekStart', 'DESC']]
    });

    const formattedTimesheets = timesheets.map((r) => ({
      id: r.id,
      employee: {
        id: r.employee?.id,
        name: `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
        role: r.employee?.title || 'Employee'
      },
      client: r.client?.clientName || 'No client assigned',
      project: r.client ? `Project for ${r.client.clientName}` : 'No project assigned',
      week: `${new Date(r.weekStart).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} To ${new Date(r.weekEnd).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}`,
      weekStart: r.weekStart,
      weekEnd: r.weekEnd,
      hours: Number(r.totalHours).toFixed(2),
      status: { 
        label: r.status.replace('_', ' ').toUpperCase(), 
        color: r.status === 'approved' ? 'success' : r.status === 'submitted' ? 'warning' : 'secondary' 
      },
      dailyHours: r.dailyHours,
      notes: r.notes,
      submittedAt: r.submittedAt,
      approvedAt: r.approvedAt,
      reviewer: r.reviewer ? {
        id: r.reviewer.id,
        name: `${r.reviewer.firstName} ${r.reviewer.lastName}`,
        email: r.reviewer.email,
        role: r.reviewer.role
      } : null
    }));

    res.json({ success: true, timesheets: formattedTimesheets });
  } catch (err) {
    next(err);
  }
});

// GET /api/employees/by-email/:email?tenantId=...
// Get employee by email (fallback for when employeeId is not in user object)
router.get('/employees/by-email/:email', async (req, res, next) => {
  try {
    const { email } = req.params;
    const { tenantId } = req.query;
    
    if (!tenantId || !email) {
      return res.status(400).json({ success: false, message: 'tenantId and email are required' });
    }

    const employee = await models.Employee.findOne({
      where: {
        email: email.toLowerCase(),
        tenantId
      },
      attributes: ['id', 'firstName', 'lastName', 'email']
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({
      success: true,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/timesheets/reviewers?tenantId=...
// Get list of users who can review timesheets (admins and managers)
router.get('/reviewers', async (req, res, next) => {
  try {
    const { tenantId } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'tenantId is required' });
    }

    const reviewers = await models.User.findAll({
      where: {
        tenantId,
        role: { [Op.in]: ['admin', 'manager'] },
        status: 'active'
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
      order: [['firstName', 'ASC'], ['lastName', 'ASC']]
    });

    const formattedReviewers = reviewers.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role
    }));

    res.json({ success: true, reviewers: formattedReviewers });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
