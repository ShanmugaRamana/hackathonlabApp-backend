const express = require('express');
const router = express.Router();
const RoleRequest = require('../models/RoleRequest');
const { protect } = require('../middleware/authMiddleware');

// @desc    Create a new role request from the mobile app
// @route   POST /api/roles
router.post('/', protect, async (req, res) => {
    const { requestedRole } = req.body;
    const user = req.user;

    try {
        // Check if the user already has a pending request
        const existingRequest = await RoleRequest.findOne({ user: user._id, status: 'Pending' });
        if (existingRequest) {
            return res.status(400).json({ message: 'You already have a pending role request.' });
        }

        // Create the new request
        await RoleRequest.create({
            user: user._id,
            userName: user.name,
            userEmail: user.email,
            requestedRole,
        });

        res.status(201).json({ message: 'Role request submitted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while creating request.' });
    }
});

module.exports = router;
