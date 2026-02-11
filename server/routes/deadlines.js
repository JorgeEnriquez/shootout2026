const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

// GET /api/deadlines - Returns all stage deadlines with lock status
router.get('/', async (req, res) => {
  try {
    const db = await getDb();

    const results = db.exec(
      'SELECT deadline_id, stage, deadline_datetime, is_locked FROM deadlines ORDER BY deadline_id ASC'
    );

    if (results.length === 0) {
      return res.json([]);
    }

    const deadlines = results[0].values.map(row => {
      const columns = results[0].columns;
      const deadline = {};
      columns.forEach((col, idx) => {
        deadline[col] = row[idx];
      });
      return deadline;
    });

    res.json(deadlines);
  } catch (error) {
    console.error('Get deadlines error:', error);
    res.status(500).json({ error: 'Failed to fetch deadlines' });
  }
});

module.exports = router;
