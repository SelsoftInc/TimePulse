const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LeaveRequest = sequelize.define('LeaveRequest', {
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
    leaveType: {
      type: DataTypes.ENUM('vacation', 'sick', 'personal', 'unpaid', 'other'),
      allowNull: false,
      field: 'leave_type',
      comment: 'Type of leave requested'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'end_date'
    },
    totalDays: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      field: 'total_days',
      comment: 'Total number of days (can be fractional for half days)'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for leave request'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Current status of leave request'
    },
    attachmentUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'attachment_url',
      comment: 'URL to uploaded attachment (e.g., medical certificate)'
    },
    attachmentName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'attachment_name',
      comment: 'Original filename of attachment'
    },
    approverId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'approver_id',
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User ID who is assigned to approve this request (usually employee manager)'
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'reviewed_by',
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User ID who actually approved/rejected the request'
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at',
      comment: 'Timestamp when request was reviewed'
    },
    reviewComments: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'review_comments',
      comment: 'Comments from reviewer (especially for rejections)'
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
    tableName: 'leave_requests',
    timestamps: true,
    indexes: [
      {
        fields: ['employee_id', 'tenant_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['start_date', 'end_date']
      },
      {
        fields: ['tenant_id', 'status']
      }
    ]
  });

  return LeaveRequest;
};
