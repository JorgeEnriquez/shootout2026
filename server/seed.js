const bcrypt = require('bcryptjs');
const { getDb, saveDb } = require('./db');

const TEAMS_DATA = [
  // Group A (4 teams)
  { name: 'Argentina', iso_code: 'ARG', group_letter: 'A', flag_emoji: '🇦🇷' },
  { name: 'Morocco', iso_code: 'MAR', group_letter: 'A', flag_emoji: '🇲🇦' },
  { name: 'Saudi Arabia', iso_code: 'KSA', group_letter: 'A', flag_emoji: '🇸🇦' },
  { name: 'Mexico', iso_code: 'MEX', group_letter: 'A', flag_emoji: '🇲🇽' },

  // Group B (4 teams)
  { name: 'France', iso_code: 'FRA', group_letter: 'B', flag_emoji: '🇫🇷' },
  { name: 'Netherlands', iso_code: 'NED', group_letter: 'B', flag_emoji: '🇳🇱' },
  { name: 'Senegal', iso_code: 'SEN', group_letter: 'B', flag_emoji: '🇸🇳' },
  { name: 'Poland', iso_code: 'POL', group_letter: 'B', flag_emoji: '🇵🇱' },

  // Group C (4 teams)
  { name: 'Spain', iso_code: 'ESP', group_letter: 'C', flag_emoji: '🇪🇸' },
  { name: 'Germany', iso_code: 'GER', group_letter: 'C', flag_emoji: '🇩🇪' },
  { name: 'Japan', iso_code: 'JPN', group_letter: 'C', flag_emoji: '🇯🇵' },
  { name: 'Costa Rica', iso_code: 'CRC', group_letter: 'C', flag_emoji: '🇨🇷' },

  // Group D (4 teams)
  { name: 'Belgium', iso_code: 'BEL', group_letter: 'D', flag_emoji: '🇧🇪' },
  { name: 'Canada', iso_code: 'CAN', group_letter: 'D', flag_emoji: '🇨🇦' },
  { name: 'Tunisia', iso_code: 'TUN', group_letter: 'D', flag_emoji: '🇹🇳' },
  { name: 'Ukraine', iso_code: 'UKR', group_letter: 'D', flag_emoji: '🇺🇦' },

  // Group E (4 teams)
  { name: 'Brazil', iso_code: 'BRA', group_letter: 'E', flag_emoji: '🇧🇷' },
  { name: 'Switzerland', iso_code: 'SUI', group_letter: 'E', flag_emoji: '🇨🇭' },
  { name: 'Cameroon', iso_code: 'CMR', group_letter: 'E', flag_emoji: '🇨🇲' },
  { name: 'Serbia', iso_code: 'SRB', group_letter: 'E', flag_emoji: '🇷🇸' },

  // Group F (4 teams)
  { name: 'England', iso_code: 'ENG', group_letter: 'F', flag_emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Iran', iso_code: 'IRN', group_letter: 'F', flag_emoji: '🇮🇷' },
  { name: 'Wales', iso_code: 'WAL', group_letter: 'F', flag_emoji: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { name: 'United States', iso_code: 'USA', group_letter: 'F', flag_emoji: '🇺🇸' },

  // Group G (4 teams)
  { name: 'Italy', iso_code: 'ITA', group_letter: 'G', flag_emoji: '🇮🇹' },
  { name: 'Greece', iso_code: 'GRE', group_letter: 'G', flag_emoji: '🇬🇷' },
  { name: 'Uzbekistan', iso_code: 'UZB', group_letter: 'G', flag_emoji: '🇺🇿' },
  { name: 'Albania', iso_code: 'ALB', group_letter: 'G', flag_emoji: '🇦🇱' },

  // Group H (4 teams)
  { name: 'Portugal', iso_code: 'POR', group_letter: 'H', flag_emoji: '🇵🇹' },
  { name: 'Türkiye', iso_code: 'TUR', group_letter: 'H', flag_emoji: '🇹🇷' },
  { name: 'Slovenia', iso_code: 'SVN', group_letter: 'H', flag_emoji: '🇸🇮' },
  { name: 'Denmark', iso_code: 'DEN', group_letter: 'H', flag_emoji: '🇩🇰' },

  // Group I (4 teams)
  { name: 'Ecuador', iso_code: 'ECU', group_letter: 'I', flag_emoji: '🇪🇨' },
  { name: 'Croatia', iso_code: 'CRO', group_letter: 'I', flag_emoji: '🇭🇷' },
  { name: 'Peru', iso_code: 'PER', group_letter: 'I', flag_emoji: '🇵🇪' },
  { name: 'Bolivia', iso_code: 'BOL', group_letter: 'I', flag_emoji: '🇧🇴' },

  // Group J (4 teams)
  { name: 'Chile', iso_code: 'CHI', group_letter: 'J', flag_emoji: '🇨🇱' },
  { name: 'Austria', iso_code: 'AUT', group_letter: 'J', flag_emoji: '🇦🇹' },
  { name: 'Czechia', iso_code: 'CZE', group_letter: 'J', flag_emoji: '🇨🇿' },
  { name: 'Norway', iso_code: 'NOR', group_letter: 'J', flag_emoji: '🇳🇴' },

  // Group K (4 teams)
  { name: 'Paraguay', iso_code: 'PAR', group_letter: 'K', flag_emoji: '🇵🇾' },
  { name: 'Uruguay', iso_code: 'URY', group_letter: 'K', flag_emoji: '🇺🇾' },
  { name: 'Ghana', iso_code: 'GHA', group_letter: 'K', flag_emoji: '🇬🇭' },
  { name: 'South Korea', iso_code: 'KOR', group_letter: 'K', flag_emoji: '🇰🇷' },

  // Group L (4 teams)
  { name: 'Colombia', iso_code: 'COL', group_letter: 'L', flag_emoji: '🇨🇴' },
  { name: 'Venezuela', iso_code: 'VEN', group_letter: 'L', flag_emoji: '🇻🇪' },
  { name: 'Jamaica', iso_code: 'JAM', group_letter: 'L', flag_emoji: '🇯🇲' },
  { name: 'Panama', iso_code: 'PAN', group_letter: 'L', flag_emoji: '🇵🇦' },
];

const PARTICIPANTS = [
  { email: 'user1@test.com', password: 'pass123', display_name: 'GoalDigger_TO' },
  { email: 'user2@test.com', password: 'pass123', display_name: 'VARYouSerious' },
  { email: 'user3@test.com', password: 'pass123', display_name: 'PoutinePredictor' },
  { email: 'user4@test.com', password: 'pass123', display_name: 'SorryNotSorry' },
  { email: 'user5@test.com', password: 'pass123', display_name: 'CN_Tower_Power' },
];

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function seed() {
  try {
    const db = await getDb();

    console.log('Starting seed...');

    // Create admin user
    const adminPasswordHash = await hashPassword('admin123');
    db.run(
      `INSERT INTO users (email, password_hash, display_name, role, first_login_complete)
       VALUES (?, ?, ?, ?, ?)`,
      ['admin@shootout.com', adminPasswordHash, 'El Comisionado', 'admin', 1]
    );
    console.log('Created admin user');

    // Create participant users
    for (const participant of PARTICIPANTS) {
      const passwordHash = await hashPassword(participant.password);
      try {
        db.run(
          `INSERT INTO users (email, password_hash, display_name, role)
           VALUES (?, ?, ?, ?)`,
          [participant.email, passwordHash, participant.display_name, 'participant']
        );
      } catch (error) {
        console.log(`User ${participant.email} already exists, skipping`);
      }
    }
    console.log('Created participant users');

    // Insert teams
    for (const team of TEAMS_DATA) {
      try {
        db.run(
          `INSERT INTO teams (name, iso_code, group_letter, flag_emoji)
           VALUES (?, ?, ?, ?)`,
          [team.name, team.iso_code, team.group_letter, team.flag_emoji]
        );
      } catch (error) {
        console.log(`Team ${team.name} already exists, skipping`);
      }
    }
    console.log('Created teams');

    // Insert group stage matches
    const matchCount = generateGroupMatches(db);
    console.log(`Created ${matchCount} group stage matches`);

    // Insert knockout matches with placeholders
    const knockoutMatches = generateKnockoutMatches(db);
    console.log(`Created ${knockoutMatches} knockout matches`);

    // Insert deadlines
    insertDeadlines(db);
    console.log('Created deadlines');

    saveDb();
    console.log('Database saved successfully!');
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

function generateGroupMatches(db) {
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const venues = [
    'SoFi Stadium, Los Angeles',
    'MetLife Stadium, New Jersey',
    'AT&T Stadium, Dallas',
    'Arrowhead Stadium, Kansas City',
    'Estadio BBVA, Monterrey',
    'Estadio Azteca, Mexico City',
    'BC Place, Vancouver',
    'Mercedes-Benz Stadium, Atlanta',
    'Levi\'s Stadium, San Francisco',
    'Soldier Field, Chicago',
    'NRG Stadium, Houston',
    'Hard Rock Stadium, Miami'
  ];

  let matchCount = 0;
  let venueIndex = 0;
  const startDate = new Date('2026-06-11T18:00:00');

  for (const group of groups) {
    // Get all teams in this group
    const groupTeams = [];
    const results = db.exec(`SELECT team_id, name FROM teams WHERE group_letter = ?`, [group]);

    if (results.length > 0) {
      groupTeams.push(...results[0].values);
    }

    // Generate all matches for this group (round-robin)
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        const homeTeamId = groupTeams[i][0];
        const awayTeamId = groupTeams[j][0];
        const homeName = groupTeams[i][1];
        const awayName = groupTeams[j][1];

        const matchDate = new Date(startDate.getTime() + matchCount * 3 * 60 * 60 * 1000);
        const dateString = matchDate.toISOString().slice(0, 19).replace('T', ' ');
        const venue = venues[venueIndex % venues.length];
        venueIndex++;

        try {
          db.run(
            `INSERT INTO matches (match_number, stage, group_letter, home_team_id, away_team_id, match_datetime, venue, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [matchCount + 1, 'Group Stage', group, homeTeamId, awayTeamId, dateString, venue, 'upcoming']
          );
          matchCount++;
        } catch (error) {
          console.log(`Match ${homeName} vs ${awayName} already exists, skipping`);
        }
      }
    }
  }

  return matchCount;
}

function generateKnockoutMatches(db) {
  const knockoutStages = [
    { stage: 'Round of 32', count: 8 },
    { stage: 'Round of 16', count: 8 },
    { stage: 'Quarterfinals', count: 4 },
    { stage: 'Semifinals', count: 2 },
    { stage: 'Third Place', count: 1 },
    { stage: 'Final', count: 1 }
  ];

  let matchCount = 0;
  let venueIndex = 0;
  const venues = [
    'SoFi Stadium, Los Angeles',
    'MetLife Stadium, New Jersey',
    'AT&T Stadium, Dallas',
    'Arrowhead Stadium, Kansas City',
    'Estadio BBVA, Monterrey',
    'Estadio Azteca, Mexico City',
    'BC Place, Vancouver',
    'Mercedes-Benz Stadium, Atlanta'
  ];

  const startDate = new Date('2026-07-01T18:00:00');

  for (const knockoutStage of knockoutStages) {
    for (let i = 0; i < knockoutStage.count; i++) {
      const matchDate = new Date(startDate.getTime() + matchCount * 2 * 24 * 60 * 60 * 1000);
      const dateString = matchDate.toISOString().slice(0, 19).replace('T', ' ');
      const venue = venues[venueIndex % venues.length];
      venueIndex++;

      const placeholderHome = getPlaceholder(knockoutStage.stage, i * 2);
      const placeholderAway = getPlaceholder(knockoutStage.stage, i * 2 + 1);

      try {
        db.run(
          `INSERT INTO matches (stage, placeholder_home, placeholder_away, match_datetime, venue, status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [knockoutStage.stage, placeholderHome, placeholderAway, dateString, venue, 'upcoming']
        );
        matchCount++;
      } catch (error) {
        console.log(`${knockoutStage.stage} match ${i} already exists, skipping`);
      }
    }
  }

  return matchCount;
}

function getPlaceholder(stage, index) {
  if (stage === 'Round of 32') {
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const groupIndex = Math.floor(index / 2);
    const isWinner = index % 2 === 0;
    return isWinner ? `Winner Group ${groups[groupIndex]}` : `Runner-up Group ${groups[groupIndex]}`;
  } else if (stage === 'Round of 16') {
    return `Winner Match ${index + 1}`;
  } else if (stage === 'Quarterfinals') {
    return `Winner Match ${index + 1}`;
  } else if (stage === 'Semifinals') {
    return `Winner Match ${index + 1}`;
  } else if (stage === 'Third Place' || stage === 'Final') {
    return `Winner Match ${index + 1}`;
  }
  return `TBD ${index}`;
}

function insertDeadlines(db) {
  const deadlines = [
    { stage: 'Group Stage', datetime: '2026-06-11 11:00:00' },
    { stage: 'Round of 32', datetime: '2026-07-01 11:00:00' },
    { stage: 'Round of 16', datetime: '2026-07-09 11:00:00' },
    { stage: 'Quarterfinals', datetime: '2026-07-17 11:00:00' },
    { stage: 'Semifinals', datetime: '2026-07-23 11:00:00' },
    { stage: 'Third Place', datetime: '2026-07-30 11:00:00' },
    { stage: 'Final', datetime: '2026-08-01 11:00:00' }
  ];

  for (const deadline of deadlines) {
    try {
      db.run(
        `INSERT INTO deadlines (stage, deadline_datetime, is_locked)
         VALUES (?, ?, ?)`,
        [deadline.stage, deadline.datetime, 0]
      );
    } catch (error) {
      console.log(`Deadline for ${deadline.stage} already exists, skipping`);
    }
  }
}

seed().catch(console.error);
