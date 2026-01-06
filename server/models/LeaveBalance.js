const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LeaveBalance = sequelize.define('LeaveBalance', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'employee_id',
      references: {
        model: 'employees',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'tenant_id',
      references: {
        model: 'tenants',
        key: 'id'
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Year for which this balance applies'
    },
    leaveType: {
      type: DataTypes.ENUM('sick', 'casual', 'earned', 'vacation', 'personal', 'unpaid', 'other'),
      allowNull: false,
      field: 'leave_type'
    },
    totalDays: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'total_days',
      comment: 'Total days allocated for this leave type'
    },
    usedDays: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'used_days',
      comment: 'Days already used (approved leaves)'
    },
    pendingDays: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'pending_days',
      comment: 'Days in pending leave requests'
    },
    carryForwardDays: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'carry_forward_days',
      comment: 'Days carried forward from previous year'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at'
    }
  }, {
    tableName: 'leave_balances',
    timestamps: true,
    indexes: [
      {
        fields: ['employee_id', 'tenant_id', 'year', 'leave_type'],
        unique: true,
        name: 'unique_employee_year_leave_type'
      },
      {
        fields: ['tenant_id', 'year']
      }
    ]
  });

  return LeaveBalance;
};
