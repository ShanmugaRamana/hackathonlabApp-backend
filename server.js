// ===== FIXED server.js =====
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
const User = require('./models/User');
const Chat = require('./models/Chat');
const admin = require('./config/firebase'); // Assuming firebase config exists

// Import route files
const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const roleRoutes = require('./routes/roleRoutes');
const profileRoutes = require('./routes/profileRoutes');
const eventRoutes = require('./routes/eventRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config();
const app = express();
connectDB();
startEventStatusUpdater();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use('/api/profile', profileRoutes);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/chat', chatRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('✅ a user connected:', socket.id);

  socket.on('sendMessage', async ({ text, userId, images, videos, documents }) => {
    try {
      const user = await User.findById(userId);
      if (user) {
        const message = new Chat({ 
          text, 
          images,
          videos,
          documents,
          user: { _id: user._id, name: user.name } 
        });

        const savedMessage = await message.save();
        io.emit('receiveMessage', savedMessage);

        const recipients = await User.find({ _id: { $ne: userId }, fcmToken: { $exists: true, $ne: null } });
        const tokens = recipients.map(r => r.fcmToken);

        if (tokens.length > 0) {
          const notificationMessage = {
            notification: {
              title: user.name,
              body: text || (images && images.length > 0 ? 'Sent an image' : 'Sent a file'),
            },
            data: {
              senderId: userId.toString(),
            },
            tokens: tokens,
          };
          
          admin.messaging().sendEachForMulticast(notificationMessage)
            .then((response) => {
              console.log('Successfully sent message:', response.successCount, 'successes');
            })
            .catch((error) => {
              console.log('Error sending message:', error);
            });
        }
      }
    } catch (error) {
      console.error('Socket error:', error);
    }
  });

  // --- NEW HANDLER FOR UNSEND MESSAGE ---
  socket.on('unsendMessage', async ({ messageId, userId }) => {
    try {
      const message = await Chat.findById(messageId);

      // Security check: Only the original sender can unsend the message
      if (message && message.user._id.toString() === userId) {
        // Update the message content
        message.text = 'This message was unsent';
        message.images = [];
        message.videos = [];
        message.documents = []; // Also clear documents
        message.isUnsent = true;
        
        const updatedMessage = await message.save();

        // Broadcast the updated message to all clients
        io.emit('messageUpdated', updatedMessage);
      }
    } catch (error) {
      console.error('Unsend message error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ user disconnected:', socket.id);
  });
});

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
// Use server.listen() for socket.io
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;
