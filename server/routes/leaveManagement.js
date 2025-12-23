const express = require("express");
const router = express.Router();
const { models } = require("../models");
const NotificationService = require("../services/NotificationService");
const LeaveManagementEmailService = require("../services/LeaveManagementEmailService");
const { Op } = require("sequelize");
const DataEncryptionService = require("../services/DataEncryptionService");
const { encryptAuthResponse } = require("../utils/encryption");

const { User, Employee, LeaveRequest, LeaveBalance } = models;

// Submit leave request
router.post("/request", async (req, res) => {
  try {
    let requestData = req.body;
    const {
      employeeId,
      employeeName,
      tenantId,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      approverId,
      attachmentName,
    } = requestData;

    if (
      !employeeId ||
      !tenantId ||
      !leaveType ||
      !startDate ||
      !endDate ||
      !totalDays ||
      !approverId
    ) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({
        error: "Start date cannot be after end date",
      });
    }

    // Check for overlapping leave requests (approved, pending, or rejected)
    const overlappingRequest = await LeaveRequest.findOne({
      where: {
        employeeId,
        tenantId,
        status: {
          [Op.in]: ['pending', 'approved', 'rejected']
        },
        [Op.or]: [
          // New request starts within existing request
          {
            startDate: { [Op.lte]: startDate },
            endDate: { [Op.gte]: startDate }
          },
          // New request ends within existing request
          {
            startDate: { [Op.lte]: endDate },
            endDate: { [Op.gte]: endDate }
          },
          // New request completely contains existing request
          {
            startDate: { [Op.gte]: startDate },
            endDate: { [Op.lte]: endDate }
          }
        ]
      }
    });

    if (overlappingRequest) {
      const statusText = overlappingRequest.status.charAt(0).toUpperCase() + overlappingRequest.status.slice(1);
      return res.status(409).json({
        error: `You already have a ${statusText} leave request for overlapping dates (${overlappingRequest.startDate} to ${overlappingRequest.endDate}). Please choose different dates or cancel the existing request.`,
        overlappingRequest: {
          id: overlappingRequest.id,
          startDate: overlappingRequest.startDate,
          endDate: overlappingRequest.endDate,
          status: overlappingRequest.status,
          leaveType: overlappingRequest.leaveType
        }
      });
    }

    // Check if employee exists, if not create one
    let employee = await Employee.findOne({
      where: { id: employeeId, tenantId },
    });

    if (!employee) {
      // Get user details to create employee record
      const user = await User.findOne({
        where: { id: employeeId, tenantId },
      });

      if (!user) {
        return res.status(404).json({
          error: "User not found. Please contact administrator.",
        });
      }

      // Create employee record with proper firstName and lastName
      employee = await Employee.create({
        id: user.id,
        tenantId: user.tenantId,
        firstName: user.firstName || "Employee",
        lastName: user.lastName || "",
        email: user.email,
        status: "active",
        startDate: new Date(),
      });

      console.log(
        "✅ Created employee record for user:",
        user.email,
        `(${user.firstName} ${user.lastName})`
      );
    } else {
      // Update employee record if firstName/lastName are missing
      if (!employee.firstName || !employee.lastName) {
        const user = await User.findOne({
          where: { id: employeeId, tenantId },
        });

        if (user) {
          await employee.update({
            firstName: user.firstName || employee.firstName || "Employee",
            lastName: user.lastName || employee.lastName || "",
          });
          console.log(
            "✅ Updated employee record with name:",
            `${user.firstName} ${user.lastName}`
          );
        }
      }
    }

    // Encrypt leave request data before saving to database
    const encryptedData = DataEncryptionService.encryptLeaveRequestData({
      reason: reason || null,
      attachmentName: attachmentName || null,
      employeeName: employeeName || null
    });

    // Create leave request
    const leaveRequest = await LeaveRequest.create({
      employeeId,
      tenantId,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason: encryptedData.reason,
      status: "pending",
      approverId,
      attachmentName: encryptedData.attachmentName,
    });

    // Update leave balance - add to pending days
    const currentYear = new Date().getFullYear();
    const [leaveBalance, created] = await LeaveBalance.findOrCreate({
      where: {
        employeeId,
        tenantId,
        year: currentYear,
        leaveType,
      },
      defaults: {
        totalDays: leaveType === "vacation" ? 10 : leaveType === "sick" ? 5 : 0, // Vacation: 10, Sick: 5
        usedDays: 0,
        pendingDays: totalDays,
        carryForwardDays: 0,
      },
    });

    if (!created) {
      await leaveBalance.update({
        pendingDays:
          parseFloat(leaveBalance.pendingDays) + parseFloat(totalDays),
      });
    }

    // Create notification for employee about submission
    try {
      const finalEmployeeName = employeeName || `${employee.firstName} ${employee.lastName}`;
      console.log(`🔔 Creating leave notifications for employee: ${finalEmployeeName}, tenant: ${tenantId}`);
      
      await NotificationService.createLeaveNotification(
        tenantId,
        employeeId,
        "requested",
        {
          id: leaveRequest.id,
          employeeId: employeeId,
          employeeName: finalEmployeeName,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          leaveType: leaveRequest.leaveType,
          totalDays: leaveRequest.totalDays,
        }
      );

      console.log(`🔔 Creating approval notification for managers/admins`);
      // Create approval notification for approver (admin/manager)
      await NotificationService.createApprovalNotification(
        tenantId,
        "leave",
        {
          employeeName: finalEmployeeName,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          leaveType: leaveRequest.leaveType,
          totalDays: leaveRequest.totalDays,
        }
      );
      
      console.log(`✅ Leave notifications created successfully`);

      // Send email notification to approver
      const approver = await User.findByPk(approverId);
      const tenant = await models.Tenant.findByPk(tenantId);
      
      if (approver && tenant) {
        const leaveRequestLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${tenant.subdomain}/leave-management`;
        
        await LeaveManagementEmailService.sendLeaveRequestSubmittedNotification({
          approverEmail: approver.email,
          approverName: `${approver.firstName} ${approver.lastName}`,
          employeeName: employeeName || `${employee.firstName} ${employee.lastName}`,
          leaveType: leaveType,
          startDate: startDate,
          endDate: endDate,
          totalDays: totalDays,
          reason: reason || 'Not provided',
          leaveRequestLink: leaveRequestLink,
          tenantName: tenant.name || 'TimePulse',
        });
      }
    } catch (notificationError) {
      console.error("Error creating leave submission notification:", notificationError);
      // Don't fail the submission if notification fails
    }

    // Decrypt leave request data for response
    const decryptedLeaveRequest = DataEncryptionService.decryptLeaveRequestData(
      leaveRequest.toJSON ? leaveRequest.toJSON() : leaveRequest
    );

    res.json({
      success: true,
      message: "Leave request submitted successfully",
      leaveRequest: decryptedLeaveRequest,
    });
  } catch (error) {
    console.error("Error submitting leave request:", error);
    res.status(500).json({
      error: "Failed to submit leave request",
      details: error.message,
    });
  }
});

// Get leave balance for an employee
router.get("/balance", async (req, res) => {
  try {
    const { employeeId, tenantId } = req.query;

    if (!employeeId || !tenantId) {
      return res.status(400).json({
        error: "Employee ID and Tenant ID are required",
      });
    }

    // Check if employee exists, if not create one
    let employee = await Employee.findOne({
      where: { id: employeeId, tenantId },
    });

    if (!employee) {
      // Get user details to create employee record
      const user = await User.findOne({
        where: { id: employeeId, tenantId },
      });

      if (!user) {
        console.error(`❌ User not found: ${employeeId}`);
        return res.status(404).json({
          error: "User not found",
        });
      }

      // Create employee record
      employee = await Employee.create({
        id: user.id,
        tenantId: user.tenantId,
        firstName: user.firstName || "Employee",
        lastName: user.lastName || "",
        email: user.email,
        status: "active",
        startDate: new Date(),
      });

      console.log(`✅ Created employee record for: ${user.email}`);
    }

    const currentYear = new Date().getFullYear();
    
    // Initialize leave balances if they don't exist
    const leaveTypes = [
      { type: 'vacation', total: 10 },
      { type: 'sick', total: 5 }
    ];
    
    for (const { type, total } of leaveTypes) {
      await LeaveBalance.findOrCreate({
        where: {
          employeeId,
          tenantId,
          year: currentYear,
          leaveType: type,
        },
        defaults: {
          totalDays: total,
          usedDays: 0,
          pendingDays: 0,
          carryForwardDays: 0,
        },
      });
    }
    
    // Fetch all balances
    const balances = await LeaveBalance.findAll({
      where: {
        employeeId,
        tenantId,
        year: currentYear,
      },
    });

    console.log(`✅ Found ${balances.length} leave balances for employee ${employeeId}`);

    // Format balance data
    const balanceData = {};
    balances.forEach((balance) => {
      const remaining =
        parseFloat(balance.totalDays) +
        parseFloat(balance.carryForwardDays) -
        parseFloat(balance.usedDays) -
        parseFloat(balance.pendingDays);
      balanceData[balance.leaveType] = {
        total:
          parseFloat(balance.totalDays) + parseFloat(balance.carryForwardDays),
        used: parseFloat(balance.usedDays),
        pending: parseFloat(balance.pendingDays),
        remaining: remaining,
      };
    });

    res.json({
      success: true,
      balance: balanceData,
    });
  } catch (error) {
    console.error("Error fetching leave balance:", error);
    res.status(500).json({
      error: "Failed to fetch leave balance",
      details: error.message,
    });
  }
});

// Get leave history for an employee
router.get("/history", async (req, res) => {
  try {
    const { employeeId, tenantId } = req.query;

    if (!employeeId || !tenantId) {
      return res.status(400).json({
        error: "Employee ID and Tenant ID are required",
      });
    }

    const requests = await LeaveRequest.findAll({
      where: {
        employeeId,
        tenantId,
        status: {
          [Op.in]: ["approved", "rejected"],
        },
      },
      include: [
        {
          model: User,
          as: "reviewer",
          attributes: ["id", "firstName", "lastName", "email"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedRequests = requests.map((req) => ({
      id: req.id,
      type: req.leaveType.charAt(0).toUpperCase() + req.leaveType.slice(1),
      startDate: req.startDate,
      endDate: req.endDate,
      days: req.totalDays,
      status: req.status.charAt(0).toUpperCase() + req.status.slice(1),
      approvedBy: req.reviewer
        ? `${req.reviewer.firstName} ${req.reviewer.lastName}`
        : "N/A",
      approvedOn: req.reviewedAt
        ? new Date(req.reviewedAt).toISOString().split("T")[0]
        : "N/A",
    }));

    // Decrypt leave request data before sending to frontend
    const decryptedRequests = formattedRequests.map(req => 
      DataEncryptionService.decryptLeaveRequestData(req)
    );

    res.json({
      success: true,
      requests: decryptedRequests,
    });
  } catch (error) {
    console.error("Error fetching leave history:", error);
    res.status(500).json({
      error: "Failed to fetch leave history",
      details: error.message,
    });
  }
});

// Get my pending requests
router.get("/my-requests", async (req, res) => {
  try {
    const { employeeId, tenantId, status } = req.query;

    if (!employeeId || !tenantId) {
      return res.status(400).json({
        error: "Employee ID and Tenant ID are required",
      });
    }

    const whereClause = {
      employeeId,
      tenantId,
    };

    if (status) {
      whereClause.status = status;
    }

    const requests = await LeaveRequest.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    const formattedRequests = requests.map((req) => ({
      id: req.id,
      type: req.leaveType.charAt(0).toUpperCase() + req.leaveType.slice(1),
      startDate: req.startDate,
      endDate: req.endDate,
      days: req.totalDays,
      status: req.status.charAt(0).toUpperCase() + req.status.slice(1),
      requestedOn: new Date(req.createdAt).toISOString().split("T")[0],
    }));

    // Decrypt leave request data before sending to frontend
    const decryptedRequests = formattedRequests.map(req => 
      DataEncryptionService.decryptLeaveRequestData(req)
    );

    res.json({
      success: true,
      requests: decryptedRequests,
    });
  } catch (error) {
    console.error("Error fetching my requests:", error);
    res.status(500).json({
      error: "Failed to fetch requests",
      details: error.message,
    });
  }
});

// Get leave requests for approval (for managers/admins)
router.get("/pending-approvals", async (req, res) => {
  try {
    const { managerId, tenantId } = req.query;

    if (!managerId || !tenantId) {
      return res.status(400).json({
        error: "Manager ID and Tenant ID are required",
      });
    }

    const leaveRequests = await LeaveRequest.findAll({
      where: {
        tenantId,
        approverId: managerId,
        status: "pending",
      },
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "email", "department"],
          required: false,
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    const formattedRequests = leaveRequests.map((req) => ({
      id: req.id,
      employeeName: req.employee
        ? `${req.employee.firstName} ${req.employee.lastName}`
        : "Unknown Employee",
      employeeEmail: req.employee?.email || "N/A",
      department: req.employee?.department || "N/A",
      leaveType: req.leaveType.charAt(0).toUpperCase() + req.leaveType.slice(1),
      startDate: req.startDate,
      endDate: req.endDate,
      days: req.totalDays,
      reason: req.reason,
      attachment: req.attachmentName,
      status: req.status,
      submittedAt: req.createdAt,
    }));

    // Decrypt leave request data before sending to frontend
    const decryptedRequests = formattedRequests.map(req => 
      DataEncryptionService.decryptLeaveRequestData(req)
    );

    res.json({
      success: true,
      leaveRequests: decryptedRequests,
      total: decryptedRequests.length,
    });
  } catch (error) {
    console.error("Error fetching pending leave approvals:", error);
    res.status(500).json({
      error: "Failed to fetch leave approvals",
      details: error.message,
    });
  }
});

// Get all leave requests (for admins)
router.get("/all-requests", async (req, res) => {
  try {
    const { tenantId, status, startDate, endDate } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        error: "Tenant ID is required",
      });
    }

    // Build query conditions
    const whereConditions = { tenantId };

    if (status) {
      whereConditions.status = status;
    }

    if (startDate && endDate) {
      whereConditions.startDate = {
        [Op.between]: [startDate, endDate],
      };
    }

    // Fetch all leave requests from database
    const leaveRequests = await LeaveRequest.findAll({
      where: whereConditions,
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "email", "department"],
        },
        {
          model: User,
          as: "reviewer",
          attributes: ["id", "firstName", "lastName", "email"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Format the response
    const formattedRequests = leaveRequests.map((request) => ({
      id: request.id,
      employeeName: request.employee
        ? `${request.employee.firstName} ${request.employee.lastName}`
        : "Unknown Employee",
      employeeEmail: request.employee?.email || "",
      department: request.employee?.department || "N/A",
      leaveType: request.leaveType,
      startDate: request.startDate,
      endDate: request.endDate,
      totalDays: parseFloat(request.totalDays),
      reason: request.reason,
      status: request.status,
      submittedOn: request.createdAt,
      reviewedBy: request.reviewer
        ? `${request.reviewer.firstName} ${request.reviewer.lastName}`
        : null,
      reviewedAt: request.reviewedAt,
      reviewComments: request.reviewComments,
    }));

    // Decrypt leave request data before sending to frontend
    const decryptedRequests = formattedRequests.map(req => 
      DataEncryptionService.decryptLeaveRequestData(req)
    );

    res.json({
      success: true,
      leaveRequests: decryptedRequests,
      total: decryptedRequests.length,
    });
  } catch (error) {
    console.error("Error fetching all leave requests:", error);
    res.status(500).json({
      error: "Failed to fetch leave requests",
      details: error.message,
    });
  }
});

// Approve leave request
router.post("/approve/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { managerId, comments } = req.body;

    if (!managerId) {
      return res.status(400).json({
        error: "Manager ID is required",
      });
    }

    // Find the leave request
    const leaveRequest = await LeaveRequest.findByPk(id);

    if (!leaveRequest) {
      return res.status(404).json({
        error: "Leave request not found",
      });
    }

    // Encrypt review comments before saving
    const encryptedComments = comments ? DataEncryptionService.encryptLeaveRequestData({ reviewComments: comments }).reviewComments : null;

    // Update leave request status
    await leaveRequest.update({
      status: "approved",
      reviewedBy: managerId,
      reviewedAt: new Date(),
      reviewComments: encryptedComments,
    });

    // Update leave balance - move from pending to used
    const currentYear = new Date().getFullYear();
    const leaveBalance = await LeaveBalance.findOne({
      where: {
        employeeId: leaveRequest.employeeId,
        tenantId: leaveRequest.tenantId,
        year: currentYear,
        leaveType: leaveRequest.leaveType,
      },
    });

    if (leaveBalance) {
      await leaveBalance.update({
        usedDays:
          parseFloat(leaveBalance.usedDays) +
          parseFloat(leaveRequest.totalDays),
        pendingDays:
          parseFloat(leaveBalance.pendingDays) -
          parseFloat(leaveRequest.totalDays),
      });
    }

    // Create notification for leave approval
    try {
      await NotificationService.createLeaveNotification(
        leaveRequest.tenantId,
        leaveRequest.employeeId,
        "approved",
        {
          id: leaveRequest.id,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          leaveType: leaveRequest.leaveType,
        }
      );

      // Send email notification to employee
      const employee = await Employee.findByPk(leaveRequest.employeeId, {
        include: [{
          model: User,
          as: 'user',
          required: false
        }]
      });
      const approver = await User.findByPk(managerId);
      const tenant = await models.Tenant.findByPk(leaveRequest.tenantId);
      
      if (employee?.user && approver && tenant) {
        await LeaveManagementEmailService.sendLeaveRequestApprovedNotification({
          employeeEmail: employee.user.email,
          employeeName: `${employee.user.firstName} ${employee.user.lastName}`,
          approverName: `${approver.firstName} ${approver.lastName}`,
          leaveType: leaveRequest.leaveType,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          totalDays: leaveRequest.totalDays,
          comments: comments || '',
          tenantName: tenant.name || 'TimePulse',
        });
      }

      // Send real-time notification via WebSocket
      if (global.wsService) {
        global.wsService.sendToUser(leaveRequest.employeeId, {
          type: "leave_approved",
          title: "Leave Request Approved",
          message: `Your leave request for ${leaveRequest.startDate} to ${leaveRequest.endDate} has been approved.`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (notificationError) {
      console.error(
        "Error creating leave approval notification:",
        notificationError
      );
      // Don't fail the approval if notification fails
    }

    res.json({
      success: true,
      message: "Leave request approved successfully",
      leaveRequestId: id,
      approvedBy: managerId,
      approvedAt: new Date().toISOString(),
      comments,
    });
  } catch (error) {
    console.error("Error approving leave request:", error);
    res.status(500).json({
      error: "Failed to approve leave request",
      details: error.message,
    });
  }
});

// Reject leave request
router.post("/reject/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { managerId, reason } = req.body;

    if (!managerId) {
      return res.status(400).json({
        error: "Manager ID is required",
      });
    }

    if (!reason) {
      return res.status(400).json({
        error: "Rejection reason is required",
      });
    }

    // Find the leave request
    const leaveRequest = await LeaveRequest.findByPk(id);

    if (!leaveRequest) {
      return res.status(404).json({
        error: "Leave request not found",
      });
    }

    // Encrypt review comments before saving
    const encryptedReason = DataEncryptionService.encryptLeaveRequestData({ reviewComments: reason }).reviewComments;

    // Update leave request status
    await leaveRequest.update({
      status: "rejected",
      reviewedBy: managerId,
      reviewedAt: new Date(),
      reviewComments: encryptedReason,
    });

    // Update leave balance - remove from pending
    const currentYear = new Date().getFullYear();
    const leaveBalance = await LeaveBalance.findOne({
      where: {
        employeeId: leaveRequest.employeeId,
        tenantId: leaveRequest.tenantId,
        year: currentYear,
        leaveType: leaveRequest.leaveType,
      },
    });

    if (leaveBalance) {
      await leaveBalance.update({
        pendingDays:
          parseFloat(leaveBalance.pendingDays) -
          parseFloat(leaveRequest.totalDays),
      });
    }

    // Create notification for leave rejection
    try {
      await NotificationService.createLeaveNotification(
        leaveRequest.tenantId,
        leaveRequest.employeeId,
        "rejected",
        {
          id: leaveRequest.id,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          leaveType: leaveRequest.leaveType,
          reason: reason,
        }
      );

      // Send email notification to employee
      const employee = await Employee.findByPk(leaveRequest.employeeId, {
        include: [{
          model: User,
          as: 'user',
          required: false
        }]
      });
      const approver = await User.findByPk(managerId);
      const tenant = await models.Tenant.findByPk(leaveRequest.tenantId);
      
      if (employee?.user && approver && tenant) {
        await LeaveManagementEmailService.sendLeaveRequestRejectedNotification({
          employeeEmail: employee.user.email,
          employeeName: `${employee.user.firstName} ${employee.user.lastName}`,
          approverName: `${approver.firstName} ${approver.lastName}`,
          leaveType: leaveRequest.leaveType,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          totalDays: leaveRequest.totalDays,
          reason: reason,
          tenantName: tenant.name || 'TimePulse',
        });
      }

      // Send real-time notification via WebSocket
      if (global.wsService) {
        global.wsService.sendToUser(leaveRequest.employeeId, {
          type: "leave_rejected",
          title: "Leave Request Not Approved",
          message: `Your leave request for ${leaveRequest.startDate} to ${leaveRequest.endDate} was not approved.`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (notificationError) {
      console.error(
        "Error creating leave rejection notification:",
        notificationError
      );
      // Don't fail the rejection if notification fails
    }

    res.json({
      success: true,
      message: "Leave request rejected",
      leaveRequestId: id,
      rejectedBy: managerId,
      rejectedAt: new Date().toISOString(),
      reason,
    });
  } catch (error) {
    console.error("Error rejecting leave request:", error);
    res.status(500).json({
      error: "Failed to reject leave request",
      details: error.message,
    });
  }
});

// Get leave statistics for dashboard
router.get("/statistics", async (req, res) => {
  try {
    const { managerId, tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        error: "Tenant ID is required",
      });
    }

    // Mock statistics
    const stats = {
      pendingApprovals: 3,
      approvedThisMonth: 12,
      rejectedThisMonth: 1,
      totalRequests: 16,
      byLeaveType: {
        vacation: 8,
        sick: 5,
        personal: 3,
      },
      upcomingLeaves: [
        {
          employeeName: "John Smith",
          leaveType: "Vacation",
          startDate: "2025-10-15",
          days: 5,
        },
      ],
    };

    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    console.error("Error fetching leave statistics:", error);
    res.status(500).json({
      error: "Failed to fetch statistics",
      details: error.message,
    });
  }
});

// Cancel/Delete a leave request
router.delete("/cancel/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, tenantId } = req.body;

    if (!id || !employeeId || !tenantId) {
      return res.status(400).json({
        error: "Leave request ID, Employee ID, and Tenant ID are required",
      });
    }

    // Find the leave request
    const leaveRequest = await LeaveRequest.findOne({
      where: {
        id,
        employeeId,
        tenantId,
        status: "pending", // Only allow canceling pending requests
      },
    });

    if (!leaveRequest) {
      return res.status(404).json({
        error: "Leave request not found or cannot be cancelled",
      });
    }

    // Update leave balance - remove from pending days before deleting
    const currentYear = new Date().getFullYear();
    const leaveBalance = await LeaveBalance.findOne({
      where: {
        employeeId: leaveRequest.employeeId,
        tenantId: leaveRequest.tenantId,
        year: currentYear,
        leaveType: leaveRequest.leaveType,
      },
    });

    if (leaveBalance) {
      await leaveBalance.update({
        pendingDays:
          parseFloat(leaveBalance.pendingDays) -
          parseFloat(leaveRequest.totalDays),
      });
      console.log(`✅ Updated leave balance: Removed ${leaveRequest.totalDays} pending days for ${leaveRequest.leaveType}`);
    }

    // Delete the leave request
    await leaveRequest.destroy();

    res.json({
      success: true,
      message: "Leave request cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling leave request:", error);
    res.status(500).json({
      error: "Failed to cancel leave request",
      details: error.message,
    });
  }
});

module.exports = router;
