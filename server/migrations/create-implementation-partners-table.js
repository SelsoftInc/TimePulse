/**
 * Migration: Create implementation_partners table
 * Creates the implementation_partners table with all required fields
 */

const { Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface, DataTypes) => {
    console.log('🔄 Creating implementation_partners table...');
    
    try {
      await queryInterface.createTable('implementation_partners', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        tenant_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'tenants',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        name: {
          type: DataTypes.STRING(500),
          allowNull: false,
        },
        legal_name: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        contact_person: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        phone: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        address: {
          type: DataTypes.JSONB,
          defaultValue: {},
          allowNull: true,
        },
        category: {
          type: DataTypes.STRING(50),
          defaultValue: 'implementation_partner',
          allowNull: true,
        },
        specialization: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('active', 'inactive', 'pending'),
          defaultValue: 'active',
          allowNull: false,
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
      
      console.log('✅ Created implementation_partners table');

      // Add unique constraint on tenant_id + name
      await queryInterface.addIndex('implementation_partners', ['tenant_id', 'name'], {
        unique: true,
        name: 'implementation_partners_tenant_id_name_unique',
      });
      console.log('✅ Added unique index on tenant_id + name');

      // Add index on tenant_id + status for faster queries
      await queryInterface.addIndex('implementation_partners', ['tenant_id', 'status'], {
        name: 'implementation_partners_tenant_id_status_index',
      });
      console.log('✅ Added index on tenant_id + status');

      console.log('✅ Implementation partners table migration completed successfully');
    } catch (error) {
      console.error('❌ Error during migration:', error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    console.log('🔄 Reverting implementation_partners table migration...');
    
    try {
      await queryInterface.dropTable('implementation_partners');
      console.log('✅ Implementation partners table migration reverted');
    } catch (error) {
      console.error('❌ Error during migration rollback:', error);
      throw error;
    }
  }
};
