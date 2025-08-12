const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { uploadChatImages, uploadChatVideos, uploadChatDocuments } = require('../controllers/uploadController');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Handles up to 3 images
router.post('/chat-images', protect, upload.array('images', 3), uploadChatImages);

// Handles up to 3 videos
router.post('/chat-videos', protect, upload.array('videos', 3), uploadChatVideos);

// The audio route has been removed.
router.post('/chat-documents', protect, upload.array('documents', 3), uploadChatDocuments);

module.exports = router;
