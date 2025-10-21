const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Lookup = sequelize.define('Lookup', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Category of lookup (e.g., payment_terms, client_type, etc.)'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Unique code for the lookup value'
    },
    label: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Display label for the lookup value'
    },
    value: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Optional value field for additional data'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'display_order',
      comment: 'Order in which to display the lookup values'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
      comment: 'Whether this lookup value is active'
    },
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'tenant_id',
      comment: 'Optional tenant ID for tenant-specific lookups'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  }, {
    tableName: 'lookups',
    timestamps: true,
    indexes: [
      {
        fields: ['category', 'code'],
        unique: true
      },
      {
        fields: ['category', 'is_active']
      },
      {
        fields: ['tenant_id']
      }
    ]
  });

  return Lookup;
};
