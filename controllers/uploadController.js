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

// Handles video uploads
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
        resourceType: 'video',
      })
    );
    const results = await Promise.all(uploadPromises);
    const videoUrls = results.map(result => result.url);
    res.status(200).json({ videoUrls });
  } catch (error) {
    res.status(500).json({ message: 'Server error during file upload.' });
  }
};

const uploadChatDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }
    const uploadPromises = req.files.map(file => 
      imagekit.upload({
        file: file.buffer,
        fileName: file.originalname,
        folder: 'hackathon-lab-chat/documents',
        resourceType: 'raw', // Use 'raw' for generic files
      })
    );
    const results = await Promise.all(uploadPromises);
    // Return both the URL and the original name
    const documentData = results.map((result, index) => ({
      url: result.url,
      name: req.files[index].originalname,
    }));
    res.status(200).json({ documents: documentData });
  } catch (error) {
    res.status(500).json({ message: 'Server error during file upload.' });
  }
};

module.exports = { uploadChatImages, uploadChatVideos, uploadChatDocuments };
