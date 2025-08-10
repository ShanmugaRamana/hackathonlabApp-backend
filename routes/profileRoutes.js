const express = require('express');
const router = express.Router();
const multer = require('multer');
const { updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

// Configure multer to store files in memory temporarily
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 Multer received file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size || 'unknown'
    });
    
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      console.log('❌ File rejected - not an image:', file.mimetype);
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Debug middleware to log incoming requests
const debugMiddleware = (req, res, next) => {
  console.log('\n=== PROFILE UPDATE REQUEST DEBUG ===');
  console.log('🔄 Method:', req.method);
  console.log('📍 URL:', req.url);
  console.log('📋 Headers:', {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length'],
    'authorization': req.headers.authorization ? 'Present' : 'Missing'
  });
  console.log('📦 Body keys:', Object.keys(req.body || {}));
  console.log('📁 File present:', !!req.file);
  console.log('=====================================\n');
  next();
};

// The upload middleware will now pass the file to the controller
router.route('/')
  .put(
    debugMiddleware,           // Add debug logging
    protect,                  // Authentication
    upload.single('profilePicture'), // File upload
    (req, res, next) => {     // Additional debug after multer
      console.log('🔍 After multer processing:');
      console.log('📁 req.file:', req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer?.length
      } : 'No file');
      console.log('📦 req.body:', req.body);
      next();
    },
    updateProfile            // Your controller
  );

module.exports = router;