const { Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Adding overtime and additional fields to employees table...');
    
    try {
      // Add overtime_rate column
      await queryInterface.addColumn('employees', 'overtime_rate', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
      console.log('✅ Added overtime_rate column');

      // Add enable_overtime column
      await queryInterface.addColumn('employees', 'enable_overtime', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      });
      console.log('✅ Added enable_overtime column');

      // Add overtime_multiplier column
      await queryInterface.addColumn('employees', 'overtime_multiplier', {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 1.5,
      });
      console.log('✅ Added overtime_multiplier column');

      // Add approver column
      await queryInterface.addColumn('employees', 'approver', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
      console.log('✅ Added approver column');

      // Add notes column
      await queryInterface.addColumn('employees', 'notes', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
      console.log('✅ Added notes column');

      console.log('✅ Migration completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Removing overtime and additional fields from employees table...');
    
    try {
      await queryInterface.removeColumn('employees', 'overtime_rate');
      await queryInterface.removeColumn('employees', 'enable_overtime');
      await queryInterface.removeColumn('employees', 'overtime_multiplier');
      await queryInterface.removeColumn('employees', 'approver');
      await queryInterface.removeColumn('employees', 'notes');
      
      console.log('✅ Rollback completed successfully');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
