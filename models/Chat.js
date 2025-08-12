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
  // --- NEW FIELD FOR AUDIO ---
  audios: {
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
