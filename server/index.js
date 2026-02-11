const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const matchesRoutes = require('./routes/matches');
const predictionsRoutes = require('./routes/predictions');
const leaderboardRoutes = require('./routes/leaderboard');
const prizePoolRoutes = require('./routes/prizepool');
const adminRoutes = require('./routes/admin');
const deadlinesRoutes = require('./routes/deadlines');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware — CORS
// In production, frontend is served from the same origin (Express serves client/dist/),
// so CORS isn't strictly needed. Allow it broadly for flexibility.
const isProduction = process.env.NODE_ENV === 'production';
app.use(cors({
  origin: isProduction
    ? true  // Allow all origins in production (same-origin anyway)
    : 'http://localhost:5173',  // Vite dev server in development
  credentials: true
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/prize-pool', prizePoolRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/deadlines', deadlinesRoutes);

// Health / diagnostic endpoint (temporary — remove after deployment is verified)
app.get('/api/health', async (req, res) => {
  try {
    const { getDb: hGetDb } = require('./db');
    const db = await hGetDb();
    const users = db.exec('SELECT COUNT(*) FROM users');
    const teams = db.exec('SELECT COUNT(*) FROM teams');
    const matches = db.exec('SELECT COUNT(*) FROM matches');
    const deadlines = db.exec('SELECT COUNT(*) FROM deadlines');
    const adminCheck = db.exec("SELECT user_id, email, role FROM users WHERE role = 'admin'");
    res.json({
      db_path: process.env.DATABASE_PATH || 'default (server/pool.db)',
      users: users[0]?.values[0][0] || 0,
      teams: teams[0]?.values[0][0] || 0,
      matches: matches[0]?.values[0][0] || 0,
      deadlines: deadlines[0]?.values[0][0] || 0,
      admin: adminCheck[0]?.values || 'none',
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Serve static files from client dist folder
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// SPA fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Auto-seed test tournament on first start if database is empty
const { getDb, saveDb } = require('./db');
const bcrypt = require('bcryptjs');

async function autoSeedIfEmpty() {
  try {
    const db = await getDb();
    const result = db.exec('SELECT COUNT(*) FROM users');
    const userCount = result.length > 0 ? result[0].values[0][0] : 0;

    if (userCount > 0) return; // DB already has data

    console.log('Empty database detected — auto-seeding test tournament...');

    // Admin user
    const adminHash = await bcrypt.hash('admin123', 10);
    db.run(
      `INSERT INTO users (email, password_hash, display_name, role, first_login_complete)
       VALUES (?, ?, ?, 'admin', 1)`,
      ['admin@shootout.com', adminHash, 'El Comisionado']
    );

    // Teams
    const teams = [
      { name: 'Brazil',    iso: 'BRA', group: 'A', flag: '\u{1F1E7}\u{1F1F7}' },
      { name: 'Argentina', iso: 'ARG', group: 'A', flag: '\u{1F1E6}\u{1F1F7}' },
      { name: 'France',    iso: 'FRA', group: 'A', flag: '\u{1F1EB}\u{1F1F7}' },
      { name: 'Canada',    iso: 'CAN', group: 'A', flag: '\u{1F1E8}\u{1F1E6}' },
      { name: 'Spain',     iso: 'ESP', group: 'B', flag: '\u{1F1EA}\u{1F1F8}' },
      { name: 'Germany',   iso: 'GER', group: 'B', flag: '\u{1F1E9}\u{1F1EA}' },
      { name: 'England',   iso: 'ENG', group: 'B', flag: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}' },
      { name: 'Mexico',    iso: 'MEX', group: 'B', flag: '\u{1F1F2}\u{1F1FD}' },
    ];

    const teamIds = {};
    teams.forEach(t => {
      db.run('INSERT INTO teams (name, iso_code, group_letter, flag_emoji) VALUES (?, ?, ?, ?)',
        [t.name, t.iso, t.group, t.flag]);
      const r = db.exec('SELECT last_insert_rowid()');
      teamIds[t.name] = r[0].values[0][0];
    });

    // Helper: date relative to today
    const DAYS_AHEAD = 1;
    function getDate(daysFromNow, hour, minute) {
      const d = new Date();
      d.setDate(d.getDate() + daysFromNow);
      d.setHours(hour, minute, 0, 0);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    }

    // Group stage matches (round-robin per group)
    const groups = { A: [], B: [] };
    teams.forEach(t => groups[t.group].push(t));
    const groupMatches = [];
    for (const [gl, gTeams] of Object.entries(groups)) {
      for (let i = 0; i < gTeams.length; i++) {
        for (let j = i + 1; j < gTeams.length; j++) {
          groupMatches.push({ group: gl, home: gTeams[i].name, away: gTeams[j].name });
        }
      }
    }

    const gA = groupMatches.filter(m => m.group === 'A');
    const gB = groupMatches.filter(m => m.group === 'B');
    const interleaved = [];
    for (let i = 0; i < Math.max(gA.length, gB.length); i++) {
      if (gA[i]) interleaved.push(gA[i]);
      if (gB[i]) interleaved.push(gB[i]);
    }

    const venues = ['BMO Field, Toronto', 'BC Place, Vancouver', 'MetLife Stadium, New Jersey',
      'SoFi Stadium, Los Angeles', 'Estadio Azteca, Mexico City', 'Hard Rock Stadium, Miami',
      'Mercedes-Benz Stadium, Atlanta', 'Lincoln Financial Field, Philadelphia'];

    const times = [
      { d: DAYS_AHEAD, h: 13 }, { d: DAYS_AHEAD, h: 16 }, { d: DAYS_AHEAD, h: 19 }, { d: DAYS_AHEAD, h: 21 },
      { d: DAYS_AHEAD+1, h: 13 }, { d: DAYS_AHEAD+1, h: 16 }, { d: DAYS_AHEAD+1, h: 19 }, { d: DAYS_AHEAD+1, h: 21 },
      { d: DAYS_AHEAD+2, h: 13 }, { d: DAYS_AHEAD+2, h: 16 }, { d: DAYS_AHEAD+2, h: 19 }, { d: DAYS_AHEAD+2, h: 21 },
    ];

    let mn = 1;
    interleaved.forEach((m, idx) => {
      const t = times[idx];
      db.run('INSERT INTO matches (match_number, stage, group_letter, home_team_id, away_team_id, match_datetime, venue) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [mn++, 'Group Stage', m.group, teamIds[m.home], teamIds[m.away], getDate(t.d, t.h, 0), venues[idx % venues.length]]);
    });

    // Knockout
    db.run('INSERT INTO matches (match_number, stage, match_datetime, venue, placeholder_home, placeholder_away) VALUES (?, ?, ?, ?, ?, ?)',
      [mn++, 'Semifinals', getDate(DAYS_AHEAD+4, 17, 0), 'BMO Field, Toronto', '1st Group A', '2nd Group B']);
    db.run('INSERT INTO matches (match_number, stage, match_datetime, venue, placeholder_home, placeholder_away) VALUES (?, ?, ?, ?, ?, ?)',
      [mn++, 'Semifinals', getDate(DAYS_AHEAD+4, 20, 0), 'MetLife Stadium, New Jersey', '1st Group B', '2nd Group A']);
    db.run('INSERT INTO matches (match_number, stage, match_datetime, venue, placeholder_home, placeholder_away) VALUES (?, ?, ?, ?, ?, ?)',
      [mn++, 'Third Place', getDate(DAYS_AHEAD+5, 17, 0), 'BC Place, Vancouver', 'Loser SF1', 'Loser SF2']);
    db.run('INSERT INTO matches (match_number, stage, match_datetime, venue, placeholder_home, placeholder_away) VALUES (?, ?, ?, ?, ?, ?)',
      [mn++, 'Final', getDate(DAYS_AHEAD+6, 20, 0), 'MetLife Stadium, New Jersey', 'Winner SF1', 'Winner SF2']);

    // Deadlines
    const deadlines = [
      { stage: 'Group Stage',  d: DAYS_AHEAD, h: 10 },
      { stage: 'Semifinals',   d: DAYS_AHEAD+4, h: 14 },
      { stage: 'Third Place',  d: DAYS_AHEAD+5, h: 14 },
      { stage: 'Final',        d: DAYS_AHEAD+6, h: 17 },
    ];
    deadlines.forEach(dl => {
      db.run('INSERT INTO deadlines (stage, deadline_datetime, is_locked) VALUES (?, ?, 0)', [dl.stage, getDate(dl.d, dl.h, 0)]);
    });

    saveDb();
    console.log('Auto-seed complete! Admin: admin@shootout.com / admin123');
  } catch (err) {
    console.error('Auto-seed error:', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await autoSeedIfEmpty();
});
