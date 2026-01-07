const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'timepulse',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

async function migrateToEighteenDays() {
  try {
    console.log('🔄 Starting migration to 18 days leave system...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Step 1: Add new ENUM values if they don't exist
    console.log('\n📝 Step 1: Updating ENUM types...');
    
    await sequelize.query(`
      DO $$ 
      BEGIN
        -- Add 'casual' if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'casual' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_leave_balances_leave_type')
        ) THEN
          ALTER TYPE enum_leave_balances_leave_type ADD VALUE 'casual';
          RAISE NOTICE 'Added casual to leave_balances enum';
        END IF;

        -- Add 'earned' if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'earned' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_leave_balances_leave_type')
        ) THEN
          ALTER TYPE enum_leave_balances_leave_type ADD VALUE 'earned';
          RAISE NOTICE 'Added earned to leave_balances enum';
        END IF;

        -- Add 'sick' if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'sick' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_leave_balances_leave_type')
        ) THEN
          ALTER TYPE enum_leave_balances_leave_type ADD VALUE 'sick';
          RAISE NOTICE 'Added sick to leave_balances enum';
        END IF;
      END $$;
    `);

    await sequelize.query(`
      DO $$ 
      BEGIN
        -- Add 'casual' to leave_requests enum
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'casual' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_leave_requests_leave_type')
        ) THEN
          ALTER TYPE enum_leave_requests_leave_type ADD VALUE 'casual';
          RAISE NOTICE 'Added casual to leave_requests enum';
        END IF;

        -- Add 'earned' to leave_requests enum
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'earned' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_leave_requests_leave_type')
        ) THEN
          ALTER TYPE enum_leave_requests_leave_type ADD VALUE 'earned';
          RAISE NOTICE 'Added earned to leave_requests enum';
        END IF;

        -- Add 'sick' to leave_requests enum
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'sick' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_leave_requests_leave_type')
        ) THEN
          ALTER TYPE enum_leave_requests_leave_type ADD VALUE 'sick';
          RAISE NOTICE 'Added sick to leave_requests enum';
        END IF;
      END $$;
    `);

    console.log('✅ ENUM types updated successfully');

    // Step 2: Update existing leave balances to new system
    console.log('\n📝 Step 2: Migrating existing leave balances...');
    
    // Get all unique employee-tenant-year combinations
    const [employees] = await sequelize.query(`
      SELECT DISTINCT employee_id, tenant_id, year 
      FROM leave_balances
    `);

    console.log(`Found ${employees.length} employee-year combinations to process`);

    for (const emp of employees) {
      const { employee_id, tenant_id, year } = emp;
      
      // Check existing leave types for this employee
      const [existing] = await sequelize.query(`
        SELECT leave_type, total_days, used_days, pending_days, carry_forward_days
        FROM leave_balances
        WHERE employee_id = :employeeId 
        AND tenant_id = :tenantId 
        AND year = :year
      `, {
        replacements: { employeeId: employee_id, tenantId: tenant_id, year }
      });

      const existingTypes = existing.map(e => e.leave_type);
      
      // Create sick leave if it doesn't exist
      if (!existingTypes.includes('sick')) {
        await sequelize.query(`
          INSERT INTO leave_balances (employee_id, tenant_id, year, leave_type, total_days, used_days, pending_days, carry_forward_days, created_at, updated_at)
          VALUES (:employeeId, :tenantId, :year, 'sick', 6, 0, 0, 0, NOW(), NOW())
          ON CONFLICT (employee_id, tenant_id, year, leave_type) DO NOTHING
        `, {
          replacements: { employeeId: employee_id, tenantId: tenant_id, year }
        });
        console.log(`  ✓ Created sick leave for employee ${employee_id}`);
      }

      // Create casual leave if it doesn't exist
      if (!existingTypes.includes('casual')) {
        await sequelize.query(`
          INSERT INTO leave_balances (employee_id, tenant_id, year, leave_type, total_days, used_days, pending_days, carry_forward_days, created_at, updated_at)
          VALUES (:employeeId, :tenantId, :year, 'casual', 6, 0, 0, 0, NOW(), NOW())
          ON CONFLICT (employee_id, tenant_id, year, leave_type) DO NOTHING
        `, {
          replacements: { employeeId: employee_id, tenantId: tenant_id, year }
        });
        console.log(`  ✓ Created casual leave for employee ${employee_id}`);
      }

      // Create earned leave if it doesn't exist
      if (!existingTypes.includes('earned')) {
        await sequelize.query(`
          INSERT INTO leave_balances (employee_id, tenant_id, year, leave_type, total_days, used_days, pending_days, carry_forward_days, created_at, updated_at)
          VALUES (:employeeId, :tenantId, :year, 'earned', 6, 0, 0, 0, NOW(), NOW())
          ON CONFLICT (employee_id, tenant_id, year, leave_type) DO NOTHING
        `, {
          replacements: { employeeId: employee_id, tenantId: tenant_id, year }
        });
        console.log(`  ✓ Created earned leave for employee ${employee_id}`);
      }

      // Update existing vacation leave to 6 days if needed
      if (existingTypes.includes('vacation')) {
        await sequelize.query(`
          UPDATE leave_balances 
          SET total_days = 6
          WHERE employee_id = :employeeId 
          AND tenant_id = :tenantId 
          AND year = :year 
          AND leave_type = 'vacation'
          AND total_days != 6
        `, {
          replacements: { employeeId: employee_id, tenantId: tenant_id, year }
        });
      }
    }

    console.log('✅ Leave balances migrated successfully');

    // Step 3: Verify migration
    console.log('\n📝 Step 3: Verifying migration...');
    
    const [summary] = await sequelize.query(`
      SELECT 
        leave_type,
        COUNT(*) as count,
        AVG(total_days) as avg_total_days
      FROM leave_balances
      GROUP BY leave_type
      ORDER BY leave_type
    `);

    console.log('\n📊 Migration Summary:');
    console.table(summary);

    const [totalDays] = await sequelize.query(`
      SELECT 
        employee_id,
        tenant_id,
        year,
        SUM(total_days) as total_leave_days
      FROM leave_balances
      WHERE leave_type IN ('sick', 'casual', 'earned')
      GROUP BY employee_id, tenant_id, year
      HAVING SUM(total_days) != 18
    `);

    if (totalDays.length > 0) {
      console.warn('\n⚠️  Warning: Some employees do not have exactly 18 days:');
      console.table(totalDays);
    } else {
      console.log('\n✅ All employees have exactly 18 days of leave (6+6+6)');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nLeave System Summary:');
    console.log('  • Sick Leave: 6 days');
    console.log('  • Casual Leave: 6 days');
    console.log('  • Earned Leave: 6 days');
    console.log('  • Total: 18 days');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run migration
migrateToEighteenDays()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
