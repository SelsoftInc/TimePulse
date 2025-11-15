const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { models } = require("../models");

class WebSocketService {
  constructor(server) {
    // Get allowed origins from environment or use defaults
    const allowedOrigins = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
      : ["http://localhost:3000", "https://app.timepulse.io"];
    
    this.io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Authorization", "Content-Type"],
      },
      allowEIO3: true, // Support older Socket.IO clients
      transports: ["polling", "websocket"], // Allow both, but prefer polling
    });

    this.connectedUsers = new Map(); // Map of userId -> socketId
    this.userSockets = new Map(); // Map of socketId -> userId

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace("Bearer ", "");

        if (!token) {
          return next(new Error("Authentication error: No token provided"));
        }

        // For demo purposes, we'll use a simple token validation
        // In production, you should verify JWT tokens properly
        if (token === "mock-jwt-token") {
          // Get user info from localStorage or database
          const userInfo = socket.handshake.auth.userInfo;
          if (!userInfo) {
            return next(
              new Error("Authentication error: No user info provided")
            );
          }

          socket.userId = userInfo.id;
          socket.tenantId = userInfo.tenantId;
          next();
        } else {
          // Try to verify JWT token
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your-secret-key"
          );
          socket.userId = decoded.userId;
          socket.tenantId = decoded.tenantId;
          next();
        }
      } catch (error) {
        console.error("WebSocket authentication error:", error);
        next(new Error("Authentication error: Invalid token"));
      }
    });
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`User ${socket.userId} connected with socket ${socket.id}`);

      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);
      this.userSockets.set(socket.id, socket.userId);

      // Join user to their tenant room
      socket.join(`tenant:${socket.tenantId}`);

      // Handle user joining their personal room
      socket.join(`user:${socket.userId}`);

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`User ${socket.userId} disconnected`);
        this.connectedUsers.delete(socket.userId);
        this.userSockets.delete(socket.id);
      });

      // Handle join room (for specific features)
      socket.on("join-room", (room) => {
        socket.join(room);
        console.log(`User ${socket.userId} joined room ${room}`);
      });

      // Handle leave room
      socket.on("leave-room", (room) => {
        socket.leave(room);
        console.log(`User ${socket.userId} left room ${room}`);
      });

      // Handle notification acknowledgment
      socket.on("notification-ack", (notificationId) => {
        console.log(
          `User ${socket.userId} acknowledged notification ${notificationId}`
        );
        // You can implement notification acknowledgment logic here
      });
    });
  }

  /**
   * Send notification to a specific user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   */
  sendToUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit("notification", notification);
      console.log(`Notification sent to user ${userId}`);
    } else {
      console.log(`User ${userId} is not connected`);
    }
  }

  /**
   * Send notification to all users in a tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} notification - Notification data
   */
  sendToTenant(tenantId, notification) {
    this.io.to(`tenant:${tenantId}`).emit("notification", notification);
    console.log(`Notification sent to tenant ${tenantId}`);
  }

  /**
   * Send notification to specific users
   * @param {Array<string>} userIds - Array of user IDs
   * @param {Object} notification - Notification data
   */
  sendToUsers(userIds, notification) {
    userIds.forEach((userId) => {
      this.sendToUser(userId, notification);
    });
  }

  /**
   * Send notification to users with specific roles
   * @param {string} tenantId - Tenant ID
   * @param {Array<string>} roles - Array of roles
   * @param {Object} notification - Notification data
   */
  async sendToRoles(tenantId, roles, notification) {
    try {
      const users = await models.User.findAll({
        where: {
          tenantId,
          role: { [models.Sequelize.Op.in]: roles },
        },
        attributes: ["id"],
      });

      const userIds = users.map((user) => user.id);
      this.sendToUsers(userIds, notification);
    } catch (error) {
      console.error("Error sending notification to roles:", error);
    }
  }

  /**
   * Send system message to a user
   * @param {string} userId - User ID
   * @param {string} message - System message
   * @param {string} type - Message type (info, success, warning, error)
   */
  sendSystemMessage(userId, message, type = "info") {
    this.sendToUser(userId, {
      type: "system",
      message,
      timestamp: new Date().toISOString(),
      systemType: type,
    });
  }

  /**
   * Broadcast system message to all users in a tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} message - System message
   * @param {string} type - Message type (info, success, warning, error)
   */
  broadcastSystemMessage(tenantId, message, type = "info") {
    this.io.to(`tenant:${tenantId}`).emit("system-message", {
      type: "system",
      message,
      timestamp: new Date().toISOString(),
      systemType: type,
    });
  }

  /**
   * Get connected users count for a tenant
   * @param {string} tenantId - Tenant ID
   * @returns {number} Connected users count
   */
  getConnectedUsersCount(tenantId) {
    const tenantRoom = this.io.sockets.adapter.rooms.get(`tenant:${tenantId}`);
    return tenantRoom ? tenantRoom.size : 0;
  }

  /**
   * Check if user is connected
   * @param {string} userId - User ID
   * @returns {boolean} True if user is connected
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get all connected users
   * @returns {Array} Array of connected user IDs
   */
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }
}

module.exports = WebSocketService;
