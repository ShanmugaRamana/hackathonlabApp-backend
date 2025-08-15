const express = require('express');
const router = express.Router();
const { getEvents, getEventById } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

// This route is for the mobile app to fetch events
// GET /api/events
router.get('/', protect, getEvents);
router.get('/:id', protect, getEventById);

module.exports = router;