/**
 * Migration: Add OAuth fields to users table
 * Adds googleId, authProvider, and emailVerified fields to support Google OAuth authentication
 */

const { Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface, DataTypes) => {
    console.log('🔄 Adding OAuth fields to users table...');
    
    try {
      // Add googleId column
      await queryInterface.addColumn('users', 'google_id', {
        type: DataTypes.STRING(255),
        allowNull: true,
      });
      console.log('✅ Added google_id column');

      // Add authProvider column
      await queryInterface.addColumn('users', 'auth_provider', {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'local',
      });
      console.log('✅ Added auth_provider column');

      // Add emailVerified column
      await queryInterface.addColumn('users', 'email_verified', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      });
      console.log('✅ Added email_verified column');

      // Make password_hash nullable for OAuth users
      await queryInterface.changeColumn('users', 'password_hash', {
        type: DataTypes.STRING(255),
        allowNull: true,
      });
      console.log('✅ Made password_hash nullable');

      console.log('✅ OAuth fields migration completed successfully');
    } catch (error) {
      console.error('❌ Error during migration:', error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    console.log('🔄 Reverting OAuth fields migration...');
    
    try {
      // Remove added columns
      await queryInterface.removeColumn('users', 'google_id');
      await queryInterface.removeColumn('users', 'auth_provider');
      await queryInterface.removeColumn('users', 'email_verified');
      
      // Make password_hash non-nullable again
      await queryInterface.changeColumn('users', 'password_hash', {
        type: Sequelize.STRING(255),
        allowNull: false,
      });
      
      console.log('✅ OAuth fields migration reverted');
    } catch (error) {
      console.error('❌ Error during migration rollback:', error);
      throw error;
    }
  }
};
