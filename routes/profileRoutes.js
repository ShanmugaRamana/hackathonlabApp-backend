const express = require('express');
const router = express.Router();
const multer = require('multer');
const { updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

// Configure multer to store files in memory temporarily
const storage = multer.memoryStorage();
const upload = multer({ storage });

// The upload middleware will now pass the file to the controller
router.route('/').put(protect, upload.single('profilePicture'), updateProfile);

module.exports = router;
