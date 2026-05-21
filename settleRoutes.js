const express = require('express');
const router = express.Router();
const { getSettlements, markSettled } = require('../controllers/settleController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// GET  /api/settle/:tripId  → calculate who owes whom
router.get('/:tripId', getSettlements);

// POST /api/settle          → mark a payment settled
router.post('/', markSettled);

module.exports = router;
