/**
 * Test the reviewers endpoint
 */

const { models, connectDB } = require('../models');
const { Op } = require('sequelize');

async function main() {
  try {
    await connectDB();
    console.log('✅ Connected\n');

    const tenantId = '5eda5596-b1d9-4963-953d-7af9d0511ce8';

    console.log('Testing reviewers endpoint logic...\n');
    console.log(`Tenant ID: ${tenantId}\n`);

    try {
      // This is exactly what the endpoint does
      const reviewers = await models.User.findAll({
        where: {
          tenantId,
          role: { [Op.in]: ['admin', 'manager'] }
          // Note: removed status filter to test
        },
        attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        order: [['firstName', 'ASC'], ['lastName', 'ASC']]
      });

      console.log(`✅ Found ${reviewers.length} reviewers:\n`);

      const formattedReviewers = reviewers.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role
      }));

      console.log('Formatted response:');
      console.log(JSON.stringify({ success: true, reviewers: formattedReviewers }, null, 2));

    } catch (err) {
      console.error('❌ Error:', err.message);
      console.error('This might be the issue!');
      
      // Try without status filter
      console.log('\nTrying without status filter...');
      const reviewers = await models.User.findAll({
        where: {
          tenantId,
          role: { [Op.in]: ['admin', 'manager'] }
        },
        attributes: ['id', 'firstName', 'lastName', 'email', 'role']
      });

      console.log(`✅ Found ${reviewers.length} reviewers`);
      reviewers.forEach(r => {
        console.log(`  - ${r.firstName} ${r.lastName} (${r.role})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
