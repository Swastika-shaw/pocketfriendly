const Trip = require('../models/Trip');
const Expense = require('../models/Expense');

// ── GET /api/members/:tripId ── Get all members with balances
const getTripMembers = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId)
      .populate('members.user', 'name email');

    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const isMember = trip.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });

    // Get approved expenses
    const expenses = await Expense.find({ trip: req.params.tripId, status: 'approved' });
    const memberCount = trip.members.length;
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const equalShare = memberCount > 0 ? totalSpent / memberCount : 0;

    // Calculate each member's balance
    const members = trip.members.map(m => {
      const uid = m.user._id.toString();
      const paid = expenses.filter(e => e.paidBy.toString() === uid).reduce((s, e) => s + e.amount, 0);
      const balance = paid - equalShare;
      return {
        id: m.user._id,
        name: m.user.name,
        email: m.user.email,
        joinedAt: m.joinedAt,
        isCreator: trip.createdBy.toString() === uid,
        totalPaid: paid,
        share: equalShare,
        balance: parseFloat(balance.toFixed(2))  // positive = to receive, negative = to pay
      };
    });

    res.json({
      success: true,
      teamCode: trip.teamCode,
      totalSpent,
      equalShare: parseFloat(equalShare.toFixed(2)),
      members
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/members/:tripId/:userId ── Remove member (creator only)
const removeMember = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    if (trip.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the creator can remove members' });
    }

    if (req.params.userId === trip.createdBy.toString()) {
      return res.status(400).json({ success: false, message: 'Creator cannot be removed' });
    }

    trip.members = trip.members.filter(m => m.user.toString() !== req.params.userId);
    await trip.save();

    res.json({ success: true, message: 'Member removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTripMembers, removeMember };
