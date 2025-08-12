const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { uploadChatImages, uploadChatVideos, uploadChatAudios } = require('../controllers/uploadController');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Handles up to 3 images
router.post('/chat-images', protect, upload.array('images', 3), uploadChatImages);

// Handles up to 3 videos
router.post('/chat-videos', protect, upload.array('videos', 3), uploadChatVideos);

// --- NEW ROUTE FOR AUDIO ---
// Handles up to 3 audio files
router.post('/chat-audios', protect, upload.array('audios', 3), uploadChatAudios);

module.exports = router;
