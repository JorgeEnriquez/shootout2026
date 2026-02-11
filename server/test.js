const { getDb } = require('./db');

async function test() {
  try {
    const db = await getDb();

    // Test users
    console.log('\n=== USERS ===');
    const users = db.exec('SELECT user_id, email, display_name, role FROM users LIMIT 5');
    if (users.length > 0) {
      users[0].values.forEach(row => {
        console.log(`${row[1]} (${row[2]}) - ${row[3]}`);
      });
    }

    // Test teams count
    console.log('\n=== TEAMS ===');
    const teams = db.exec('SELECT COUNT(*) as count FROM teams');
    if (teams.length > 0) {
      console.log(`Total teams: ${teams[0].values[0][0]}`);
    }

    // Test groups
    console.log('\n=== TEAMS BY GROUP ===');
    const groups = db.exec('SELECT group_letter, COUNT(*) as count FROM teams GROUP BY group_letter ORDER BY group_letter');
    if (groups.length > 0) {
      groups[0].values.forEach(row => {
        console.log(`Group ${row[0]}: ${row[1]} teams`);
      });
    }

    // Test matches
    console.log('\n=== MATCHES ===');
    const matches = db.exec('SELECT COUNT(*) as count FROM matches');
    if (matches.length > 0) {
      console.log(`Total matches: ${matches[0].values[0][0]}`);
    }

    // Test matches by stage
    console.log('\n=== MATCHES BY STAGE ===');
    const stages = db.exec('SELECT stage, COUNT(*) as count FROM matches GROUP BY stage ORDER BY stage');
    if (stages.length > 0) {
      stages[0].values.forEach(row => {
        console.log(`${row[0]}: ${row[1]} matches`);
      });
    }

    // Test deadlines
    console.log('\n=== DEADLINES ===');
    const deadlines = db.exec('SELECT stage, deadline_datetime FROM deadlines ORDER BY stage');
    if (deadlines.length > 0) {
      deadlines[0].values.forEach(row => {
        console.log(`${row[0]}: ${row[1]}`);
      });
    }

    console.log('\n=== ALL TESTS PASSED ===\n');
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

test();
