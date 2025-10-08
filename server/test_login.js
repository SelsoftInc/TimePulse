const { models } = require('./models');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const user = await models.User.findOne({
      where: { email: 'selvakumar@selsoftinc.com' },
      include: [{
        model: models.Tenant,
        as: 'tenant'
      }]
    });
    
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    console.log('User found:', user.email);
    console.log('User status:', user.status);
    console.log('Has passwordHash:', !!user.passwordHash);
    console.log('Tenant:', user.tenant ? user.tenant.tenantName : 'NO TENANT');
    
    const isValid = await bcrypt.compare('test123#', user.passwordHash);
    console.log('Password valid:', isValid);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();
