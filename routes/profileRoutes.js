const express = require('express');
const router = express.Router();
const { updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

// PUT /api/profile - Updates the logged-in user's profile
router.route('/').put(protect, updateProfile);

module.exports = router;