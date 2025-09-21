const User = require('../models/User');

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

const toggleFavoriteEvent = async (req, res) => {
    try {
        const { eventId } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const index = user.favorites.indexOf(eventId);
        if (index > -1) {
            user.favorites.splice(index, 1); // Remove if exists
        } else {
            user.favorites.push(eventId); // Add if doesn't exist
        }
        await user.save();
        res.status(200).json({ message: 'Favorites updated.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getFavoriteEvents = async (req, res) => {
  try {
    // Find the user and use .populate() to get the full event details
    const user = await User.findById(req.user._id).populate('favorites');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user.favorites);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerDevice,
  toggleFavoriteEvent,
  getFavoriteEvents,
};