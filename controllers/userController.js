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

// --- NEW FUNCTION ---
// @desc    Add or remove an event from user's favorites
// @route   POST /api/users/favorites
// @access  Private
const toggleFavoriteEvent = async (req, res) => {
    try {
        const { eventId } = req.body;
        // req.user is attached by the 'protect' middleware
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the event is already in the favorites array
        const index = user.favorites.indexOf(eventId);

        if (index > -1) {
            // If it exists, remove it (unfavorite)
            user.favorites.splice(index, 1);
        } else {
            // If it doesn't exist, add it (favorite)
            user.favorites.push(eventId);
        }

        await user.save();
        res.status(200).json({ message: 'Favorites updated successfully.' });

    } catch (error) {
        console.error('Error toggling favorite event:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// --- UPDATED EXPORTS ---
module.exports = {
  registerDevice,
  toggleFavoriteEvent,
};
