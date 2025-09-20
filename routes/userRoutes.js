const express = require('express');
const router = express.Router();
// --- UPDATED: Import the new controller function
const { registerDevice, toggleFavoriteEvent } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/users/register-device
// This route is for registering a device for push notifications
router.post('/register-device', protect, registerDevice);

// --- NEW: Route to add or remove an event from a user's favorites ---
// POST /api/users/favorites
router.post('/favorites', protect, toggleFavoriteEvent);

module.exports = router;
