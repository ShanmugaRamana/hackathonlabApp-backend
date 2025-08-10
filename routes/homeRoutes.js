const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// @desc    Get logged in user's data
// @route   GET /api/home
// @access  Private
router.get('/', protect, (req, res) => {
  // The 'protect' middleware attaches the user object to req.user
  // We send the whole user object back to the frontend
  res.status(200).json({
    user: req.user,
  });
});

module.exports = router;