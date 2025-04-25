// models/Transaction.js

const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', // 👈 match the name used in your User model registration
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  mpesaReceiptNumber: String,
  transactionDate: {
    type: Date,
    default: Date.now
  },
  description: String
}, {
  timestamps: true
});

const Transaction = mongoose.model('Transaction', TransactionSchema);
module.exports = Transaction;
