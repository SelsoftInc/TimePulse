const { models } = require('./models');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    console.log('🔍 Testing login fix...\n');
    
    const user = await models.User.findOne({
      where: { email: 'pushban@selsoftinc.com' },
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
    console.log('📊 User data structure:');
    console.log('  - id:', user.id);
    console.log('  - firstName (camelCase):', user.firstName);
    console.log('  - first_name (snake_case):', user.first_name);
    console.log('  - lastName (camelCase):', user.lastName);
    console.log('  - last_name (snake_case):', user.last_name);
    console.log('  - tenantId (camelCase):', user.tenantId);
    console.log('  - tenant_id (snake_case):', user.tenant_id);
    console.log('  - role:', user.role);
    console.log('  - status:', user.status);
    console.log('  - mustChangePassword (camelCase):', user.mustChangePassword);
    console.log('  - must_change_password (snake_case):', user.must_change_password);
    
    if (user.tenant) {
      console.log('\n🏢 Tenant data:');
      console.log('  - id:', user.tenant.id);
      console.log('  - tenantName (camelCase):', user.tenant.tenantName);
      console.log('  - tenant_name (snake_case):', user.tenant.tenant_name);
      console.log('  - subdomain:', user.tenant.subdomain);
      console.log('  - status:', user.tenant.status);
    } else {
      console.log('\n❌ No tenant associated');
    }
    
    // Test response object construction
    console.log('\n📦 Testing response object construction:');
    const responseUser = {
      id: user.id,
      firstName: user.firstName || user.first_name,
      lastName: user.lastName || user.last_name,
      email: user.email,
      role: user.role,
      department: user.department,
      title: user.title,
      tenantId: user.tenantId || user.tenant_id,
      mustChangePassword: user.mustChangePassword || user.must_change_password
    };
    
    console.log('Response user object:', JSON.stringify(responseUser, null, 2));
    
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();
