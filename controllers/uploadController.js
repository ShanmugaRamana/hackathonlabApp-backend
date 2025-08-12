const imagekit = require('../config/imagekit');

// @desc    Upload images for chat
// @route   POST /api/upload/chat-images
// @access  Private
const uploadChatImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    const uploadPromises = req.files.map(file => 
      imagekit.upload({
        file: file.buffer,
        fileName: file.originalname,
        folder: 'hackathon-lab-chat',
      })
    );

    const results = await Promise.all(uploadPromises);
    const imageUrls = results.map(result => result.url);

    res.status(200).json({ imageUrls });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Server error during file upload.' });
  }
};

module.exports = { uploadChatImages };