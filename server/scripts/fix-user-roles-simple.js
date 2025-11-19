/**
 * Simple Fix: Add approver role and seed lookups
 * This script directly uses Sequelize to fix the user roles issue
 */

const { sequelize, models } = require('../models');

async function fixUserRoles() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Step 1: Add 'approver' to enum (using raw SQL)
    console.log('📝 Step 1: Adding "approver" to enum_users_role...');
    try {
      await sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'enum_users_role' AND e.enumlabel = 'approver'
          ) THEN
            ALTER TYPE enum_users_role ADD VALUE 'approver' AFTER 'manager';
          END IF;
        END $$;
      `);
      console.log('✅ Enum updated successfully\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⏭️  "approver" already exists in enum\n');
      } else {
        throw error;
      }
    }

    // Step 2: Verify enum values
    console.log('📋 Current enum values:');
    const [enumValues] = await sequelize.query(`
      SELECT enumlabel as role 
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'enum_users_role'
      ORDER BY e.enumsortorder;
    `);
    enumValues.forEach(row => console.log(`   - ${row.role}`));
    console.log('');

    // Step 3: Seed user roles in lookups table
    console.log('📝 Step 2: Seeding user roles in lookups table...');
    
    const userRoles = [
      { code: 'admin', label: 'Admin', displayOrder: 1 },
      { code: 'manager', label: 'Manager', displayOrder: 2 },
      { code: 'approver', label: 'Approver', displayOrder: 3 },
      { code: 'employee', label: 'Employee', displayOrder: 4 },
      { code: 'accountant', label: 'Accountant', displayOrder: 5 },
      { code: 'hr', label: 'HR', displayOrder: 6 }
    ];

    for (const role of userRoles) {
      const [lookup, created] = await models.Lookup.findOrCreate({
        where: {
          category: 'user_role',
          code: role.code
        },
        defaults: {
          category: 'user_role',
          code: role.code,
          label: role.label,
          displayOrder: role.displayOrder,
          isActive: true,
          tenantId: null
        }
      });

      if (created) {
        console.log(`   ✅ Created: ${role.label}`);
      } else {
        // Update existing
        await lookup.update({
          label: role.label,
          displayOrder: role.displayOrder,
          isActive: true
        });
        console.log(`   ⏭️  Updated: ${role.label}`);
      }
    }

    // Step 4: Verify lookups
    console.log('\n📋 Roles in lookups table:');
    const lookups = await models.Lookup.findAll({
      where: { category: 'user_role', isActive: true },
      order: [['displayOrder', 'ASC']]
    });
    
    lookups.forEach(lookup => {
      console.log(`   ${lookup.displayOrder}. ${lookup.label} (${lookup.code})`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('✅ Enum updated with "approver" role');
    console.log('✅ Lookups table populated with all roles');
    console.log('\n🎉 Next steps:');
    console.log('   1. Restart your backend server (Ctrl+C, then npm start)');
    console.log('   2. Refresh your frontend browser (Ctrl+Shift+R)');
    console.log('   3. Test Settings → User Management → Edit User\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the fix
fixUserRoles();
