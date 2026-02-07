import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const seedPath = resolve(__dirname, 'seed.sql');
if (!existsSync(seedPath)) {
  // eslint-disable-next-line no-console
  console.log('No seed.sql found. Skipping.');
  process.exit(0);
}

const seed = readFileSync(seedPath, 'utf-8');
if (!seed.trim()) {
  // eslint-disable-next-line no-console
  console.log('seed.sql is empty. Skipping.');
  process.exit(0);
}

async function run() {
  const pool = new Pool({ connectionString });
  try {
    await pool.query(seed);
    // eslint-disable-next-line no-console
    console.log('Seed applied.');
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', error);
  process.exit(1);
});
