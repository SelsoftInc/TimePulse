const bcrypt = require('bcryptjs');
const { models, connectDB } = require('./models');

async function createUsersFromEmployees() {
  try {
    await connectDB();
    
    const tenantId = 'c92fe40d-af85-4c8b-8053-71df10680804';
    const defaultPassword = 'test123#';
    
    // Get all employees without user accounts
    const employees = await models.Employee.findAll({
      where: { tenantId },
      attributes: ['id', 'firstName', 'lastName', 'email', 'department', 'title']
    });
    
    console.log(`Found ${employees.length} employees in Selsoft tenant`);
    
    // Hash password once for all users
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    
    let created = 0;
    let skipped = 0;
    
    for (const employee of employees) {
      if (!employee.email) {
        console.log(`⚠️  Skipping ${employee.firstName} ${employee.lastName} - no email`);
        skipped++;
        continue;
      }
      
      // Check if user already exists
      const existingUser = await models.User.findOne({
        where: { 
          email: employee.email.toLowerCase(),
          tenantId: tenantId
        }
      });
      
      if (existingUser) {
        console.log(`⏭️  User already exists: ${employee.email}`);
        skipped++;
        continue;
      }
      
      // Create user account
      const user = await models.User.create({
        tenantId: tenantId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email.toLowerCase(),
        passwordHash: passwordHash,
        role: 'employee', // Default role
        status: 'active',
        department: employee.department || null,
        title: employee.title || null,
        mustChangePassword: false // Set to true if you want users to change password on first login
      });
      
      console.log(`✅ Created user: ${employee.email} (${employee.firstName} ${employee.lastName})`);
      created++;
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total employees: ${employees.length}`);
    console.log(`Users created: ${created}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`\nDefault password for all users: ${defaultPassword}`);
    console.log('\nAll users can now login with their email and the default password.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createUsersFromEmployees();
