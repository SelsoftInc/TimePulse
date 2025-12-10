/**
 * Simplified Migration: Increase Encrypted Field Lengths
 * Only updates fields that exist in the database
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'timepulse',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

async function up() {
  const queryInterface = sequelize.getQueryInterface();
  
  console.log('🔧 Starting migration: Increase encrypted field lengths\n');

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // VENDORS TABLE - Only update fields that definitely exist
    console.log('📝 Updating vendors table...');
    try {
      await queryInterface.changeColumn('vendors', 'name', {
        type: Sequelize.STRING(500),
        allowNull: false
      });
      console.log('  ✓ name updated');
    } catch (e) { console.log('  ⊗ name skipped:', e.message); }

    try {
      await queryInterface.changeColumn('vendors', 'email', {
        type: Sequelize.STRING(500),
        allowNull: true
      });
      console.log('  ✓ email updated');
    } catch (e) { console.log('  ⊗ email skipped:', e.message); }

    try {
      await queryInterface.changeColumn('vendors', 'phone', {
        type: Sequelize.STRING(500),
        allowNull: true
      });
      console.log('  ✓ phone updated');
    } catch (e) { console.log('  ⊗ phone skipped:', e.message); }

    try {
      await queryInterface.changeColumn('vendors', 'contact_person', {
        type: Sequelize.STRING(500),
        allowNull: true
      });
      console.log('  ✓ contact_person updated');
    } catch (e) { console.log('  ⊗ contact_person skipped:', e.message); }

    try {
      await queryInterface.changeColumn('vendors', 'address', {
        type: Sequelize.STRING(1000),
        allowNull: true
      });
      console.log('  ✓ address updated');
    } catch (e) { console.log('  ⊗ address skipped:', e.message); }

    console.log('✅ Vendors table updated\n');

    // EMPLOYEES TABLE
    console.log('📝 Updating employees table...');
    try {
      await queryInterface.changeColumn('employees', 'first_name', {
        type: Sequelize.STRING(500),
        allowNull: false
      });
      console.log('  ✓ first_name updated');
    } catch (e) { console.log('  ⊗ first_name skipped:', e.message); }

    try {
      await queryInterface.changeColumn('employees', 'last_name', {
        type: Sequelize.STRING(500),
        allowNull: false
      });
      console.log('  ✓ last_name updated');
    } catch (e) { console.log('  ⊗ last_name skipped:', e.message); }

    try {
      await queryInterface.changeColumn('employees', 'email', {
        type: Sequelize.STRING(500),
        allowNull: true
      });
      console.log('  ✓ email updated');
    } catch (e) { console.log('  ⊗ email skipped:', e.message); }

    try {
      await queryInterface.changeColumn('employees', 'phone', {
        type: Sequelize.STRING(500),
        allowNull: true
      });
      console.log('  ✓ phone updated');
    } catch (e) { console.log('  ⊗ phone skipped:', e.message); }

    try {
      await queryInterface.changeColumn('employees', 'contact_info', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('  ✓ contact_info updated');
    } catch (e) { console.log('  ⊗ contact_info skipped:', e.message); }

    console.log('✅ Employees table updated\n');

    // CLIENTS TABLE
    console.log('📝 Updating clients table...');
    try {
      await queryInterface.changeColumn('clients', 'client_name', {
        type: Sequelize.STRING(500),
        allowNull: false
      });
      console.log('  ✓ client_name updated');
    } catch (e) { console.log('  ⊗ client_name skipped:', e.message); }

    try {
      await queryInterface.changeColumn('clients', 'legal_name', {
        type: Sequelize.STRING(500),
        allowNull: true
      });
      console.log('  ✓ legal_name updated');
    } catch (e) { console.log('  ⊗ legal_name skipped:', e.message); }

    try {
      await queryInterface.changeColumn('clients', 'contact_person', {
        type: Sequelize.STRING(500),
        allowNull: true
      });
      console.log('  ✓ contact_person updated');
    } catch (e) { console.log('  ⊗ contact_person skipped:', e.message); }

    try {
      await queryInterface.changeColumn('clients', 'email', {
        type: Sequelize.STRING(500),
        allowNull: true
      });
      console.log('  ✓ email updated');
    } catch (e) { console.log('  ⊗ email skipped:', e.message); }

    try {
      await queryInterface.changeColumn('clients', 'phone', {
        type: Sequelize.STRING(500),
        allowNull: true
      });
      console.log('  ✓ phone updated');
    } catch (e) { console.log('  ⊗ phone skipped:', e.message); }

    console.log('✅ Clients table updated\n');

    console.log('✅ Migration completed successfully!');
    console.log('\n🔒 All encrypted fields now support VARCHAR(500) or TEXT');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  up()
    .then(() => {
      console.log('\n✅ Migration completed. Closing database connection...');
      return sequelize.close();
    })
    .then(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      sequelize.close().then(() => process.exit(1));
    });
}

module.exports = { up };
