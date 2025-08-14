const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  text: {
    type: String,
  },
  images: {
    type: [String],
    default: [],
  },
  videos: {
    type: [String],
    default: [],
  },
  isUnsent: {
    type: Boolean,
    default: false,
  },
  originalText: {
    type: String,
    default: null,
  },
  // --- NEW FIELD FOR REPLIES ---
  replyTo: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
    },
    textSnippet: {
      type: String,
    },
    authorName: {
      type: String,
    },
  },
  user: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
}, {
  timestamps: true,
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
