/**
 * Migration: Update implementation_partners field lengths
 * Increases field lengths to accommodate encrypted data and removes email validation
 */

const { Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface, DataTypes) => {
    console.log('🔄 Updating implementation_partners field lengths...');
    
    try {
      // Update name field length
      await queryInterface.changeColumn('implementation_partners', 'name', {
        type: DataTypes.STRING(500),
        allowNull: false,
      });
      console.log('✅ Updated name field to VARCHAR(500)');

      // Update legal_name field length
      await queryInterface.changeColumn('implementation_partners', 'legal_name', {
        type: DataTypes.STRING(500),
        allowNull: true,
      });
      console.log('✅ Updated legal_name field to VARCHAR(500)');

      // Update contact_person field length
      await queryInterface.changeColumn('implementation_partners', 'contact_person', {
        type: DataTypes.STRING(500),
        allowNull: true,
      });
      console.log('✅ Updated contact_person field to VARCHAR(500)');

      // Update email field length (remove validation - done in model)
      await queryInterface.changeColumn('implementation_partners', 'email', {
        type: DataTypes.STRING(500),
        allowNull: true,
      });
      console.log('✅ Updated email field to VARCHAR(500)');

      // Update phone field length
      await queryInterface.changeColumn('implementation_partners', 'phone', {
        type: DataTypes.STRING(100),
        allowNull: true,
      });
      console.log('✅ Updated phone field to VARCHAR(100)');

      // Update specialization field length
      await queryInterface.changeColumn('implementation_partners', 'specialization', {
        type: DataTypes.STRING(500),
        allowNull: true,
      });
      console.log('✅ Updated specialization field to VARCHAR(500)');

      console.log('✅ Field lengths migration completed successfully');
    } catch (error) {
      console.error('❌ Error during migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, DataTypes) => {
    console.log('🔄 Reverting field length changes...');
    
    try {
      // Revert to original lengths
      await queryInterface.changeColumn('implementation_partners', 'name', {
        type: DataTypes.STRING(255),
        allowNull: false,
      });
      
      await queryInterface.changeColumn('implementation_partners', 'legal_name', {
        type: DataTypes.STRING(255),
        allowNull: true,
      });
      
      await queryInterface.changeColumn('implementation_partners', 'contact_person', {
        type: DataTypes.STRING(255),
        allowNull: true,
      });
      
      await queryInterface.changeColumn('implementation_partners', 'email', {
        type: DataTypes.STRING(255),
        allowNull: true,
      });
      
      await queryInterface.changeColumn('implementation_partners', 'phone', {
        type: DataTypes.STRING(20),
        allowNull: true,
      });
      
      await queryInterface.changeColumn('implementation_partners', 'specialization', {
        type: DataTypes.STRING(255),
        allowNull: true,
      });
      
      console.log('✅ Field lengths migration reverted');
    } catch (error) {
      console.error('❌ Error during migration rollback:', error);
      throw error;
    }
  }
};
