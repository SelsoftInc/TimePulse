/**
 * Migration: Increase Encrypted Field Lengths
 * 
 * Problem: Encrypted data is much longer than plain text
 * Solution: Increase VARCHAR lengths for all encrypted fields
 * 
 * Affected Models:
 * - Vendor: name, email, phone, contactPerson, address, taxId
 * - Employee: firstName, lastName, email, phone, contactInfo
 * - Client: clientName, name, legalName, contactPerson, email, phone, billingAddress, shippingAddress, taxId
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

    // VENDORS TABLE
    console.log('📝 Updating vendors table...');
    await queryInterface.changeColumn('vendors', 'name', {
      type: Sequelize.STRING(500),
      allowNull: false
    });
    await queryInterface.changeColumn('vendors', 'email', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
    await queryInterface.changeColumn('vendors', 'phone', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
    await queryInterface.changeColumn('vendors', 'contact_person', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
    await queryInterface.changeColumn('vendors', 'address', {
      type: Sequelize.STRING(1000),
      allowNull: true
    });
    // Note: tax_id column doesn't exist in vendors table, skipping
    console.log('✅ Vendors table updated\n');

    // EMPLOYEES TABLE
    console.log('📝 Updating employees table...');
    await queryInterface.changeColumn('employees', 'first_name', {
      type: Sequelize.STRING(500),
      allowNull: false
    });
    await queryInterface.changeColumn('employees', 'last_name', {
      type: Sequelize.STRING(500),
      allowNull: false
    });
    await queryInterface.changeColumn('employees', 'email', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
    await queryInterface.changeColumn('employees', 'phone', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
    await queryInterface.changeColumn('employees', 'contact_info', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    console.log('✅ Employees table updated\n');

    // CLIENTS TABLE
    console.log('📝 Updating clients table...');
    await queryInterface.changeColumn('clients', 'client_name', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
    await queryInterface.changeColumn('clients', 'name', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
    await queryInterface.changeColumn('clients', 'legal_name', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
    await queryInterface.changeColumn('clients', 'contact_person', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
    await queryInterface.changeColumn('clients', 'email', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
    await queryInterface.changeColumn('clients', 'phone', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
    // Note: tax_id column doesn't exist in clients table, skipping
    console.log('✅ Clients table updated\n');

    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Vendors: 5 fields updated (name, email, phone, contact_person, address)');
    console.log('   - Employees: 5 fields updated (first_name, last_name, email, phone, contact_info)');
    console.log('   - Clients: 6 fields updated (client_name, name, legal_name, contact_person, email, phone)');
    console.log('\n🔒 All encrypted fields now support VARCHAR(500) or TEXT');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

async function down() {
  const queryInterface = sequelize.getQueryInterface();
  
  console.log('🔧 Rolling back migration: Increase encrypted field lengths\n');

  try {
    // VENDORS TABLE - Revert to original sizes
    console.log('📝 Reverting vendors table...');
    await queryInterface.changeColumn('vendors', 'name', {
      type: Sequelize.STRING(255),
      allowNull: false
    });
    await queryInterface.changeColumn('vendors', 'email', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.changeColumn('vendors', 'phone', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    await queryInterface.changeColumn('vendors', 'contact_person', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.changeColumn('vendors', 'address', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    // Note: tax_id column doesn't exist in vendors table, skipping
    console.log('✅ Vendors table reverted\n');

    // EMPLOYEES TABLE - Revert to original sizes
    console.log('📝 Reverting employees table...');
    await queryInterface.changeColumn('employees', 'first_name', {
      type: Sequelize.STRING(100),
      allowNull: false
    });
    await queryInterface.changeColumn('employees', 'last_name', {
      type: Sequelize.STRING(100),
      allowNull: false
    });
    await queryInterface.changeColumn('employees', 'email', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.changeColumn('employees', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true
    });
    await queryInterface.changeColumn('employees', 'contact_info', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    console.log('✅ Employees table reverted\n');

    // CLIENTS TABLE - Revert to original sizes
    console.log('📝 Reverting clients table...');
    await queryInterface.changeColumn('clients', 'client_name', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.changeColumn('clients', 'name', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.changeColumn('clients', 'legal_name', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.changeColumn('clients', 'contact_person', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.changeColumn('clients', 'email', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.changeColumn('clients', 'phone', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    // Note: tax_id column doesn't exist in clients table, skipping
    console.log('✅ Clients table reverted\n');

    console.log('✅ Rollback completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Rollback failed:', error);
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

module.exports = { up, down };
