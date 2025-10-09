const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmployeeRelationship = sequelize.define('EmployeeRelationship', {
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
      onDelete: 'CASCADE',
      comment: 'The employee who is being managed/supervised'
    },
    relatedUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'related_user_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: 'The user who has authority over the employee'
    },
    relationshipType: {
      type: DataTypes.ENUM(
        'manager',           // Direct line manager
        'leave_approver',    // Approves leave requests
        'timesheet_approver', // Approves timesheets
        'expense_approver',  // Approves expenses
        'performance_reviewer', // Conducts performance reviews
        'mentor',            // Mentorship relationship
        'backup_approver'    // Backup when primary is unavailable
      ),
      allowNull: false,
      field: 'relationship_type',
      comment: 'Type of relationship/authority'
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'tenant_id',
      references: {
        model: 'tenants',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_primary',
      comment: 'Whether this is the primary approver for this relationship type'
    },
    effectiveFrom: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'effective_from',
      comment: 'When this relationship becomes active'
    },
    effectiveTo: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'effective_to',
      comment: 'When this relationship ends (null = ongoing)'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
      comment: 'Whether this relationship is currently active'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes about this relationship'
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
    tableName: 'employee_relationships',
    timestamps: true,
    indexes: [
      {
        fields: ['employee_id', 'relationship_type', 'is_active'],
        name: 'idx_employee_relationship_active'
      },
      {
        fields: ['related_user_id', 'relationship_type', 'is_active'],
        name: 'idx_approver_relationship_active'
      },
      {
        fields: ['tenant_id', 'relationship_type'],
        name: 'idx_tenant_relationship'
      },
      {
        fields: ['employee_id', 'tenant_id'],
        name: 'idx_employee_tenant'
      },
      {
        // Ensure only one primary approver per employee per relationship type
        unique: true,
        fields: ['employee_id', 'relationship_type', 'is_primary', 'tenant_id'],
        where: { is_primary: true, is_active: true },
        name: 'unique_primary_approver'
      }
    ]
  });

  return EmployeeRelationship;
};
