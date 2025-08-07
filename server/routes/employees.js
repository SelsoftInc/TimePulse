const express = require('express');
const router = express.Router();
const { models } = require('../models');
const { Op } = require('sequelize');

const { Employee, User, Client, Tenant } = models;

// Get all employees for a tenant
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const employees = await Employee.findAll({
      where: { tenantId }
    });

    // Transform the data to match frontend expectations
    const transformedEmployees = employees.map(emp => ({
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      position: emp.position || 'N/A',
      email: emp.email,
      phone: emp.phone || 'N/A',
      status: emp.status || 'active',
      department: emp.department || 'N/A',
      joinDate: emp.startDate || new Date().toISOString(),
      hourlyRate: emp.hourlyRate || 0,
      client: 'Not assigned', // TODO: Add client association
      clientId: null,
      employmentType: emp.employmentType || 'W2',
      vendor: emp.vendor || null,
      vendorId: emp.vendorId || null,
      endClient: emp.endClient ? {
        name: emp.endClient.name || 'N/A',
        location: emp.endClient.location || 'N/A',
        hiringManager: emp.endClient.hiringManager || null
      } : null,
      // Additional fields from database
      employeeId: emp.employeeId,
      ssn: emp.ssn,
      address: emp.address,
      emergencyContact: emp.emergencyContact,
      bankDetails: emp.bankDetails,
      documents: emp.documents
    }));

    res.json({
      success: true,
      employees: transformedEmployees,
      total: transformedEmployees.length
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ 
      error: 'Failed to fetch employees',
      details: error.message 
    });
  }
});

// Get single employee by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    const employee = await Employee.findOne({
      where: { 
        id,
        tenantId 
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'department', 'title']
        },
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'contactPerson', 'email', 'phone']
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Transform the data
    const transformedEmployee = {
      id: employee.id,
      name: employee.user ? `${employee.user.firstName} ${employee.user.lastName}` : 'N/A',
      firstName: employee.user?.firstName || '',
      lastName: employee.user?.lastName || '',
      position: employee.user?.title || employee.position || 'N/A',
      email: employee.user?.email || employee.email,
      phone: employee.phone || 'N/A',
      status: employee.status || 'active',
      department: employee.user?.department || employee.department || 'N/A',
      joinDate: employee.startDate || new Date().toISOString(),
      hourlyRate: employee.hourlyRate || 0,
      client: employee.client?.name || 'Not assigned',
      clientId: employee.clientId,
      employmentType: employee.employmentType || 'W2',
      vendor: employee.vendor || null,
      vendorId: employee.vendorId || null,
      endClient: employee.endClient,
      // Additional detailed fields
      employeeId: employee.employeeId,
      ssn: employee.ssn,
      address: employee.address,
      emergencyContact: employee.emergencyContact,
      bankDetails: employee.bankDetails,
      documents: employee.documents,
      user: employee.user
    };

    res.json({
      success: true,
      employee: transformedEmployee
    });

  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ 
      error: 'Failed to fetch employee',
      details: error.message 
    });
  }
});

// Create new employee
router.post('/', async (req, res) => {
  try {
    const employeeData = req.body;
    
    // Create the employee record
    const employee = await Employee.create(employeeData);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee
    });

  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ 
      error: 'Failed to create employee',
      details: error.message 
    });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    const updateData = req.body;

    const employee = await Employee.findOne({
      where: { id, tenantId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await employee.update(updateData);

    res.json({
      success: true,
      message: 'Employee updated successfully',
      employee
    });

  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ 
      error: 'Failed to update employee',
      details: error.message 
    });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    const employee = await Employee.findOne({
      where: { id, tenantId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await employee.destroy();

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ 
      error: 'Failed to delete employee',
      details: error.message 
    });
  }
});

// Get employee statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const totalEmployees = await Employee.count({
      where: { tenantId }
    });

    const activeEmployees = await Employee.count({
      where: { 
        tenantId,
        status: 'active'
      }
    });

    const employeesByDepartment = await Employee.findAll({
      where: { tenantId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['department']
      }],
      attributes: []
    });

    // Group by department
    const departmentCounts = {};
    employeesByDepartment.forEach(emp => {
      const dept = emp.user?.department || 'Unassigned';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });

    const employeesByType = await Employee.findAll({
      where: { tenantId },
      attributes: ['employmentType'],
      group: ['employmentType']
    });

    res.json({
      success: true,
      stats: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: totalEmployees - activeEmployees,
        byDepartment: departmentCounts,
        byEmploymentType: employeesByType.reduce((acc, emp) => {
          acc[emp.employmentType || 'W2'] = (acc[emp.employmentType || 'W2'] || 0) + 1;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Error fetching employee stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch employee statistics',
      details: error.message 
    });
  }
});

module.exports = router;
