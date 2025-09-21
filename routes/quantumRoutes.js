const express = require('express');
const router = express.Router();
const { getLaunchDate } = require('../controllers/quantumController');

// Route to get the feature launch date
router.get('/launch-date', getLaunchDate);

module.exports = router;