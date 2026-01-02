/**
 * AccountRequest Model
 * Stores user account creation requests pending approval
 */

module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  const AccountRequest = sequelize.define(
    'AccountRequest',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenantId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'tenant_id',
        references: {
          model: 'tenants',
          key: 'id',
        },
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'first_name',
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'last_name',
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      countryCode: {
        type: DataTypes.STRING(5),
        allowNull: false,
        defaultValue: '+1',
        field: 'country_code',
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'password_hash',
      },
      requestedRole: {
        type: DataTypes.ENUM('admin', 'manager', 'approver', 'employee', 'accountant', 'hr'),
        allowNull: false,
        defaultValue: 'employee',
        field: 'requested_role',
      },
      requestedApproverId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'requested_approver_id',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      companyName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'company_name',
      },
      department: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      approvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'approved_by',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approved_at',
      },
      rejectedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'rejected_by',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      rejectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'rejected_at',
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'rejection_reason',
      },
      temporaryPassword: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'temporary_password',
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
    },
    {
      tableName: 'account_requests',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return AccountRequest;
};
