const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Trip name is required'],
    trim: true
  },
  destination: {
    type: String,
    trim: true,
    default: ''
  },
  budget: {
    type: Number,
    default: 0
  },
  teamCode: {
    type: String,
    unique: true,
    uppercase: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      joinedAt: { type: Date, default: Date.now }
    }
  ],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate team code before saving
TripSchema.pre('save', function (next) {
  if (!this.teamCode) {
    const prefix = this.name.replace(/\s+/g, '').toUpperCase().slice(0, 4);
    const suffix = Math.floor(100 + Math.random() * 900);
    this.teamCode = (prefix + suffix).slice(0, 8);
  }
  next();
});

module.exports = mongoose.model('Trip', TripSchema);
