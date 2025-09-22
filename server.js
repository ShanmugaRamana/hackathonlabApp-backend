const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');


const passport = require("passport");

const session = require('express-session');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const multer = require('multer');
const startEventStatusUpdater = require('./jobs/eventStatusUpdater');
const http = require('http');
const { Server } = require("socket.io");
const User = require('./models/User');
const Chat = require('./models/Chat');
const admin = require('./config/firebase'); 
const imagekit = require('./config/imagekit'); 

const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const roleRoutes = require('./routes/roleRoutes');
const profileRoutes = require('./routes/profileRoutes');
const eventRoutes = require('./routes/eventRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes'); 
const quantumRoutes = require('./routes/quantumRoutes');

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

app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/chat', chatRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes); 
app.use('/api/quantum', quantumRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('✅ a user connected:', socket.id);
  
  socket.on('sendMessage', async ({ text, userId, images, videos, replyTo }) => {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Check if message has content
      if (!text?.trim() && (!images || images.length === 0) && 
          (!videos || videos.length === 0)) {
        return;
      }

      // Process reply information if replying to a message
      let processedReplyTo = null;
      if (replyTo && replyTo.messageId) {
        try {
          const originalMessage = await Chat.findById(replyTo.messageId);
          if (originalMessage) {
            processedReplyTo = {
              messageId: originalMessage._id,
              textSnippet: originalMessage.text ? 
                (originalMessage.text.length > 100 ? 
                  originalMessage.text.substring(0, 100) + '...' : 
                  originalMessage.text) : '',
              authorName: originalMessage.user.name,
            };

            // Determine media type and thumbnail
            if (originalMessage.images && originalMessage.images.length > 0) {
              processedReplyTo.mediaType = 'image';
              processedReplyTo.mediaThumbnail = originalMessage.images[0];
              processedReplyTo.mediaCount = originalMessage.images.length;
            } else if (originalMessage.videos && originalMessage.videos.length > 0) {
              processedReplyTo.mediaType = 'video';
              processedReplyTo.mediaThumbnail = originalMessage.videos[0];
              processedReplyTo.mediaCount = originalMessage.videos.length;
            }
          }
        } catch (replyError) {
          console.error('Error processing reply:', replyError);
          // Continue without reply if there's an error
        }
      }

      const message = new Chat({
        text,
        images: images || [],
        videos: videos || [],
        replyTo: processedReplyTo,
        user: { 
          _id: user._id, 
          name: user.name, 
          profilePicture: user.profilePicture 
        }
      });

      const savedMessage = await message.save();
      
      // Populate the reply information for the response
      await savedMessage.populate('replyTo.messageId');
      
      io.emit('receiveMessage', savedMessage);

      // Send push notifications
      const recipients = await User.find({ 
        _id: { $ne: userId }, 
        fcmToken: { $exists: true, $ne: null } 
      });
      
      const tokens = recipients.map(r => r.fcmToken);
      
      if (tokens.length > 0) {
        // Generate notification body based on message content
        let notificationBody = '';
        
        if (processedReplyTo) {
          const replyPrefix = `↳ Replied to ${processedReplyTo.authorName}: `;
          if (text) {
            notificationBody = replyPrefix + text;
          } else if (images && images.length > 0) {
            notificationBody = replyPrefix + `📷 Sent ${images.length} image${images.length > 1 ? 's' : ''}`;
          } else if (videos && videos.length > 0) {
            notificationBody = replyPrefix + `🎥 Sent ${videos.length} video${videos.length > 1 ? 's' : ''}`;
          }
        } else {
          if (text) {
            notificationBody = text;
          } else if (images && images.length > 0) {
            notificationBody = `📷 Sent ${images.length} image${images.length > 1 ? 's' : ''}`;
          } else if (videos && videos.length > 0) {
            notificationBody = `🎥 Sent ${videos.length} video${videos.length > 1 ? 's' : ''}`;
          }
        }

        const notificationMessage = {
          notification: {
            title: user.name,
            body: notificationBody,
          },
          data: {
            senderId: userId.toString(),
            messageId: savedMessage._id.toString(),
            hasReply: processedReplyTo ? 'true' : 'false',
          },
          tokens: tokens,
        };

        admin.messaging().sendEachForMulticast(notificationMessage)
          .then((response) => {
            console.log('Successfully sent message:', response.successCount, 'successes');
            if (response.failureCount > 0) {
              console.log('Failed to send to:', response.failureCount, 'devices');
            }
          })
          .catch((error) => {
            console.log('Error sending message:', error);
          });
      }
    } catch (error) {
      console.error('Socket error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('unsendMessage', async ({ messageId, userId }) => {
    try {
      const message = await Chat.findById(messageId);
      if (message && message.user._id.toString() === userId) {
        message.originalText = message.text;
        message.text = 'This message was unsent';
        message.images = [];
        message.videos = [];
        message.isUnsent = true;
        
        // Keep reply information even when message is unsent
        const updatedMessage = await message.save();
        io.emit('messageUpdated', updatedMessage);
      }
    } catch (error) {
      console.error('Unsend message error:', error);
      socket.emit('error', { message: 'Failed to unsend message' });
    }
  });

  // New event to get message details for reply
  socket.on('getMessageForReply', async ({ messageId }) => {
    try {
      const message = await Chat.findById(messageId);
      if (message) {
        const replyData = {
          messageId: message._id,
          textSnippet: message.text ? 
            (message.text.length > 100 ? 
              message.text.substring(0, 100) + '...' : 
              message.text) : '',
          authorName: message.user.name,
          mediaType: null,
          mediaThumbnail: null,
          mediaCount: 0
        };

        // Set media information
        if (message.images && message.images.length > 0) {
          replyData.mediaType = 'image';
          replyData.mediaThumbnail = message.images[0];
          replyData.mediaCount = message.images.length;
        } else if (message.videos && message.videos.length > 0) {
          replyData.mediaType = 'video';
          replyData.mediaThumbnail = message.videos[0];
          replyData.mediaCount = message.videos.length;
        }

        socket.emit('messageForReply', replyData);
      }
    } catch (error) {
      console.error('Error getting message for reply:', error);
      socket.emit('error', { message: 'Failed to get message details' });
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ user disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;
