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

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'Active',
  kyc_status VARCHAR(16) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

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
