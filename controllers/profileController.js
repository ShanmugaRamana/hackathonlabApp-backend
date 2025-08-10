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

    // Update basic fields with sanitization
    if (req.body.name) {
      const trimmedName = req.body.name.trim();
      if (trimmedName.length > 0 && trimmedName.length <= 100) {
        user.name = trimmedName;
      } else {
        return res.status(400).json({ message: 'Name must be between 1 and 100 characters' });
      }
    }

    if (req.body.bio) {
      const trimmedBio = req.body.bio.trim();
      if (trimmedBio.length <= 500) {
        user.bio = trimmedBio;
      } else {
        return res.status(400).json({ message: 'Bio must be 500 characters or less' });
      }
    }

    if (req.body.rollNumber) {
      const trimmedRollNumber = req.body.rollNumber.trim();
      if (trimmedRollNumber.length > 0) {
        user.rollNumber = trimmedRollNumber;
      }
    }

    // --- Handle interestedDomains safely ---
    let interestedDomains = req.body.interestedDomains;
    if (interestedDomains !== undefined) {
      if (typeof interestedDomains === 'string') {
        try {
          // Try JSON first
          if (interestedDomains.trim().startsWith('[')) {
            interestedDomains = JSON.parse(interestedDomains);
          } else {
            // Fallback: comma-separated string
            interestedDomains = interestedDomains.split(',').map(d => d.trim()).filter(d => d.length > 0);
          }
        } catch {
          interestedDomains = interestedDomains.split(',').map(d => d.trim()).filter(d => d.length > 0);
        }
      }
      
      if (Array.isArray(interestedDomains)) {
        // Validate array length and content
        if (interestedDomains.length <= 10) {
          const validDomains = interestedDomains.filter(domain => 
            typeof domain === 'string' && domain.trim().length > 0 && domain.trim().length <= 50
          );
          user.interestedDomains = validDomains;
        } else {
          return res.status(400).json({ message: 'Maximum 10 interested domains allowed' });
        }
      }
    }

    // --- Handle profile picture upload ---
    if (req.file) {
      try {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          return res.status(400).json({ message: 'Only JPEG, PNG, and WebP images are allowed' });
        }

        // Validate file size (e.g., 5MB limit)
        if (req.file.size > 5 * 1024 * 1024) {
          return res.status(400).json({ message: 'Image size must be less than 5MB' });
        }

        // Upload to ImageKit
        const response = await imagekit.upload({
          file: req.file.buffer.toString('base64'),
          fileName: `profile-${user._id}-${Date.now()}-${req.file.originalname}`,
          folder: 'hackathon-lab-profiles',
          transformation: {
            pre: 'w-300,h-300,c-maintain_ratio'
          }
        });

        // Optional: Delete old profile picture from ImageKit
        if (user.profilePicture && user.profilePicture.includes('ik.imagekit.io')) {
          try {
            // Extract fileId from URL - this is a simplified approach
            // You might need to store fileId separately in your database for proper deletion
            const urlParts = user.profilePicture.split('/');
            const fileName = urlParts[urlParts.length - 1];
            // You would need the actual fileId for deletion
            // await imagekit.deleteFile(fileId);
          } catch (deleteError) {
            console.warn('Could not delete old profile picture:', deleteError);
          }
        }

        user.profilePicture = response.url;
      } catch (uploadError) {
        console.error('ImageKit upload failed:', uploadError);
        return res.status(500).json({ 
          message: 'Image upload failed. Please try again.',
          error: process.env.NODE_ENV === 'development' ? uploadError.message : undefined
        });
      }
    }

    // Save updated user
    const updatedUser = await user.save();

    // Send back updated data (excluding sensitive information)
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      bio: updatedUser.bio,
      rollNumber: updatedUser.rollNumber,
      interestedDomains: updatedUser.interestedDomains,
      profilePicture: updatedUser.profilePicture,
      updatedAt: updatedUser.updatedAt
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation Error', 
        errors: errors 
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate field value. Please use a different value.' 
      });
    }

    res.status(500).json({ 
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { updateProfile };