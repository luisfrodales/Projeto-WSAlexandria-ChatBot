import mongoose from 'mongoose';

const vectorRefSchema = new mongoose.Schema({
  vectorId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  provider: {
    type: String,
    enum: ['pinecone', 'weaviate', 'openai', 'custom'],
    required: true
  },
  namespace: {
    type: String,
    trim: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: false
  },
  transcriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AudioTranscription',
    required: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  guestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest',
    required: false
  },
  embeddingModel: {
    type: String,
    trim: true,
    required: true
  },
  dimensions: {
    type: Number,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
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

// Index for better query performance
vectorRefSchema.index({ vectorId: 1 });
vectorRefSchema.index({ provider: 1 });
vectorRefSchema.index({ namespace: 1 });
vectorRefSchema.index({ documentId: 1 });
vectorRefSchema.index({ transcriptionId: 1 });
vectorRefSchema.index({ userId: 1 });
vectorRefSchema.index({ guestId: 1 });
vectorRefSchema.index({ isActive: 1 });

// Method to get vector reference info
vectorRefSchema.methods.toPublicJSON = function() {
  const vectorRef = this.toObject();
  return {
    id: vectorRef._id,
    vectorId: vectorRef.vectorId,
    provider: vectorRef.provider,
    namespace: vectorRef.namespace,
    embeddingModel: vectorRef.embeddingModel,
    dimensions: vectorRef.dimensions,
    metadata: vectorRef.metadata,
    tags: vectorRef.tags,
    isActive: vectorRef.isActive,
    lastUpdated: vectorRef.lastUpdated,
    createdAt: vectorRef.createdAt
  };
};

// Method to update last updated timestamp
vectorRefSchema.methods.updateLastUpdated = function() {
  this.lastUpdated = new Date();
  return this.save();
};

// Method to deactivate vector reference
vectorRefSchema.methods.deactivate = function() {
  this.isActive = false;
  this.lastUpdated = new Date();
  return this.save();
};

export default mongoose.model('VectorRef', vectorRefSchema); 