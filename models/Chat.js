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
  // --- REPLY FUNCTIONALITY ---
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
    mediaType: { 
      type: String, 
      enum: ['image', 'video'] 
    },
    mediaThumbnail: { 
      type: String 
    }, // URL to the first image/video
    mediaCount: {
      type: Number,
      default: 0
    } // Number of media items in the original message
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
    profilePicture: {
      type: String,
    },
  },
}, {
  timestamps: true,
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;