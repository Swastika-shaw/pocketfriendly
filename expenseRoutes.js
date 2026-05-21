const express = require('express');
const router = express.Router();
const { addExpense, getTripExpenses, approveExpense, rejectExpense, deleteExpense } = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// POST /api/expenses            → add expense
router.post('/', addExpense);

// GET /api/expenses/:tripId     → get all expenses for a trip
router.get('/:tripId', getTripExpenses);

// PUT /api/expenses/:id/approve → approve
router.put('/:id/approve', approveExpense);

// PUT /api/expenses/:id/reject  → reject
router.put('/:id/reject', rejectExpense);

// DELETE /api/expenses/:id      → delete
router.delete('/:id', deleteExpense);

module.exports = router;
