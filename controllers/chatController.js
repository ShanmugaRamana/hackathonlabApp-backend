const Chat = require('../models/Chat');
const User = require('../models/User');

// Get recent messages with pagination
const getMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const channel = req.query.channel || 'general';
    const skip = (page - 1) * limit;

    const messages = await Chat.find({
      channel,
      'deleted.isDeleted': false
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    // Reverse to show oldest first
    const reversedMessages = messages.reverse();

    res.json({
      success: true,
      data: reversedMessages,
      pagination: {
        page,
        limit,
        total: await Chat.countDocuments({ 
          channel, 
          'deleted.isDeleted': false 
        }),
        hasMore: messages.length === limit
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error' 
    });
  }
};

// Send a new message
const sendMessage = async (req, res) => {
  try {
    const { text, channel = 'general' } = req.body;
    const userId = req.user.id; // From auth middleware

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    if (text.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long. Maximum 1000 characters allowed.'
      });
    }

    // Get user details
    const user = await User.findById(userId).select('name');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create message
    const messageData = {
      text: text.trim(),
      channel,
      user: {
        _id: user._id,
        name: user.name
      }
    };

    const message = new Chat(messageData);
    const savedMessage = await message.save();

    res.status(201).json({
      success: true,
      data: savedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Edit a message
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    if (text.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long. Maximum 1000 characters allowed.'
      });
    }

    const message = await Chat.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user owns the message
    if (!message.user._id.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this message'
      });
    }

    // Check if message is not too old (e.g., 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return res.status(400).json({
        success: false,
        message: 'Message is too old to edit (15 minute limit)'
      });
    }

    await message.editMessage(text.trim());

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Delete a message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Chat.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user owns the message or is admin
    const user = await User.findById(userId);
    const canDelete = message.user._id.equals(userId) || user.role === 'admin';

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    await message.softDelete(userId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Search messages
const searchMessages = async (req, res) => {
  try {
    const { query, channel } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const messages = await Chat.searchMessages(query.trim(), channel);

    res.json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Get user's messages
const getUserMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const messages = await Chat.getMessagesByUser(userId, limit);

    res.json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (error) {
    console.error('Get user messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Mark messages as delivered (for read receipts)
const markAsDelivered = async (req, res) => {
  try {
    const { messageIds } = req.body; // Array of message IDs
    
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs array is required'
      });
    }

    await Chat.updateMany(
      { 
        _id: { $in: messageIds },
        status: 'sent'
      },
      { 
        status: 'delivered'
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as delivered'
    });
  } catch (error) {
    console.error('Mark as delivered error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  searchMessages,
  getUserMessages,
  markAsDelivered
};
