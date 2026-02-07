import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const schemaPath = resolve(__dirname, 'schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');

async function run() {
  const pool = new Pool({ connectionString });
  try {
    await pool.query(schema);
    // eslint-disable-next-line no-console
    console.log('Schema applied.');
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Migration failed:', error);
  process.exit(1);
});
