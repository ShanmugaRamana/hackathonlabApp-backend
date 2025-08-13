const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require("socket.io");
const User = require('./models/User');
const Chat = require('./models/Chat');
const startEventStatusUpdater = require('./jobs/eventStatusUpdater');

// Import route files
const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const roleRoutes = require('./routes/roleRoutes');
const profileRoutes = require('./routes/profileRoutes');
const eventRoutes = require('./routes/eventRoutes');
const chatRoutes = require('./routes/chatRoutes');
const admin = require('./config/firebase'); // Import Firebase Admin
const userRoutes = require('./routes/userRoutes'); // Import new user routes
const uploadRoutes = require('./routes/uploadRoutes'); // <-- Import new upload routes
dotenv.config();
const app = express();
connectDB();
startEventStatusUpdater();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use('/api/profile', profileRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes); // Mount new user routes
app.use('/api/upload', uploadRoutes); // <-- Mount new upload routes
app.use('/dashboard', dashboardRoutes);

// --- Socket.io Real-time Setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  // --- UPDATED sendMessage HANDLER ---
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

        // --- SEND NOTIFICATION LOGIC ---
        // Find all users who should receive a notification (everyone except the sender)
        const recipients = await User.find({ _id: { $ne: userId }, fcmToken: { $exists: true, $ne: null } });
        const tokens = recipients.map(r => r.fcmToken);

        if (tokens.length > 0) {
          const notificationMessage = {
            notification: {
              title: user.name,
              body: text || (images && images.length > 0 ? 'Sent an image' : 'Sent a file'),
            },
            tokens: tokens,
          };
          
          // Send the notification
          admin.messaging().sendMulticast(notificationMessage)
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
  socket.on('disconnect', () => {
    console.log('❌ user disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
