const { models } = require('./models');

async function testLeaveSubmit() {
  try {
    console.log('🔍 Testing leave submission components...\n');
    
    // Check if Tenant model exists
    console.log('1. Checking Tenant model:', !!models.Tenant);
    
    if (models.Tenant) {
      const tenant = await models.Tenant.findOne();
      console.log('   Sample tenant:', tenant ? { id: tenant.id, name: tenant.tenantName } : 'No tenants found');
    }
    
    // Check if LeaveRequest model exists
    console.log('\n2. Checking LeaveRequest model:', !!models.LeaveRequest);
    
    // Check if LeaveBalance model exists
    console.log('3. Checking LeaveBalance model:', !!models.LeaveBalance);
    
    // Check if Employee model exists
    console.log('4. Checking Employee model:', !!models.Employee);
    
    // Check if User model exists
    console.log('5. Checking User model:', !!models.User);
    
    // Try to find a user to test with
    const user = await models.User.findOne({
      where: { role: 'employee' }
    });
    
    if (user) {
      console.log('\n6. Found test user:', {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId
      });
      
      // Check if employee record exists
      const employee = await models.Employee.findOne({
        where: { id: user.id, tenantId: user.tenantId }
      });
      
      console.log('7. Employee record exists:', !!employee);
      
      // Try to find tenant
      const tenant = await models.Tenant.findByPk(user.tenantId);
      console.log('8. Tenant found:', !!tenant);
      
      if (tenant) {
        console.log('   Tenant details:', {
          id: tenant.id,
          name: tenant.tenantName,
          subdomain: tenant.subdomain
        });
      }
    } else {
      console.log('\n❌ No employee user found in database');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testLeaveSubmit();
