const express = require('express');
const router = express.Router();
const { getDashboardPage, getLoginPage, loginAdmin, logoutAdmin } = require('../controllers/dashboardController');
const { isAdmin } = require('../middleware/authAdmin');

// Login routes
router.get('/login', getLoginPage);
router.post('/login', loginAdmin);

// Logout route
router.get('/logout', logoutAdmin);

// Protected dashboard route
router.get('/', isAdmin, getDashboardPage);

module.exports = router;
