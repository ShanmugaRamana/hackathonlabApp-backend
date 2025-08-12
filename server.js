// ===== ENHANCED server.js =====
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const multer = require('multer');
const startEventStatusUpdater = require('./jobs/eventStatusUpdater');
const http = require('http');
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Chat = require('./models/Chat');

// Import route files
const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const roleRoutes = require('./routes/roleRoutes');
const profileRoutes = require('./routes/profileRoutes');
const eventRoutes = require('./routes/eventRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Start scheduled tasks
startEventStatusUpdater();

// Configure view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Enhanced CORS for file uploads and Socket.IO ---
app.use(cors({
  origin: true, // Allow all origins for development - restrict in production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
}));

// --- Static files and cookies ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// ✅ IMPORTANT: Mount profile routes BEFORE express.json()
// This prevents express.json() from interfering with file uploads
app.use('/api/profile', profileRoutes);

// --- Standard middleware for other routes ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Mount other routers AFTER express.json() ---
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/chat', chatRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/api/events', eventRoutes);

// --- Socket.io Real-time Setup with Enhanced Features ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Restrict this in production
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowUpgrades: true,
  transports: ['websocket', 'polling']
});

// Rate limiting for messages
const rateLimitMap = new Map();
const MESSAGE_RATE_LIMIT = 30; // messages per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

const checkRateLimit = (userId) => {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  if (now > userLimit.resetTime) {
    userLimit.count = 0;
    userLimit.resetTime = now + RATE_LIMIT_WINDOW;
  }
  
  userLimit.count++;
  rateLimitMap.set(userId, userLimit);
  
  return userLimit.count <= MESSAGE_RATE_LIMIT;
};

// Socket.IO authentication middleware (optional but recommended)
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userToken = token;
      console.log('✅ Socket authenticated for user:', decoded.id);
    } catch (error) {
      console.log('⚠️ Invalid token in socket connection:', error.message);
      // Allow connection without authentication for now
    }
  }
  
  next();
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id, 'UserID:', socket.userId || 'Anonymous');

  // Join user to general chat room
  socket.join('general_chat');

  // Handle incoming messages
  socket.on('sendMessage', async ({ text, userId, tempId }) => {
    try {
      // Validate input
      if (!text || !text.trim()) {
        socket.emit('messageError', { 
          message: 'Message text is required',
          tempId 
        });
        return;
      }

      if (!userId) {
        socket.emit('messageError', { 
          message: 'User authentication required',
          tempId 
        });
        return;
      }

      // Check rate limiting
      if (!checkRateLimit(userId)) {
        socket.emit('messageError', { 
          message: 'Too many messages. Please slow down.',
          tempId 
        });
        return;
      }

      // Find user
      const user = await User.findById(userId).select('name');
      if (!user) {
        socket.emit('messageError', { 
          message: 'User not found',
          tempId 
        });
        return;
      }

      // Create and save message
      const messageData = {
        text: text.trim(),
        user: { 
          _id: user._id, 
          name: user.name 
        }
      };

      const message = new Chat(messageData);
      const savedMessage = await message.save();

      console.log('📨 Message saved:', savedMessage._id, 'from user:', user.name);

      // Broadcast to all clients in the room
      io.to('general_chat').emit('receiveMessage', savedMessage);

      // Send confirmation back to sender
      socket.emit('messageConfirmed', { 
        tempId, 
        messageId: savedMessage._id,
        timestamp: savedMessage.createdAt
      });

    } catch (error) {
      console.error('❌ Socket sendMessage error:', error);
      socket.emit('messageError', { 
        message: 'Failed to send message. Please try again.',
        tempId,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Handle typing indicators
  socket.on('typing', ({ userId, userName }) => {
    if (userId && userName) {
      socket.to('general_chat').emit('userTyping', { 
        userId, 
        userName,
        socketId: socket.id 
      });
    }
  });

  socket.on('stopTyping', ({ userId }) => {
    if (userId) {
      socket.to('general_chat').emit('userStoppedTyping', { 
        userId,
        socketId: socket.id 
      });
    }
  });

  // Handle user joining notifications
  socket.on('userJoined', ({ userId, userName }) => {
    if (userId && userName) {
      socket.to('general_chat').emit('userJoinedChat', { 
        userId, 
        userName,
        timestamp: new Date().toISOString()
      });
      console.log('👋 User joined chat:', userName);
    }
  });

  // Handle message read receipts (optional feature)
  socket.on('markMessageRead', async ({ messageId, userId }) => {
    try {
      if (messageId && userId) {
        // Update message read status in database if needed
        // This is optional - you can implement read receipts later
        socket.to('general_chat').emit('messageRead', { 
          messageId, 
          userId,
          readAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log('❌ User disconnected:', socket.id, 'Reason:', reason, 'UserID:', socket.userId || 'Anonymous');
    
    // Notify other users if authenticated user left
    if (socket.userId) {
      socket.to('general_chat').emit('userLeft', { 
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle general socket errors
  socket.on('error', (error) => {
    console.error('🚨 Socket error for user:', socket.id, 'Error:', error);
  });

  // Handle connection errors
  socket.on('connect_error', (error) => {
    console.error('🚨 Socket connection error:', error);
  });

  // Send welcome message to newly connected user
  socket.emit('connected', { 
    message: 'Connected to chat server',
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });
});

// Cleanup rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(userId);
    }
  }
}, RATE_LIMIT_WINDOW);

// --- Error Handling Middleware ---
app.use((error, req, res, next) => {
  console.error('🚨 Global Error Handler:', error);
  
  // Handle Multer errors (file upload errors)
  if (error instanceof multer.MulterError) {
    console.log('📁 Multer Error:', error.code, error.message);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        message: 'File too large. Maximum size is 5MB.' 
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        success: false,
        message: 'Unexpected file field. Use "profilePicture" field name.' 
      });
    }
    
    return res.status(400).json({ 
      success: false,
      message: `File upload error: ${error.message}` 
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      success: false,
      message: 'Token expired' 
    });
  }

  // Handle MongoDB errors
  if (error.name === 'ValidationError') {
    const validationErrors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({ 
      success: false,
      message: 'Validation error',
      errors: validationErrors 
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid ID format' 
    });
  }

  // Handle duplicate key errors (MongoDB)
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({ 
      success: false,
      message: `${field} already exists` 
    });
  }

  // Generic server error
  res.status(500).json({ 
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// --- 404 Handler ---
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: `Route ${req.originalUrl} not found` 
  });
});

// --- Graceful Shutdown ---
const gracefulShutdown = (signal) => {
  console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed.');
    
    // Close Socket.IO connections
    io.close(() => {
      console.log('✅ Socket.IO server closed.');
      
      // Close database connection if needed
      process.exit(0);
    });
  });

  // Force close after timeout
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;

// Use server.listen() instead of app.listen() for socket.io
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`💬 Socket.IO server ready for connections`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;