const User = require('../models/User');
const imagekit = require('../config/imagekit'); // Import the ImageKit config

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    console.log('=== Profile Update Debug Info ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      fieldname: req.file.fieldname
    } : 'No file uploaded');
    console.log('User ID:', req.user._id);

    const user = await User.findById(req.user._id);
    
    // If user doesn't exist
    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User found:', user.name);

    // Update basic fields with sanitization
    if (req.body.name) {
      const trimmedName = req.body.name.trim();
      if (trimmedName.length > 0 && trimmedName.length <= 100) {
        user.name = trimmedName;
        console.log('✅ Name updated:', trimmedName);
      } else {
        return res.status(400).json({ message: 'Name must be between 1 and 100 characters' });
      }
    }

    if (req.body.bio) {
      const trimmedBio = req.body.bio.trim();
      if (trimmedBio.length <= 500) {
        user.bio = trimmedBio;
        console.log('✅ Bio updated');
      } else {
        return res.status(400).json({ message: 'Bio must be 500 characters or less' });
      }
    }

    if (req.body.rollNumber) {
      const trimmedRollNumber = req.body.rollNumber.trim();
      if (trimmedRollNumber.length > 0) {
        user.rollNumber = trimmedRollNumber;
        console.log('✅ Roll number updated:', trimmedRollNumber);
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
          console.log('✅ Interested domains updated:', validDomains);
        } else {
          return res.status(400).json({ message: 'Maximum 10 interested domains allowed' });
        }
      }
    }

    // --- Handle profile picture operations ---
    
    // Check if user wants to delete profile picture (empty string sent from frontend)
    if ('profilePicture' in req.body && req.body.profilePicture === '') {
      console.log('🗑️  User requested profile picture deletion');
      
      // Store old profile picture for potential cleanup
      const oldProfilePicture = user.profilePicture;
      
      // Remove profile picture from user
      user.profilePicture = undefined;
      
      console.log('✅ Profile picture removed from user object');
      
      // Optional: Delete from ImageKit (uncomment if you want to clean up old images)
      /*
      if (oldProfilePicture && oldProfilePicture.includes('imagekit.io')) {
        try {
          // Extract fileId from URL or use ImageKit's delete API
          // This requires additional ImageKit configuration
          console.log('🗑️  Would delete old image from ImageKit:', oldProfilePicture);
        } catch (deleteError) {
          console.warn('⚠️  Could not delete old image from ImageKit:', deleteError.message);
        }
      }
      */
    } 
    // Handle new profile picture upload
    else if (req.file) {
      console.log('📸 Processing file upload...');
      console.log('File details:', {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        bufferLength: req.file.buffer ? req.file.buffer.length : 'No buffer'
      });

      try {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          console.log('❌ Invalid file type:', req.file.mimetype);
          return res.status(400).json({ message: 'Only JPEG, PNG, and WebP images are allowed' });
        }

        // Validate file size (e.g., 5MB limit)
        if (req.file.size > 5 * 1024 * 1024) {
          console.log('❌ File too large:', req.file.size);
          return res.status(400).json({ message: 'Image size must be less than 5MB' });
        }

        console.log('✅ File validation passed');
        console.log('🚀 Uploading to ImageKit...');

        // Check ImageKit configuration
        console.log('ImageKit config check:', {
          hasPublicKey: !!imagekit.publicKey,
          hasPrivateKey: !!imagekit.privateKey,
          hasUrlEndpoint: !!imagekit.urlEndpoint
        });

        // Upload to ImageKit
        const response = await imagekit.upload({
          file: req.file.buffer.toString('base64'),
          fileName: `profile-${user._id}-${Date.now()}-${req.file.originalname}`,
          folder: 'hackathon-lab-profiles',
        });

        console.log('✅ ImageKit upload successful:', {
          url: response.url,
          fileId: response.fileId,
          name: response.name
        });

        // Store old profile picture URL for potential cleanup
        const oldProfilePicture = user.profilePicture;
        
        // Update user's profile picture
        user.profilePicture = response.url;
        
        console.log('✅ Profile picture URL updated from:', oldProfilePicture, 'to:', response.url);

      } catch (uploadError) {
        console.error('❌ ImageKit upload failed:', uploadError);
        console.error('Upload error details:', {
          message: uploadError.message,
          stack: uploadError.stack,
          response: uploadError.response?.data
        });
        return res.status(500).json({ 
          message: 'Image upload failed. Please try again.',
          error: process.env.NODE_ENV === 'development' ? uploadError.message : undefined
        });
      }
    } else {
      console.log('ℹ️  No profile picture changes requested');
    }

    console.log('💾 Saving user to database...');
    
    // Save updated user
    const updatedUser = await user.save();
    
    console.log('✅ User saved successfully');
    console.log('Final user data:', {
      _id: updatedUser._id,
      name: updatedUser.name,
      profilePicture: updatedUser.profilePicture
    });

    // Send back updated data (excluding sensitive information)
    const responseData = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      bio: updatedUser.bio,
      rollNumber: updatedUser.rollNumber,
      interestedDomains: updatedUser.interestedDomains,
      profilePicture: updatedUser.profilePicture,
      updatedAt: updatedUser.updatedAt
    };

    console.log('📤 Sending response:', responseData);
    res.json(responseData);

  } catch (error) {
    console.error('❌ Error updating profile:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.log('MongoDB Validation Error:', errors);
      return res.status(400).json({ 
        message: 'Validation Error', 
        errors: errors 
      });
    }

    if (error.code === 11000) {
      console.log('MongoDB Duplicate Key Error:', error);
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