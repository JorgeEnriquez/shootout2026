const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

const PRIZE_PER_PERSON = 104;
const PRIZE_DISTRIBUTION = [
  { place: 1, percentage: 0.30 },
  { place: 2, percentage: 0.20 },
  { place: 3, percentage: 0.15 },
  { place: 4, percentage: 0.10 },
  { place: 5, percentage: 0.08 },
  { place: 6, percentage: 0.06 },
  { place: 7, percentage: 0.04 },
  { place: 8, percentage: 0.03 },
  { place: 9, percentage: 0.02 },
  { place: 10, percentage: 0.02 }
];

// GET /api/prize-pool
router.get('/', async (req, res) => {
  try {
    const db = await getDb();

    // Count active participants
    const countResults = db.exec(
      'SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = 1',
      ['participant']
    );

    let participantCount = 0;
    if (countResults.length > 0 && countResults[0].values.length > 0) {
      participantCount = countResults[0].values[0][0];
    }

    const totalJackpot = participantCount * PRIZE_PER_PERSON;

    // Calculate breakdown
    const breakdown = PRIZE_DISTRIBUTION.map(dist => {
      const amount = Math.round(totalJackpot * dist.percentage * 100) / 100;
      return {
        place: dist.place,
        percentage: dist.percentage * 100,
        amount: amount
      };
    });

    res.json({
      participant_count: participantCount,
      total_jackpot: totalJackpot,
      prize_per_person: PRIZE_PER_PERSON,
      breakdown: breakdown
    });
  } catch (error) {
    console.error('Get prize pool error:', error);
    res.status(500).json({ error: 'Failed to fetch prize pool' });
  }
});

module.exports = router;
