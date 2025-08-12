const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { uploadChatImages } = require('../controllers/uploadController');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// This route will handle up to 3 images with the field name 'images'
router.post('/chat-images', protect, upload.array('images', 3), uploadChatImages);

module.exports = router;