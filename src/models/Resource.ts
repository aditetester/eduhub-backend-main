import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',  // Changed to ObjectId reference
    required: true
  },
  standard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Standard',  // Changed to ObjectId reference
    required: true
  },
  type: {
    type: String,
    enum: ['PDF', 'VIDEO'],
    required: true
  },
  fileUrl: {
    type: String,
    get: function(fileUrl: string) {
      if (!fileUrl) return null;
      return `http://localhost:3000/uploads/${fileUrl}`;
    }
  },
  videoUrl: {
    type: String,
    required: function(this: IResource) { return this.type === 'VIDEO'; }  // Required only for VIDEO
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: function(this: IResource) { return this.type === 'PDF'; }  // Required only for PDF
  },
  duration: {
    type: String,
    required: function(this: IResource) { return this.type === 'VIDEO'; }  // Required only for VIDEO
  }
}, { 
  timestamps: true,
  toJSON: { getters: true }
});

// Add any methods or virtuals here if needed
resourceSchema.methods.toJSON = function() {
  const resource = this.toObject();
  return {
    ...resource,
    board: resource.board?.name || resource.board,
    standard: resource.standard?.grade || resource.standard,
    subject: resource.subject?.name || resource.subject
  };
};

export interface IResource extends mongoose.Document {
  name: string;
  description: string;
  type: 'PDF' | 'VIDEO';
  subject: mongoose.Types.ObjectId | { _id: string; name: string; };
  board: mongoose.Types.ObjectId | { _id: string; name: string; };
  standard: mongoose.Types.ObjectId | { _id: string; grade: string; };
  fileUrl?: string;
  videoUrl?: string;
  thumbnailUrl: string;
  size?: string;
  duration?: string;
  createdAt: Date;
  updatedAt: Date;
}

const Resource = mongoose.model<IResource>('Resource', resourceSchema);
export default Resource;