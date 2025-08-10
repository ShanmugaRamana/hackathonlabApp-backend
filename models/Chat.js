const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  // Store a reference to the user who sent the message
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
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
