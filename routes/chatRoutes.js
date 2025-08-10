const express = require('express');
const router = express.Router();
const { getMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/chat/messages - Fetches all messages
router.route('/messages').get(protect, getMessages);

module.exports = router;