#!/usr/bin/env node

/**
 * Semifinals Simulation Script
 *
 * Sets up a World Cup prediction pool app with:
 * - Semifinals matches (Brazil vs Argentina, Spain vs Germany)
 * - Test user predictions
 * - Updated deadlines
 *
 * Usage: node simulate-semifinals.js
 *
 * SIMULATED RESULTS (admin enters manually after deadline):
 *   Brazil 2-1 Argentina
 *   Spain 1-1 Germany
 *
 * Expected point breakdown (Semifinals: exact=11, correct=5):
 *   GoalDigger_TO:    BRA 2-1 ARG (EXACT 11) + ESP 1-0 GER (WRONG 0) = 11 pts
 *   VARYouSerious:    BRA 1-0 ARG (CORRECT 5) + ESP 2-1 GER (WRONG 0) = 5 pts
 *   PoutinePredictor: BRA 0-0 ARG (WRONG 0)   + ESP 1-1 GER (EXACT 11) = 11 pts
 *   SorryNotSorry:    BRA 3-2 ARG (CORRECT 5) + ESP 0-1 GER (WRONG 0) = 5 pts
 *   CN_Tower_Power:   BRA 1-1 ARG (WRONG 0)   + ESP 2-0 GER (WRONG 0) = 0 pts
 */

const { getDb, saveDb } = require('./db');

async function simulateSemifinals() {
  try {
    console.log('Starting semifinals simulation...\n');

    // Connect to database
    const db = await getDb();
    console.log('✓ Connected to database');

    // Step 1: Reset state
    console.log('\n--- Resetting existing data ---');
    db.run('DELETE FROM predictions');
    console.log('✓ Cleared predictions');

    db.run('UPDATE matches SET home_score = NULL, away_score = NULL, status = ?', ['upcoming']);
    console.log('✓ Reset match scores and status');

    // Step 2: Find team IDs for semifinals
    console.log('\n--- Fetching team IDs ---');
    const teamResults = db.exec(
      'SELECT team_id, name FROM teams WHERE name IN (?, ?, ?, ?) ORDER BY name ASC',
      ['Argentina', 'Brazil', 'Germany', 'Spain']
    );

    if (teamResults.length === 0 || teamResults[0].values.length === 0) {
      throw new Error('Could not find required teams in database');
    }

    // Parse team results: results[0].values = [[team_id1, name1], [team_id2, name2], ...]
    const teams = {};
    teamResults[0].values.forEach(row => {
      const [teamId, name] = row;
      teams[name] = teamId;
    });

    console.log('✓ Found teams:');
    Object.entries(teams).forEach(([name, id]) => {
      console.log(`  - ${name}: ${id}`);
    });

    // Step 3: Find semifinal match IDs
    console.log('\n--- Fetching semifinal matches ---');
    const matchResults = db.exec(
      'SELECT match_id FROM matches WHERE stage = ? ORDER BY match_id ASC',
      ['Semifinals']
    );

    if (matchResults.length === 0 || matchResults[0].values.length < 2) {
      throw new Error('Could not find 2 semifinal matches in database');
    }

    const semifinalMatches = matchResults[0].values.map(row => row[0]);
    const match1Id = semifinalMatches[0];
    const match2Id = semifinalMatches[1];

    console.log(`✓ Found semifinal matches: ${match1Id}, ${match2Id}`);

    // Step 4: Update Semifinal Match 1 (Brazil vs Argentina)
    console.log('\n--- Updating semifinal matches ---');
    db.run(
      `UPDATE matches
       SET home_team_id = ?, away_team_id = ?, match_datetime = ?, venue = ?,
           placeholder_home = NULL, placeholder_away = NULL
       WHERE match_id = ?`,
      [
        teams['Brazil'],
        teams['Argentina'],
        '2026-02-09 21:30:00',
        'MetLife Stadium, New Jersey',
        match1Id
      ]
    );
    console.log(`✓ Match 1 (${match1Id}): Brazil vs Argentina @ MetLife Stadium`);

    // Step 5: Update Semifinal Match 2 (Spain vs Germany)
    db.run(
      `UPDATE matches
       SET home_team_id = ?, away_team_id = ?, match_datetime = ?, venue = ?,
           placeholder_home = NULL, placeholder_away = NULL
       WHERE match_id = ?`,
      [
        teams['Spain'],
        teams['Germany'],
        '2026-02-09 21:30:00',
        'MetLife Stadium, New Jersey',
        match2Id
      ]
    );
    console.log(`✓ Match 2 (${match2Id}): Spain vs Germany @ MetLife Stadium`);

    // Step 6: Lock all previous stages (tournament is at Semifinals)
    console.log('\n--- Locking previous stages ---');
    const previousStages = ['Group Stage', 'Round of 32', 'Round of 16', 'Quarterfinals'];
    previousStages.forEach(stage => {
      db.run(
        'UPDATE deadlines SET is_locked = ? WHERE stage = ?',
        [1, stage]
      );
      console.log(`✓ Locked: ${stage}`);
    });

    // Step 7: Update Semifinals deadline (7:45pm EST today)
    console.log('\n--- Updating Semifinals deadline ---');
    db.run(
      'UPDATE deadlines SET deadline_datetime = ?, is_locked = ? WHERE stage = ?',
      ['2026-02-09 19:45:00', 0, 'Semifinals']
    );
    console.log('✓ Semifinals deadline: 2026-02-09 19:45:00 (unlocked)');

    // Step 8: Find test users
    console.log('\n--- Fetching test users ---');
    const userResults = db.exec(
      'SELECT user_id, email, display_name FROM users WHERE role = ? ORDER BY user_id ASC',
      ['participant']
    );

    if (userResults.length === 0 || userResults[0].values.length < 5) {
      throw new Error('Could not find 5 test users in database');
    }

    // Parse user results: results[0].values = [[user_id1, email1, name1], ...]
    const testUsers = userResults[0].values.slice(0, 5).map(row => ({
      user_id: row[0],
      email: row[1],
      display_name: row[2]
    }));

    console.log('✓ Found test users:');
    testUsers.forEach((user, idx) => {
      console.log(`  ${idx + 1}. ${user.display_name} (${user.email})`);
    });

    // Step 9: Insert predictions for each user
    console.log('\n--- Inserting predictions ---');

    // Prediction data spread across users
    const predictionData = [
      { match1: [2, 1], match2: [1, 0] }, // User 1: BRA 2-1 ARG, ESP 1-0 GER
      { match1: [1, 0], match2: [2, 1] }, // User 2: BRA 1-0 ARG, ESP 2-1 GER
      { match1: [0, 0], match2: [1, 1] }, // User 3: BRA 0-0 ARG, ESP 1-1 GER
      { match1: [3, 2], match2: [0, 1] }, // User 4: BRA 3-2 ARG, ESP 0-1 GER
      { match1: [1, 1], match2: [2, 0] }  // User 5: BRA 1-1 ARG, ESP 2-0 GER
    ];

    testUsers.forEach((user, idx) => {
      const predictions = predictionData[idx];

      // Prediction for Match 1
      db.run(
        `INSERT OR REPLACE INTO predictions
         (user_id, match_id, predicted_home_score, predicted_away_score, points_earned, scoring_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.user_id, match1Id, predictions.match1[0], predictions.match1[1], 0, 'none']
      );

      // Prediction for Match 2
      db.run(
        `INSERT OR REPLACE INTO predictions
         (user_id, match_id, predicted_home_score, predicted_away_score, points_earned, scoring_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.user_id, match2Id, predictions.match2[0], predictions.match2[1], 0, 'none']
      );

      console.log(
        `✓ ${user.display_name}: ` +
        `BRA ${predictions.match1[0]}-${predictions.match1[1]} ARG, ` +
        `ESP ${predictions.match2[0]}-${predictions.match2[1]} GER`
      );
    });

    // Step 10: Save database
    console.log('\n--- Saving database ---');
    await saveDb();
    console.log('✓ Database saved to disk');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SEMIFINALS SIMULATION COMPLETE');
    console.log('='.repeat(60));
    console.log('\nMatches configured:');
    console.log(`  • Match ${match1Id}: Brazil vs Argentina (MetLife Stadium)`);
    console.log(`  • Match ${match2Id}: Spain vs Germany (MetLife Stadium)`);
    console.log('\nDateTime: 2026-02-09 21:30:00');
    console.log('Prediction deadline: 2026-02-09 19:45:00\n');
    console.log('Locked stages: Group Stage, Round of 32, Round of 16, Quarterfinals');
    console.log(`Predictions loaded for ${testUsers.length} users`);
    console.log('Status: Ready for semifinals predictions!\n');

  } catch (error) {
    console.error('\n❌ Error during simulation:', error.message);
    process.exit(1);
  }
}

// Run the simulation
simulateSemifinals();
