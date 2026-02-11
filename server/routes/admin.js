const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb, saveDb } = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const POINT_VALUES = {
  'Group Stage': { correct: 1, exact: 3 },
  'Round of 32': { correct: 2, exact: 5 },
  'Round of 16': { correct: 3, exact: 7 },
  'Quarterfinals': { correct: 4, exact: 9 },
  'Semifinals': { correct: 6, exact: 11 },
  'Third Place': { correct: 6, exact: 11 },
  'Final': { correct: 10, exact: 20 }
};

// POST /api/admin/users
router.post('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const db = await getDb();

    try {
      db.run(
        'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
        [email, passwordHash, 'participant']
      );
      saveDb();

      res.json({ success: true, message: 'User created successfully' });
    } catch (error) {
      return res.status(400).json({ error: 'User already exists' });
    }
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /api/admin/users
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();

    const query = `
      SELECT
        user_id,
        email,
        display_name,
        role,
        is_active,
        first_login_complete,
        created_at
      FROM users
      ORDER BY created_at DESC
    `;

    const results = db.exec(query);

    if (results.length === 0) {
      return res.json([]);
    }

    const users = results[0].values.map(row => {
      const columns = results[0].columns;
      const user = {};
      columns.forEach((col, idx) => {
        user[col] = row[idx];
      });
      return user;
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, is_active, display_name } = req.body;

    const db = await getDb();

    const updates = [];
    const values = [];

    if (role !== undefined) {
      if (!['admin', 'participant'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      updates.push('role = ?');
      values.push(role);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (display_name !== undefined) {
      updates.push('display_name = ?');
      values.push(display_name);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`;
    db.run(query, values);
    saveDb();

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// POST /api/admin/matches/:id/result
router.post('/matches/:id/result', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { home_score, away_score } = req.body;

    if (typeof home_score !== 'number' || typeof away_score !== 'number') {
      return res.status(400).json({ error: 'Scores must be numbers' });
    }

    const db = await getDb();

    // Get match details
    const matchResults = db.exec(
      'SELECT stage FROM matches WHERE match_id = ?',
      [id]
    );

    if (matchResults.length === 0 || matchResults[0].values.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const stage = matchResults[0].values[0][0];

    // Update match
    db.run(
      'UPDATE matches SET home_score = ?, away_score = ?, status = ? WHERE match_id = ?',
      [home_score, away_score, 'completed', id]
    );

    // Calculate points for all predictions on this match
    calculateMatchPoints(db, id, home_score, away_score, stage);
    saveDb();

    res.json({ success: true, message: 'Match result recorded and scores calculated' });
  } catch (error) {
    console.error('Record match result error:', error);
    res.status(500).json({ error: 'Failed to record match result' });
  }
});

// POST /api/admin/scores/recalculate
router.post('/scores/recalculate', verifyToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();

    // Get all completed matches
    const matchResults = db.exec(
      'SELECT match_id, stage, home_score, away_score FROM matches WHERE status = ? AND home_score IS NOT NULL',
      ['completed']
    );

    if (matchResults.length > 0) {
      matchResults[0].values.forEach(row => {
        const match_id = row[0];
        const stage = row[1];
        const home_score = row[2];
        const away_score = row[3];

        calculateMatchPoints(db, match_id, home_score, away_score, stage);
      });
    }

    saveDb();
    res.json({ success: true, message: 'All scores recalculated' });
  } catch (error) {
    console.error('Recalculate scores error:', error);
    res.status(500).json({ error: 'Failed to recalculate scores' });
  }
});

// PUT /api/admin/deadlines/:stage
router.put('/deadlines/:stage', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { stage } = req.params;
    const { deadline_datetime, is_locked } = req.body;

    const db = await getDb();

    const updates = [];
    const values = [];

    if (deadline_datetime !== undefined) {
      updates.push('deadline_datetime = ?');
      values.push(deadline_datetime);
    }

    if (is_locked !== undefined) {
      updates.push('is_locked = ?');
      values.push(is_locked ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(stage);
    const query = `UPDATE deadlines SET ${updates.join(', ')} WHERE stage = ?`;

    try {
      db.run(query, values);
    } catch (error) {
      return res.status(404).json({ error: 'Deadline not found' });
    }

    saveDb();
    res.json({ success: true, message: 'Deadline updated successfully' });
  } catch (error) {
    console.error('Update deadline error:', error);
    res.status(500).json({ error: 'Failed to update deadline' });
  }
});

// Helper function to calculate points for a match
function calculateMatchPoints(db, matchId, actualHome, actualAway, stage) {
  const pointValues = POINT_VALUES[stage] || { correct: 1, exact: 3 };

  // Get all predictions for this match
  const predResults = db.exec(
    'SELECT prediction_id, predicted_home_score, predicted_away_score FROM predictions WHERE match_id = ?',
    [matchId]
  );

  if (predResults.length === 0) {
    return;
  }

  predResults[0].values.forEach(row => {
    const prediction_id = row[0];
    const predicted_home = row[1];
    const predicted_away = row[2];

    let points = 0;
    let scoring_type = 'none';

    // Check for exact score
    if (predicted_home === actualHome && predicted_away === actualAway) {
      points = pointValues.exact;
      scoring_type = 'exact';
    } else {
      // Check for correct outcome
      const actualOutcome = actualHome > actualAway ? 'home' : actualHome < actualAway ? 'away' : 'draw';
      const predictedOutcome = predicted_home > predicted_away ? 'home' : predicted_home < predicted_away ? 'away' : 'draw';

      if (actualOutcome === predictedOutcome) {
        points = pointValues.correct;
        scoring_type = 'correct';
      }
    }

    // Update prediction with points
    db.run(
      'UPDATE predictions SET points_earned = ?, scoring_type = ? WHERE prediction_id = ?',
      [points, scoring_type, prediction_id]
    );
  });
}

module.exports = router;
