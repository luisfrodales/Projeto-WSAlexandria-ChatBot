import mongoose from 'mongoose';

const audioTranscriptionSchema = new mongoose.Schema({
  originalFileName: {
    type: String,
    required: true,
    trim: true
  },
  transcription: {
    type: String,
    required: true,
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
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: false
  },
  filePath: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number, // Duration in seconds
    required: false
  },
  format: {
    type: String,
    trim: true
  },
  size: {
    type: Number // File size in bytes
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'completed', 'error'],
    default: 'uploaded'
  },
  processingError: {
    type: String,
    trim: true
  },
  confidence: {
    type: Number, // Confidence score from transcription service
    min: 0,
    max: 1
  },
  language: {
    type: String,
    trim: true,
    default: 'pt-BR'
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
audioTranscriptionSchema.index({ userId: 1, createdAt: -1 });
audioTranscriptionSchema.index({ guestId: 1, createdAt: -1 });
audioTranscriptionSchema.index({ conversationId: 1 });
audioTranscriptionSchema.index({ status: 1 });
audioTranscriptionSchema.index({ language: 1 });

// Text index for search functionality
audioTranscriptionSchema.index({ transcription: 'text' });

// Method to get transcription info without sensitive data
audioTranscriptionSchema.methods.toPublicJSON = function() {
  const transcription = this.toObject();
  delete transcription.filePath;
  delete transcription.processingError;
  return transcription;
};

// Method to get transcription summary
audioTranscriptionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    originalFileName: this.originalFileName,
    duration: this.duration,
    status: this.status,
    language: this.language,
    createdAt: this.createdAt,
    transcriptionPreview: this.transcription.substring(0, 200) + '...'
  };
};

export default mongoose.model('AudioTranscription', audioTranscriptionSchema); 