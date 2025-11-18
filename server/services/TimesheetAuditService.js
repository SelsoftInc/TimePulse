const { models } = require("../models");
const { Op } = require("sequelize");

/**
 * Service to handle timesheet audit logging
 */
class TimesheetAuditService {
  /**
   * Log a timesheet change
   * @param {Object} options
   * @param {string} options.timesheetId - UUID of the timesheet
   * @param {string} options.action - Action type (create, update, delete, submit, approve, reject, draft_save)
   * @param {Object} options.oldValues - Previous values (optional)
   * @param {Object} options.newValues - New values (optional)
   * @param {Array<string>} options.changedFields - Array of field names that changed
   * @param {string} options.changedBy - UUID of user who made the change
   * @param {string} options.changedByEmail - Email of user who made the change
   * @param {string} options.tenantId - Tenant ID
   * @param {string} options.employeeId - Employee ID
   * @param {string} options.ipAddress - IP address (optional)
   * @param {string} options.userAgent - User agent (optional)
   * @param {Object} options.metadata - Additional metadata (optional)
   */
  static async logChange({
    timesheetId,
    action,
    oldValues = {},
    newValues = {},
    changedFields = [],
    changedBy = null,
    changedByEmail = null,
    tenantId,
    employeeId,
    ipAddress = null,
    userAgent = null,
    metadata = {},
  }) {
    try {
      // Only log fields that actually changed
      const filteredOldValues = {};
      const filteredNewValues = {};
      
      if (changedFields.length > 0) {
        changedFields.forEach((field) => {
          if (oldValues.hasOwnProperty(field)) {
            filteredOldValues[field] = oldValues[field];
          }
          if (newValues.hasOwnProperty(field)) {
            filteredNewValues[field] = newValues[field];
          }
        });
      } else {
        // If no changedFields specified, log all provided values
        filteredOldValues = oldValues;
        filteredNewValues = newValues;
      }

      const auditEntry = await models.TimesheetAudit.create({
        timesheetId,
        action,
        oldValues: filteredOldValues,
        newValues: filteredNewValues,
        changedFields: changedFields.length > 0 ? changedFields : Object.keys(filteredNewValues),
        changedBy,
        changedByEmail,
        tenantId,
        employeeId,
        ipAddress,
        userAgent,
        metadata,
      });

      return auditEntry;
    } catch (error) {
      // Don't throw errors - audit logging should never break the main flow
      console.error("❌ Error logging timesheet audit:", error);
      return null;
    }
  }

  /**
   * Get audit history for a timesheet
   * @param {string} timesheetId - UUID of the timesheet
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of audit entries
   */
  static async getAuditHistory(timesheetId, options = {}) {
    const { limit = 100, offset = 0, action = null } = options;

    const where = { timesheetId };
    if (action) {
      where.action = action;
    }

    const auditEntries = await models.TimesheetAudit.findAll({
      where,
      order: [["changedAt", "DESC"]],
      limit,
      offset,
      include: [
        {
          model: models.User,
          as: "changedByUser",
          attributes: ["id", "firstName", "lastName", "email"],
          required: false,
        },
      ],
    });

    return auditEntries;
  }

  /**
   * Get audit history for an employee
   * @param {string} employeeId - UUID of the employee
   * @param {string} tenantId - Tenant ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of audit entries
   */
  static async getEmployeeAuditHistory(employeeId, tenantId, options = {}) {
    const { limit = 100, offset = 0, action = null, fromDate = null, toDate = null } = options;

    const where = { employeeId, tenantId };
    if (action) {
      where.action = action;
    }
    if (fromDate || toDate) {
      where.changedAt = {};
      if (fromDate) where.changedAt[Op.gte] = fromDate;
      if (toDate) where.changedAt[Op.lte] = toDate;
    }

    const auditEntries = await models.TimesheetAudit.findAll({
      where,
      order: [["changedAt", "DESC"]],
      limit,
      offset,
      include: [
        {
          model: models.User,
          as: "changedByUser",
          attributes: ["id", "firstName", "lastName", "email"],
          required: false,
        },
        {
          model: models.Timesheet,
          as: "timesheet",
          attributes: ["id", "weekStart", "weekEnd", "status"],
          required: false,
        },
      ],
    });

    return auditEntries;
  }

  /**
   * Get audit history for a tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of audit entries
   */
  static async getTenantAuditHistory(tenantId, options = {}) {
    const {
      limit = 100,
      offset = 0,
      action = null,
      employeeId = null,
      fromDate = null,
      toDate = null,
    } = options;

    const where = { tenantId };
    if (action) {
      where.action = action;
    }
    if (employeeId) {
      where.employeeId = employeeId;
    }
    if (fromDate || toDate) {
      where.changedAt = {};
      if (fromDate) where.changedAt[Op.gte] = fromDate;
      if (toDate) where.changedAt[Op.lte] = toDate;
    }

    const auditEntries = await models.TimesheetAudit.findAll({
      where,
      order: [["changedAt", "DESC"]],
      limit,
      offset,
      include: [
        {
          model: models.User,
          as: "changedByUser",
          attributes: ["id", "firstName", "lastName", "email"],
          required: false,
        },
        {
          model: models.Timesheet,
          as: "timesheet",
          attributes: ["id", "weekStart", "weekEnd", "status"],
          required: false,
        },
        {
          model: models.Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "email"],
          required: false,
        },
      ],
    });

    return auditEntries;
  }
}

module.exports = TimesheetAuditService;

