const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { uploadChatImages, uploadChatVideos } = require('../controllers/uploadController');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Handles up to 3 images
router.post('/chat-images', protect, upload.array('images', 3), uploadChatImages);

// --- NEW ROUTE FOR VIDEOS ---
// Handles up to 3 videos
router.post('/chat-videos', protect, upload.array('videos', 3), uploadChatVideos);

module.exports = router;
