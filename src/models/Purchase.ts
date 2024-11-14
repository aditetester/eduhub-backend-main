import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  purchaseType: {
    type: String,
    enum: ['STANDARD', 'SUBJECT'],
    required: true
  },
  standard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Standard',
    // Required only if purchasing entire standard
    required: function(this: any) { return this.purchaseType === 'STANDARD'; }
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    // Required only if purchasing single subject
    required: function(this: any) { return this.purchaseType === 'SUBJECT'; }
  },
  amount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  paymentId: String,
  validUntil: {
    type: Date,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Purchase', purchaseSchema);
