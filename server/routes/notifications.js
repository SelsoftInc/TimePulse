const express = require("express");
const router = express.Router();
const { models } = require("../models");
const { Op } = require("sequelize");

const { Notification, User } = models;

// Get user notifications
router.get("/", async (req, res) => {
  try {
    const { tenantId, userId } = req.query;
    const {
      limit = 20,
      offset = 0,
      category,
      type,
      priority,
      includeRead = false,
    } = req.query;

    console.log(`📬 Fetching notifications for userId: ${userId}, tenantId: ${tenantId}`);

    if (!tenantId || !userId) {
      return res
        .status(400)
        .json({ error: "Tenant ID and User ID are required" });
    }

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      category,
      type,
      priority,
      includeRead: includeRead === "true",
    };

    const result = await Notification.getUserNotifications(
      userId,
      tenantId,
      options
    );

    console.log(`📬 Found ${result.count} notifications (returning ${result.rows.length})`);

    res.json({
      success: true,
      notifications: result.rows,
      total: result.count,
      hasMore: result.count > parseInt(offset) + parseInt(limit),
      unreadCount: result.rows.filter(n => !n.readAt).length,
    });
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get unread count
router.get("/unread-count", async (req, res) => {
  try {
    const { tenantId, userId } = req.query;

    console.log(`🔔 Fetching unread count for userId: ${userId}, tenantId: ${tenantId}`);

    if (!tenantId || !userId) {
      return res
        .status(400)
        .json({ error: "Tenant ID and User ID are required" });
    }

    const count = await Notification.getUnreadCount(userId, tenantId);

    console.log(`🔔 Unread count: ${count}`);

    res.json({
      success: true,
      count: count,
    });
  } catch (error) {
    console.error("❌ Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// Mark notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.body;

    if (!tenantId || !userId) {
      return res
        .status(400)
        .json({ error: "Tenant ID and User ID are required" });
    }

    const notification = await Notification.findOne({
      where: {
        id,
        tenantId,
        userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.patch("/mark-all-read", async (req, res) => {
  try {
    const { tenantId, userId } = req.body;

    if (!tenantId || !userId) {
      return res
        .status(400)
        .json({ error: "Tenant ID and User ID are required" });
    }

    await Notification.update(
      { readAt: new Date() },
      {
        where: {
          tenantId,
          userId,
          readAt: null,
        },
      }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

// Delete notification
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.body;

    if (!tenantId || !userId) {
      return res
        .status(400)
        .json({ error: "Tenant ID and User ID are required" });
    }

    const notification = await Notification.findOne({
      where: {
        id,
        tenantId,
        userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// Create notification (admin/system use)
router.post("/", async (req, res) => {
  try {
    const {
      tenantId,
      userId,
      title,
      message,
      type = "info",
      category = "general",
      priority = "medium",
      expiresAt,
      actionUrl,
      metadata,
    } = req.body;

    if (!tenantId || !title || !message) {
      return res
        .status(400)
        .json({ error: "Tenant ID, title, and message are required" });
    }

    const notification = await Notification.create({
      tenantId,
      userId,
      title,
      message,
      type,
      category,
      priority,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      actionUrl,
      metadata,
    });

    res.status(201).json({
      success: true,
      notification,
      message: "Notification created successfully",
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

module.exports = router;
