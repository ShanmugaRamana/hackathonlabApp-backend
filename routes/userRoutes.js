const express = require('express');
const router = express.Router();
const { registerDevice } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/users/register-device
router.post('/register-device', protect, registerDevice);

module.exports = router;
