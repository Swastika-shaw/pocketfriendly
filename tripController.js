const Trip = require('../models/Trip');

// ── POST /api/trips ── Create a new trip
const createTrip = async (req, res) => {
  try {
    const { name, destination, budget } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Trip name is required' });
    }

    const trip = await Trip.create({
      name,
      destination,
      budget: budget || 0,
      createdBy: req.user._id,
      members: [{ user: req.user._id }]
    });

    await trip.populate('members.user', 'name email');

    res.status(201).json({ success: true, message: 'Trip created!', trip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/trips ── Get all trips for logged-in user
const getMyTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ 'members.user': req.user._id })
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: trips.length, trips });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/trips/:id ── Get single trip
const getTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Check if user is a member
    const isMember = trip.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied. Not a member.' });
    }

    res.json({ success: true, trip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/trips/join ── Join trip via team code
const joinTrip = async (req, res) => {
  try {
    const { teamCode } = req.body;

    if (!teamCode) {
      return res.status(400).json({ success: false, message: 'Team code is required' });
    }

    const trip = await Trip.findOne({ teamCode: teamCode.toUpperCase() });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Invalid team code. Trip not found.' });
    }

    // Already a member?
    const alreadyMember = trip.members.some(m => m.user.toString() === req.user._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this trip.' });
    }

    trip.members.push({ user: req.user._id });
    await trip.save();
    await trip.populate('members.user', 'name email');

    res.json({ success: true, message: `Joined "${trip.name}" successfully!`, trip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/trips/:id ── Delete trip (creator only)
const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    if (trip.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the creator can delete this trip.' });
    }

    await trip.deleteOne();
    res.json({ success: true, message: 'Trip deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createTrip, getMyTrips, getTrip, joinTrip, deleteTrip };
