/**
 * Delete Duplicate Shanmugavel Employee
 * Finds duplicate employees named Shanmugavel and keeps only the oldest record
 */

const { models, connectDB } = require('../models');
const { Op } = require('sequelize');

async function deleteDuplicateShanmugavel() {
  try {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   DELETE DUPLICATE SHANMUGAVEL EMPLOYEE           ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    await connectDB();
    console.log('✅ Database connected\n');

    console.log('🔍 Step 1: Finding Shanmugavel employees...\n');
    
    // Find all employees with name containing "Shanmugavel"
    const employees = await models.Employee.findAll({
      where: {
        [Op.or]: [
          { firstName: { [Op.iLike]: '%Shanmugavel%' } },
          { lastName: { [Op.iLike]: '%Shanmugavel%' } }
        ]
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt', 'userId'],
      order: [['createdAt', 'ASC']] // Oldest first
    });

    if (employees.length === 0) {
      console.log('⚠️  No Shanmugavel employees found');
      process.exit(0);
    }

    if (employees.length === 1) {
      console.log('✅ Only one Shanmugavel employee found - no duplicates to delete');
      process.exit(0);
    }

    console.log(`Found ${employees.length} Shanmugavel employees:\n`);
    employees.forEach((emp, index) => {
      console.log(`   ${index + 1}. ${emp.firstName} ${emp.lastName}`);
      console.log(`      ID: ${emp.id}`);
      console.log(`      Email: ${emp.email}`);
      console.log(`      Created: ${emp.createdAt}`);
      console.log(`      User ID: ${emp.userId || 'None'}`);
      console.log('');
    });

    // Keep the oldest record (first in the array)
    const keepEmployee = employees[0];
    const deleteEmployees = employees.slice(1);

    console.log('📌 DECISION:');
    console.log(`   ✅ KEEP: ${keepEmployee.firstName} ${keepEmployee.lastName} (ID: ${keepEmployee.id})`);
    console.log(`      Created: ${keepEmployee.createdAt}`);
    console.log('');
    console.log(`   ❌ DELETE: ${deleteEmployees.length} duplicate(s):`);
    deleteEmployees.forEach(emp => {
      console.log(`      - ${emp.firstName} ${emp.lastName} (ID: ${emp.id})`);
      console.log(`        Created: ${emp.createdAt}`);
    });
    console.log('');

    console.log('⚠️  WARNING: This will DELETE the duplicate employee records!\n');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🗑️  Step 2: Deleting duplicate employees...\n');
    
    const idsToDelete = deleteEmployees.map(e => e.id);
    
    // Delete the duplicate employee records
    const deletedCount = await models.Employee.destroy({
      where: {
        id: { [Op.in]: idsToDelete }
      }
    });

    console.log(`✅ Deleted ${deletedCount} duplicate employee(s)\n`);

    // Also delete associated user accounts if they exist
    const userIdsToDelete = deleteEmployees
      .filter(e => e.userId)
      .map(e => e.userId);

    if (userIdsToDelete.length > 0) {
      console.log('🗑️  Step 3: Deleting associated user accounts...\n');
      const deletedUsers = await models.User.destroy({
        where: {
          id: { [Op.in]: userIdsToDelete }
        }
      });
      console.log(`✅ Deleted ${deletedUsers} associated user account(s)\n`);
    }

    console.log('🔍 Step 4: Verifying deletion...\n');
    const remainingEmployees = await models.Employee.findAll({
      where: {
        [Op.or]: [
          { firstName: { [Op.iLike]: '%Shanmugavel%' } },
          { lastName: { [Op.iLike]: '%Shanmugavel%' } }
        ]
      }
    });

    console.log(`✅ Remaining Shanmugavel employees: ${remainingEmployees.length}`);
    if (remainingEmployees.length === 1) {
      console.log(`   - ${remainingEmployees[0].firstName} ${remainingEmployees[0].lastName} (ID: ${remainingEmployees[0].id})`);
    }
    console.log('');

    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   DUPLICATE DELETION COMPLETED                     ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
deleteDuplicateShanmugavel();
