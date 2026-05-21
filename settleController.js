const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const Trip = require('../models/Trip');

// ── GET /api/settle/:tripId ── Calculate who owes whom
const getSettlements = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate('members.user', 'name email');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const isMember = trip.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });

    const expenses = await Expense.find({ trip: req.params.tripId, status: 'approved' });
    const members = trip.members.map(m => m.user);
    const memberCount = members.length;

    // Calculate net balance for each member
    const balances = {};
    members.forEach(m => { balances[m._id.toString()] = 0; });

    expenses.forEach(exp => {
      const share = exp.amount / memberCount;
      balances[exp.paidBy.toString()] += exp.amount;
      members.forEach(m => { balances[m._id.toString()] -= share; });
    });

    // Already settled amounts
    const settled = await Settlement.find({ trip: req.params.tripId });
    settled.forEach(s => {
      balances[s.fromUser.toString()] += s.amount;
      balances[s.toUser.toString()] -= s.amount;
    });

    // Build who-owes-whom list
    const debts = [];
    const creditors = members.filter(m => balances[m._id.toString()] > 0.5).map(m => ({ ...m.toObject(), balance: balances[m._id.toString()] }));
    const debtors  = members.filter(m => balances[m._id.toString()] < -0.5).map(m => ({ ...m.toObject(), balance: balances[m._id.toString()] }));

    let ci = 0, di = 0;
    while (ci < creditors.length && di < debtors.length) {
      const credit = creditors[ci];
      const debt   = debtors[di];
      const amount = Math.min(credit.balance, Math.abs(debt.balance));
      debts.push({
        from:       debt._id,
        fromName:   debt.name,
        to:         credit._id,
        toName:     credit.name,
        amount:     parseFloat(amount.toFixed(2))
      });
      credit.balance -= amount;
      debt.balance   += amount;
      if (credit.balance < 0.5) ci++;
      if (Math.abs(debt.balance) < 0.5) di++;
    }

    // User-specific summary
    const uid = req.user._id.toString();
    const myBalance = parseFloat((balances[uid] || 0).toFixed(2));
    const iOwe      = debts.filter(d => d.from.toString() === uid);
    const iAmOwed   = debts.filter(d => d.to.toString() === uid);

    res.json({
      success: true,
      myBalance,        // positive = others owe you, negative = you owe
      iOwe,             // list of people you need to pay
      iAmOwed,          // list of people who owe you
      allDebts: debts,  // full picture for admins
      allBalances: members.map(m => ({
        id: m._id,
        name: m.name,
        balance: parseFloat((balances[m._id.toString()] || 0).toFixed(2))
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/settle ── Mark a payment as settled
const markSettled = async (req, res) => {
  try {
    const { tripId, toUserId, amount, note } = req.body;

    if (!tripId || !toUserId || !amount) {
      return res.status(400).json({ success: false, message: 'tripId, toUserId and amount are required' });
    }

    const settlement = await Settlement.create({
      trip:     tripId,
      fromUser: req.user._id,
      toUser:   toUserId,
      amount,
      note:     note || ''
    });

    res.status(201).json({ success: true, message: '✅ Payment marked as settled!', settlement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSettlements, markSettled };
