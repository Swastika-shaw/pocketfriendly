const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Expense name is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Amount must be at least 1']
  },
  category: {
    type: String,
    enum: ['🏨 Hotel', '🍽 Food', '🚗 Transport', '🎡 Activities', '🛒 Shopping', '⛽ Fuel', '💊 Medical', '🎟 Tickets', '🔖 Other'],
    default: '🔖 Other'
  },
  notes: {
    type: String,
    default: ''
  },
  splitType: {
    type: String,
    enum: ['equal', 'custom'],
    default: 'equal'
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Who has approved this expense
  approvals: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: { type: Date, default: Date.now }
    }
  ],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
