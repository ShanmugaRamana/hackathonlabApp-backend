const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  // Message content
  text: {
    type: String,
    required: [true, 'Message text is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
    minlength: [1, 'Message cannot be empty']
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
    }
  },

  // Message status for delivery confirmation
  status: {
    type: String,
    enum: ['sent', 'delivered', 'failed'],
    default: 'sent'
  },

  // For different chat rooms/channels (optional)
  channel: {
    type: String,
    default: 'general',
    index: true
  },

  // Soft delete for message management
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

  // Message editing capability
  edited: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    },
    originalText: {
      type: String,
      default: null
    }
  }

}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// Indexes for better performance
chatSchema.index({ createdAt: -1 }); // For chronological sorting
chatSchema.index({ 'user._id': 1 }); // For user-specific queries
chatSchema.index({ channel: 1, createdAt: -1 }); // For channel-specific queries
chatSchema.index({ 'deleted.isDeleted': 1 }); // For filtering deleted messages

// Pre-save middleware
chatSchema.pre('save', function(next) {
  // Ensure text is properly sanitized
  if (this.text) {
    this.text = this.text.trim();
  }
  
  // Set status for new messages
  if (this.isNew) {
    this.status = 'sent';
  }
  
  next();
});

// Instance methods
chatSchema.methods.editMessage = function(newText) {
  // Save original text if first edit
  if (!this.edited.isEdited) {
    this.edited.originalText = this.text;
  }
  
  // Update message
  this.text = newText.trim();
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

chatSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  return this.save();
};

// Static methods for common queries
chatSchema.statics.getRecentMessages = function(channel = 'general', limit = 50) {
  return this.find({
    channel,
    'deleted.isDeleted': false
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .lean();
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
    text: { $regex: query, $options: 'i' }, // Case-insensitive search
    'deleted.isDeleted': false
  };
  
  if (channel) {
    searchFilter.channel = channel;
  }
  
  return this.find(searchFilter)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
};

// JSON transform to clean up output
chatSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret.__v;
    
    // Hide deleted messages content
    if (ret.deleted && ret.deleted.isDeleted) {
      ret.text = '[Message deleted]';
    }
    
    // Show edit indicator
    if (ret.edited && ret.edited.isEdited) {
      ret.isEdited = true;
    }
    
    return ret;
  }
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
