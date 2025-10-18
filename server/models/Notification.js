const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Notification = sequelize.define(
    "Notification",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "tenant_id",
        references: {
          model: "tenants",
          key: "id",
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "user_id",
        references: {
          model: "users",
          key: "id",
        },
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("info", "success", "warning", "error"),
        defaultValue: "info",
      },
      category: {
        type: DataTypes.ENUM(
          "general",
          "timesheet",
          "leave",
          "invoice",
          "system",
          "approval",
          "reminder"
        ),
        defaultValue: "general",
      },
      priority: {
        type: DataTypes.ENUM("low", "medium", "high", "urgent"),
        defaultValue: "medium",
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "read_at",
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "expires_at",
      },
      actionUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: "action_url",
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: "notifications",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  // Instance methods
  Notification.prototype.markAsRead = function () {
    this.readAt = new Date();
    return this.save();
  };

  Notification.prototype.isRead = function () {
    return this.readAt !== null;
  };

  Notification.prototype.isExpired = function () {
    return this.expiresAt && new Date() > this.expiresAt;
  };

  // Class methods
  Notification.getUnreadCount = async function (userId, tenantId) {
    return await this.count({
      where: {
        userId,
        tenantId,
        readAt: null,
        [sequelize.Op.or]: [
          { expiresAt: null },
          { expiresAt: { [sequelize.Op.gt]: new Date() } },
        ],
      },
    });
  };

  Notification.getUserNotifications = async function (userId, tenantId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      category = null,
      type = null,
      priority = null,
      includeRead = false,
    } = options;

    const whereClause = {
      userId,
      tenantId,
      [sequelize.Op.or]: [
        { expiresAt: null },
        { expiresAt: { [sequelize.Op.gt]: new Date() } },
      ],
    };

    if (!includeRead) {
      whereClause.readAt = null;
    }

    if (category) {
      whereClause.category = category;
    }

    if (type) {
      whereClause.type = type;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    return await this.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
  };

  return Notification;
};
