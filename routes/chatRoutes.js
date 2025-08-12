const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  searchMessages,
  getUserMessages,
  markAsDelivered
} = require('../controllers/chatController');

// Basic message operations
router.route('/')
  .get(protect, getMessages)      // GET /api/chat?page=1&limit=50&channel=general
  .post(protect, sendMessage);    // POST /api/chat

// Message-specific operations
router.route('/:messageId')
  .put(protect, editMessage)      // PUT /api/chat/:messageId
  .delete(protect, deleteMessage); // DELETE /api/chat/:messageId

// Search operations
router.get('/search', protect, searchMessages); // GET /api/chat/search?query=hello&channel=general

// User-specific operations
router.get('/user/:userId', protect, getUserMessages); // GET /api/chat/user/:userId

// Delivery confirmation
router.post('/delivered', protect, markAsDelivered); // POST /api/chat/delivered

module.exports = router;