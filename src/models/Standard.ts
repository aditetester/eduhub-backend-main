import mongoose from 'mongoose';

const standardSchema = new mongoose.Schema({
  grade: {
    type: String,
    required: true
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
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
  }
}, { timestamps: true });

export default mongoose.model('Standard', standardSchema);
