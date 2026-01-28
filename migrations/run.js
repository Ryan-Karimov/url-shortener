const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function runMigrations() {
  console.log('Running migrations...');

  try {
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      console.log(`Completed: ${file}`);
    }

    console.log('All migrations completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
