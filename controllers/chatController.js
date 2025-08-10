const Chat = require('../models/Chat');

// @desc    Get all chat messages
// @route   GET /api/chat/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    // Find all messages and sort them by creation date (oldest first)
    const messages = await Chat.find({}).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getMessages };