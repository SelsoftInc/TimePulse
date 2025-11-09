const { models } = require('./models');
const bcrypt = require('bcryptjs');

const testUsers = [
  { email: 'pushban@selsoftinc.com', password: 'test123#', role: 'admin' },
  { email: 'selvakumar@selsoftinc.com', password: 'test123#', role: 'employee' }
];

async function testLogin(email, password, expectedRole) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Testing login: ${email}`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Find user
    const user = await models.User.findOne({
      where: { email: email.toLowerCase() },
      include: [{
        model: models.Tenant,
        as: 'tenant'
      }]
    });
    
    if (!user) {
      console.log('❌ FAILED: User not found');
      return false;
    }
    
    console.log('✅ User found');
    console.log(`   Role: ${user.role} (expected: ${expectedRole})`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    
    // Check status
    if (user.status !== 'active') {
      console.log('❌ FAILED: User is not active');
      return false;
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      console.log('❌ FAILED: Invalid password');
      return false;
    }
    
    console.log('✅ Password valid');
    
    // Check tenant
    if (!user.tenant) {
      console.log('❌ FAILED: No tenant associated');
      return false;
    }
    
    console.log(`✅ Tenant: ${user.tenant.tenantName} (${user.tenant.subdomain})`);
    
    // For employees, check employee record
    if (user.role === 'employee') {
      const employee = await models.Employee.findOne({
        where: {
          email: user.email,
          tenantId: user.tenantId
        }
      });
      
      if (employee) {
        console.log(`✅ Employee record found: ${employee.firstName} ${employee.lastName}`);
      } else {
        console.log('⚠️  No employee record (will be created on first login)');
      }
    }
    
    console.log('\n✅ LOGIN TEST PASSED!');
    return true;
    
  } catch (error) {
    console.log(`\n❌ LOGIN TEST FAILED!`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    return false;
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(15) + 'LOGIN TESTS FOR ALL USERS' + ' '.repeat(18) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  
  let passed = 0;
  let failed = 0;
  
  for (const testUser of testUsers) {
    const result = await testLogin(testUser.email, testUser.password, testUser.role);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(20) + 'TEST SUMMARY' + ' '.repeat(26) + '║');
  console.log('╠' + '═'.repeat(58) + '╣');
  console.log(`║  Total Tests: ${testUsers.length}` + ' '.repeat(46 - testUsers.length.toString().length) + '║');
  console.log(`║  ✅ Passed: ${passed}` + ' '.repeat(48 - passed.toString().length) + '║');
  console.log(`║  ❌ Failed: ${failed}` + ' '.repeat(48 - failed.toString().length) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! All users can log in successfully!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  SOME TESTS FAILED! Please check the errors above.\n');
    process.exit(1);
  }
}

runAllTests();
