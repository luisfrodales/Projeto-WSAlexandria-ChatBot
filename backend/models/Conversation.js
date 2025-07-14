import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const conversationSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Can be null for guest conversations
  },
  guestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest',
    required: false // Can be null for user conversations
  },
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
conversationSchema.index({ userId: 1, lastMessageAt: -1 });
conversationSchema.index({ guestId: 1, lastMessageAt: -1 });
conversationSchema.index({ isActive: 1 });

// Method to add a message to the conversation
conversationSchema.methods.addMessage = function(role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    metadata,
    timestamp: new Date()
  });
  this.lastMessageAt = new Date();
  return this.save();
};

// Method to get conversation summary
conversationSchema.methods.getSummary = function() {
  const summary = {
    id: this._id,
    title: this.title,
    messageCount: this.messages.length,
    lastMessageAt: this.lastMessageAt,
    createdAt: this.createdAt
  };
  
  if (this.messages.length > 0) {
    summary.lastMessage = this.messages[this.messages.length - 1].content.substring(0, 100);
  }
  
  return summary;
};

// Method to get recent messages (last N messages)
conversationSchema.methods.getRecentMessages = function(limit = 50) {
  return this.messages.slice(-limit);
};

export default mongoose.model('Conversation', conversationSchema); 