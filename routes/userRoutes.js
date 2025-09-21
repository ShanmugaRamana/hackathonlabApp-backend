const express = require('express');
const router = express.Router();
const {
  registerDevice,
  toggleFavoriteEvent,
  getFavoriteEvents
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Route for registering a device for push notifications
router.post('/register-device', protect, registerDevice);

// --- NEW: Route to add/remove an event from favorites ---
router.post('/favorites', protect, toggleFavoriteEvent);

// --- NEW: Route to get all of a user's favorited events ---
router.get('/my-favorites', protect, getFavoriteEvents);

module.exports = router;