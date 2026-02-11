const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

// GET /api/leaderboard
router.get('/', async (req, res) => {
  try {
    const db = await getDb();

    const query = `
      SELECT
        u.user_id,
        u.display_name,
        u.email,
        COALESCE(SUM(p.points_earned), 0) as total_points,
        COALESCE(SUM(CASE WHEN p.scoring_type = 'exact' THEN 1 ELSE 0 END), 0) as exact_count,
        COALESCE(SUM(CASE WHEN p.scoring_type = 'correct' THEN 1 ELSE 0 END), 0) as correct_count
      FROM users u
      LEFT JOIN predictions p ON u.user_id = p.user_id
      WHERE u.role = 'participant' AND u.is_active = 1
      GROUP BY u.user_id
      ORDER BY total_points DESC, exact_count DESC, correct_count DESC, u.display_name ASC
    `;

    const results = db.exec(query);

    if (results.length === 0) {
      return res.json([]);
    }

    // Build entries first
    const entries = results[0].values.map((row) => {
      const columns = results[0].columns;
      const entry = {};
      columns.forEach((col, idx) => {
        entry[col] = row[idx];
      });
      return entry;
    });

    // Assign ranks with tie handling:
    // Same total_points = same rank; next rank skips accordingly
    let currentRank = 1;
    const leaderboard = entries.map((entry, index) => {
      if (index > 0 && entry.total_points < entries[index - 1].total_points) {
        currentRank = index + 1;
      }
      entry.rank = currentRank;
      return entry;
    });

    res.json(leaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
