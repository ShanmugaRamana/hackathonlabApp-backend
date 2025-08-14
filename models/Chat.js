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
  // --- NEW FIELD FOR MONITORING ---
  originalText: {
    type: String,
    default: null, // Will only be populated if a message is unsent
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
