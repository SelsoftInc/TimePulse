const express = require('express');
const router = express.Router();
const { models } = require('../models');
const { Op } = require('sequelize');

const { User, Employee } = models;

// Get leave requests for approval (for managers/admins)
router.get('/pending-approvals', async (req, res) => {
  try {
    const { managerId, tenantId } = req.query;
    
    if (!managerId || !tenantId) {
      return res.status(400).json({ 
        error: 'Manager ID and Tenant ID are required' 
      });
    }

    // For now, using mock data structure
    // In production, you would have a LeaveRequest model
    // Note: John Smith, Sarah Johnson, and Michael Brown have been removed from employees
    // So their leave requests should not appear
    const mockLeaveRequests = [];

    res.json({
      success: true,
      leaveRequests: mockLeaveRequests,
      total: mockLeaveRequests.length
    });

  } catch (error) {
    console.error('Error fetching pending leave approvals:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leave approvals',
      details: error.message 
    });
  }
});

// Get all leave requests (for admins)
router.get('/all-requests', async (req, res) => {
  try {
    const { tenantId, status, startDate, endDate } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({ 
        error: 'Tenant ID is required' 
      });
    }

    // Mock data for all leave requests
    // Note: Deleted employees (John Smith, Sarah Johnson, Michael Brown) removed
    const mockAllRequests = [];

    // Filter by status if provided
    let filteredRequests = mockAllRequests;
    if (status) {
      filteredRequests = filteredRequests.filter(req => req.status === status);
    }

    res.json({
      success: true,
      leaveRequests: filteredRequests,
      total: filteredRequests.length
    });

  } catch (error) {
    console.error('Error fetching all leave requests:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leave requests',
      details: error.message 
    });
  }
});

// Approve leave request
router.post('/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { managerId, comments } = req.body;
    
    if (!managerId) {
      return res.status(400).json({ 
        error: 'Manager ID is required' 
      });
    }

    // In production, update the leave request in database
    // For now, returning success response
    res.json({
      success: true,
      message: 'Leave request approved successfully',
      leaveRequestId: id,
      approvedBy: managerId,
      approvedAt: new Date().toISOString(),
      comments
    });

  } catch (error) {
    console.error('Error approving leave request:', error);
    res.status(500).json({ 
      error: 'Failed to approve leave request',
      details: error.message 
    });
  }
});

// Reject leave request
router.post('/reject/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { managerId, reason } = req.body;
    
    if (!managerId) {
      return res.status(400).json({ 
        error: 'Manager ID is required' 
      });
    }

    if (!reason) {
      return res.status(400).json({ 
        error: 'Rejection reason is required' 
      });
    }

    // In production, update the leave request in database
    res.json({
      success: true,
      message: 'Leave request rejected',
      leaveRequestId: id,
      rejectedBy: managerId,
      rejectedAt: new Date().toISOString(),
      reason
    });

  } catch (error) {
    console.error('Error rejecting leave request:', error);
    res.status(500).json({ 
      error: 'Failed to reject leave request',
      details: error.message 
    });
  }
});

// Get leave statistics for dashboard
router.get('/statistics', async (req, res) => {
  try {
    const { managerId, tenantId } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({ 
        error: 'Tenant ID is required' 
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
        personal: 3
      },
      upcomingLeaves: [
        {
          employeeName: 'John Smith',
          leaveType: 'Vacation',
          startDate: '2025-10-15',
          days: 5
        }
      ]
    };

    res.json({
      success: true,
      statistics: stats
    });

  } catch (error) {
    console.error('Error fetching leave statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      details: error.message 
    });
  }
});

module.exports = router;
