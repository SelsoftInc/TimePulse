/**
 * Delete Dummy Employee Data
 * Removes all timesheets and invoices for Uma Sivalingam, Lalitha Prabhu, and Asvini .V
 */

const { models, connectDB, sequelize } = require('../models');
const { Op } = require('sequelize');

async function deleteDummyEmployeeData() {
  try {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   DELETE DUMMY EMPLOYEE DATA                       ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    await connectDB();
    console.log('✅ Database connected\n');

    // Employee names to search for
    const employeeNames = [
      'Uma Sivalingam',
      'Lalitha Prabhu',
      'Asvini .V',
      'Asvini V',
      'Aswini'
    ];

    console.log('🔍 Step 1: Finding employees by name...\n');
    
    // Find employees by name (search in both firstName and lastName)
    const employees = await models.Employee.findAll({
      where: {
        [Op.or]: [
          // Search for "Uma Sivalingam"
          {
            [Op.and]: [
              { firstName: { [Op.iLike]: '%Uma%' } },
              { lastName: { [Op.iLike]: '%Sivalingam%' } }
            ]
          },
          // Search for "Lalitha Prabhu"
          {
            [Op.and]: [
              { firstName: { [Op.iLike]: '%Lalitha%' } },
              { lastName: { [Op.iLike]: '%Prabhu%' } }
            ]
          },
          // Search for "Asvini" or "Aswini"
          {
            [Op.or]: [
              { firstName: { [Op.iLike]: '%Asvini%' } },
              { firstName: { [Op.iLike]: '%Aswini%' } }
            ]
          }
        ]
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'tenantId']
    });

    if (employees.length === 0) {
      console.log('⚠️  No matching employees found');
      process.exit(0);
    }

    console.log(`Found ${employees.length} employee(s):\n`);
    employees.forEach((emp, index) => {
      console.log(`   ${index + 1}. ${emp.firstName} ${emp.lastName}`);
      console.log(`      ID: ${emp.id}`);
      console.log(`      Email: ${emp.email}`);
      console.log(`      Tenant ID: ${emp.tenantId}`);
      console.log('');
    });

    const employeeIds = employees.map(e => e.id);

    console.log('⚠️  WARNING: This will DELETE all timesheets and invoices for these employees!\n');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 2: Find and delete timesheets
    console.log('🔍 Step 2: Finding timesheets for these employees...\n');
    
    const timesheets = await models.Timesheet.findAll({
      where: {
        employeeId: { [Op.in]: employeeIds }
      },
      attributes: ['id', 'employeeId', 'weekStart', 'weekEnd', 'totalHours', 'status']
    });

    console.log(`Found ${timesheets.length} timesheet(s)\n`);
    
    if (timesheets.length > 0) {
      console.log('Sample timesheets:');
      timesheets.slice(0, 5).forEach(ts => {
        console.log(`   - Week: ${ts.weekStart} to ${ts.weekEnd}, Hours: ${ts.totalHours}, Status: ${ts.status}`);
      });
      console.log('');

      console.log('🗑️  Deleting timesheets...\n');
      const deletedTimesheets = await models.Timesheet.destroy({
        where: {
          employeeId: { [Op.in]: employeeIds }
        }
      });
      console.log(`✅ Deleted ${deletedTimesheets} timesheet(s)\n`);
    }

    // Step 3: Find and delete invoices
    console.log('🔍 Step 3: Finding invoices for these employees...\n');
    
    // Find invoices by employeeId (more reliable than name/email)
    const invoices = await models.Invoice.findAll({
      where: {
        employeeId: { [Op.in]: employeeIds }
      },
      attributes: ['id', 'invoiceNumber', 'employeeId', 'totalAmount', 'status']
    });

    console.log(`Found ${invoices.length} invoice(s)\n`);
    
    if (invoices.length > 0) {
      console.log('Sample invoices:');
      invoices.slice(0, 5).forEach(inv => {
        const employeeName = employees.find(e => e.id === inv.employeeId);
        const displayName = employeeName ? `${employeeName.firstName} ${employeeName.lastName}` : 'Unknown';
        console.log(`   - ${inv.invoiceNumber}: ${displayName}, $${inv.totalAmount}, ${inv.status}`);
      });
      console.log('');

      console.log('🗑️  Deleting invoices...\n');
      const deletedInvoices = await models.Invoice.destroy({
        where: {
          employeeId: { [Op.in]: employeeIds }
        }
      });
      console.log(`✅ Deleted ${deletedInvoices} invoice(s)\n`);
    }

    // Step 4: Verification
    console.log('🔍 Step 4: Verifying deletion...\n');
    
    const remainingTimesheets = await models.Timesheet.count({
      where: {
        employeeId: { [Op.in]: employeeIds }
      }
    });

    const remainingInvoices = await models.Invoice.count({
      where: {
        employeeId: { [Op.in]: employeeIds }
      }
    });

    console.log('Verification Results:');
    console.log(`   - Remaining timesheets: ${remainingTimesheets}`);
    console.log(`   - Remaining invoices: ${remainingInvoices}`);
    console.log('');

    if (remainingTimesheets === 0 && remainingInvoices === 0) {
      console.log('✅ All data successfully deleted!\n');
    } else {
      console.log('⚠️  Warning: Some data may still remain\n');
    }

    console.log('📊 Summary:');
    console.log(`   - Employees found: ${employees.length}`);
    console.log(`   - Timesheets deleted: ${timesheets.length}`);
    console.log(`   - Invoices deleted: ${invoices.length}`);
    console.log('');

    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   DELETION COMPLETED                               ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log('ℹ️  Note: The employee records themselves are NOT deleted.');
    console.log('   Only their timesheets and invoices have been removed.\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
deleteDummyEmployeeData();
