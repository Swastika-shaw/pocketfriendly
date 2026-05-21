const Expense = require('../models/Expense');
const Trip = require('../models/Trip');

// ── POST /api/expenses ── Add expense
const addExpense = async (req, res) => {
  try {
    const { tripId, name, amount, category, notes, splitType } = req.body;

    if (!tripId || !name || !amount) {
      return res.status(400).json({ success: false, message: 'tripId, name and amount are required' });
    }

    // Verify trip exists and user is a member
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const isMember = trip.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member of this trip' });

    // Creator auto-approves their own expense
    const expense = await Expense.create({
      trip: tripId,
      name,
      amount,
      category: category || '🔖 Other',
      notes: notes || '',
      splitType: splitType || 'equal',
      paidBy: req.user._id,
      approvals: [{ user: req.user._id }],
      status: trip.members.length === 1 ? 'approved' : 'pending'
    });

    await expense.populate('paidBy', 'name email');
    await expense.populate('approvals.user', 'name email');

    res.status(201).json({ success: true, message: 'Expense added! Awaiting group approval.', expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/expenses/:tripId ── Get all expenses for a trip
const getTripExpenses = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const isMember = trip.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });

    const expenses = await Expense.find({ trip: req.params.tripId })
      .populate('paidBy', 'name email')
      .populate('approvals.user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: expenses.length, expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/expenses/:id/approve ── Approve expense
const approveExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    if (expense.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Expense is already ${expense.status}` });
    }

    // Already approved by this user?
    const alreadyApproved = expense.approvals.some(a => a.user.toString() === req.user._id.toString());
    if (alreadyApproved) {
      return res.status(400).json({ success: false, message: 'You already approved this expense' });
    }

    expense.approvals.push({ user: req.user._id });

    // Check if all members approved
    const trip = await Trip.findById(expense.trip);
    if (expense.approvals.length >= trip.members.length) {
      expense.status = 'approved';
    }

    await expense.save();
    await expense.populate('paidBy', 'name email');
    await expense.populate('approvals.user', 'name email');

    res.json({ success: true, message: expense.status === 'approved' ? '✅ Expense fully approved!' : '✅ Your approval recorded.', expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/expenses/:id/reject ── Reject expense
const rejectExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    if (expense.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Expense is already ${expense.status}` });
    }

    expense.status = 'rejected';
    await expense.save();

    res.json({ success: true, message: 'Expense rejected.', expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/expenses/:id ── Delete expense (payer only)
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    if (expense.paidBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the payer can delete this expense' });
    }

    await expense.deleteOne();
    res.json({ success: true, message: 'Expense deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { addExpense, getTripExpenses, approveExpense, rejectExpense, deleteExpense };
