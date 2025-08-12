const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  // Message content
  text: {
    type: String,
    required: [true, 'Message text is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
    minlength: [1, 'Message cannot be empty']
  },

  // Message type (text, image, file, system, etc.)
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system', 'announcement'],
    default: 'text'
  },

  // User information
  user: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true
    },
    avatar: {
      type: String, // URL to user's profile picture
      default: null
    }
  },

  // Message status and delivery
  status: {
    type: String,
    enum: ['sent', 'delivered', 'failed'],
    default: 'sent'
  },

  // Read receipts
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],

  // For reply functionality
  replyTo: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      default: null
    },
    text: {
      type: String, // Preview of the original message
      maxlength: 200
    },
    userName: {
      type: String
    }
  },

  // For file/image messages
  media: {
    url: {
      type: String, // URL to the media file
      default: null
    },
    filename: {
      type: String,
      default: null
    },
    fileSize: {
      type: Number, // Size in bytes
      default: null
    },
    mimeType: {
      type: String,
      default: null
    },
    thumbnail: {
      type: String, // URL to thumbnail for images/videos
      default: null
    }
  },

  // Message reactions (emojis)
  reactions: [{
    emoji: {
      type: String,
      required: true
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    count: {
      type: Number,
      default: 0
    }
  }],

  // For system messages or announcements
  systemMessage: {
    type: {
      type: String,
      enum: ['user_joined', 'user_left', 'room_created', 'user_promoted', 'user_demoted'],
      default: null
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // Flexible data for system messages
      default: null
    }
  },

  // Message editing
  edited: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    },
    editHistory: [{
      text: String,
      editedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Soft delete
  deleted: {
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },

  // For threading/channels (if you want different chat rooms)
  channel: {
    type: String,
    default: 'general', // Default channel
    index: true // Index for better query performance
  },

  // Message priority (for important announcements)
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  // Mention handling
  mentions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    startIndex: Number, // Position in text where mention starts
    endIndex: Number    // Position in text where mention ends
  }],

  // IP address for moderation purposes
  ipAddress: {
    type: String,
    default: null
  },

  // User agent for analytics
  userAgent: {
    type: String,
    default: null
  }

}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  
  // Add indexes for better performance
  indexes: [
    { createdAt: -1 }, // For chronological sorting
    { 'user._id': 1 }, // For user-specific queries
    { channel: 1, createdAt: -1 }, // For channel-specific queries
    { 'deleted.isDeleted': 1 } // For filtering deleted messages
  ]
});

// Virtual for getting reply count (if implementing threading)
chatSchema.virtual('replyCount', {
  ref: 'Chat',
  localField: '_id',
  foreignField: 'replyTo.messageId',
  count: true
});

// Pre-save middleware
chatSchema.pre('save', function(next) {
  // Ensure text is properly sanitized
  if (this.text) {
    this.text = this.text.trim();
  }
  
  // Set status based on conditions
  if (this.isNew) {
    this.status = 'sent';
  }
  
  next();
});

// Instance methods
chatSchema.methods.addReaction = function(emoji, userId) {
  const existingReaction = this.reactions.find(r => r.emoji === emoji);
  
  if (existingReaction) {
    // Add user to existing reaction if not already present
    if (!existingReaction.users.includes(userId)) {
      existingReaction.users.push(userId);
      existingReaction.count = existingReaction.users.length;
    }
  } else {
    // Create new reaction
    this.reactions.push({
      emoji,
      users: [userId],
      count: 1
    });
  }
  
  return this.save();
};

chatSchema.methods.removeReaction = function(emoji, userId) {
  const reactionIndex = this.reactions.findIndex(r => r.emoji === emoji);
  
  if (reactionIndex > -1) {
    const reaction = this.reactions[reactionIndex];
    reaction.users = reaction.users.filter(id => !id.equals(userId));
    reaction.count = reaction.users.length;
    
    // Remove reaction if no users left
    if (reaction.count === 0) {
      this.reactions.splice(reactionIndex, 1);
    }
  }
  
  return this.save();
};

chatSchema.methods.markAsRead = function(userId) {
  // Check if user already read this message
  const alreadyRead = this.readBy.some(read => read.user.equals(userId));
  
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
  }
  
  return this.save();
};

chatSchema.methods.editMessage = function(newText, editedBy) {
  // Save current text to edit history
  if (!this.edited.isEdited) {
    this.edited.editHistory.push({
      text: this.text,
      editedAt: this.updatedAt || this.createdAt
    });
  }
  
  // Update message
  this.text = newText;
  this.edited.isEdited = true;
  this.edited.editedAt = new Date();
  
  return this.save();
};

chatSchema.methods.softDelete = function(deletedBy) {
  this.deleted.isDeleted = true;
  this.deleted.deletedAt = new Date();
  this.deleted.deletedBy = deletedBy;
  
  return this.save();
};

// Static methods
chatSchema.statics.getRecentMessages = function(channel = 'general', limit = 50) {
  return this.find({
    channel,
    'deleted.isDeleted': false
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('user._id', 'name avatar')
  .populate('replyTo.messageId', 'text user')
  .lean(); // Use lean() for better performance when you don't need full documents
};

chatSchema.statics.getMessagesByUser = function(userId, limit = 100) {
  return this.find({
    'user._id': userId,
    'deleted.isDeleted': false
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .lean();
};

chatSchema.statics.searchMessages = function(query, channel = null) {
  const searchFilter = {
    $text: { $search: query },
    'deleted.isDeleted': false
  };
  
  if (channel) {
    searchFilter.channel = channel;
  }
  
  return this.find(searchFilter, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .populate('user._id', 'name avatar')
    .lean();
};

// Text index for search functionality
chatSchema.index({ 
  text: 'text', 
  'user.name': 'text' 
}, {
  weights: {
    text: 10,
    'user.name': 5
  }
});

// JSON transform to clean up output
chatSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    // Remove sensitive fields from output
    delete ret.ipAddress;
    delete ret.userAgent;
    delete ret.__v;
    
    // Hide deleted messages content
    if (ret.deleted && ret.deleted.isDeleted) {
      ret.text = '[Message deleted]';
      delete ret.media;
    }
    
    return ret;
  }
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;