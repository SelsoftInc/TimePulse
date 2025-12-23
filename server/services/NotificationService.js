const { models } = require("../models");
const { Op } = require("sequelize");
let Notification, User, Employee;

// Safely initialize models with error handling
try {
  Notification = models.Notification;
  User = models.User;
  Employee = models.Employee;
} catch (error) {
  console.error("⚠️ Error initializing NotificationService models:", error.message);
}

class NotificationService {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.tenantId - Tenant ID
   * @param {string} notificationData.userId - User ID (optional for broadcast)
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {string} notificationData.type - Notification type (info, success, warning, error)
   * @param {string} notificationData.category - Notification category
   * @param {string} notificationData.priority - Notification priority (low, medium, high, urgent)
   * @param {Date} notificationData.expiresAt - Expiration date (optional)
   * @param {string} notificationData.actionUrl - Action URL (optional)
   * @param {Object} notificationData.metadata - Additional metadata (optional)
   * @returns {Promise<Object>} Created notification
   */
  static async createNotification(notificationData) {
    try {
      console.log(`📝 Creating notification:`, {
        userId: notificationData.userId,
        title: notificationData.title,
        category: notificationData.category,
        type: notificationData.type
      });
      
      const notification = await Notification.create(notificationData);
      console.log(`✅ Notification created successfully with ID: ${notification.id}`);
      return notification;
    } catch (error) {
      console.error("❌ Error creating notification:", error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   * @param {string} tenantId - Tenant ID
   * @param {Array<string>} userIds - Array of user IDs
   * @param {Object} notificationData - Notification data (without userId)
   * @returns {Promise<Array>} Created notifications
   */
  static async createBulkNotifications(tenantId, userIds, notificationData) {
    try {
      const notifications = await Promise.all(
        userIds.map((userId) =>
          Notification.create({
            ...notificationData,
            tenantId,
            userId,
          })
        )
      );
      return notifications;
    } catch (error) {
      console.error("Error creating bulk notifications:", error);
      throw error;
    }
  }

  /**
   * Create notification for all users in a tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Array>} Created notifications
   */
  static async createTenantNotification(tenantId, notificationData) {
    try {
      // Get all users in the tenant
      const users = await User.findAll({
        where: { tenantId },
        attributes: ["id"],
      });

      const userIds = users.map((user) => user.id);
      return await this.createBulkNotifications(
        tenantId,
        userIds,
        notificationData
      );
    } catch (error) {
      console.error("Error creating tenant notification:", error);
      throw error;
    }
  }

  /**
   * Create notification for all employees in a tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Array>} Created notifications
   */
  static async createEmployeeNotification(tenantId, notificationData) {
    try {
      // Get all employees with user accounts in the tenant
      const employees = await Employee.findAll({
        where: {
          tenantId,
          userId: { [Op.ne]: null },
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id"],
          },
        ],
      });

      const userIds = employees
        .filter((emp) => emp.user)
        .map((emp) => emp.user.id);

      return await this.createBulkNotifications(
        tenantId,
        userIds,
        notificationData
      );
    } catch (error) {
      console.error("Error creating employee notification:", error);
      throw error;
    }
  }

  /**
   * Create notification for specific roles
   * @param {string} tenantId - Tenant ID
   * @param {Array<string>} roles - Array of roles (admin, manager, employee, etc.)
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Array>} Created notifications
   */
  static async createRoleNotification(tenantId, roles, notificationData) {
    try {
      console.log(`🔔 Creating role notification for tenant: ${tenantId}, roles:`, roles);
      
      const users = await User.findAll({
        where: {
          tenantId,
          role: { [Op.in]: roles },
        },
        attributes: ["id", "email", "role"],
      });

      console.log(`📧 Found ${users.length} users with roles ${roles.join(', ')}:`, users.map(u => ({ id: u.id, email: u.email, role: u.role })));

      if (users.length === 0) {
        console.warn(`⚠️ No users found with roles ${roles.join(', ')} for tenant ${tenantId}`);
        return [];
      }

      const userIds = users.map((user) => user.id);
      const notifications = await this.createBulkNotifications(
        tenantId,
        userIds,
        notificationData
      );
      
      console.log(`✅ Created ${notifications.length} notifications for approvers`);
      return notifications;
    } catch (error) {
      console.error("❌ Error creating role notification:", error);
      throw error;
    }
  }

  /**
   * Create timesheet-related notification
   * @param {string} tenantId - Tenant ID
   * @param {string} employeeId - Employee ID
   * @param {string} type - Notification type (submitted, approved, rejected, reminder)
   * @param {Object} timesheetData - Timesheet data
   * @returns {Promise<Object>} Created notification
   */
  static async createTimesheetNotification(
    tenantId,
    employeeId,
    type,
    timesheetData
  ) {
    const employee = await Employee.findOne({
      where: { id: employeeId, tenantId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName"],
          required: false,
        },
      ],
    });

    // If employee not found, try to get user directly
    let userId = null;
    if (employee && employee.user) {
      userId = employee.user.id;
    } else {
      // Try to get user directly if employee record doesn't exist
      const user = await User.findByPk(employeeId);
      if (user) {
        userId = user.id;
      } else {
        console.warn(`⚠️ User not found for employeeId: ${employeeId}`);
        return null; // Don't throw error, just return null
      }
    }

    const notificationTemplates = {
      submitted: {
        title: "Timesheet Submitted",
        message: `Timesheet for week of ${timesheetData.weekStartDate} has been submitted for approval.`,
        type: "info",
        category: "timesheet",
        priority: "medium",
        actionUrl: `/timesheets/approval`,
      },
      approved: {
        title: "Timesheet Approved",
        message: `Your timesheet for week of ${timesheetData.weekStartDate} has been approved.`,
        type: "success",
        category: "timesheet",
        priority: "medium",
        actionUrl: `/timesheets`,
      },
      rejected: {
        title: "Timesheet Rejected",
        message: `Your timesheet for week of ${timesheetData.weekStartDate} has been rejected. Please review and resubmit.`,
        type: "warning",
        category: "timesheet",
        priority: "high",
        actionUrl: `/timesheets/submit`,
      },
      reminder: {
        title: "Timesheet Reminder",
        message: `Don't forget to submit your timesheet for week of ${timesheetData.weekStartDate}.`,
        type: "info",
        category: "reminder",
        priority: "medium",
        actionUrl: `/timesheets/submit`,
      },
    };

    const template = notificationTemplates[type];
    if (!template) {
      throw new Error(`Invalid timesheet notification type: ${type}`);
    }

    return await this.createNotification({
      tenantId,
      userId: userId,
      ...template,
      metadata: {
        timesheetId: timesheetData.id,
        employeeId,
        weekStartDate: timesheetData.weekStartDate,
        weekEndDate: timesheetData.weekEndDate,
      },
    });
  }

  /**
   * Create leave-related notification
   * @param {string} tenantId - Tenant ID
   * @param {string} employeeId - Employee ID
   * @param {string} type - Notification type (requested, approved, rejected, reminder)
   * @param {Object} leaveData - Leave request data
   * @returns {Promise<Object>} Created notification
   */
  static async createLeaveNotification(tenantId, employeeId, type, leaveData) {
    const employee = await Employee.findOne({
      where: { id: employeeId, tenantId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });

    if (!employee || !employee.user) {
      throw new Error("Employee or user not found");
    }

    const notificationTemplates = {
      requested: {
        title: "Leave Request Submitted",
        message: `Leave request for ${leaveData.startDate} to ${leaveData.endDate} has been submitted for approval.`,
        type: "info",
        category: "leave",
        priority: "medium",
        actionUrl: `/leave-management`,
      },
      approved: {
        title: "Leave Request Approved",
        message: `Your leave request for ${leaveData.startDate} to ${leaveData.endDate} has been approved.`,
        type: "success",
        category: "leave",
        priority: "medium",
        actionUrl: `/leave-management`,
      },
      rejected: {
        title: "Leave Request Rejected",
        message: `Your leave request for ${leaveData.startDate} to ${leaveData.endDate} has been rejected.`,
        type: "warning",
        category: "leave",
        priority: "high",
        actionUrl: `/leave-management`,
      },
    };

    const template = notificationTemplates[type];
    if (!template) {
      throw new Error(`Invalid leave notification type: ${type}`);
    }

    return await this.createNotification({
      tenantId,
      userId: employee.user.id,
      ...template,
      metadata: {
        leaveRequestId: leaveData.id,
        employeeId,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        leaveType: leaveData.leaveType,
      },
    });
  }

  /**
   * Create approval notification for managers/admins
   * @param {string} tenantId - Tenant ID
   * @param {string} type - Approval type (timesheet, leave)
   * @param {Object} data - Approval data
   * @returns {Promise<Array>} Created notifications
   */
  static async createApprovalNotification(tenantId, type, data) {
    const approverRoles = ["admin", "manager", "approver"];

    const notificationTemplates = {
      timesheet: {
        title: "Timesheet Pending Approval",
        message: `${data.employeeName} has submitted a timesheet for week of ${data.weekStartDate} and is waiting for your approval.`,
        type: "info",
        category: "approval",
        priority: "medium",
        actionUrl: `/timesheets/approval`,
      },
      leave: {
        title: "Leave Request Pending Approval",
        message: `${data.employeeName} has submitted a leave request for ${data.startDate} to ${data.endDate} and is waiting for your approval.`,
        type: "info",
        category: "approval",
        priority: "medium",
        actionUrl: `/leave-management`,
      },
    };

    const template = notificationTemplates[type];
    if (!template) {
      throw new Error(`Invalid approval notification type: ${type}`);
    }

    return await this.createRoleNotification(tenantId, approverRoles, {
      ...template,
      metadata: {
        ...data,
        approvalType: type,
      },
    });
  }

  /**
   * Clean up expired notifications
   * @param {string} tenantId - Tenant ID (optional)
   * @returns {Promise<number>} Number of deleted notifications
   */
  static async cleanupExpiredNotifications(tenantId = null) {
    try {
      const whereClause = {
        expiresAt: { [Op.lt]: new Date() },
      };

      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      const deletedCount = await Notification.destroy({
        where: whereClause,
      });

      return deletedCount;
    } catch (error) {
      console.error("Error cleaning up expired notifications:", error);
      throw error;
    }
  }
}

module.exports = NotificationService;
