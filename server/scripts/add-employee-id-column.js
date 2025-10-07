/**
 * Add employee_id column to users table
 */

const { sequelize, connectDB } = require('../models');

async function addEmployeeIdColumn() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Check if column exists
    const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'employee_id'
    `);

    if (columns.length > 0) {
      console.log('✓  employee_id column already exists');
    } else {
      // Add the column
      await sequelize.query(`
        ALTER TABLE users ADD COLUMN employee_id UUID REFERENCES employees(id);
      `);
      console.log('✅ Added employee_id column to users table');
    }

    // Now update Selvakumar's record
    const [users] = await sequelize.query(`
      SELECT u.id as user_id, e.id as employee_id
      FROM users u
      JOIN employees e ON e.email = u.email AND e.tenant_id = u.tenant_id
      WHERE u.email = 'selvakumar@selsoftinc.com'
    `);

    if (users.length > 0) {
      const { user_id, employee_id } = users[0];
      
      await sequelize.query(`
        UPDATE users SET employee_id = :employeeId WHERE id = :userId
      `, {
        replacements: { employeeId: employee_id, userId: user_id }
      });

      console.log('✅ Linked Selvakumar user to employee');
      console.log('   User ID:', user_id);
      console.log('   Employee ID:', employee_id);
    }

    console.log('\n🎯 Next steps:');
    console.log('1. Restart backend server (Ctrl+C, then npm start)');
    console.log('2. Logout from browser');
    console.log('3. Login again as selvakumar@selsoftinc.com');
    console.log('4. Timesheets will load!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addEmployeeIdColumn();
