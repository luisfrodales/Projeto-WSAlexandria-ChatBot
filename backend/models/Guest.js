import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const guestSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4()
  },
  token: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4()
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
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

// Update lastActivity on save
guestSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

// Method to check if session is expired (24 hours)
guestSchema.methods.isExpired = function() {
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return Date.now() - this.lastActivity.getTime() > twentyFourHours;
};

// Method to refresh session
guestSchema.methods.refreshSession = function() {
  this.lastActivity = new Date();
  return this.save();
};

export default mongoose.model('Guest', guestSchema); 