CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  phone VARCHAR(32) UNIQUE,
  name TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_credentials (
  id UUID PRIMARY KEY,
  role VARCHAR(16) NOT NULL,
  subject_id UUID NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oauth_identities (
  id UUID PRIMARY KEY,
  role VARCHAR(16) NOT NULL,
  subject_id UUID NOT NULL,
  provider VARCHAR(32) NOT NULL,
  provider_user_id TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS oauth_identities_provider_user_idx
  ON oauth_identities(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS oauth_identities_email_idx ON oauth_identities(email);

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'Active',
  kyc_status VARCHAR(16) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_type VARCHAR(16);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS address_line TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS status_reason TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS registration_ts TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS vendor_documents (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  document_category VARCHAR(32) NOT NULL,
  document_type VARCHAR(64) NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  verification_status VARCHAR(32) NOT NULL DEFAULT 'UPLOADED',
  verified_by UUID,
  verified_at TIMESTAMP,
  expiry_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vendor_documents_vendor_id_idx ON vendor_documents(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_documents_status_idx ON vendor_documents(verification_status);
CREATE UNIQUE INDEX IF NOT EXISTS vendor_documents_vendor_id_type_idx ON vendor_documents(vendor_id, document_type);

CREATE TABLE IF NOT EXISTS vendor_status_history (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL,
  reason TEXT,
  actor_role VARCHAR(16) NOT NULL,
  actor_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_refresh_tokens (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vendor_refresh_tokens_vendor_id_idx ON vendor_refresh_tokens(vendor_id);

CREATE TABLE IF NOT EXISTS vendor_audit_logs (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_role VARCHAR(16) NOT NULL,
  actor_id UUID,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_notifications (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  channel VARCHAR(16) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'UNREAD',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vendor_notifications_vendor_id_idx ON vendor_notifications(vendor_id);

CREATE TABLE IF NOT EXISTS vendor_settlements (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  payout_reference TEXT,
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vendor_settlements_vendor_id_idx ON vendor_settlements(vendor_id);

CREATE TABLE IF NOT EXISTS vendor_device_requests (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  device_id TEXT,
  station_id UUID,
  location TEXT,
  reason TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vendor_device_requests_vendor_id_idx ON vendor_device_requests(vendor_id);

CREATE TABLE IF NOT EXISTS vendor_user_device_assignments (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS vendor_user_device_assignments_unique_idx
  ON vendor_user_device_assignments(vendor_id, user_id, device_id);

CREATE INDEX IF NOT EXISTS vendor_user_device_assignments_vendor_idx
  ON vendor_user_device_assignments(vendor_id);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'OPEN',
  priority VARCHAR(16) NOT NULL DEFAULT 'NORMAL',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_tickets_vendor_id_idx ON support_tickets(vendor_id);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  sender_role VARCHAR(16) NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_ticket_messages_ticket_idx ON support_ticket_messages(ticket_id);

CREATE TABLE IF NOT EXISTS stations (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  name TEXT NOT NULL,
  address TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  station_id UUID,
  status VARCHAR(32) NOT NULL DEFAULT 'offline',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY,
  device_id TEXT REFERENCES devices(id),
  type TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  device_id TEXT REFERENCES devices(id),
  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  device_id TEXT REFERENCES devices(id),
  user_id UUID REFERENCES users(id),
  vendor_id UUID REFERENCES vendors(id),
  booking_id UUID REFERENCES bookings(id),
  vehicle_type VARCHAR(16) NOT NULL,
  status VARCHAR(16) NOT NULL,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  price_per_kwh NUMERIC(10,4) NOT NULL,
  platform_fee_pct NUMERIC(5,2) NOT NULL,
  energy_kwh NUMERIC(12,6) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  platform_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  vendor_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  close_reason TEXT,
  illegal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telemetry (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  device_id TEXT REFERENCES devices(id),
  rpt CHAR(1) NOT NULL,
  st SMALLINT NOT NULL,
  v NUMERIC(10,3),
  p NUMERIC(10,3),
  e NUMERIC(12,6),
  tpwh NUMERIC(12,3),
  up NUMERIC(12,0),
  ts BIGINT NOT NULL,
  ct TEXT,
  ill SMALLINT,
  amt NUMERIC(12,2),
  rt NUMERIC(10,4),
  sid TEXT,
  tr TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_id UUID REFERENCES sessions(id),
  amount NUMERIC(12,2) NOT NULL,
  type VARCHAR(16) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_ledger (
  id BIGSERIAL PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  session_id UUID REFERENCES sessions(id),
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  platform_fee_pct NUMERIC(5,2) NOT NULL DEFAULT 20,
  min_wallet_car NUMERIC(10,2) NOT NULL DEFAULT 700,
  min_wallet_bike NUMERIC(10,2) NOT NULL DEFAULT 300,
  bookings_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
