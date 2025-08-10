const User = require('../models/User');
const imagekit = require('../config/imagekit'); // Import the ImageKit config

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // If user doesn't exist
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic fields
    user.name = req.body.name || user.name;
    user.bio = req.body.bio || user.bio;
    user.rollNumber = req.body.rollNumber || user.rollNumber;

    // --- Handle interestedDomains safely ---
    let interestedDomains = req.body.interestedDomains;
    if (typeof interestedDomains === 'string') {
      try {
        // Try JSON first
        if (interestedDomains.trim().startsWith('[')) {
          interestedDomains = JSON.parse(interestedDomains);
        } else {
          // Fallback: comma-separated string
          interestedDomains = interestedDomains.split(',').map(d => d.trim());
        }
      } catch {
        interestedDomains = interestedDomains.split(',').map(d => d.trim());
      }
    }
    if (Array.isArray(interestedDomains)) {
      user.interestedDomains = interestedDomains;
    }

    // --- Handle profile picture upload ---
    if (req.file) {
      const response = await imagekit.upload({
        file: req.file.buffer.toString('base64'),
        fileName: `${Date.now()}-${req.file.originalname}`,
        folder: 'hackathon-lab-profiles', // Optional: creates folder in ImageKit dashboard
      });
      user.profilePicture = response.url;
    }

    // Save updated user
    const updatedUser = await user.save();

    // Send back updated data
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      bio: updatedUser.bio,
      rollNumber: updatedUser.rollNumber,
      interestedDomains: updatedUser.interestedDomains,
      profilePicture: updatedUser.profilePicture,
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { updateProfile };
