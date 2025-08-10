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

// --- NEW API ROUTE FOR THE APP ---
const RoleRequest = require('../models/RoleRequest');
const { protect } = require('../middleware/authMiddleware');

// @desc    Create a new role request from the mobile app
// @route   POST /api/roles/request
router.post('/api/roles/request', protect, async (req, res) => {
    const { requestedRole } = req.body;
    const user = req.user;

    try {
        const existingRequest = await RoleRequest.findOne({ user: user._id, status: 'Pending' });
        if (existingRequest) {
            return res.status(400).json({ message: 'You already have a pending role request.' });
        }

        await RoleRequest.create({
            user: user._id,
            userName: user.name,
            userEmail: user.email,
            requestedRole,
        });

        res.status(201).json({ message: 'Role request submitted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
