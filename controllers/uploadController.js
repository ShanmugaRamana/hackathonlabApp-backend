const imagekit = require('../config/imagekit');

// Handles image uploads
const uploadChatImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }
    const uploadPromises = req.files.map(file => 
      imagekit.upload({
        file: file.buffer,
        fileName: file.originalname,
        folder: 'hackathon-lab-chat/images',
      })
    );
    const results = await Promise.all(uploadPromises);
    const imageUrls = results.map(result => result.url);
    res.status(200).json({ imageUrls });
  } catch (error) {
    res.status(500).json({ message: 'Server error during file upload.' });
  }
};

// --- NEW FUNCTION FOR VIDEO UPLOADS ---
const uploadChatVideos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }
    const uploadPromises = req.files.map(file => 
      imagekit.upload({
        file: file.buffer,
        fileName: file.originalname,
        folder: 'hackathon-lab-chat/videos',
        resourceType: 'video', // Specify resource type for videos
      })
    );
    const results = await Promise.all(uploadPromises);
    const videoUrls = results.map(result => result.url);
    res.status(200).json({ videoUrls });
  } catch (error) {
    res.status(500).json({ message: 'Server error during file upload.' });
  }
};

module.exports = { uploadChatImages, uploadChatVideos };
