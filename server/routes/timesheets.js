/**
 * Timesheet Routes - DB backed
 */

const express = require("express");
const router = express.Router();
const { models } = require("../models");
const { Op } = require("sequelize");
const NotificationService = require("../services/NotificationService");

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
        required: true,
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
    const transformedTimesheets = timesheets.map((ts) => ({
      id: ts.id,
      employeeId: ts.employeeId,
      employeeName: ts.employee
        ? `${ts.employee.firstName} ${ts.employee.lastName}`
        : "Unknown",
      client: ts.client ? ts.client.clientName : "No Client",
      weekEnding: ts.weekEnd,
      hours: ts.totalHours || 0,
      overtimeHours: 0, // Calculate if needed
      billRate: ts.billRate || 0,
      payRate: ts.payRate || 0,
      approved: ts.status === "approved",
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
    });

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
    } = req.body;

    console.log("📥 Received timesheet submission:", req.body);

    // Validate required fields
    if (!tenantId || !employeeId || !weekStart || !weekEnd) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: tenantId, employeeId, weekStart, weekEnd",
      });
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
      // Update existing timesheet
      existing.clientId = clientId || existing.clientId;
      existing.reviewerId = reviewerId || existing.reviewerId;
      existing.status = status || "submitted";
      existing.totalHours = totalHours || 0;
      existing.notes = notes || existing.notes;
      existing.dailyHours = dailyHours || existing.dailyHours;
      existing.submittedAt = new Date();

      await existing.save();

      console.log("✅ Updated existing timesheet:", existing.id);

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
      clientId: clientId || null,
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
      submittedAt: new Date(),
    });

    console.log("✅ Created new timesheet:", newTimesheet.id);

    // Create notification for timesheet submission
    try {
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
      const employee = await models.Employee.findByPk(employeeId, {
        include: [
          {
            model: models.User,
            as: "user",
            attributes: ["firstName", "lastName"],
          },
        ],
      });

      if (employee && employee.user) {
        await NotificationService.createApprovalNotification(
          tenantId,
          "timesheet",
          {
            employeeName: `${employee.user.firstName} ${employee.user.lastName}`,
            weekStartDate: weekStart,
            weekEndDate: weekEnd,
          }
        );
      }

      // Send real-time notification via WebSocket
      if (global.wsService) {
        global.wsService.sendToTenant(tenantId, {
          type: "timesheet_submitted",
          title: "Timesheet Submitted",
          message: `New timesheet submitted for week of ${weekStart}`,
          timestamp: new Date().toISOString(),
        });
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
    next(err);
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
    res.json({
      success: true,
      timesheet: row,
      message: "Timesheet updated successfully",
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
        approved_at: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

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
        updated_at: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

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

module.exports = router;
