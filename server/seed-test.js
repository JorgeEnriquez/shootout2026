/**
 * seed-test.js — Mini Test Tournament Seed
 *
 * Creates an 8-team, ~1-week test tournament for testing with friends.
 *
 * Structure:
 *   Group A: Brazil, Argentina, France, Canada (6 matches)
 *   Group B: Spain, Germany, England, Mexico  (6 matches)
 *   Semifinals: 1st A vs 2nd B, 1st B vs 2nd A
 *   Third Place: Losers of semis
 *   Final: Winners of semis
 *   Total: 16 matches across 4 stages over ~7 days
 *
 * Usage:
 *   node server/seed-test.js
 *
 * Only creates admin user. Participants self-register.
 */

const path = require('path');
const bcrypt = require('bcryptjs');
const initSqlJs = require('sql.js');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'pool.db');

// ─── Configuration ───────────────────────────────────────────
// All dates are relative to "today". Adjust DAYS_AHEAD if you
// want the tournament to start in the future.
const DAYS_AHEAD = 1; // Tournament starts tomorrow

function getDate(daysFromNow, hour = 12, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  // Format as ISO-ish for SQLite: YYYY-MM-DD HH:MM:SS
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

// ─── Teams ───────────────────────────────────────────────────
const TEAMS = [
  // Group A
  { name: 'Brazil',    iso: 'BRA', group: 'A', flag: '\u{1F1E7}\u{1F1F7}' },
  { name: 'Argentina', iso: 'ARG', group: 'A', flag: '\u{1F1E6}\u{1F1F7}' },
  { name: 'France',    iso: 'FRA', group: 'A', flag: '\u{1F1EB}\u{1F1F7}' },
  { name: 'Canada',    iso: 'CAN', group: 'A', flag: '\u{1F1E8}\u{1F1E6}' },
  // Group B
  { name: 'Spain',    iso: 'ESP', group: 'B', flag: '\u{1F1EA}\u{1F1F8}' },
  { name: 'Germany',  iso: 'GER', group: 'B', flag: '\u{1F1E9}\u{1F1EA}' },
  { name: 'England',  iso: 'ENG', group: 'B', flag: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}' },
  { name: 'Mexico',   iso: 'MEX', group: 'B', flag: '\u{1F1F2}\u{1F1FD}' },
];

// ─── Venues ──────────────────────────────────────────────────
const VENUES = [
  'BMO Field, Toronto',
  'BC Place, Vancouver',
  'MetLife Stadium, New Jersey',
  'SoFi Stadium, Los Angeles',
  'Estadio Azteca, Mexico City',
  'Hard Rock Stadium, Miami',
  'Mercedes-Benz Stadium, Atlanta',
  'Lincoln Financial Field, Philadelphia',
];

async function seedTestTournament() {
  console.log('Starting test tournament seed...\n');

  const SQL = await initSqlJs();

  // Start fresh
  const db = new SQL.Database();

  // Create tables
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      role TEXT DEFAULT 'participant' CHECK(role IN ('admin','participant')),
      is_active INTEGER DEFAULT 1,
      first_login_complete INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS teams (
      team_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      iso_code TEXT NOT NULL,
      group_letter TEXT,
      flag_emoji TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS matches (
      match_id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_number INTEGER,
      stage TEXT NOT NULL,
      group_letter TEXT,
      home_team_id INTEGER REFERENCES teams(team_id),
      away_team_id INTEGER REFERENCES teams(team_id),
      match_datetime TEXT,
      venue TEXT,
      home_score INTEGER,
      away_score INTEGER,
      status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming','in_progress','completed')),
      placeholder_home TEXT,
      placeholder_away TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS deadlines (
      deadline_id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage TEXT UNIQUE NOT NULL,
      deadline_datetime TEXT NOT NULL,
      is_locked INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS predictions (
      prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(user_id),
      match_id INTEGER REFERENCES matches(match_id),
      predicted_home_score INTEGER NOT NULL,
      predicted_away_score INTEGER NOT NULL,
      points_earned INTEGER DEFAULT 0,
      scoring_type TEXT DEFAULT 'none' CHECK(scoring_type IN ('exact','correct','none')),
      submitted_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, match_id)
    )`
  ];

  tables.forEach(sql => db.run(sql));

  // ─── Admin User ──────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 10);
  db.run(
    `INSERT INTO users (email, password_hash, display_name, role, first_login_complete)
     VALUES (?, ?, ?, 'admin', 1)`,
    ['admin@shootout.com', adminHash, 'El Comisionado']
  );
  console.log('Created admin user (admin@shootout.com / admin123)');

  // ─── Teams ───────────────────────────────────────────────
  const teamIds = {};
  TEAMS.forEach(t => {
    db.run(
      'INSERT INTO teams (name, iso_code, group_letter, flag_emoji) VALUES (?, ?, ?, ?)',
      [t.name, t.iso, t.group, t.flag]
    );
    const result = db.exec('SELECT last_insert_rowid() as id');
    teamIds[t.name] = result[0].values[0][0];
  });
  console.log(`Created ${TEAMS.length} teams (Group A: Brazil, Argentina, France, Canada | Group B: Spain, Germany, England, Mexico)`);

  // ─── Group Stage Matches ─────────────────────────────────
  // Round-robin within each group: 6 matches per group = 12 total
  // Spread over 3 days: 4 matches per day
  const groups = { A: [], B: [] };
  TEAMS.forEach(t => groups[t.group].push(t));

  let matchNumber = 1;
  const groupMatches = [];

  for (const [groupLetter, teams] of Object.entries(groups)) {
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        groupMatches.push({
          stage: 'Group Stage',
          group: groupLetter,
          home: teams[i].name,
          away: teams[j].name,
        });
      }
    }
  }

  // Interleave: alternate Group A and B matches
  const groupA = groupMatches.filter(m => m.group === 'A');
  const groupB = groupMatches.filter(m => m.group === 'B');
  const interleaved = [];
  for (let i = 0; i < Math.max(groupA.length, groupB.length); i++) {
    if (groupA[i]) interleaved.push(groupA[i]);
    if (groupB[i]) interleaved.push(groupB[i]);
  }

  // Schedule: 4 matches per day over 3 days
  const matchTimes = [
    // Day 1: matches 1-4
    { day: DAYS_AHEAD, hour: 13, min: 0 },
    { day: DAYS_AHEAD, hour: 16, min: 0 },
    { day: DAYS_AHEAD, hour: 19, min: 0 },
    { day: DAYS_AHEAD, hour: 21, min: 0 },
    // Day 2: matches 5-8
    { day: DAYS_AHEAD + 1, hour: 13, min: 0 },
    { day: DAYS_AHEAD + 1, hour: 16, min: 0 },
    { day: DAYS_AHEAD + 1, hour: 19, min: 0 },
    { day: DAYS_AHEAD + 1, hour: 21, min: 0 },
    // Day 3: matches 9-12
    { day: DAYS_AHEAD + 2, hour: 13, min: 0 },
    { day: DAYS_AHEAD + 2, hour: 16, min: 0 },
    { day: DAYS_AHEAD + 2, hour: 19, min: 0 },
    { day: DAYS_AHEAD + 2, hour: 21, min: 0 },
  ];

  interleaved.forEach((match, idx) => {
    const time = matchTimes[idx];
    const venue = VENUES[idx % VENUES.length];
    db.run(
      `INSERT INTO matches (match_number, stage, group_letter, home_team_id, away_team_id, match_datetime, venue)
       VALUES (?, 'Group Stage', ?, ?, ?, ?, ?)`,
      [matchNumber++, match.group, teamIds[match.home], teamIds[match.away], getDate(time.day, time.hour, time.min), venue]
    );
  });

  console.log(`Created 12 Group Stage matches (Days ${DAYS_AHEAD}-${DAYS_AHEAD + 2})`);

  // ─── Knockout Matches ────────────────────────────────────
  // Semifinals: Day 5
  db.run(
    `INSERT INTO matches (match_number, stage, match_datetime, venue, placeholder_home, placeholder_away)
     VALUES (?, 'Semifinals', ?, ?, '1st Group A', '2nd Group B')`,
    [matchNumber++, getDate(DAYS_AHEAD + 4, 17, 0), 'BMO Field, Toronto']
  );

  db.run(
    `INSERT INTO matches (match_number, stage, match_datetime, venue, placeholder_home, placeholder_away)
     VALUES (?, 'Semifinals', ?, ?, '1st Group B', '2nd Group A')`,
    [matchNumber++, getDate(DAYS_AHEAD + 4, 20, 0), 'MetLife Stadium, New Jersey']
  );

  console.log(`Created 2 Semifinal matches (Day ${DAYS_AHEAD + 4})`);

  // Third Place: Day 6
  db.run(
    `INSERT INTO matches (match_number, stage, match_datetime, venue, placeholder_home, placeholder_away)
     VALUES (?, 'Third Place', ?, ?, 'Loser SF1', 'Loser SF2')`,
    [matchNumber++, getDate(DAYS_AHEAD + 5, 17, 0), 'BC Place, Vancouver']
  );

  console.log(`Created 1 Third Place match (Day ${DAYS_AHEAD + 5})`);

  // Final: Day 7
  db.run(
    `INSERT INTO matches (match_number, stage, match_datetime, venue, placeholder_home, placeholder_away)
     VALUES (?, 'Final', ?, ?, 'Winner SF1', 'Winner SF2')`,
    [matchNumber++, getDate(DAYS_AHEAD + 6, 20, 0), 'MetLife Stadium, New Jersey']
  );

  console.log(`Created 1 Final match (Day ${DAYS_AHEAD + 6})`);

  // ─── Deadlines ───────────────────────────────────────────
  // Each deadline is set a few hours before the first match of that stage
  const deadlines = [
    { stage: 'Group Stage',  day: DAYS_AHEAD,     hour: 10, min: 0 },
    { stage: 'Semifinals',   day: DAYS_AHEAD + 4, hour: 14, min: 0 },
    { stage: 'Third Place',  day: DAYS_AHEAD + 5, hour: 14, min: 0 },
    { stage: 'Final',        day: DAYS_AHEAD + 6, hour: 17, min: 0 },
  ];

  deadlines.forEach(d => {
    db.run(
      'INSERT INTO deadlines (stage, deadline_datetime, is_locked) VALUES (?, ?, 0)',
      [d.stage, getDate(d.day, d.hour, d.min)]
    );
  });

  console.log('Created 4 deadlines (Group Stage, Semifinals, Third Place, Final)');

  // ─── Save ────────────────────────────────────────────────
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
  console.log(`\nDatabase saved to ${DB_PATH}`);

  // ─── Summary ─────────────────────────────────────────────
  console.log('\n============================================================');
  console.log('TEST TOURNAMENT SEED COMPLETE');
  console.log('============================================================');
  console.log('');
  console.log('Teams:');
  console.log('  Group A: Brazil, Argentina, France, Canada');
  console.log('  Group B: Spain, Germany, England, Mexico');
  console.log('');
  console.log('Schedule:');
  deadlines.forEach(d => {
    console.log(`  ${d.stage.padEnd(14)} Deadline: ${getDate(d.day, d.hour, d.min)}`);
  });
  console.log('');
  console.log('Admin login: admin@shootout.com / admin123');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Have friends register at your site');
  console.log('  2. They submit Group Stage predictions before the deadline');
  console.log('  3. You (admin) enter match results via the Admin panel');
  console.log('  4. After Group Stage, assign semifinal teams in admin or via script');
  console.log('  5. Repeat for Semifinals, Third Place, Final');
  console.log('  6. Check the leaderboard after the Final!');
}

seedTestTournament().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
