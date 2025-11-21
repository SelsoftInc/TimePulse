/**
 * Migration: Reset mustChangePassword flag for existing users
 * 
 * This migration sets mustChangePassword to false for all existing users
 * so they are not forced to reset their passwords.
 * 
 * Only newly created users (via employee creation or onboarding) will have
 * mustChangePassword set to true.
 * 
 * Run this migration with: node migrations/reset_existing_users_password_flag.js
 */

const { sequelize, models } = require('../models');

async function resetExistingUsersPasswordFlag() {
  try {
    console.log('🔄 Starting migration: Reset existing users password flag...\n');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Get count of users with mustChangePassword = true
    const usersNeedingReset = await models.User.count({
      where: {
        mustChangePassword: true
      }
    });

    console.log(`📊 Found ${usersNeedingReset} users with mustChangePassword = true\n`);

    if (usersNeedingReset === 0) {
      console.log('✅ No users need to be updated. Migration complete.\n');
      process.exit(0);
    }

    // Update all existing users to set mustChangePassword = false
    const [updatedCount] = await sequelize.query(`
      UPDATE users 
      SET must_change_password = false 
      WHERE must_change_password = true
    `);

    console.log(`✅ Updated ${updatedCount} users: mustChangePassword set to false\n`);

    // Verify the update
    const remainingUsers = await models.User.count({
      where: {
        mustChangePassword: true
      }
    });

    if (remainingUsers === 0) {
      console.log('✅ Migration completed successfully!');
      console.log('📝 All existing users can now login without password reset.\n');
      console.log('ℹ️  Note: Newly created users will still have mustChangePassword = true\n');
    } else {
      console.log(`⚠️  Warning: ${remainingUsers} users still have mustChangePassword = true\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the migration
resetExistingUsersPasswordFlag();
