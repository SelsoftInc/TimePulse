/**
 * Seed Script: Add user roles to lookups table
 * This script adds all available user roles to the lookups table
 * 
 * Usage: node scripts/seed-user-roles.js
 */

const { models, connectDB } = require('../models');

const userRoles = [
  { code: 'admin', label: 'Admin', displayOrder: 1 },
  { code: 'manager', label: 'Manager', displayOrder: 2 },
  { code: 'approver', label: 'Approver', displayOrder: 3 },
  { code: 'employee', label: 'Employee', displayOrder: 4 },
  { code: 'accountant', label: 'Accountant', displayOrder: 5 },
  { code: 'hr', label: 'HR', displayOrder: 6 }
];

async function seedUserRoles() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    console.log('✅ Database connection established');

    console.log('\n📝 Seeding user roles...');

    for (const role of userRoles) {
      // Check if role already exists
      const existing = await models.Lookup.findOne({
        where: {
          category: 'user_role',
          code: role.code
        }
      });

      if (existing) {
        console.log(`⏭️  Role "${role.label}" already exists, skipping...`);
        continue;
      }

      // Create the role
      await models.Lookup.create({
        category: 'user_role',
        code: role.code,
        label: role.label,
        displayOrder: role.displayOrder,
        isActive: true,
        tenantId: null // Global lookup
      });

      console.log(`✅ Created role: ${role.label}`);
    }

    console.log('\n📊 Verifying seeded roles...');
    const allRoles = await models.Lookup.findAll({
      where: {
        category: 'user_role',
        isActive: true
      },
      order: [['displayOrder', 'ASC']]
    });

    console.log(`\n✅ Total roles in database: ${allRoles.length}`);
    allRoles.forEach(role => {
      console.log(`   - ${role.label} (${role.code})`);
    });

    console.log('\n🎉 User roles seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding user roles:', error);
    process.exit(1);
  }
}

// Run the seed script
seedUserRoles();
