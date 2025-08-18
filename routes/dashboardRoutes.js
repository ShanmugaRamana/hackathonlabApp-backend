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
  getManageEventsPage,
  getEventsPage,
} = require('../controllers/dashboardController');
const { createEvent } = require('../controllers/eventController'); // <-- THIS IS THE FIX
const { isAdmin } = require('../middleware/authAdmin');

// Multer setup for event thumbnail
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Login/Logout
router.get('/login', getLoginPage);
router.post('/login', loginAdmin);
router.get('/logout', logoutAdmin);

// Protected Routes
router.get('/', isAdmin, getDashboardPage);
router.get('/roles', isAdmin, getRoleRequests);
router.post('/roles/approve/:id', isAdmin, approveRoleRequest);
router.post('/roles/reject/:id', isAdmin, rejectRoleRequest);

// Events routes
router.get('/events', isAdmin, getEventsPage);
router.post('/events', isAdmin, upload.single('thumbnail'), createEvent); // This line will now work
router.get('/manage-events', isAdmin, getManageEventsPage);

module.exports = router;
