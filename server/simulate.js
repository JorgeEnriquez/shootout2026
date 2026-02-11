/**
 * SIMULATION SCRIPT
 * Adds sample predictions for all test users on the first 12 group stage matches,
 * then "completes" those 12 matches with realistic results so the scoring engine
 * and leaderboard have real data to show.
 *
 * Run: node server/simulate.js
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, 'pool.db');

async function simulate() {
  const SQL = await initSqlJs();
  const data = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(data);

  console.log('\n⚽ shoot-out SIMULATION\n');
  console.log('='.repeat(50));

  // Get the first 12 group stage matches
  const matchRes = db.exec(
    `SELECT match_id, match_number, home_team_id, away_team_id, stage
     FROM matches
     WHERE stage = 'Group Stage'
     ORDER BY match_id ASC
     LIMIT 12`
  );

  if (!matchRes.length) {
    console.log('No group stage matches found!');
    return;
  }

  const matches = matchRes[0].values.map(r => ({
    match_id: r[0], match_number: r[1], home_team_id: r[2], away_team_id: r[3], stage: r[4]
  }));

  console.log(`Found ${matches.length} matches to simulate.\n`);

  // Get participant user IDs
  const userRes = db.exec(
    `SELECT user_id, display_name FROM users WHERE role = 'participant' AND is_active = 1`
  );

  if (!userRes.length) {
    console.log('No participants found!');
    return;
  }

  const users = userRes[0].values.map(r => ({ user_id: r[0], display_name: r[1] }));
  console.log(`Participants: ${users.map(u => u.display_name || u.user_id).join(', ')}\n`);

  // "Actual" results for the 12 matches (realistic World Cup scores)
  const actualResults = [
    { home: 2, away: 1 },  // Match 1
    { home: 1, away: 1 },  // Match 2
    { home: 3, away: 0 },  // Match 3
    { home: 0, away: 1 },  // Match 4
    { home: 2, away: 2 },  // Match 5
    { home: 1, away: 0 },  // Match 6
    { home: 2, away: 1 },  // Match 7
    { home: 0, away: 0 },  // Match 8
    { home: 1, away: 3 },  // Match 9
    { home: 2, away: 0 },  // Match 10
    { home: 1, away: 1 },  // Match 11
    { home: 0, away: 2 },  // Match 12
  ];

  // Predictions per user — some exact, some correct outcome, some wrong
  // Each user has different "skill" levels for variety on the leaderboard
  const userPredictions = {
    // User 1 (GoalDigger_TO) — best predictor, gets several exact scores
    0: [
      { home: 2, away: 1 },  // EXACT
      { home: 1, away: 1 },  // EXACT
      { home: 2, away: 0 },  // correct result (home win)
      { home: 1, away: 2 },  // correct result (away win)
      { home: 2, away: 2 },  // EXACT
      { home: 1, away: 0 },  // EXACT
      { home: 3, away: 1 },  // correct result (home win)
      { home: 1, away: 1 },  // correct result (draw) — but actual is 0-0
      { home: 0, away: 2 },  // correct result (away win)
      { home: 2, away: 0 },  // EXACT
      { home: 0, away: 0 },  // correct result (draw) — but actual is 1-1
      { home: 1, away: 2 },  // correct result (away win)
    ],
    // User 2 (VARYouSerious) — decent, gets a few exact
    1: [
      { home: 1, away: 0 },  // correct result
      { home: 2, away: 2 },  // correct result (draw)
      { home: 3, away: 0 },  // EXACT
      { home: 1, away: 0 },  // wrong (predicted home win, actual away win)
      { home: 1, away: 0 },  // wrong
      { home: 1, away: 0 },  // EXACT
      { home: 2, away: 1 },  // EXACT
      { home: 0, away: 0 },  // EXACT
      { home: 2, away: 1 },  // wrong (predicted home, actual away)
      { home: 1, away: 0 },  // correct result
      { home: 1, away: 1 },  // EXACT
      { home: 0, away: 2 },  // EXACT
    ],
    // User 3 (PoutinePredictor) — average
    2: [
      { home: 1, away: 0 },  // correct result
      { home: 0, away: 1 },  // wrong (predicted away, actual draw)
      { home: 2, away: 1 },  // correct result
      { home: 0, away: 1 },  // EXACT
      { home: 3, away: 1 },  // wrong
      { home: 2, away: 1 },  // correct result
      { home: 1, away: 2 },  // wrong (predicted away, actual home)
      { home: 1, away: 0 },  // wrong
      { home: 1, away: 3 },  // EXACT
      { home: 1, away: 0 },  // correct result
      { home: 2, away: 0 },  // wrong
      { home: 0, away: 2 },  // EXACT
    ],
    // User 4 (SorryNotSorry) — below average
    3: [
      { home: 0, away: 0 },  // wrong
      { home: 2, away: 0 },  // wrong
      { home: 1, away: 0 },  // correct result
      { home: 2, away: 0 },  // wrong (predicted home, actual away)
      { home: 1, away: 2 },  // wrong
      { home: 0, away: 1 },  // wrong
      { home: 2, away: 1 },  // EXACT
      { home: 0, away: 0 },  // EXACT
      { home: 0, away: 1 },  // correct result
      { home: 2, away: 0 },  // EXACT
      { home: 1, away: 1 },  // EXACT
      { home: 1, away: 0 },  // wrong (predicted home, actual away)
    ],
    // User 5 (CN_Tower_Power) — middling
    4: [
      { home: 2, away: 1 },  // EXACT
      { home: 0, away: 0 },  // correct result (draw)
      { home: 3, away: 0 },  // EXACT
      { home: 1, away: 2 },  // correct result
      { home: 0, away: 0 },  // wrong (predicted draw, actual draw 2-2)
      { home: 2, away: 0 },  // correct result
      { home: 0, away: 1 },  // wrong
      { home: 1, away: 1 },  // correct result (draw)
      { home: 0, away: 2 },  // correct result
      { home: 3, away: 0 },  // correct result
      { home: 1, away: 1 },  // EXACT
      { home: 0, away: 2 },  // EXACT
    ],
  };

  // Scoring engine
  const POINT_VALUES = { 'Group Stage': { correct: 1, exact: 3 } };

  // Step 1: Insert predictions for each user
  console.log('📝 Inserting predictions...\n');
  for (let ui = 0; ui < users.length; ui++) {
    const user = users[ui];
    const preds = userPredictions[ui];
    let inserted = 0;

    for (let mi = 0; mi < matches.length; mi++) {
      const match = matches[mi];
      const pred = preds[mi];

      // Delete existing prediction if any
      db.run('DELETE FROM predictions WHERE user_id = ? AND match_id = ?', [user.user_id, match.match_id]);

      db.run(
        `INSERT INTO predictions (user_id, match_id, predicted_home_score, predicted_away_score, points_earned, scoring_type)
         VALUES (?, ?, ?, ?, 0, 'none')`,
        [user.user_id, match.match_id, pred.home, pred.away]
      );
      inserted++;
    }
    console.log(`  ✅ ${user.display_name || 'User ' + user.user_id}: ${inserted} predictions`);
  }

  // Step 2: Set actual match results and calculate scores
  console.log('\n🏟️  Setting match results and calculating scores...\n');

  for (let mi = 0; mi < matches.length; mi++) {
    const match = matches[mi];
    const result = actualResults[mi];

    // Get team names for display
    const teamRes = db.exec(
      `SELECT
         (SELECT name FROM teams WHERE team_id = ?) as home_name,
         (SELECT name FROM teams WHERE team_id = ?) as away_name`,
      [match.home_team_id, match.away_team_id]
    );
    const homeName = teamRes.length ? teamRes[0].values[0][0] || 'TBD' : 'TBD';
    const awayName = teamRes.length ? teamRes[0].values[0][1] || 'TBD' : 'TBD';

    // Update match result
    db.run(
      'UPDATE matches SET home_score = ?, away_score = ?, status = ? WHERE match_id = ?',
      [result.home, result.away, 'completed', match.match_id]
    );

    console.log(`  Match ${match.match_number}: ${homeName} ${result.home}-${result.away} ${awayName}`);

    // Calculate points for each prediction
    const predRes = db.exec(
      'SELECT prediction_id, user_id, predicted_home_score, predicted_away_score FROM predictions WHERE match_id = ?',
      [match.match_id]
    );

    if (predRes.length) {
      const pv = POINT_VALUES[match.stage];
      predRes[0].values.forEach(row => {
        const [predId, userId, predH, predA] = row;
        let points = 0;
        let scoringType = 'none';

        if (predH === result.home && predA === result.away) {
          points = pv.exact;
          scoringType = 'exact';
        } else {
          const actualOutcome = result.home > result.away ? 'home' : result.home < result.away ? 'away' : 'draw';
          const predOutcome = predH > predA ? 'home' : predH < predA ? 'away' : 'draw';
          if (actualOutcome === predOutcome) {
            points = pv.correct;
            scoringType = 'correct';
          }
        }

        db.run(
          'UPDATE predictions SET points_earned = ?, scoring_type = ? WHERE prediction_id = ?',
          [points, scoringType, predId]
        );
      });
    }
  }

  // Step 3: Show leaderboard
  console.log('\n' + '='.repeat(50));
  console.log('🏆 LEADERBOARD AFTER 12 MATCHES\n');

  const lbRes = db.exec(`
    SELECT
      u.display_name,
      COALESCE(SUM(p.points_earned), 0) as total_points,
      COALESCE(SUM(CASE WHEN p.scoring_type = 'exact' THEN 1 ELSE 0 END), 0) as exact_count,
      COALESCE(SUM(CASE WHEN p.scoring_type = 'correct' THEN 1 ELSE 0 END), 0) as correct_count
    FROM users u
    LEFT JOIN predictions p ON u.user_id = p.user_id
    WHERE u.role = 'participant' AND u.is_active = 1
    GROUP BY u.user_id
    ORDER BY total_points DESC, exact_count DESC
  `);

  if (lbRes.length) {
    const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
    lbRes[0].values.forEach((row, i) => {
      const [name, pts, exact, correct] = row;
      console.log(`  ${medals[i] || (i+1)+'.'} ${(name || 'Unknown').padEnd(20)} ${String(pts).padStart(3)} pts  (${exact} exact, ${correct} correct)`);
    });
  }

  // Save
  const buffer = Buffer.from(db.export());
  fs.writeFileSync(DB_PATH, buffer);

  console.log('\n' + '='.repeat(50));
  console.log('✅ Simulation complete! Database updated.');
  console.log('   12 matches completed, all 5 users have predictions.');
  console.log('   Restart the server to see changes: npm run dev\n');
}

simulate().catch(err => {
  console.error('Simulation failed:', err);
  process.exit(1);
});
