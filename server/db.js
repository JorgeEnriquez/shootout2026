const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'pool.db');
let dbInstance = null;
let SQL = null;

async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  // Initialize sql.js
  if (!SQL) {
    SQL = await initSqlJs();
  }

  // Load existing database or create new one
  let data = null;
  if (fs.existsSync(DB_PATH)) {
    data = fs.readFileSync(DB_PATH);
  }

  if (data) {
    dbInstance = new SQL.Database(data);
  } else {
    dbInstance = new SQL.Database();
  }

  // Create tables if they don't exist
  initializeTables();

  return dbInstance;
}

function initializeTables() {
  const statements = [
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

  statements.forEach(statement => {
    try {
      dbInstance.run(statement);
    } catch (error) {
      // Table might already exist, that's fine
    }
  });
}

function saveDb() {
  if (dbInstance) {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

module.exports = {
  getDb,
  saveDb
};
