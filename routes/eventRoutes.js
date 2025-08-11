const express = require('express');
const router = express.Router();
const { getEvents } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

// This route is for the mobile app to fetch events
// GET /api/events
router.get('/', protect, getEvents);

module.exports = router;