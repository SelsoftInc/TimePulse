/**
 * Migration: Add approver_id field to employees table
 * This field stores the user who approves this employee's timesheets and leave requests
 */

const { Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Adding approver_id column to employees table...');
    
    try {
      // Check if column already exists
      const tableDescription = await queryInterface.describeTable('employees');
      
      if (tableDescription.approver_id) {
        console.log('Column approver_id already exists in employees table');
        return;
      }

      // Add approver_id column
      await queryInterface.addColumn('employees', 'approver_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User who approves this employee\'s timesheets and leave requests'
      });

      console.log('✅ Successfully added approver_id column to employees table');

      // Create index for better query performance
      await queryInterface.addIndex('employees', ['approver_id'], {
        name: 'idx_employees_approver_id'
      });

      console.log('✅ Successfully created index on approver_id column');

    } catch (error) {
      console.error('❌ Error adding approver_id column:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Removing approver_id column from employees table...');
    
    try {
      // Remove index first
      await queryInterface.removeIndex('employees', 'idx_employees_approver_id');
      console.log('✅ Removed index on approver_id column');

      // Remove column
      await queryInterface.removeColumn('employees', 'approver_id');
      console.log('✅ Successfully removed approver_id column from employees table');

    } catch (error) {
      console.error('❌ Error removing approver_id column:', error.message);
      throw error;
    }
  }
};
