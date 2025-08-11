const express = require('express');
const router = express.Router();
const { 
  getDashboardPage, 
  getLoginPage, 
  loginAdmin, 
  logoutAdmin,
  getRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
  getEventsPage, // Import new function
} = require('../controllers/dashboardController');
const { isAdmin } = require('../middleware/authAdmin');

// Login/Logout
router.get('/login', getLoginPage);
router.post('/login', loginAdmin);
router.get('/logout', logoutAdmin);

// Protected Routes
router.get('/', isAdmin, getDashboardPage);
router.get('/roles', isAdmin, getRoleRequests);
router.post('/roles/approve/:id', isAdmin, approveRoleRequest);
router.post('/roles/reject/:id', isAdmin, rejectRoleRequest);
router.get('/events', isAdmin, getEventsPage); // Add new route

module.exports = router;
