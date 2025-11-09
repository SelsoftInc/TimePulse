const { models } = require('./models');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    console.log('🔍 Testing employee login: selvakumar@selsoftinc.com\n');
    
    const user = await models.User.findOne({
      where: { email: 'selvakumar@selsoftinc.com' },
      include: [{
        model: models.Tenant,
        as: 'tenant'
      }]
    });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('✅ User found:', user.email);
    console.log('📊 User details:');
    console.log('  - ID:', user.id);
    console.log('  - Role:', user.role);
    console.log('  - Status:', user.status);
    console.log('  - First Name:', user.firstName);
    console.log('  - Last Name:', user.lastName);
    console.log('  - Tenant ID:', user.tenantId);
    console.log('  - Has password:', !!user.passwordHash);
    
    if (user.tenant) {
      console.log('\n🏢 Tenant details:');
      console.log('  - ID:', user.tenant.id);
      console.log('  - Name:', user.tenant.tenantName);
      console.log('  - Subdomain:', user.tenant.subdomain);
      console.log('  - Status:', user.tenant.status);
      console.log('  - Stripe Customer ID:', user.tenant.stripeCustomerId || 'null');
      console.log('  - Plan:', user.tenant.plan || 'null');
    } else {
      console.log('\n❌ No tenant associated!');
    }
    
    // Test password
    const isValid = await bcrypt.compare('test123#', user.passwordHash);
    console.log('\n🔐 Password test (test123#):', isValid ? '✅ Valid' : '❌ Invalid');
    
    // Find employee record
    const employee = await models.Employee.findOne({
      where: {
        email: user.email,
        tenantId: user.tenantId
      }
    });
    
    if (employee) {
      console.log('\n👤 Employee record found:');
      console.log('  - ID:', employee.id);
      console.log('  - Name:', `${employee.firstName} ${employee.lastName}`);
      console.log('  - Status:', employee.status);
    } else {
      console.log('\n⚠️  No employee record found');
    }
    
    console.log('\n✅ Login test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();
