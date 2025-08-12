const express = require('express');
const router = express.Router();
const { getMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getMessages);

module.exports = router;