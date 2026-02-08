# Supabase Setup Instructions

Your company firewall blocks PostgreSQL direct connections (port 5432), so we'll use Supabase's SQL Editor instead.

## Steps to Complete:

### 1. Open Supabase Dashboard
- Go to: https://app.supabase.com
- Sign in to your project
- Click "SQL Editor" on the left sidebar

### 2. Create Tables (Run Schema)
- Click "New Query"
- Copy the entire content from: `backend/src/database/schema.sql`
- Paste it into the SQL editor
- Click "Run" button
- Confirm all tables are created

### 3. Seed Sample Data (Run Seeds)
- Click "New Query" again
- Copy the entire content from: `backend/src/database/seed.sql`
- Paste it into the SQL editor
- Click "Run" button
- Confirm all data is inserted (should see success messages)

### 4. Verify Data
In Supabase Dashboard, you should now see:
- **vendors**: 3 records (Metro Charge, Green Spark, City Plug)
- **stations**: 3 records 
- **devices**: 3 records (mix of online/offline)
- **users**: 2 records
- **sessions**: 2 records (1 ACTIVE, 1 STOPPED)
- **telemetry**: 2 records
- **alerts**: 2 records
- **wallet_ledger**: 1 record
- **vendor_ledger**: 1 record

## After Setup:

Once data is seeded, the backend is ready to connect. In your local environment:

1. **Restart backend**: Kill the existing backend process and run `npm run start:dev` again
2. **Hard refresh admin panel**: Press Ctrl+F5 in browser at localhost:3000
3. **Check admin dashboard**: You should now see real data (vendor counts, station status, device online/offline, etc.)

## Troubleshooting

If you get any SQL errors:
- Check that the SQL Editor runs in the correct database context
- Ensure you're not in a transaction mode that requires explicit commits
- Try running schema.sql first, then seed.sql in separate queries

## Online SQL Files

You can also access the SQL files from your VS Code workspace and copy them directly:
- Schema: `/backend/src/database/schema.sql`
- Seed: `/backend/src/database/seed.sql`
