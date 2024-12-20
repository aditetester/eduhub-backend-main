import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    default: 'student'
  },
  subscriptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  }]
}, {
  timestamps: true
});

// Add password comparison method
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  try {
    // If using bcrypt
    return await bcrypt.compare(candidatePassword, this.password);
    
    // If storing plain text passwords (not recommended for production)
    // return this.password === candidatePassword;
  } catch (error) {
    return false;
  }
};

export default mongoose.model('User', userSchema);