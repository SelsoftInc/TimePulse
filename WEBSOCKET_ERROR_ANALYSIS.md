# WebSocket Error Analysis & Solutions

## 🔴 Current Error

```
WebSocket connection to 'wss://zewunzistm.us-east-1.awsapprunner.com/socket.io/?EIO=4&transport=websocket' failed
WebSocket connection error: Rl: websocket error
```

## 🔍 Root Causes

### 1. **AWS App Runner WebSocket Limitations**
- **Issue**: AWS App Runner has **limited WebSocket support**
- **Problem**: App Runner may not properly handle WebSocket upgrade requests
- **Impact**: Socket.IO WebSocket connections fail, even though polling should work as fallback

### 2. **CORS Configuration Mismatch**
- **Backend CORS**: Configured for `process.env.FRONTEND_URL` or `https://goggly-casteless-torri.ngrok-free.dev`
- **Frontend URL**: `https://app.timepulse.io` (production)
- **Issue**: CORS origin may not match, causing WebSocket handshake to fail

### 3. **Authentication Token Issues**
- **Requirement**: WebSocket connection requires JWT token in `auth.token`
- **Problem**: Token might be expired, invalid, or not properly passed
- **Impact**: Authentication middleware rejects connection

### 4. **Socket.IO Transport Configuration**
- **Current**: `transports: ["websocket", "polling"]` (tries WebSocket first)
- **Issue**: If WebSocket fails, polling fallback may not work properly on App Runner

### 5. **SSL/TLS Termination**
- **Issue**: App Runner handles SSL termination, which can interfere with WebSocket upgrades
- **Impact**: WebSocket handshake fails at the proxy level

## ✅ Solutions

### Solution 1: Force Polling Transport (Quick Fix)

**Update `frontend/src/contexts/WebSocketContext.js`:**

```javascript
const newSocket = io(
  process.env.REACT_APP_API_BASE || "http://44.222.217.57:5001",
  {
    auth: {
      token: localStorage.getItem("token"),
      userInfo: user,
    },
    transports: ["polling"], // Force polling instead of WebSocket
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  }
);
```

**Pros:**
- ✅ Works reliably on App Runner
- ✅ No WebSocket upgrade issues
- ✅ Simple fix

**Cons:**
- ⚠️ Slightly higher latency than WebSocket
- ⚠️ More HTTP requests

### Solution 2: Improve CORS Configuration

**Update `server/services/WebSocketService.js`:**

```javascript
this.io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
      : ["https://goggly-casteless-torri.ngrok-free.dev", "https://app.timepulse.io"],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
  },
  allowEIO3: true, // Support older Socket.IO clients
  transports: ["websocket", "polling"], // Allow both
});
```

### Solution 3: Add Better Error Handling & Fallback

**Update `frontend/src/contexts/WebSocketContext.js`:**

```javascript
const connectWebSocket = () => {
  try {
    const apiBase = process.env.REACT_APP_API_BASE || "http://44.222.217.57:5001";
    
    const newSocket = io(apiBase, {
      auth: {
        token: localStorage.getItem("token"),
        userInfo: user,
      },
      transports: ["polling", "websocket"], // Try polling first
      upgrade: true,
      rememberUpgrade: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    newSocket.on("connect", () => {
      console.log("✅ WebSocket connected via", newSocket.io.engine.transport.name);
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error.message);
      setIsConnected(false);
      
      // If WebSocket fails, force polling
      if (error.message.includes("websocket") || error.message.includes("upgrade")) {
        console.log("🔄 Falling back to polling transport...");
        newSocket.io.opts.transports = ["polling"];
        newSocket.disconnect();
        setTimeout(() => newSocket.connect(), 1000);
      }
    });

    // ... rest of handlers
  } catch (error) {
    console.error("Failed to initialize WebSocket:", error);
  }
};
```

### Solution 4: Disable WebSocket (Recommended for App Runner)

**If WebSocket is not critical, disable it entirely:**

```javascript
// In WebSocketContext.js
const newSocket = io(apiBase, {
  auth: {
    token: localStorage.getItem("token"),
    userInfo: user,
  },
  transports: ["polling"], // Only use polling
  upgrade: false, // Disable WebSocket upgrade attempts
  reconnection: true,
});
```

### Solution 5: Use Alternative Real-Time Solution

**If WebSocket is critical, consider:**
- **AWS API Gateway WebSocket API** (separate service)
- **AWS AppSync** (GraphQL subscriptions)
- **Server-Sent Events (SSE)** (simpler, one-way)
- **Long Polling** (already supported by Socket.IO)

## 🎯 Recommended Approach

### For Immediate Fix:
1. **Force polling transport** (Solution 1) - Quick and reliable
2. **Update CORS** (Solution 2) - Ensure proper origin matching
3. **Add error handling** (Solution 3) - Better user experience

### For Long-Term:
- **Evaluate if WebSocket is needed**: If real-time notifications aren't critical, polling is sufficient
- **Consider alternative hosting**: If WebSocket is essential, consider:
  - AWS ECS/Fargate (full control)
  - AWS Elastic Beanstalk (better WebSocket support)
  - Self-hosted on EC2

## 📝 Implementation Steps

1. **Update frontend WebSocket config** to use polling first
2. **Update backend CORS** to include production frontend URL
3. **Add better error handling** and fallback logic
4. **Test connection** and verify notifications work
5. **Monitor logs** to ensure stable connections

## 🔧 Configuration Checklist

- [ ] `FRONTEND_URL` environment variable set in App Runner
- [ ] CORS includes production frontend URL
- [ ] JWT token is valid and passed correctly
- [ ] Socket.IO version compatibility (client/server)
- [ ] App Runner service has proper network configuration

## 📊 Impact Assessment

**Current State:**
- ❌ WebSocket connections fail
- ⚠️ Real-time notifications may not work
- ⚠️ User experience degraded with error messages

**After Fix:**
- ✅ Polling transport works reliably
- ✅ Real-time notifications functional
- ✅ No error messages in console
- ⚠️ Slightly higher latency (acceptable for most use cases)

## 🚨 Important Notes

1. **WebSocket errors are non-critical**: The app functions without WebSocket
2. **Polling is sufficient**: For most notification use cases, polling works fine
3. **App Runner limitation**: This is a known limitation of App Runner, not a bug in your code
4. **Future consideration**: If real-time is critical, consider alternative hosting

