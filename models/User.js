const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  profilePhoto: String,
  currency: String,
  expenseCap:{
    type:Number,
    default:null
  },
  balanceCap:{
    type:Number,
    default:null
  },

  role: {
    type: String,
    default: 'visitor',
  },
  expenseAlert: {
    type: Boolean,
    default: false,
  },
  balanceAlert: {
    type: Boolean,
    default: false,
  },
  isSuspended: {
    type: Boolean,
    default: false,
  },
  suspensionReason: String,

  // Subscription-related fields
  trialEndsAt: Date,
  subscriptionEndsAt: Date,
  subscriptionType: {
    type: String,
    enum: ['trial', 'paid', 'promo'],
    default: 'trial',
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Virtual field to calculate active access based on time
UserSchema.virtual('activeAccess').get(function () {
  const now = new Date();
  const hasTrial = this.trialEndsAt && this.trialEndsAt > now;
  const hasSub = this.subscriptionEndsAt && this.subscriptionEndsAt > now;
  return hasTrial || hasSub;
});

const UserModel = mongoose.model('user', UserSchema);
module.exports = UserModel;
