/**
 * Complete Fix: Create lookups table, add approver role, and seed data
 */

const { sequelize, models } = require('../models');

async function completeFix() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Step 1: Create lookups table if it doesn't exist
    console.log('📝 Step 1: Creating lookups table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS lookups (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        code VARCHAR(50) NOT NULL,
        label VARCHAR(100) NOT NULL,
        value VARCHAR(100),
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        tenant_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category, code)
      );
    `);
    console.log('✅ Lookups table created/verified\n');

    // Step 2: Add 'approver' to enum
    console.log('📝 Step 2: Adding "approver" to enum_users_role...');
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

    // Step 3: Verify enum values
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

    // Step 4: Insert user roles
    console.log('📝 Step 3: Inserting user roles into lookups table...');
    await sequelize.query(`
      INSERT INTO lookups (category, code, label, display_order, is_active, tenant_id)
      VALUES 
        ('user_role', 'admin', 'Admin', 1, true, NULL),
        ('user_role', 'manager', 'Manager', 2, true, NULL),
        ('user_role', 'approver', 'Approver', 3, true, NULL),
        ('user_role', 'employee', 'Employee', 4, true, NULL),
        ('user_role', 'accountant', 'Accountant', 5, true, NULL),
        ('user_role', 'hr', 'HR', 6, true, NULL)
      ON CONFLICT (category, code) 
      DO UPDATE SET 
        label = EXCLUDED.label,
        display_order = EXCLUDED.display_order,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP;
    `);
    console.log('✅ User roles inserted/updated\n');

    // Step 5: Verify lookups
    console.log('📋 Roles in lookups table:');
    const [lookups] = await sequelize.query(`
      SELECT id, code, label, display_order, is_active
      FROM lookups
      WHERE category = 'user_role'
      ORDER BY display_order;
    `);
    
    lookups.forEach(lookup => {
      console.log(`   ${lookup.display_order}. ${lookup.label} (${lookup.code}) - Active: ${lookup.is_active}`);
    });

    console.log('\n✅ ✅ ✅ MIGRATION COMPLETED SUCCESSFULLY! ✅ ✅ ✅');
    console.log('\n📊 Summary:');
    console.log('   ✅ Lookups table created');
    console.log('   ✅ Enum updated with "approver" role');
    console.log('   ✅ All 6 user roles inserted');
    console.log('\n🎉 Next steps:');
    console.log('   1. Restart your backend server (Ctrl+C, then: npm start)');
    console.log('   2. Refresh your frontend browser (Ctrl+Shift+R)');
    console.log('   3. Test: Settings → User Management → Edit User');
    console.log('   4. Role dropdown should show all 6 roles');
    console.log('   5. Save Changes should work without errors\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the complete fix
completeFix();
