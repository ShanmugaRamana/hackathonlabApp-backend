const express = require('express');
const router = express.Router();
const multer = require('multer');

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

const storage = multer.memoryStorage();
const upload = multer({ storage });
// Protected Routes
router.get('/', isAdmin, getDashboardPage);
router.get('/roles', isAdmin, getRoleRequests);
router.post('/roles/approve/:id', isAdmin, approveRoleRequest);
router.post('/roles/reject/:id', isAdmin, rejectRoleRequest);
router.get('/events', isAdmin, getEventsPage); // Add new route
router.get('/events', isAdmin, getEventsPage);
router.post('/events', isAdmin, upload.single('thumbnail'), createEvent); // Add POST route

module.exports = router;
