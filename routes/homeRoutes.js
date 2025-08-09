const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// @desc    Access a protected home screen message
// @route   GET /api/home
// @access  Private
router.get('/', protect, (req, res) => {
  // The 'protect' middleware runs first. If successful, it attaches the user to req.user.
  res.status(200).json({
    message: `Welcome to the Hackathon Lab, ${req.user.name}!`,
  });
});

module.exports = router;