const express = require('express');
const router = express.Router();
const { getTripMembers, removeMember } = require('../controllers/memberController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// GET /api/members/:tripId                   → get members + balances
router.get('/:tripId', getTripMembers);

// DELETE /api/members/:tripId/:userId        → remove member
router.delete('/:tripId/:userId', removeMember);

module.exports = router;
