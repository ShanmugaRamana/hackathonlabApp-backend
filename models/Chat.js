const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  text: {
    type: String,
  },
  images: {
    type: [String],
    default: [],
  },
  // --- NEW FIELD FOR VIDEOS ---
  videos: {
    type: [String],
    default: [],
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
