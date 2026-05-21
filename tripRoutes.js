const express = require('express');
const router = express.Router();
const { createTrip, getMyTrips, getTrip, joinTrip, deleteTrip } = require('../controllers/tripController');
const { protect } = require('../middleware/authMiddleware');

// All routes protected
router.use(protect);

// POST /api/trips        → create trip
// GET  /api/trips        → get my trips
router.route('/').post(createTrip).get(getMyTrips);

// POST /api/trips/join   → join via team code
router.post('/join', joinTrip);

// GET    /api/trips/:id  → get single trip
// DELETE /api/trips/:id  → delete trip
router.route('/:id').get(getTrip).delete(deleteTrip);

module.exports = router;
