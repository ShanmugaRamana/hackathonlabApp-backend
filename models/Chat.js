const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  text: {
    type: String,
    // Text is no longer required, as a message can be just an image
  },
  // --- NEW FIELD FOR IMAGES ---
  images: {
    type: [String], // An array of image URLs
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