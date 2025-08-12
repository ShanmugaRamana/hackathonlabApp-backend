// ===== FIXED server.js =====
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const multer = require('multer'); // <-- Add this
const startEventStatusUpdater = require('./jobs/eventStatusUpdater'); // Import the scheduled task
const http = require('http');
const { Server } = require("socket.io");
const User = require('./models/User');
const Chat = require('./models/Chat');
// Import route files
const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const roleRoutes = require('./routes/roleRoutes');
const profileRoutes = require('./routes/profileRoutes');
const eventRoutes = require('./routes/eventRoutes');
const chatRoutes = require('./routes/chatRoutes'); // For fetching messages
dotenv.config();
const app = express();
connectDB();
startEventStatusUpdater();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Enhanced CORS for file uploads ---
app.use(cors({
  origin: true, // Allow all origins for development
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
    cookie: { secure: false }
}));

// ✅ IMPORTANT: Mount profile routes BEFORE express.json()
// This prevents express.json() from interfering with file uploads
app.use('/api/profile', profileRoutes);

// --- Standard middleware for other routes ---
app.use(express.json({ limit: '10mb' })); // Increased limit for safety
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Mount other routers AFTER express.json() ---
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/chat', chatRoutes); // Use chat routes
app.use('/dashboard', dashboardRoutes);
app.use('/api/events', eventRoutes);

// --- Socket.io Real-time Setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
io.on('connection', (socket) => {
  console.log('✅ a user connected:', socket.id);

  socket.on('sendMessage', async ({ text, userId }) => {
    try {
      const user = await User.findById(userId);
      if (user) {
        const message = new Chat({ text, user: { _id: user._id, name: user.name } });
        const savedMessage = await message.save();
        io.emit('receiveMessage', savedMessage); // Broadcast to all clients
      }
    } catch (error) {
      console.error('Socket error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ user disconnected:', socket.id);
  });
});

// ✅ Add error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Global Error Handler:', error);
  
  if (error instanceof multer.MulterError) {
    console.log('📁 Multer Error:', error.code, error.message);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field. Use "profilePicture" field name.' });
    }
    
    return res.status(400).json({ message: `File upload error: ${error.message}` });
  }
  
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
// Use server.listen() instead of app.listen() for socket.io
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;
