const User = require('../models/User');
const imagekit = require('../config/imagekit'); // Import the new ImageKit config

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.bio = req.body.bio || user.bio;
      user.rollNumber = req.body.rollNumber || user.rollNumber;
      // The domains are sent as a JSON string from FormData, so we need to parse them
      user.interestedDomains = req.body.interestedDomains ? JSON.parse(req.body.interestedDomains) : user.interestedDomains;

      // If a new file was uploaded by multer, its buffer will be in req.file
      if (req.file) {
        // Upload the file buffer to ImageKit
        const response = await imagekit.upload({
          file: req.file.buffer, // required: The file buffer
          fileName: req.file.originalname, // required: The original file name
          folder: 'hackathon-lab-profiles', // A folder name in your ImageKit account
        });
        // Save the URL returned by ImageKit to the user's profile
        user.profilePicture = response.url;
      }

      const updatedUser = await user.save();

      // Send back the full, updated user object
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
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { updateProfile };
