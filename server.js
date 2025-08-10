// ===== FIXED client.ts =====
import axios from 'axios';
import { getToken } from '../storage/userStorage';

const API_URL = 'https://hackathonlabapp-backend.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_URL,
  // ❌ REMOVED: Don't set default Content-Type
  // headers: {
  //   'Content-Type': 'application/json',
  // },
});

// Request Interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // ✅ Set Content-Type conditionally
    if (!(config.data instanceof FormData)) {
      // Only set JSON content type for non-file requests
      config.headers['Content-Type'] = 'application/json';
    }
    // For FormData, let axios set the proper multipart headers automatically
    
    console.log('📡 API Request Config:', {
      method: config.method,
      url: config.url,
      contentType: config.headers['Content-Type'],
      isFormData: config.data instanceof FormData,
      hasAuth: !!config.headers.Authorization
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      message: error.response?.data?.message || error.message
    });
    return Promise.reject(error);
  }
);

export default apiClient;

// ===== FIXED server.js =====
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Import route files
const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const roleRoutes = require('./routes/roleRoutes');
const profileRoutes = require('./routes/profileRoutes');

dotenv.config();
const app = express();
connectDB();

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
app.use('/dashboard', dashboardRoutes);

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
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;