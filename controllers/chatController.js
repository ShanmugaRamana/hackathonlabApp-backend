// controllers/chatController.js
const Chat = require('../models/Chat');

const getMessages = async (req, res) => {
  try {
    const messages = await Chat.find({}).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getMessages };