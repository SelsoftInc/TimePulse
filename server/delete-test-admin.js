/**
 * Delete the test admin user that was created
 */

const { models } = require('./models');

async function deleteTestAdmin() {
  try {
    console.log('🗑️ Deleting test admin user...\n');

    // Delete admin@shunmugavel.com
    const deleted = await models.User.destroy({
      where: {
        email: 'admin@shunmugavel.com'
      }
    });

    if (deleted > 0) {
      console.log('✅ Deleted admin@shunmugavel.com');
    } else {
      console.log('⚠️ User admin@shunmugavel.com not found (may already be deleted)');
    }

    console.log('\n✅ Cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

deleteTestAdmin();
