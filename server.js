const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http'); // Import http
const { Server } = require("socket.io"); // Import socket.io
const User = require('./models/User'); // To get user details
const Chat = require('./models/Chat'); // To save messages

// Import route files
const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const chatRoutes = require('./routes/chatRoutes'); // Import chat routes

dotenv.config();
const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// --- Mount Routers ---
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/chat', chatRoutes); // Mount chat routes

// --- Socket.io Setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity in development
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  // Listen for a new message from a client
  socket.on('sendMessage', async ({ text, userId }) => {
    try {
      const user = await User.findById(userId);
      if (user) {
        // Create the message object
        const message = new Chat({
          text,
          user: {
            _id: user._id,
            name: user.name,
          },
        });
        // Save the message to the database
        const savedMessage = await message.save();
        // Broadcast the saved message to all connected clients
        io.emit('receiveMessage', savedMessage);
      }
    } catch (error) {
      console.error('Socket error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});


const PORT = process.env.PORT || 5000;

// Use server.listen instead of app.listen
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
