const User = require('../models/User');

// @desc    Register a device token for push notifications
// @route   POST /api/users/register-device
// @access  Private
const registerDevice = async (req, res) => {
  const { token } = req.body;
  const userId = req.user._id;

  try {
    await User.findByIdAndUpdate(userId, { fcmToken: token });
    res.status(200).json({ message: 'Device registered successfully' });
  } catch (error) {
    console.error('Failed to register device:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerDevice };