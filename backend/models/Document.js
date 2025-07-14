import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  mimeType: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number,
    required: true
  },
  embeddingId: {
    type: String,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Can be null for guest uploads
  },
  guestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest',
    required: false // Can be null for user uploads
  },
  filePath: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'processed', 'error'],
    default: 'uploaded'
  },
  processingError: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
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

// Index for better query performance
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ guestId: 1, createdAt: -1 });
documentSchema.index({ embeddingId: 1 });
documentSchema.index({ status: 1 });

// Method to get document info without sensitive data
documentSchema.methods.toPublicJSON = function() {
  const doc = this.toObject();
  delete doc.filePath;
  delete doc.processingError;
  return doc;
};

export default mongoose.model('Document', documentSchema); 