import mongoose from "mongoose";
import { addDays } from 'date-fns';

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['SUBJECT', 'STANDARD'],
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  standardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Standard'
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  paymentId: {
    type: String
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: () => addDays(new Date(), 30)
  },
  renewalReminder: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add index for faster queries
subscriptionSchema.index({ userId: 1, subjectId: 1 });
subscriptionSchema.index({ expiryDate: 1 });

// Add validation
subscriptionSchema.pre('save', function(next) {
  if (this.type === 'SUBJECT' && !this.subjectId) {
    next(new Error('Subject ID required for subject subscription'));
  }
  if (this.type === 'STANDARD' && !this.standardId) {
    next(new Error('Standard ID required for standard subscription'));
  }
  next();
});

export default mongoose.model('Subscription', subscriptionSchema); 