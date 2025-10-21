const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const path = require('path');
const { models, connectDB } = require('./models');

async function syncExcelEmployees() {
  try {
    await connectDB();
    
    const tenantId = 'c92fe40d-af85-4c8b-8053-71df10680804';
    const defaultPassword = 'test123#';
    
    // Read Excel file
    const excelPath = path.join(__dirname, 'Onboard/Selsoft/Selsoft.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const employeesSheet = workbook.Sheets['Employees'];
    const excelEmployees = XLSX.utils.sheet_to_json(employeesSheet);
    
    console.log(`Found ${excelEmployees.length} employees in Excel file`);
    
    // Hash password once
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    
    let employeesCreated = 0;
    let usersCreated = 0;
    let skipped = 0;
    
    for (const row of excelEmployees) {
      const firstName = row['First Name'];
      const lastName = row['Last Name'];
      const email = row['Email'];
      const department = row['Department'] || null;
      const title = row['Title'] || null;
      const hourlyRate = parseFloat(row['Hourly Rate']) || 0;
      
      // Skip Pushban as requested
      if (email && email.toLowerCase().includes('push123@gmail.com')) {
        console.log(`⏭️  Skipping Pushban (as requested)`);
        skipped++;
        continue;
      }
      
      if (!email || !firstName || !lastName) {
        console.log(`⚠️  Skipping row - missing required fields`);
        skipped++;
        continue;
      }
      
      // Check if employee exists
      const existingEmployee = await models.Employee.findOne({
        where: { 
          email: email.toLowerCase(),
          tenantId: tenantId
        }
      });
      
      let employeeId;
      
      if (!existingEmployee) {
        // Create employee
        const employee = await models.Employee.create({
          tenantId: tenantId,
          firstName: firstName,
          lastName: lastName,
          email: email.toLowerCase(),
          department: department,
          title: title,
          hourlyRate: hourlyRate,
          salaryType: 'hourly',
          status: 'active',
          startDate: new Date().toISOString().split('T')[0]
        });
        
        employeeId = employee.id;
        console.log(`✅ Created employee: ${firstName} ${lastName} (${email})`);
        employeesCreated++;
      } else {
        employeeId = existingEmployee.id;
        console.log(`📋 Employee exists: ${firstName} ${lastName} (${email})`);
      }
      
      // Check if user exists
      const existingUser = await models.User.findOne({
        where: { 
          email: email.toLowerCase(),
          tenantId: tenantId
        }
      });
      
      if (!existingUser) {
        // Create user account
        await models.User.create({
          tenantId: tenantId,
          firstName: firstName,
          lastName: lastName,
          email: email.toLowerCase(),
          passwordHash: passwordHash,
          role: 'employee',
          status: 'active',
          department: department,
          title: title,
          mustChangePassword: false
        });
        
        console.log(`   ✅ Created user account for: ${email}`);
        usersCreated++;
      } else {
        console.log(`   📋 User account exists: ${email}`);
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Employees created: ${employeesCreated}`);
    console.log(`User accounts created: ${usersCreated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`\nDefault password: ${defaultPassword}`);
    console.log('\nAll users can now login with their email and the default password.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

syncExcelEmployees();
