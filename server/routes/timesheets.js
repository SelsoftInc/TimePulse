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
          { model: models.Client, as: 'client', attributes: ['id', 'clientName'] }
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
    const { dailyHours, status, clientId } = req.body || {};

    const row = await models.Timesheet.findByPk(id);
    if (!row) return res.status(404).json({ success: false, message: 'Timesheet not found' });

    if (dailyHours && typeof dailyHours === 'object') {
      const total = ['mon','tue','wed','thu','fri','sat','sun']
        .map((k) => Number(dailyHours[k] || 0))
        .reduce((a, b) => a + b, 0);
      row.dailyHours = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0, ...dailyHours };
      row.totalHours = Number(total.toFixed(2));
    }
    if (status) row.status = status;
    if (clientId !== undefined) row.clientId = clientId || null;

    await row.save();
    res.json({ success: true, timesheet: row });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
