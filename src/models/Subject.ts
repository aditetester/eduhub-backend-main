import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  standard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Standard',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: false
  },
  resources: [{
    id: String,
    name: String,
    content: String,
    description: String,
    // ... other resource fields
  }]
}, { timestamps: true });

export default mongoose.model('Subject', subjectSchema);
