const express = require('express');
const router = express.Router();
const { models } = require('../models');
const { Employee, Timesheet, Invoice, Client, Vendor, LeaveRequest, User } = models;
const { Op } = require('sequelize');

router.get('/global', async (req, res) => {
  try {
    const { query, tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        results: {
          navigation: [],
          employees: [],
          timesheets: [],
          invoices: [],
          leaveRequests: [],
          clients: [],
          vendors: []
        }
      });
    }

    const searchTerm = query.trim().toLowerCase();
    const results = {
      navigation: [],
      employees: [],
      timesheets: [],
      invoices: [],
      leaveRequests: [],
      clients: [],
      vendors: []
    };

    // Navigation suggestions (static menu items)
    const navigationItems = [
      { label: 'Dashboard', path: '/dashboard', icon: 'fa-home', keywords: ['dashboard', 'home', 'overview'] },
      { label: 'Timesheets', path: '/timesheets', icon: 'fa-clock', keywords: ['timesheet', 'time', 'hours', 'submit'] },
      { label: 'Timesheet Approval', path: '/timesheets/approval', icon: 'fa-check-circle', keywords: ['approval', 'approve', 'timesheet approval', 'pending'] },
      { label: 'Invoices', path: '/invoices', icon: 'fa-file-invoice', keywords: ['invoice', 'billing', 'payment'] },
      { label: 'Employees', path: '/employees', icon: 'fa-users', keywords: ['employee', 'staff', 'team', 'people'] },
      { label: 'Vendors', path: '/vendors', icon: 'fa-handshake', keywords: ['vendor', 'supplier', 'contractor'] },
      { label: 'End Clients', path: '/clients', icon: 'fa-building', keywords: ['client', 'customer', 'end client'] },
      { label: 'Implementation Partners', path: '/impl-partners', icon: 'fa-users-cog', keywords: ['partner', 'implementation', 'impl partner'] },
      { label: 'Leave Management', path: '/leave-management', icon: 'fa-calendar-alt', keywords: ['leave', 'vacation', 'time off', 'pto', 'holiday'] },
      { label: 'Reports', path: '/reports', icon: 'fa-chart-bar', keywords: ['report', 'analytics', 'statistics'] },
      { label: 'Settings', path: '/settings', icon: 'fa-cog', keywords: ['settings', 'configuration', 'preferences'] }
    ];

    results.navigation = navigationItems.filter(item => 
      item.keywords.some(keyword => keyword.includes(searchTerm)) ||
      item.label.toLowerCase().includes(searchTerm)
    ).map(item => ({
      type: 'navigation',
      label: item.label,
      path: item.path,
      icon: item.icon
    }));

    // Search Employees
    try {
      const employees = await Employee.findAll({
        where: {
          tenantId,
          [Op.or]: [
            { firstName: { [Op.like]: `%${searchTerm}%` } },
            { lastName: { [Op.like]: `%${searchTerm}%` } },
            { department: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        limit: 5,
        attributes: ['id', 'firstName', 'lastName', 'email', 'department', 'status']
      });

      results.employees = employees.map(emp => ({
        type: 'employee',
        id: emp.id,
        label: `${emp.firstName} ${emp.lastName}`,
        subtitle: emp.email || 'No email',
        department: emp.department,
        status: emp.status,
        icon: 'fa-user'
      }));
    } catch (error) {
      console.error('Employee search error:', error.message);
      results.employees = [];
    }

    // Search Timesheets (by employee name only - status is ENUM)
    try {
      const timesheets = await Timesheet.findAll({
        where: {
          tenantId,
          employeeName: { [Op.like]: `%${searchTerm}%` }
        },
        limit: 5,
        attributes: ['id', 'employeeName', 'status', 'totalHours', 'weekStart', 'weekEnd'],
        order: [['weekStart', 'DESC']]
      });

      results.timesheets = timesheets.map(ts => {
        const weekStart = new Date(ts.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const weekEnd = new Date(ts.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return {
          type: 'timesheet',
          id: ts.id,
          label: `${ts.employeeName} - ${weekStart} – ${weekEnd}`,
          subtitle: `Status: ${ts.status} | Hours: ${ts.totalHours || 0}`,
          status: ts.status,
          employeeName: ts.employeeName,
          icon: 'fa-clock'
        };
      });
    } catch (error) {
      console.error('Timesheet search error:', error.message);
      results.timesheets = [];
    }

    // Search Invoices (by invoice number)
    try {
      const invoices = await Invoice.findAll({
        where: {
          tenantId,
          invoiceNumber: { [Op.like]: `%${searchTerm}%` }
        },
        limit: 5,
        attributes: ['id', 'invoiceNumber', 'totalAmount', 'paymentStatus', 'invoiceDate'],
        order: [['invoiceDate', 'DESC']]
      });

      results.invoices = invoices.map(inv => ({
        type: 'invoice',
        id: inv.id,
        label: `Invoice #${inv.invoiceNumber}`,
        subtitle: `$${inv.totalAmount} | ${inv.paymentStatus}`,
        status: inv.paymentStatus,
        icon: 'fa-file-invoice'
      }));
    } catch (error) {
      console.error('Invoice search error:', error.message);
      results.invoices = [];
    }

    // Search Leave Requests (by leave type - status is ENUM)
    try {
      const leaveRequests = await LeaveRequest.findAll({
        where: {
          tenantId,
          leaveType: { [Op.like]: `%${searchTerm}%` }
        },
        limit: 5,
        attributes: ['id', 'leaveType', 'startDate', 'endDate', 'status', 'employeeId'],
        order: [['startDate', 'DESC']]
      });

      results.leaveRequests = leaveRequests.map(leave => ({
        type: 'leave',
        id: leave.employeeId,
        label: `${leave.leaveType} Leave Request`,
        subtitle: `${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} | ${leave.status}`,
        status: leave.status,
        icon: 'fa-calendar-alt'
      }));
    } catch (error) {
      console.error('Leave request search error:', error.message);
      results.leaveRequests = [];
    }

    // Search Clients
    try {
      const clients = await Client.findAll({
        where: {
          tenantId,
          [Op.or]: [
            { clientName: { [Op.like]: `%${searchTerm}%` } },
            { contactPerson: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        limit: 5,
        attributes: ['id', 'clientName', 'email', 'contactPerson', 'phone']
      });

      results.clients = clients.map(client => ({
        type: 'client',
        id: client.id,
        label: client.clientName,
        subtitle: `${client.contactPerson || 'No contact'} | ${client.email || 'No email'}`,
        icon: 'fa-building'
      }));
    } catch (error) {
      console.error('Client search error:', error.message);
      results.clients = [];
    }

    // Search Vendors
    try {
      const vendors = await Vendor.findAll({
        where: {
          tenantId,
          [Op.or]: [
            { name: { [Op.like]: `%${searchTerm}%` } },
            { contactPerson: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        limit: 5,
        attributes: ['id', 'name', 'email', 'contactPerson', 'phone']
      });

      results.vendors = vendors.map(vendor => ({
        type: 'vendor',
        id: vendor.id,
        label: vendor.name,
        subtitle: `${vendor.contactPerson || 'No contact'} | ${vendor.email || 'No email'}`,
        icon: 'fa-handshake'
      }));
    } catch (error) {
      console.error('Vendor search error:', error.message);
      results.vendors = [];
    }

    res.json({
      success: true,
      results,
      totalResults: 
        results.navigation.length +
        results.employees.length +
        results.timesheets.length +
        results.invoices.length +
        results.leaveRequests.length +
        results.clients.length +
        results.vendors.length
    });

  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing search',
      error: error.message
    });
  }
});

module.exports = router;
