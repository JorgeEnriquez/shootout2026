const express = require('express');
const { getDb, saveDb } = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/predictions
router.post('/', verifyToken, async (req, res) => {
  try {
    const { predictions } = req.body;
    const user_id = req.user.user_id;

    if (!predictions || !Array.isArray(predictions)) {
      return res.status(400).json({ error: 'Predictions array required' });
    }

    const db = await getDb();

    // Check deadlines
    for (const prediction of predictions) {
      const matchResults = db.exec(
        'SELECT stage FROM matches WHERE match_id = ?',
        [prediction.match_id]
      );

      if (matchResults.length === 0 || matchResults[0].values.length === 0) {
        return res.status(404).json({ error: `Match ${prediction.match_id} not found` });
      }

      const stage = matchResults[0].values[0][0];

      const deadlineResults = db.exec(
        'SELECT deadline_datetime, is_locked FROM deadlines WHERE stage = ?',
        [stage]
      );

      if (deadlineResults.length > 0 && deadlineResults[0].values.length > 0) {
        const deadlineRow = deadlineResults[0].values[0];
        const deadline_datetime = deadlineRow[0];
        const is_locked = deadlineRow[1];

        if (is_locked || new Date(deadline_datetime) < new Date()) {
          return res.status(403).json({ error: `Deadline for ${stage} has passed` });
        }
      }
    }

    // Insert predictions
    for (const prediction of predictions) {
      if (typeof prediction.predicted_home_score !== 'number' ||
          typeof prediction.predicted_away_score !== 'number') {
        return res.status(400).json({ error: 'Invalid prediction scores' });
      }

      try {
        db.run(
          `INSERT OR REPLACE INTO predictions (user_id, match_id, predicted_home_score, predicted_away_score)
           VALUES (?, ?, ?, ?)`,
          [user_id, prediction.match_id, prediction.predicted_home_score, prediction.predicted_away_score]
        );
      } catch (error) {
        console.error('Prediction insert error:', error);
        return res.status(500).json({ error: 'Failed to insert prediction' });
      }
    }

    saveDb();

    res.json({ success: true, message: 'Predictions submitted successfully' });
  } catch (error) {
    console.error('Submit predictions error:', error);
    res.status(500).json({ error: 'Failed to submit predictions' });
  }
});

// GET /api/predictions/mine
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const db = await getDb();

    const query = `
      SELECT
        p.prediction_id,
        p.user_id,
        p.match_id,
        p.predicted_home_score,
        p.predicted_away_score,
        p.points_earned,
        p.scoring_type,
        p.submitted_at,
        m.match_number,
        m.stage,
        m.group_letter,
        m.match_datetime,
        m.venue,
        m.home_score,
        m.away_score,
        m.status,
        m.placeholder_home,
        m.placeholder_away,
        ht.name as home_team_name,
        ht.iso_code as home_team_iso,
        ht.flag_emoji as home_team_flag,
        at.name as away_team_name,
        at.iso_code as away_team_iso,
        at.flag_emoji as away_team_flag
      FROM predictions p
      JOIN matches m ON p.match_id = m.match_id
      LEFT JOIN teams ht ON m.home_team_id = ht.team_id
      LEFT JOIN teams at ON m.away_team_id = at.team_id
      WHERE p.user_id = ?
      ORDER BY m.match_datetime ASC
    `;

    const results = db.exec(query, [user_id]);

    if (results.length === 0) {
      return res.json([]);
    }

    const predictions = results[0].values.map(row => {
      const columns = results[0].columns;
      const prediction = {};
      columns.forEach((col, idx) => {
        prediction[col] = row[idx];
      });
      return prediction;
    });

    res.json(predictions);
  } catch (error) {
    console.error('Get my predictions error:', error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

// GET /api/predictions/all
router.get('/all', async (req, res) => {
  try {
    const db = await getDb();

    const query = `
      SELECT
        p.prediction_id,
        p.user_id,
        p.match_id,
        p.predicted_home_score,
        p.predicted_away_score,
        p.points_earned,
        p.scoring_type,
        p.submitted_at,
        u.email,
        u.display_name,
        m.match_number,
        m.stage,
        m.group_letter,
        m.match_datetime,
        m.venue,
        m.home_score,
        m.away_score,
        m.status,
        m.placeholder_home,
        m.placeholder_away,
        ht.name as home_team_name,
        ht.iso_code as home_team_iso,
        ht.flag_emoji as home_team_flag,
        at.name as away_team_name,
        at.iso_code as away_team_iso,
        at.flag_emoji as away_team_flag
      FROM predictions p
      JOIN users u ON p.user_id = u.user_id
      JOIN matches m ON p.match_id = m.match_id
      LEFT JOIN teams ht ON m.home_team_id = ht.team_id
      LEFT JOIN teams at ON m.away_team_id = at.team_id
      ORDER BY u.display_name ASC, m.match_datetime ASC
    `;

    const results = db.exec(query);

    if (results.length === 0) {
      return res.json([]);
    }

    const predictions = results[0].values.map(row => {
      const columns = results[0].columns;
      const prediction = {};
      columns.forEach((col, idx) => {
        prediction[col] = row[idx];
      });
      return prediction;
    });

    res.json(predictions);
  } catch (error) {
    console.error('Get all predictions error:', error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

// GET /api/predictions/user/:userId - Get all predictions for a specific user (public)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await getDb();

    const query = `
      SELECT
        p.prediction_id,
        p.user_id,
        p.match_id,
        p.predicted_home_score,
        p.predicted_away_score,
        p.points_earned,
        p.scoring_type,
        p.submitted_at,
        u.display_name,
        m.match_number,
        m.stage,
        m.group_letter,
        m.match_datetime,
        m.venue,
        m.home_score,
        m.away_score,
        m.status,
        m.placeholder_home,
        m.placeholder_away,
        ht.name as home_team_name,
        ht.iso_code as home_team_iso,
        ht.flag_emoji as home_team_flag,
        at.name as away_team_name,
        at.iso_code as away_team_iso,
        at.flag_emoji as away_team_flag
      FROM predictions p
      JOIN users u ON p.user_id = u.user_id
      JOIN matches m ON p.match_id = m.match_id
      LEFT JOIN teams ht ON m.home_team_id = ht.team_id
      LEFT JOIN teams at ON m.away_team_id = at.team_id
      WHERE p.user_id = ?
      ORDER BY m.match_datetime ASC
    `;

    const results = db.exec(query, [userId]);

    if (results.length === 0) {
      return res.json([]);
    }

    const predictions = results[0].values.map(row => {
      const columns = results[0].columns;
      const prediction = {};
      columns.forEach((col, idx) => {
        prediction[col] = row[idx];
      });
      return prediction;
    });

    res.json(predictions);
  } catch (error) {
    console.error('Get user predictions error:', error);
    res.status(500).json({ error: 'Failed to fetch user predictions' });
  }
});

module.exports = router;
