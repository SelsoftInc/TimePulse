/**
 * Seed Payment Terms Lookups
 * Adds standard payment terms to the lookups table
 */

require('dotenv').config();
const { models, sequelize } = require('../models');

const paymentTerms = [
  { code: 'due_on_receipt', label: 'Due on Receipt', displayOrder: 1 },
  { code: 'net15', label: 'Net 15', displayOrder: 2 },
  { code: 'net30', label: 'Net 30', displayOrder: 3 },
  { code: 'net45', label: 'Net 45', displayOrder: 4 },
  { code: 'net60', label: 'Net 60', displayOrder: 5 },
  { code: 'net90', label: 'Net 90', displayOrder: 6 }
];

async function seedPaymentTerms() {
  try {
    console.log('🌱 Seeding payment terms lookups...\n');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Check if Lookup model exists
    if (!models.Lookup) {
      console.error('❌ Lookup model not found in models');
      console.log('Available models:', Object.keys(models));
      process.exit(1);
    }

    // Check if payment terms already exist
    const existingTerms = await models.Lookup.findAll({
      where: { category: 'payment_terms' }
    });

    if (existingTerms.length > 0) {
      console.log(`⚠️  Found ${existingTerms.length} existing payment terms:`);
      existingTerms.forEach(term => {
        console.log(`   - ${term.label} (${term.code})`);
      });
      console.log('\n❓ Do you want to skip seeding? (Existing terms will remain)');
      console.log('   To force re-seed, delete existing terms first.\n');
      process.exit(0);
    }

    // Create payment terms
    console.log('📝 Creating payment terms...\n');
    
    for (const term of paymentTerms) {
      const lookup = await models.Lookup.create({
        category: 'payment_terms',
        code: term.code,
        label: term.label,
        value: term.code,
        displayOrder: term.displayOrder,
        tenantId: null, // Global lookup
        isActive: true
      });
      console.log(`✅ Created: ${lookup.label} (${lookup.code})`);
    }

    console.log('\n✅ Payment terms seeded successfully!');
    console.log(`📊 Total terms created: ${paymentTerms.length}\n`);
    
    // Verify
    const allTerms = await models.Lookup.findAll({
      where: { category: 'payment_terms', isActive: true },
      order: [['displayOrder', 'ASC']]
    });

    console.log('📋 Verification - All payment terms:');
    allTerms.forEach((term, index) => {
      console.log(`   ${index + 1}. ${term.label} (${term.code})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding payment terms:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the seeder
seedPaymentTerms();
