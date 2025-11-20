/**
 * Timesheet Routes - DB backed
 */

const express = require("express");
const router = express.Router();
const { models } = require("../models");
const { Op } = require("sequelize");
const NotificationService = require("../services/NotificationService");
const EmailService = require("../services/EmailService");
const TimesheetAuditService = require("../services/TimesheetAuditService");
const { getAuditInfo } = require("../middleware/auditHelper");
const multer = require("multer");
const S3Service = require("../services/S3Service");
const { S3_CONFIG } = require("../config/aws");

// Helpers
// Format date as YYYY-MM-DD in local time to avoid UTC shift issues
const toDateOnly = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const getWeekRangeMonToSun = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun - 6 Sat
  const diffToMon = (day === 0 ? -6 : 1) - day; // move to Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { weekStart: toDateOnly(monday), weekEnd: toDateOnly(sunday) };
};

// GET /api/timesheets?tenantId=...&scope=...&employeeId=...&from=...&to=...&client=...&q=...
// Get timesheets with scope filtering for dashboard
router.get("/", async (req, res, next) => {
  try {
    const {
      tenantId,
      scope = "company",
      employeeId,
      from,
      to,
      client,
      q,
      excludeUserId,
    } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "tenantId is required",
      });
    }

    // Build where clause
    const whereClause = { tenantId };

    // Add scope filtering
    if (scope === "employee" && employeeId) {
      whereClause.employeeId = employeeId;
    }

    // Add date filtering
    if (from) {
      whereClause.weekStart = { [Op.gte]: from };
    }
    if (to) {
      whereClause.weekEnd = { [Op.lte]: to };
    }

    // Add client filtering
    if (client) {
      whereClause.clientId = client;
    }

    // Exclude specific user if needed
    if (excludeUserId) {
      whereClause.employeeId = { [Op.ne]: excludeUserId };
    }

    // Add search filtering
    let includeClause = [
      {
        model: models.Employee,
        as: "employee",
        attributes: ["id", "firstName", "lastName", "email"],
        required: false, // Make it optional in case Employee record doesn't exist
      },
      {
        model: models.Client,
        as: "client",
        attributes: ["id", "clientName"],
        required: false,
      },
    ];

    // Add search filter to employee if q is provided
    if (q) {
      includeClause[0].where = {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${q}%` } },
          { lastName: { [Op.iLike]: `%${q}%` } },
          { email: { [Op.iLike]: `%${q}%` } },
        ],
      };
    }

    const timesheets = await models.Timesheet.findAll({
      where: whereClause,
      include: includeClause,
      order: [["weekStart", "DESC"]],
      limit: 100, // Limit for performance
    });

    // Transform data for frontend
    const transformedTimesheets = await Promise.all(timesheets.map(async (ts) => {
      // Get employee name - fallback to User if Employee doesn't exist
      let employeeName = "Unknown";
      if (ts.employee) {
        employeeName = `${ts.employee.firstName} ${ts.employee.lastName}`;
      } else {
        // Try to get user directly if employee record doesn't exist
        const user = await models.User.findByPk(ts.employeeId);
        if (user) {
          employeeName = `${user.firstName} ${user.lastName}`;
        }
      }

      return {
        id: ts.id,
        employeeId: ts.employeeId,
        employeeName: employeeName,
        client: ts.client ? ts.client.clientName : "No Client",
        weekEnding: ts.weekEnd,
        hours: ts.totalHours || 0,
        overtimeHours: 0, // Calculate if needed
        billRate: ts.billRate || 0,
        payRate: ts.payRate || 0,
        approved: ts.status === "approved",
      };
    }));

    res.json({
      success: true,
      timesheets: transformedTimesheets,
      total: transformedTimesheets.length,
    });
  } catch (err) {
    console.error("❌ Error fetching timesheets:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch timesheets",
      error: err.message,
    });
  }
});

// GET /api/timesheets/employees/by-email/:email?tenantId=...
// Get employee by email (fallback for when employeeId is not in user object)
router.get("/employees/by-email/:email", async (req, res, next) => {
  try {
    const { email } = req.params;
    const { tenantId } = req.query;

    if (!tenantId || !email) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId and email are required" });
    }

    const employee = await models.Employee.findOne({
      where: {
        email: email.toLowerCase(),
        tenantId,
      },
      attributes: ["id", "firstName", "lastName", "email"],
    });

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    res.json({
      success: true,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/timesheets/employee/:id/all?tenantId=...
// Get all timesheets for a specific employee
router.get("/employee/:id/all", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    console.log("📡 /api/timesheets/employee/:id/all called");
    console.log("  Employee ID:", id);
    console.log("  Tenant ID:", tenantId);

    if (!tenantId || !id) {
      return res.status(400).json({
        success: false,
        message: "tenantId and employee id are required",
      });
    }

    // Fetch all timesheets for the employee
    const timesheets = await models.Timesheet.findAll({
      where: {
        tenantId,
        employeeId: id,
      },
      include: [
        {
          model: models.Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "email"],
          required: false,
        },
        {
          model: models.Client,
          as: "client",
          attributes: ["id", "clientName", "clientType"],
          required: false,
        },
        {
          model: models.User,
          as: "reviewer",
          attributes: ["id", "firstName", "lastName", "email", "role"],
          required: false,
        },
      ],
      order: [["weekStart", "DESC"]],
    });

    console.log(`  Found ${timesheets.length} timesheets for employee ${id}`);

    // Format timesheets for frontend
    const formattedTimesheets = timesheets.map((ts) => {
      // Parse attachments if it's a string
      let attachments = [];
      if (ts.attachments) {
        if (typeof ts.attachments === "string") {
          try {
            attachments = JSON.parse(ts.attachments);
          } catch (e) {
            console.error("Error parsing attachments:", e);
            attachments = [];
          }
        } else if (Array.isArray(ts.attachments)) {
          attachments = ts.attachments;
        }
      }

      // Format week range
      const weekStart = new Date(ts.weekStart);
      const weekEnd = new Date(ts.weekEnd);
      const weekRange = `${weekStart.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })} To ${weekEnd.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`;

      // Format status
      let statusLabel = ts.status.toUpperCase();
      if (ts.status === "submitted") statusLabel = "SUBMITTED";
      else if (ts.status === "approved") statusLabel = "APPROVED";
      else if (ts.status === "rejected") statusLabel = "REJECTED";
      else if (ts.status === "draft") statusLabel = "DRAFT";

      return {
        id: ts.id,
        week: weekRange,
        weekStart: ts.weekStart,
        weekEnd: ts.weekEnd,
        hours: Number(ts.totalHours).toFixed(2),
        status: {
          label: statusLabel,
          value: ts.status,
        },
        dailyHours: ts.dailyHours || {},
        notes: ts.notes || "",
        attachments: attachments,
        reviewer: ts.reviewer
          ? {
              name: `${ts.reviewer.firstName} ${ts.reviewer.lastName}`,
              email: ts.reviewer.email,
              role: ts.reviewer.role,
            }
          : null,
        client: ts.client
          ? {
              id: ts.client.id,
              name: ts.client.clientName,
              type: ts.client.clientType,
            }
          : null,
      };
    });

    console.log(`  Returning ${formattedTimesheets.length} formatted timesheets`);
    res.json({ success: true, timesheets: formattedTimesheets });
  } catch (err) {
    console.error("❌ Error in /api/timesheets/employee/:id/all:", err);
    console.error("Error details:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee timesheets",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
});

// GET /api/timesheets/current?tenantId=...
// Ensures a draft timesheet exists for each employee for the current week
router.get("/current", async (req, res, next) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId)
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });

    const { weekStart, weekEnd } = getWeekRangeMonToSun(new Date());

    // Get employees for tenant
    const employees = await models.Employee.findAll({
      where: { tenantId },
      attributes: [
        "id",
        "firstName",
        "lastName",
        "employeeId",
        "clientId",
        "title",
        "status",
      ],
    });

    // Ensure a timesheet exists for each employee for this week
    const ensurePromises = employees.map((emp) =>
      models.Timesheet.findOrCreate({
        where: { tenantId, employeeId: emp.id, weekStart, weekEnd },
        defaults: {
          tenantId,
          employeeId: emp.id,
          clientId: emp.clientId || null,
          weekStart,
          weekEnd,
          dailyHours: {
            mon: 0,
            tue: 0,
            wed: 0,
            thu: 0,
            fri: 0,
            sat: 0,
            sun: 0,
          },
          totalHours: 0,
          status: "draft",
        },
      })
    );
    await Promise.all(ensurePromises);

    // Fetch with joins for response
    let rows = [];
    try {
      rows = await models.Timesheet.findAll({
        where: { tenantId, weekStart, weekEnd },
        include: [
          {
            model: models.Employee,
            as: "employee",
            attributes: ["id", "firstName", "lastName", "title"],
          },
          {
            model: models.Client,
            as: "client",
            attributes: ["id", "clientName"],
          },
          {
            model: models.User,
            as: "reviewer",
            attributes: ["id", "firstName", "lastName", "email", "role"],
            required: false,
          },
        ],
        order: [
          [{ model: models.Employee, as: "employee" }, "firstName", "ASC"],
        ],
      });
    } catch (dbErr) {
      // Graceful fallback if DB schema doesn't match expected column names (e.g., 42703 missing column)
      const code = dbErr?.original?.code || dbErr?.parent?.code;
      if (code === "42703") {
        return res.json({ success: true, weekStart, weekEnd, timesheets: [] });
      }
      throw dbErr;
    }

    const result = rows.map((r) => ({
      id: r.id,
      employee: {
        id: r.employee?.id,
        name: `${r.employee?.firstName || ""} ${
          r.employee?.lastName || ""
        }`.trim(),
        role: r.employee?.title || "Employee",
      },
      client: r.client?.clientName || "No client assigned",
      project: r.client
        ? `Project for ${r.client.clientName}`
        : "No project assigned",
      week: `${new Date(r.weekStart).toLocaleString("en-US", {
        month: "short",
      })} ${new Date(r.weekStart).getDate()} - ${new Date(
        r.weekEnd
      ).toLocaleString("en-US", { month: "short" })} ${new Date(
        r.weekEnd
      ).getDate()}`,
      weekStart: r.weekStart,
      weekEnd: r.weekEnd,
      hours: Number(r.totalHours).toFixed(1),
      status: {
        label: r.status.replace("_", " ").toUpperCase(),
        color:
          r.status === "approved"
            ? "success"
            : r.status === "submitted"
            ? "warning"
            : "secondary",
      },
      dailyHours: r.dailyHours,
    }));

    res.json({ success: true, weekStart, weekEnd, timesheets: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/timesheets/pending-approval?tenantId=...&reviewerId=...
// Get timesheets pending approval for a specific reviewer
router.get("/pending-approval", async (req, res, next) => {
  try {
    const { tenantId, reviewerId } = req.query;

    console.log("📡 /api/timesheets/pending-approval called");
    console.log("  Query params:", { tenantId, reviewerId });

    if (!tenantId) {
      console.error("❌ Missing tenantId");
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });
    }

    const whereClause = {
      tenantId,
      status: "submitted",
    };

    // If reviewerId is provided, filter by it
    if (reviewerId) {
      whereClause.reviewerId = reviewerId;
    }

    console.log("  Where clause:", whereClause);

    const timesheets = await models.Timesheet.findAll({
      where: whereClause,
      include: [
        {
          model: models.Employee,
          as: "employee",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "department",
            "title",
          ],
          required: false, // Make it optional in case Employee record doesn't exist
        },
        {
          model: models.Client,
          as: "client",
          attributes: ["id", "clientName", "clientType"],
          required: false,
        },
        {
          model: models.User,
          as: "reviewer",
          attributes: ["id", "firstName", "lastName", "email", "role"],
          required: false,
        },
      ],
      order: [["submitted_at", "DESC NULLS LAST"]],
    });

    console.log(
      `  Found ${timesheets.length} timesheets with status 'submitted'`
    );

    const formattedTimesheets = await Promise.all(timesheets.map(async (ts) => {
      // Parse attachments if it's a string (SQLite stores JSONB as string)
      let attachments = [];
      if (ts.attachments) {
        if (typeof ts.attachments === "string") {
          try {
            attachments = JSON.parse(ts.attachments);
          } catch (e) {
            console.error("Error parsing attachments:", e);
            attachments = [];
          }
        } else if (Array.isArray(ts.attachments)) {
          attachments = ts.attachments;
        }
      }

      // Get employee info - fallback to User if Employee doesn't exist
      let employeeName = "Unknown Employee";
      let employeeEmail = "N/A";
      let department = "N/A";

      if (ts.employee) {
        employeeName = `${ts.employee.firstName || ""} ${ts.employee.lastName || ""}`.trim();
        employeeEmail = ts.employee.email || "N/A";
        department = ts.employee.department || "N/A";
      } else {
        // Try to get user directly if employee record doesn't exist
        const user = await models.User.findByPk(ts.employeeId);
        if (user) {
          employeeName = `${user.firstName} ${user.lastName}`;
          employeeEmail = user.email;
        }
      }

      return {
        id: ts.id,
        employeeName: employeeName,
        employeeEmail: employeeEmail,
        department: department,
        weekRange: `${new Date(ts.weekStart).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })} To ${new Date(ts.weekEnd).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}`,
        weekStart: ts.weekStart,
        weekEnd: ts.weekEnd,
        status: ts.status,
        billableProjectHrs: Number(ts.totalHours).toFixed(2),
        timeOffHolidayHrs: "0.00",
        totalTimeHours: Number(ts.totalHours).toFixed(2),
        attachments: attachments,
        notes: ts.notes || "",
        overtimeComment: ts.overtimeComment || null,
        overtimeDays: ts.overtimeDays || null,
        submittedDate: ts.submittedAt
          ? new Date(ts.submittedAt).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A",
        clientName: ts.client?.name || ts.client?.clientName || "No Client",
        clientType: ts.client?.clientType || "N/A",
        reviewer: ts.reviewer
          ? {
              name: `${ts.reviewer.firstName} ${ts.reviewer.lastName}`,
              email: ts.reviewer.email,
              role: ts.reviewer.role,
            }
          : null,
      };
    }));

    console.log(
      `  Returning ${formattedTimesheets.length} formatted timesheets`
    );
    res.json({ success: true, timesheets: formattedTimesheets });
  } catch (err) {
    console.error("❌ Error in /api/timesheets/pending-approval:", err);
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    if (err.original) {
      console.error("Database error:", err.original);
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending timesheets",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
});

// GET /api/timesheets/reviewers?tenantId=...
// Get list of users who can review timesheets (admins and managers)
// IMPORTANT: This must come BEFORE /:id route to avoid matching "reviewers" as an ID
router.get("/reviewers", async (req, res, next) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });
    }

    // Try to find reviewers with status filter, fallback without it
    let reviewers;
    try {
      reviewers = await models.User.findAll({
        where: {
          tenantId,
          role: { [Op.in]: ["admin", "manager"] },
          status: "active",
        },
        attributes: ["id", "firstName", "lastName", "email", "role"],
        order: [
          ["firstName", "ASC"],
          ["lastName", "ASC"],
        ],
      });
    } catch (err) {
      // If status column doesn't exist, try without it
      console.warn("Status filter failed, trying without status:", err.message);
      reviewers = await models.User.findAll({
        where: {
          tenantId,
          role: { [Op.in]: ["admin", "manager"] },
        },
        attributes: ["id", "firstName", "lastName", "email", "role"],
        order: [
          ["firstName", "ASC"],
          ["lastName", "ASC"],
        ],
      });
    }

    const formattedReviewers = reviewers.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
    }));

    res.json({ success: true, reviewers: formattedReviewers });
  } catch (err) {
    next(err);
  }
});

// POST /api/timesheets/submit
// Submit a new timesheet
router.post("/submit", async (req, res, next) => {
  try {
    const {
      tenantId,
      employeeId,
      weekStart,
      weekEnd,
      clientId,
      reviewerId,
      status,
      totalHours,
      notes,
      dailyHours,
      overtimeComment,
      overtimeDays,
    } = req.body;

    console.log("📥 Received timesheet submission:", req.body);
    
    // Log overtime information if present
    if (overtimeComment) {
      console.log("⏰ Overtime detected:", {
        days: overtimeDays,
        comment: overtimeComment
      });
    }

    // Validate required fields
    if (!tenantId || !employeeId || !weekStart || !weekEnd) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: tenantId, employeeId, weekStart, weekEnd",
      });
    }

    // Validate and sanitize clientId - must be valid UUID or null
    let sanitizedClientId = null;
    if (clientId) {
      // Check if it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(clientId)) {
        sanitizedClientId = clientId;
      } else {
        // If it's not a valid UUID (e.g., "1", "default", etc.), set to null
        console.warn(`⚠️ Invalid clientId format: "${clientId}". Setting to null.`);
        sanitizedClientId = null;
      }
    }

    // Check if timesheet already exists for this week
    const existing = await models.Timesheet.findOne({
      where: {
        tenantId,
        employeeId,
        weekStart,
        weekEnd,
      },
    });

    if (existing) {
      // Store old values for audit
      const oldValues = {
        status: existing.status,
        totalHours: existing.totalHours,
        notes: existing.notes,
        dailyHours: existing.dailyHours,
        clientId: existing.clientId,
        reviewerId: existing.reviewerId,
      };

      // Update existing timesheet
      existing.clientId = sanitizedClientId !== null ? sanitizedClientId : existing.clientId;
      existing.reviewerId = reviewerId || existing.reviewerId;
      existing.status = status || "submitted";
      existing.totalHours = totalHours || 0;
      existing.notes = notes || existing.notes;
      existing.dailyHours = dailyHours || existing.dailyHours;
      existing.overtimeComment = overtimeComment || existing.overtimeComment;
      existing.overtimeDays = overtimeDays || existing.overtimeDays;
      existing.submittedAt = new Date();

      await existing.save();

      console.log("✅ Updated existing timesheet:", existing.id);

      // Log audit entry
      const auditInfo = getAuditInfo(req);
      const changedFields = [];
      if (oldValues.status !== existing.status) changedFields.push("status");
      if (oldValues.totalHours !== existing.totalHours) changedFields.push("totalHours");
      if (oldValues.notes !== existing.notes) changedFields.push("notes");
      if (JSON.stringify(oldValues.dailyHours) !== JSON.stringify(existing.dailyHours)) changedFields.push("dailyHours");
      if (oldValues.clientId !== existing.clientId) changedFields.push("clientId");
      if (oldValues.reviewerId !== existing.reviewerId) changedFields.push("reviewerId");

      await TimesheetAuditService.logChange({
        timesheetId: existing.id,
        action: status === "submitted" ? "submit" : "update",
        oldValues,
        newValues: {
          status: existing.status,
          totalHours: existing.totalHours,
          notes: existing.notes,
          dailyHours: existing.dailyHours,
          clientId: existing.clientId,
          reviewerId: existing.reviewerId,
        },
        changedFields,
        ...auditInfo,
        tenantId,
        employeeId,
      });

      return res.json({
        success: true,
        message: "Timesheet updated and submitted successfully",
        timesheet: existing,
      });
    }

    // Create new timesheet
    const newTimesheet = await models.Timesheet.create({
      tenantId,
      employeeId,
      clientId: sanitizedClientId,
      reviewerId: reviewerId || null,
      weekStart,
      weekEnd,
      dailyHours: dailyHours || {
        mon: 0,
        tue: 0,
        wed: 0,
        thu: 0,
        fri: 0,
        sat: 0,
        sun: 0,
      },
      totalHours: totalHours || 0,
      status: status || "submitted",
      notes: notes || "",
      overtimeComment: overtimeComment || null,
      overtimeDays: overtimeDays || null,
      submittedAt: new Date(),
    });

    console.log("✅ Created new timesheet:", newTimesheet.id);

    // Log audit entry for creation
    const auditInfo = getAuditInfo(req);
    await TimesheetAuditService.logChange({
      timesheetId: newTimesheet.id,
      action: status === "submitted" ? "submit" : "create",
      oldValues: {},
      newValues: {
        status: newTimesheet.status,
        totalHours: newTimesheet.totalHours,
        notes: newTimesheet.notes,
        dailyHours: newTimesheet.dailyHours,
        clientId: newTimesheet.clientId,
        reviewerId: newTimesheet.reviewerId,
        weekStart: newTimesheet.weekStart,
        weekEnd: newTimesheet.weekEnd,
      },
      changedFields: ["status", "totalHours", "notes", "dailyHours", "clientId", "reviewerId", "weekStart", "weekEnd"],
      ...auditInfo,
      tenantId,
      employeeId,
    });

    // Create notification for timesheet submission
    try {
      // Try to get employee info for notifications
      const employee = await models.Employee.findByPk(employeeId, {
        include: [
          {
            model: models.User,
            as: "user",
            attributes: ["firstName", "lastName"],
            required: false,
          },
        ],
      });

      // If employee not found, try to get user directly
      let employeeName = "Employee";
      if (employee && employee.user) {
        employeeName = `${employee.user.firstName} ${employee.user.lastName}`;
      } else {
        // Try to get user directly if employee record doesn't exist
        const user = await models.User.findByPk(employeeId);
        if (user) {
          employeeName = `${user.firstName} ${user.lastName}`;
        }
      }

      // Create timesheet notification
      await NotificationService.createTimesheetNotification(
        tenantId,
        employeeId,
        "submitted",
        {
          id: newTimesheet.id,
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
        }
      );

      // Create approval notification for managers/admins
      await NotificationService.createApprovalNotification(
        tenantId,
        "timesheet",
        {
          employeeName: employeeName,
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
        }
      );

      // Send real-time notification via WebSocket
      if (global.wsService) {
        global.wsService.sendToTenant(tenantId, {
          type: "timesheet_submitted",
          title: "Timesheet Submitted",
          message: `New timesheet submitted for week of ${weekStart}`,
          timestamp: new Date().toISOString(),
        });
      }

      // Send email notification to reviewer if reviewerId is set
      if (reviewerId) {
        try {
          const reviewer = await models.User.findByPk(reviewerId);
          const tenant = await models.Tenant.findByPk(tenantId);
          
          if (reviewer && tenant) {
            const weekRange = `${weekStart} to ${weekEnd}`;
            const timesheetLink = `${process.env.FRONTEND_URL || 'https://app.timepulse.io'}/${tenant.subdomain}/timesheets/submit/${newTimesheet.id}`;
            
            await EmailService.sendTimesheetSubmittedNotification({
              reviewerEmail: reviewer.email,
              reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
              employeeName: employeeName,
              weekRange: weekRange,
              timesheetLink: timesheetLink,
              tenantName: tenant.name || 'TimePulse',
            });
          }
        } catch (emailError) {
          console.error("Error sending timesheet submission email:", emailError);
          // Don't fail the timesheet submission if email fails
        }
      }
    } catch (notificationError) {
      console.error(
        "Error creating timesheet notification:",
        notificationError
      );
      // Don't fail the timesheet submission if notification fails
    }

    res.json({
      success: true,
      message: "Timesheet submitted successfully",
      timesheet: newTimesheet,
    });
  } catch (err) {
    console.error("❌ Error submitting timesheet:", err);
    console.error("❌ Error details:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
      sql: err.sql,
      parameters: err.parameters
    });
    res.status(500).json({
      success: false,
      error: "Timesheet submission failed",
      message: err.message,
      details: err.toString()
    });
  }
});

// GET /api/timesheets/approved-today?tenantId=...&date=...
// Get count of timesheets approved today
router.get("/approved-today", async (req, res, next) => {
  try {
    const { tenantId, date } = req.query;

    if (!tenantId || !date) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId and date are required" });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await models.Timesheet.count({
      where: {
        tenantId,
        status: "approved",
        approvedAt: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

    console.log(`📊 Approved timesheets count for ${todayStr}:`, count);

    res.json({ success: true, count });
  } catch (err) {
    console.error("❌ Error getting approved count:", err);
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    if (err.original) {
      console.error("Database error:", err.original);
    }
    res.status(500).json({
      success: false,
      message: "Failed to get approved count",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
});

// GET /api/timesheets/rejected-today?tenantId=...&date=...
// Get count of timesheets rejected today
router.get("/rejected-today", async (req, res, next) => {
  try {
    const { tenantId, date } = req.query;

    if (!tenantId || !date) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId and date are required" });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await models.Timesheet.count({
      where: {
        tenantId,
        status: "rejected",
        updatedAt: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

    console.log(`📊 Rejected timesheets count for ${todayStr}:`, count);

    res.json({ success: true, count });
  } catch (err) {
    console.error("❌ Error getting rejected count:", err);
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    if (err.original) {
      console.error("Database error:", err.original);
    }
    res.status(500).json({
      success: false,
      message: "Failed to get rejected count",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
});

// GET /api/timesheets/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await models.Timesheet.findByPk(id, {
      include: [
        {
          model: models.Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "title"],
        },
        {
          model: models.Client,
          as: "client",
          attributes: ["id", "clientName"],
        },
      ],
    });
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Timesheet not found" });

    // Parse attachments if it's a string (SQLite stores JSONB as string)
    let attachments = [];
    if (row.attachments) {
      if (typeof row.attachments === "string") {
        try {
          attachments = JSON.parse(row.attachments);
        } catch (e) {
          console.error("Error parsing attachments:", e);
          attachments = [];
        }
      } else if (Array.isArray(row.attachments)) {
        attachments = row.attachments;
      }
    }

    const timesheet = {
      ...row.toJSON(),
      attachments: attachments,
    };

    res.json({ success: true, timesheet });
  } catch (err) {
    next(err);
  }
});

// PUT /api/timesheets/:id - update hours/status
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      dailyHours,
      status,
      clientId,
      notes,
      attachments,
      reviewerId,
      approvedBy,
      rejectionReason,
    } = req.body || {};

    const row = await models.Timesheet.findByPk(id);
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Timesheet not found" });

    // Store old values for audit
    const oldValues = {
      status: row.status,
      totalHours: row.totalHours,
      notes: row.notes,
      dailyHours: row.dailyHours,
      clientId: row.clientId,
      reviewerId: row.reviewerId,
      approvedBy: row.approvedBy,
      rejectionReason: row.rejectionReason,
    };

    // Track if status is changing to approved or rejected
    const wasNotApproved = row.status !== "approved";
    const wasNotRejected = row.status !== "rejected";
    const isBeingApproved = status === "approved";
    const isBeingRejected = status === "rejected";
    const previousStatus = row.status;

    if (dailyHours && typeof dailyHours === "object") {
      const total = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
        .map((k) => Number(dailyHours[k] || 0))
        .reduce((a, b) => a + b, 0);
      row.dailyHours = {
        mon: 0,
        tue: 0,
        wed: 0,
        thu: 0,
        fri: 0,
        sat: 0,
        sun: 0,
        ...dailyHours,
      };
      row.totalHours = Number(total.toFixed(2));
    }
    if (status) {
      row.status = status;
      if (status === "submitted") {
        row.submittedAt = new Date();
      } else if (status === "approved") {
        row.approvedAt = new Date();
        if (approvedBy) row.approvedBy = approvedBy;
      } else if (status === "rejected") {
        if (rejectionReason) row.rejectionReason = rejectionReason;
      }
    }
    if (clientId !== undefined) row.clientId = clientId || null;
    if (notes !== undefined) row.notes = notes;
    if (attachments !== undefined) row.attachments = attachments;
    if (reviewerId !== undefined) row.reviewerId = reviewerId || null;

    await row.save();

    // Log audit entry
    const auditInfo = getAuditInfo(req);
    const changedFields = [];
    if (oldValues.status !== row.status) changedFields.push("status");
    if (oldValues.totalHours !== row.totalHours) changedFields.push("totalHours");
    if (oldValues.notes !== row.notes) changedFields.push("notes");
    if (JSON.stringify(oldValues.dailyHours) !== JSON.stringify(row.dailyHours)) changedFields.push("dailyHours");
    if (oldValues.clientId !== row.clientId) changedFields.push("clientId");
    if (oldValues.reviewerId !== row.reviewerId) changedFields.push("reviewerId");
    if (oldValues.approvedBy !== row.approvedBy) changedFields.push("approvedBy");
    if (oldValues.rejectionReason !== row.rejectionReason) changedFields.push("rejectionReason");

    let auditAction = "update";
    if (isBeingApproved) auditAction = "approve";
    else if (isBeingRejected) auditAction = "reject";
    else if (status === "submitted" && previousStatus !== "submitted") auditAction = "submit";
    else if (status === "draft" && previousStatus !== "draft") auditAction = "draft_save";

    await TimesheetAuditService.logChange({
      timesheetId: row.id,
      action: auditAction,
      oldValues,
      newValues: {
        status: row.status,
        totalHours: row.totalHours,
        notes: row.notes,
        dailyHours: row.dailyHours,
        clientId: row.clientId,
        reviewerId: row.reviewerId,
        approvedBy: row.approvedBy,
        rejectionReason: row.rejectionReason,
      },
      changedFields,
      ...auditInfo,
      tenantId: row.tenantId,
      employeeId: row.employeeId,
      metadata: {
        previousStatus,
        newStatus: row.status,
        ...(rejectionReason && { rejectionReason }),
      },
    });

    // Send email notifications for approval/rejection
    try {
      const tenant = await models.Tenant.findByPk(row.tenantId);
      const employee = await models.Employee.findByPk(row.employeeId, {
        include: [
          {
            model: models.User,
            as: "user",
            required: false,
          },
        ],
      });

      const weekRange = `${row.weekStart} to ${row.weekEnd}`;
      const timesheetLink = `${process.env.FRONTEND_URL || 'https://app.timepulse.io'}/${tenant?.subdomain || 'app'}/timesheets/submit/${row.id}`;
      const tenantName = tenant?.name || 'TimePulse';

      // Send approval email
      if (wasNotApproved && isBeingApproved && employee?.user) {
        const reviewer = approvedBy ? await models.User.findByPk(approvedBy) : null;
        const reviewerName = reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Manager';
        
        await EmailService.sendTimesheetApprovedNotification({
          employeeEmail: employee.user.email,
          employeeName: `${employee.user.firstName} ${employee.user.lastName}`,
          reviewerName: reviewerName,
          weekRange: weekRange,
          timesheetLink: timesheetLink,
          tenantName: tenantName,
        });
      }

      // Send rejection email
      if (wasNotRejected && isBeingRejected && employee?.user) {
        const reviewer = approvedBy ? await models.User.findByPk(approvedBy) : null;
        const reviewerName = reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Manager';
        
        await EmailService.sendTimesheetRejectedNotification({
          employeeEmail: employee.user.email,
          employeeName: `${employee.user.firstName} ${employee.user.lastName}`,
          reviewerName: reviewerName,
          weekRange: weekRange,
          rejectionReason: row.rejectionReason || 'No reason provided',
          timesheetLink: timesheetLink,
          tenantName: tenantName,
        });
      }
    } catch (emailError) {
      console.error("Error sending timesheet status email:", emailError);
      // Don't fail the timesheet update if email fails
    }

    // ✨ AUTOMATIC INVOICE GENERATION ✨
    // Trigger invoice generation when timesheet is approved
    let invoiceData = null;
    if (wasNotApproved && isBeingApproved) {
      try {
        console.log("🎯 Timesheet approved - triggering automatic invoice generation");
        const InvoiceService = require("../services/InvoiceService");
        
        const result = await InvoiceService.generateInvoiceFromTimesheet(
          row.id,
          row.tenantId,
          approvedBy || null
        );

        if (result.success) {
          console.log("✅ Invoice auto-generated:", result.invoice.invoiceNumber);
          invoiceData = {
            invoiceId: result.invoice.id,
            invoiceNumber: result.invoice.invoiceNumber,
            totalAmount: result.invoice.totalAmount,
          };
        } else {
          console.log("⚠️ Invoice generation skipped:", result.message);
        }
      } catch (invoiceError) {
        console.error("❌ Error auto-generating invoice:", invoiceError.message);
        // Don't fail the timesheet approval if invoice generation fails
        // Just log the error and continue
      }
    }

    res.json({
      success: true,
      timesheet: row,
      message: "Timesheet updated successfully",
      invoice: invoiceData, // Include invoice data if generated
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/timesheets/employee/:employeeId/current?tenantId=...
// Get current week's timesheet for a specific employee
router.get("/employee/:employeeId/current", async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { tenantId } = req.query;

    if (!tenantId)
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });

    const { weekStart, weekEnd } = getWeekRangeMonToSun(new Date());

    // Get employee details
    const employee = await models.Employee.findOne({
      where: { id: employeeId, tenantId },
      include: [
        {
          model: models.Client,
          as: "client",
          attributes: ["id", "clientName"],
        },
      ],
    });

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    // Find or create timesheet for current week
    const [timesheet, created] = await models.Timesheet.findOrCreate({
      where: {
        tenantId,
        employeeId,
        weekStart,
        weekEnd,
      },
      defaults: {
        tenantId,
        employeeId,
        clientId: employee.clientId || null,
        weekStart,
        weekEnd,
        dailyHours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
        totalHours: 0,
        status: "draft",
      },
    });

    // Parse attachments if it's a string (SQLite stores JSONB as string)
    let attachments = [];
    if (timesheet.attachments) {
      if (typeof timesheet.attachments === "string") {
        try {
          attachments = JSON.parse(timesheet.attachments);
        } catch (e) {
          console.error("Error parsing attachments:", e);
          attachments = [];
        }
      } else if (Array.isArray(timesheet.attachments)) {
        attachments = timesheet.attachments;
      }
    }

    // Format response
    const response = {
      id: timesheet.id,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
      },
      client: employee.client
        ? {
            id: employee.client.id,
            name: employee.client.clientName,
          }
        : null,
      weekStart: timesheet.weekStart,
      weekEnd: timesheet.weekEnd,
      weekLabel: `${new Date(timesheet.weekStart).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${new Date(timesheet.weekEnd).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`,
      dailyHours: timesheet.dailyHours,
      totalHours: Number(timesheet.totalHours),
      status: timesheet.status,
      notes: timesheet.notes,
      attachments: attachments,
      submittedAt: timesheet.submittedAt,
      created: created,
    };

    res.json({ success: true, timesheet: response });
  } catch (err) {
    next(err);
  }
});

// GET /api/timesheets/employee/approved?tenantId=...
// Get approved timesheets for all employees (admin view)
router.get("/employee/approved", async (req, res, next) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });
    }

    console.log("📡 Fetching approved timesheets for tenant:", tenantId);

    const timesheets = await models.Timesheet.findAll({
      where: {
        tenantId,
        status: "approved",
      },
      include: [
        {
          model: models.Employee,
          as: "employee",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "department",
            "title",
          ],
        },
        {
          model: models.Client,
          as: "client",
          attributes: ["id", "clientName", "clientType"],
          required: false,
        },
        {
          model: models.User,
          as: "reviewer",
          attributes: ["id", "firstName", "lastName", "email", "role"],
          required: false,
        },
      ],
      order: [["approved_at", "DESC NULLS LAST"]],
    });

    console.log(`✅ Found ${timesheets.length} approved timesheets`);

    const formattedTimesheets = timesheets.map((ts) => {
      // Parse attachments if it's a string (SQLite stores JSONB as string)
      let attachments = [];
      if (ts.attachments) {
        if (typeof ts.attachments === "string") {
          try {
            attachments = JSON.parse(ts.attachments);
          } catch (e) {
            console.error("Error parsing attachments:", e);
            attachments = [];
          }
        } else if (Array.isArray(ts.attachments)) {
          attachments = ts.attachments;
        }
      }

      return {
        id: ts.id,
        employeeName: `${ts.employee?.firstName || ""} ${
          ts.employee?.lastName || ""
        }`.trim(),
        employeeEmail: ts.employee?.email,
        department: ts.employee?.department,
        weekRange: `${new Date(ts.weekStart).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })} To ${new Date(ts.weekEnd).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}`,
        weekStart: ts.weekStart,
        weekEnd: ts.weekEnd,
        status: ts.status,
        billableProjectHrs: Number(ts.totalHours).toFixed(2),
        timeOffHolidayHrs: "0.00",
        totalTimeHours: Number(ts.totalHours).toFixed(2),
        attachments: attachments,
        notes: ts.notes || "",
        submittedDate: ts.submittedAt
          ? new Date(ts.submittedAt).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A",
        approvedDate: ts.approvedAt
          ? new Date(ts.approvedAt).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A",
        clientName: ts.client?.clientName || "No Client",
        clientType: ts.client?.clientType || "N/A",
        reviewer: ts.reviewer
          ? {
              name: `${ts.reviewer.firstName} ${ts.reviewer.lastName}`,
              email: ts.reviewer.email,
              role: ts.reviewer.role,
            }
          : null,
      };
    });

    res.json({ success: true, timesheets: formattedTimesheets });
  } catch (err) {
    console.error("❌ Error fetching approved timesheets:", err);
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    if (err.original) {
      console.error("Database error:", err.original);
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch approved timesheets",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
});

// GET /api/timesheets/employee/rejected?tenantId=...
// Get rejected timesheets for all employees (admin view)
router.get("/employee/rejected", async (req, res, next) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });
    }

    console.log("📡 Fetching rejected timesheets for tenant:", tenantId);

    const timesheets = await models.Timesheet.findAll({
      where: {
        tenantId,
        status: "rejected",
      },
      include: [
        {
          model: models.Employee,
          as: "employee",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "department",
            "title",
          ],
        },
        {
          model: models.Client,
          as: "client",
          attributes: ["id", "clientName", "clientType"],
          required: false,
        },
        {
          model: models.User,
          as: "reviewer",
          attributes: ["id", "firstName", "lastName", "email", "role"],
          required: false,
        },
      ],
      order: [["updated_at", "DESC NULLS LAST"]],
    });

    console.log(`✅ Found ${timesheets.length} rejected timesheets`);

    const formattedTimesheets = timesheets.map((ts) => {
      // Parse attachments if it's a string (SQLite stores JSONB as string)
      let attachments = [];
      if (ts.attachments) {
        if (typeof ts.attachments === "string") {
          try {
            attachments = JSON.parse(ts.attachments);
          } catch (e) {
            console.error("Error parsing attachments:", e);
            attachments = [];
          }
        } else if (Array.isArray(ts.attachments)) {
          attachments = ts.attachments;
        }
      }

      return {
        id: ts.id,
        employeeName: `${ts.employee?.firstName || ""} ${
          ts.employee?.lastName || ""
        }`.trim(),
        employeeEmail: ts.employee?.email,
        department: ts.employee?.department,
        weekRange: `${new Date(ts.weekStart).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })} To ${new Date(ts.weekEnd).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}`,
        weekStart: ts.weekStart,
        weekEnd: ts.weekEnd,
        status: ts.status,
        billableProjectHrs: Number(ts.totalHours).toFixed(2),
        timeOffHolidayHrs: "0.00",
        totalTimeHours: Number(ts.totalHours).toFixed(2),
        attachments: attachments,
        notes: ts.notes || "",
        submittedDate: ts.submittedAt
          ? new Date(ts.submittedAt).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A",
        rejectedDate: ts.updatedAt
          ? new Date(ts.updatedAt).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A",
        clientName: ts.client?.clientName || "No Client",
        clientType: ts.client?.clientType || "N/A",
        reviewer: ts.reviewer
          ? {
              name: `${ts.reviewer.firstName} ${ts.reviewer.lastName}`,
              email: ts.reviewer.email,
              role: ts.reviewer.role,
            }
          : null,
        rejectionReason: ts.rejectionReason || "",
      };
    });

    res.json({ success: true, timesheets: formattedTimesheets });
  } catch (err) {
    console.error("❌ Error fetching rejected timesheets:", err);
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    if (err.original) {
      console.error("Database error:", err.original);
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch rejected timesheets",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
});
// GET /api/timesheets/employee/:employeeId/approved?tenantId=...
// Get approved timesheets for a specific employee (for invoice generation)
router.get("/employee/:employeeId/approved", async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { tenantId } = req.query;

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });
    }

    const timesheets = await models.Timesheet.findAll({
      where: {
        tenantId,
        employeeId,
        status: "approved",
      },
      include: [
        {
          model: models.Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: models.Client,
          as: "client",
          attributes: ["id", "clientName", "email"],
        },
      ],
      order: [["week_start", "DESC"]],
    });

    res.json({ success: true, timesheets });
  } catch (err) {
    console.error("❌ Error fetching approved timesheets for employee:", err);
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    if (err.parent) {
      console.error("Database error:", err.parent.message);
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch approved timesheets",
      error: err.message,
    });
  }
});

// GET /api/timesheets/employee/:employeeId/all?tenantId=...
// Get all timesheets for a specific employee
router.get("/employee/:employeeId/all", async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { tenantId } = req.query;

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });
    }

    const timesheets = await models.Timesheet.findAll({
      where: {
        tenantId,
        employeeId,
      },
      include: [
        {
          model: models.Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "title"],
        },
        {
          model: models.Client,
          as: "client",
          attributes: ["id", "clientName"],
        },
        {
          model: models.User,
          as: "reviewer",
          attributes: ["id", "firstName", "lastName", "email", "role"],
          required: false,
        },
      ],
      order: [["week_start", "DESC"]],
    });

    const formattedTimesheets = timesheets.map((r) => {
      // Parse attachments if it's a string (SQLite stores JSONB as string)
      let attachments = [];
      if (r.attachments) {
        if (typeof r.attachments === "string") {
          try {
            attachments = JSON.parse(r.attachments);
          } catch (e) {
            console.error("Error parsing attachments:", e);
            attachments = [];
          }
        } else if (Array.isArray(r.attachments)) {
          attachments = r.attachments;
        }
      }

      return {
        id: r.id,
        employee: {
          id: r.employee?.id,
          name: `${r.employee?.firstName || ""} ${
            r.employee?.lastName || ""
          }`.trim(),
          role: r.employee?.title || "Employee",
        },
        client: r.client?.clientName || "No client assigned",
        project: r.client
          ? `Project for ${r.client.clientName}`
          : "No project assigned",
        week: `${new Date(r.weekStart)
          .toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .toUpperCase()} To ${new Date(r.weekEnd)
          .toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .toUpperCase()}`,
        weekStart: r.weekStart,
        weekEnd: r.weekEnd,
        hours: Number(r.totalHours).toFixed(2),
        status: {
          label: r.status.replace("_", " ").toUpperCase(),
          color:
            r.status === "approved"
              ? "success"
              : r.status === "submitted"
              ? "warning"
              : "secondary",
        },
        dailyHours: r.dailyHours,
        notes: r.notes,
        attachments: attachments,
        submittedAt: r.submittedAt,
        approvedAt: r.approvedAt,
        reviewer: r.reviewer
          ? {
              id: r.reviewer.id,
              name: `${r.reviewer.firstName} ${r.reviewer.lastName}`,
              email: r.reviewer.email,
              role: r.reviewer.role,
            }
          : null,
      };
    });

    res.json({ success: true, timesheets: formattedTimesheets });
  } catch (err) {
    console.error("❌ Error in /api/timesheets/employee/:employeeId/all:", err);
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    if (err.original) {
      console.error("Database error:", err.original);
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee timesheets",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
});

// GET /api/employees/by-email/:email?tenantId=...
// Get employee by email (fallback for when employeeId is not in user object)
router.get("/employees/by-email/:email", async (req, res, next) => {
  try {
    const { email } = req.params;
    const { tenantId } = req.query;

    if (!tenantId || !email) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId and email are required" });
    }

    const employee = await models.Employee.findOne({
      where: {
        email: email.toLowerCase(),
        tenantId,
      },
      attributes: ["id", "firstName", "lastName", "email"],
    });

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    res.json({
      success: true,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/timesheets/:timesheetId/generate-invoice
// Generate invoice from approved timesheet
router.post("/:timesheetId/generate-invoice", async (req, res) => {
  try {
    const { timesheetId } = req.params;
    const { tenantId, userId } = req.body;

    console.log('📄 Generating invoice for timesheet:', timesheetId);

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "tenantId is required",
      });
    }

    // Fetch the timesheet with all related data
    const timesheet = await models.Timesheet.findOne({
      where: { id: timesheetId, tenantId },
      include: [
        {
          model: models.Employee,
          as: "employee",
          required: false,
          attributes: ["id", "firstName", "lastName", "email", "hourlyRate", "vendorId"],
          include: [
            {
              model: models.Vendor,
              as: "vendor",
              required: false,
              attributes: ["id", "name", "email", "contactPerson"],
            },
          ],
        },
        {
          model: models.Client,
          as: "client",
          attributes: ["id", "clientName", "email", "hourlyRate"],
        },
        {
          model: models.Tenant,
          as: "tenant",
          attributes: ["id", "tenantName", "legalName"],
        },
      ],
    });

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: "Timesheet not found",
      });
    }

    // If employee is not loaded via employeeId, try to fetch by userId
    let employee = timesheet.employee;
    if (!employee && timesheet.userId) {
      console.log('🔍 Employee not found via employeeId, trying userId:', timesheet.userId);
      
      try {
        const user = await models.User.findOne({
          where: { id: timesheet.userId, tenantId },
          include: [{
            model: models.Employee,
            as: 'employee',
            include: [{
              model: models.Vendor,
              as: 'vendor',
              attributes: ["id", "name", "email", "contactPerson"],
            }]
          }]
        });
        
        if (user && user.employee) {
          employee = user.employee;
          console.log('✅ Found employee via userId');
        }
      } catch (userLookupError) {
        console.error('❌ Error looking up employee via userId:', userLookupError.message);
      }
    }

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: "Timesheet must be associated with an employee to generate invoice",
      });
    }

    // Update timesheet reference
    if (!timesheet.employee && employee) {
      timesheet.employee = employee;
    }

    // Verify timesheet is approved
    if (timesheet.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved timesheets can be converted to invoices",
      });
    }

    // Check if invoice already exists
    const existingInvoice = await models.Invoice.findOne({
      where: { timesheetId: timesheet.id, tenantId },
    });

    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: "Invoice already exists for this timesheet",
        invoiceId: existingInvoice.id,
        invoiceNumber: existingInvoice.invoiceNumber,
      });
    }

    // Log employee and vendor data for debugging
    console.log('📋 Employee data:', {
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      vendorId: employee.vendorId,
      hasVendor: !!employee.vendor,
      vendorData: employee.vendor ? {
        id: employee.vendor.id,
        name: employee.vendor.name,
        email: employee.vendor.email
      } : null
    });

    // Check if employee has vendor
    if (!employee.vendorId || !employee.vendor) {
      console.error('❌ Vendor validation failed:', {
        vendorId: employee.vendorId,
        hasVendor: !!employee.vendor
      });
      
      // Try to fetch employee with vendor again
      const employeeWithVendor = await models.Employee.findOne({
        where: { id: employee.id, tenantId },
        include: [{
          model: models.Vendor,
          as: 'vendor',
          required: false,
          attributes: ["id", "name", "email", "contactPerson"],
        }]
      });
      
      console.log('🔄 Re-fetched employee:', {
        vendorId: employeeWithVendor?.vendorId,
        hasVendor: !!employeeWithVendor?.vendor,
        vendorData: employeeWithVendor?.vendor
      });
      
      // If vendor exists after re-fetch, use it
      if (employeeWithVendor && employeeWithVendor.vendorId && employeeWithVendor.vendor) {
        employee.vendor = employeeWithVendor.vendor;
        employee.vendorId = employeeWithVendor.vendorId;
        console.log('✅ Vendor found after re-fetch');
      } else {
        return res.status(400).json({
          success: false,
          message: "Employee must be associated with a vendor to generate invoice",
        });
      }
    }

    const vendor = employee.vendor;
    if (!vendor.email) {
      return res.status(400).json({
        success: false,
        message: "Vendor email is required to send invoice",
      });
    }

    // Generate invoice number
    const invoiceCount = await models.Invoice.count({ where: { tenantId } });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(5, '0')}`;

    // Calculate invoice amounts
    const hourlyRate = employee.hourlyRate || timesheet.client?.hourlyRate || 0;
    const totalHours = parseFloat(timesheet.totalHours || 0);
    const subtotal = totalHours * parseFloat(hourlyRate);
    const taxAmount = 0;
    const totalAmount = subtotal + taxAmount;

    // Format week range
    const weekStart = new Date(timesheet.weekStart);
    const weekEnd = new Date(timesheet.weekEnd);
    const weekRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;

    // Create line items
    const lineItems = [
      {
        description: `Timesheet for ${employee.firstName} ${employee.lastName} - ${weekRange}`,
        hours: totalHours,
        rate: parseFloat(hourlyRate),
        amount: subtotal,
      },
    ];

    // Generate invoice hash for secure link
    const crypto = require("crypto");
    const invoiceHash = crypto.createHash('md5').update(`${timesheetId}-${Date.now()}`).digest('hex');

    // Calculate due date (30 days from invoice date)
    const invoiceDate = new Date();
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Format dates as YYYY-MM-DD
    const toDateOnly = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Create invoice
    const invoice = await models.Invoice.create({
      tenantId,
      invoiceNumber,
      clientId: timesheet.clientId,
      employeeId: employee.id,
      vendorId: vendor.id,
      timesheetId: timesheet.id,
      invoiceHash,
      invoiceDate: toDateOnly(invoiceDate),
      dueDate: toDateOnly(dueDate),
      lineItems,
      subtotal,
      taxAmount,
      totalAmount,
      paymentStatus: "pending",
      status: "active",
      createdBy: userId,
    });

    console.log('✅ Invoice created:', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
    });

    // Generate invoice link
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const invoiceLink = `${baseUrl}/invoice/${invoice.invoiceHash}`;

    // Return success response
    res.json({
      success: true,
      message: "Invoice generated successfully",
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: parseFloat(invoice.totalAmount),
        dueDate: invoice.dueDate,
        invoiceLink,
        vendorEmail: vendor.email,
        emailSent: false,
      },
    });

  } catch (err) {
    console.error('❌ Error generating invoice:', err);
    res.status(500).json({
      success: false,
      message: "Failed to generate invoice",
      error: err.message,
    });
  }
});

// =============================================
// FILE UPLOAD/DOWNLOAD ENDPOINTS
// =============================================

// Configure multer for in-memory file uploads (we'll upload directly to S3)
const upload = multer({
  storage: multer.memoryStorage ? multer.memoryStorage() : multer.MemoryStorage(),
  limits: {
    fileSize: S3_CONFIG.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    const validation = S3Service.validateFile(file);
    if (validation.valid) {
      cb(null, true);
    } else {
      cb(new Error(validation.errors.join(', ')));
    }
  },
});

// POST /api/timesheets/:id/upload
// Upload file attachment to S3 and update timesheet
router.post("/:id/upload", upload.single('file'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "tenantId is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided",
      });
    }

    // Get timesheet
    const timesheet = await models.Timesheet.findByPk(id);
    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: "Timesheet not found",
      });
    }

    // Verify tenant matches
    if (timesheet.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Upload file to S3
    const fileMetadata = await S3Service.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      id,
      tenantId
    );

    // Get existing attachments
    let attachments = [];
    if (timesheet.attachments) {
      if (typeof timesheet.attachments === 'string') {
        try {
          attachments = JSON.parse(timesheet.attachments);
        } catch (e) {
          attachments = [];
        }
      } else if (Array.isArray(timesheet.attachments)) {
        attachments = timesheet.attachments;
      }
    }

    // Add new file to attachments
    attachments.push(fileMetadata);

    // Update timesheet
    timesheet.attachments = attachments;
    await timesheet.save();

    res.json({
      success: true,
      message: "File uploaded successfully",
      file: fileMetadata,
      timesheet: {
        id: timesheet.id,
        attachments: attachments,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/timesheets/:id/files/:fileId/download
// Get presigned URL for file download
router.get("/:id/files/:fileId/download", async (req, res, next) => {
  try {
    const { id, fileId } = req.params;
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "tenantId is required",
      });
    }

    // Get timesheet
    const timesheet = await models.Timesheet.findByPk(id);
    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: "Timesheet not found",
      });
    }

    // Verify tenant matches
    if (timesheet.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get attachments
    let attachments = [];
    if (timesheet.attachments) {
      if (typeof timesheet.attachments === 'string') {
        try {
          attachments = JSON.parse(timesheet.attachments);
        } catch (e) {
          attachments = [];
        }
      } else if (Array.isArray(timesheet.attachments)) {
        attachments = timesheet.attachments;
      }
    }

    // Find file
    const file = attachments.find(f => f.id === fileId);
    if (!file || !file.s3Key) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Generate presigned URL
    const downloadUrl = await S3Service.getDownloadUrl(file.s3Key);

    res.json({
      success: true,
      downloadUrl: downloadUrl,
      file: {
        id: file.id,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/timesheets/:id/files/:fileId
// Delete file from S3 and update timesheet
router.delete("/:id/files/:fileId", async (req, res, next) => {
  try {
    const { id, fileId } = req.params;
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "tenantId is required",
      });
    }

    // Get timesheet
    const timesheet = await models.Timesheet.findByPk(id);
    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: "Timesheet not found",
      });
    }

    // Verify tenant matches
    if (timesheet.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get attachments
    let attachments = [];
    if (timesheet.attachments) {
      if (typeof timesheet.attachments === 'string') {
        try {
          attachments = JSON.parse(timesheet.attachments);
        } catch (e) {
          attachments = [];
        }
      } else if (Array.isArray(timesheet.attachments)) {
        attachments = timesheet.attachments;
      }
    }

    // Find file
    const fileIndex = attachments.findIndex(f => f.id === fileId);
    if (fileIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const file = attachments[fileIndex];

    // Delete from S3
    if (file.s3Key) {
      await S3Service.deleteFile(file.s3Key);
    }

    // Remove from attachments array
    attachments.splice(fileIndex, 1);

    // Update timesheet
    timesheet.attachments = attachments;
    await timesheet.save();

    res.json({
      success: true,
      message: "File deleted successfully",
      timesheet: {
        id: timesheet.id,
        attachments: attachments,
      },
    });
  } catch (err) {
    next(err);
  }
});

// =============================================
// WEEK NAVIGATION & HISTORY ENDPOINTS
// =============================================

// GET /api/timesheets/history?tenantId=...&employeeId=...&from=...&to=...&status=...
// Get timesheet history with optional filters
router.get("/history", async (req, res, next) => {
  try {
    const { tenantId, employeeId, from, to, status, limit = 50, offset = 0 } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "tenantId is required",
      });
    }

    const whereClause = { tenantId };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (from) {
      whereClause.weekStart = { [Op.gte]: from };
    }

    if (to) {
      whereClause.weekEnd = { [Op.lte]: to };
    }

    if (status) {
      whereClause.status = status;
    }

    const timesheets = await models.Timesheet.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: models.Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "email"],
          required: false,
        },
        {
          model: models.Client,
          as: "client",
          attributes: ["id", "clientName"],
          required: false,
        },
        {
          model: models.User,
          as: "reviewer",
          attributes: ["id", "firstName", "lastName", "email"],
          required: false,
        },
      ],
      order: [["weekStart", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Parse attachments for each timesheet
    const formattedTimesheets = timesheets.rows.map(ts => {
      let attachments = [];
      if (ts.attachments) {
        if (typeof ts.attachments === "string") {
          try {
            attachments = JSON.parse(ts.attachments);
          } catch (e) {
            attachments = [];
          }
        } else if (Array.isArray(ts.attachments)) {
          attachments = ts.attachments;
        }
      }

      return {
        ...ts.toJSON(),
        attachments: attachments,
      };
    });

    res.json({
      success: true,
      timesheets: formattedTimesheets,
      total: timesheets.count,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/timesheets/week/:date?tenantId=...&employeeId=...
// Get timesheet for a specific week (date can be any date in that week)
router.get("/week/:date", async (req, res, next) => {
  try {
    const { date } = req.params;
    const { tenantId, employeeId } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "tenantId is required",
      });
    }

    const weekDate = new Date(date);
    const { weekStart, weekEnd } = getWeekRangeMonToSun(weekDate);

    const whereClause = {
      tenantId,
      weekStart,
      weekEnd,
    };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    const timesheet = await models.Timesheet.findOne({
      where: whereClause,
      include: [
        {
          model: models.Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "email"],
          required: false,
        },
        {
          model: models.Client,
          as: "client",
          attributes: ["id", "clientName"],
          required: false,
        },
        {
          model: models.User,
          as: "reviewer",
          attributes: ["id", "firstName", "lastName", "email"],
          required: false,
        },
      ],
    });

    if (!timesheet) {
      return res.json({
        success: true,
        timesheet: null,
        weekStart,
        weekEnd,
        message: "No timesheet found for this week",
      });
    }

    // Parse attachments
    let attachments = [];
    if (timesheet.attachments) {
      if (typeof timesheet.attachments === "string") {
        try {
          attachments = JSON.parse(timesheet.attachments);
        } catch (e) {
          attachments = [];
        }
      } else if (Array.isArray(timesheet.attachments)) {
        attachments = timesheet.attachments;
      }
    }

    res.json({
      success: true,
      timesheet: {
        ...timesheet.toJSON(),
        attachments: attachments,
      },
      weekStart,
      weekEnd,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/timesheets/weeks/available?tenantId=...&employeeId=...
// Get list of weeks that have timesheets
router.get("/weeks/available", async (req, res, next) => {
  try {
    const { tenantId, employeeId } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "tenantId is required",
      });
    }

    const whereClause = { tenantId };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    const timesheets = await models.Timesheet.findAll({
      where: whereClause,
      attributes: ["weekStart", "weekEnd"],
      group: ["weekStart", "weekEnd"],
      order: [["weekStart", "DESC"]],
      raw: true,
    });

    const weeks = timesheets.map(ts => ({
      weekStart: ts.weekStart,
      weekEnd: ts.weekEnd,
      label: `${ts.weekStart} to ${ts.weekEnd}`,
    }));

    res.json({
      success: true,
      weeks: weeks,
    });
  } catch (err) {
    next(err);
  }
});

// =============================================
// AUDIT LOG ENDPOINTS
// =============================================

// GET /api/timesheets/:id/audit - Get audit history for a specific timesheet
router.get("/:id/audit", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, limit = 100, offset = 0 } = req.query;

    const timesheet = await models.Timesheet.findByPk(id);
    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: "Timesheet not found",
      });
    }

    const auditLogs = await TimesheetAuditService.getAuditHistory(id, {
      action: action || null,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.json({
      success: true,
      timesheetId: id,
      auditLogs,
      count: auditLogs.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/timesheets/audit/employee/:employeeId - Get audit history for an employee
router.get("/audit/employee/:employeeId", async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { tenantId, action, fromDate, toDate, limit = 100, offset = 0 } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "tenantId is required",
      });
    }

    const auditLogs = await TimesheetAuditService.getEmployeeAuditHistory(
      employeeId,
      tenantId,
      {
        action: action || null,
        fromDate: fromDate || null,
        toDate: toDate || null,
        limit: parseInt(limit),
        offset: parseInt(offset),
      }
    );

    return res.json({
      success: true,
      employeeId,
      tenantId,
      auditLogs,
      count: auditLogs.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/timesheets/audit/tenant - Get audit history for a tenant
router.get("/audit/tenant", async (req, res, next) => {
  try {
    const { tenantId, action, employeeId, fromDate, toDate, limit = 100, offset = 0 } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "tenantId is required",
      });
    }

    const auditLogs = await TimesheetAuditService.getTenantAuditHistory(tenantId, {
      action: action || null,
      employeeId: employeeId || null,
      fromDate: fromDate || null,
      toDate: toDate || null,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.json({
      success: true,
      tenantId,
      auditLogs,
      count: auditLogs.length,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
