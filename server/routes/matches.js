const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

// GET /api/matches
router.get('/', async (req, res) => {
  try {
    const { stage } = req.query;
    const db = await getDb();

    let query = `
      SELECT
        m.match_id,
        m.match_number,
        m.stage,
        m.group_letter,
        m.home_team_id,
        m.away_team_id,
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
      FROM matches m
      LEFT JOIN teams ht ON m.home_team_id = ht.team_id
      LEFT JOIN teams at ON m.away_team_id = at.team_id
    `;

    const params = [];
    if (stage) {
      query += ' WHERE m.stage = ?';
      params.push(stage);
    }

    query += ' ORDER BY m.match_datetime ASC, m.match_id ASC';

    const results = db.exec(query, params);

    if (results.length === 0) {
      return res.json([]);
    }

    const matches = results[0].values.map(row => {
      const columns = results[0].columns;
      const match = {};
      columns.forEach((col, idx) => {
        match[col] = row[idx];
      });
      return match;
    });

    res.json(matches);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// GET /api/matches/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const query = `
      SELECT
        m.match_id,
        m.match_number,
        m.stage,
        m.group_letter,
        m.home_team_id,
        m.away_team_id,
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
      FROM matches m
      LEFT JOIN teams ht ON m.home_team_id = ht.team_id
      LEFT JOIN teams at ON m.away_team_id = at.team_id
      WHERE m.match_id = ?
    `;

    const results = db.exec(query, [id]);

    if (results.length === 0 || results[0].values.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const row = results[0].values[0];
    const columns = results[0].columns;
    const match = {};
    columns.forEach((col, idx) => {
      match[col] = row[idx];
    });

    res.json(match);
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

module.exports = router;
