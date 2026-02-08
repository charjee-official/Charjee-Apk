INSERT INTO admin_settings (id, platform_fee_pct, min_wallet_car, min_wallet_bike, bookings_enabled)
VALUES (1, 20, 700, 300, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, phone, name)
VALUES
	('11111111-1111-1111-1111-111111111111', '+911111111111', 'Asha Patel'),
	('22222222-2222-2222-2222-222222222222', '+922222222222', 'Ravi Sharma')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO vendors (id, name, status, kyc_status)
VALUES
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Metro Charge', 'Active', 'Approved'),
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Green Spark', 'Active', 'Pending'),
	('cccccccc-cccc-cccc-cccc-cccccccccccc', 'City Plug', 'Suspended', 'Rejected')
ON CONFLICT (id) DO NOTHING;

INSERT INTO stations (id, vendor_id, name, address, status)
VALUES
	('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MG Road Hub', 'MG Road, Pune', 'Active'),
	('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Airport Lot', 'Airport Rd, Pune', 'Active'),
	('33333333-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Riverside Dock', 'River Rd, Pune', 'Disabled')
ON CONFLICT (id) DO NOTHING;

INSERT INTO devices (id, vendor_id, station_id, status, enabled)
VALUES
	('charjeedec2025001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'online', TRUE),
	('charjeedec2025002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'offline', TRUE),
	('charjeedec2025009', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'online', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO bookings (id, user_id, device_id, start_at, end_at, status)
VALUES
	('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'charjeedec2025001', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '2 hours 30 minutes', 'BOOKED'),
	('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'charjeedec2025002', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 30 minutes', 'EXPIRED')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sessions (
	id, device_id, user_id, vendor_id, booking_id, vehicle_type, status,
	started_at, ended_at, price_per_kwh, platform_fee_pct,
	energy_kwh, amount, platform_amount, vendor_amount, close_reason, illegal
)
VALUES
	(
		'dddddddd-0000-0000-0000-dddddddddddd',
		'charjeedec2025001',
		'11111111-1111-1111-1111-111111111111',
		'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
		NULL,
		'car',
		'ACTIVE',
		NOW() - INTERVAL '45 minutes',
		NULL,
		18.0,
		20.0,
		4.2,
		84.0,
		16.8,
		67.2,
		NULL,
		FALSE
	),
	(
		'eeeeeeee-0000-0000-0000-eeeeeeeeeeee',
		'charjeedec2025002',
		'22222222-2222-2222-2222-222222222222',
		'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
		NULL,
		'bike',
		'STOPPED',
		NOW() - INTERVAL '3 hours',
		NOW() - INTERVAL '2 hours 10 minutes',
		18.0,
		20.0,
		12.8,
		256.0,
		51.2,
		204.8,
		'Normal',
		FALSE
	)
ON CONFLICT (id) DO NOTHING;

INSERT INTO telemetry (session_id, device_id, rpt, st, v, p, e, tpwh, up, ts, ct, ill, amt, rt, sid, tr)
VALUES
	('dddddddd-0000-0000-0000-dddddddddddd', 'charjeedec2025001', 'i', 1, 220.0, 7.5, 4.2, 4200, 1, EXTRACT(EPOCH FROM NOW())::BIGINT, NULL, 0, 84.0, 18.0, NULL, NULL),
	('eeeeeeee-0000-0000-0000-eeeeeeeeeeee', 'charjeedec2025002', 'f', 0, 180.0, 6.1, 12.8, 12800, 1, EXTRACT(EPOCH FROM NOW())::BIGINT, NULL, 1, 256.0, 18.0, NULL, NULL);

INSERT INTO alerts (id, device_id, type, status)
VALUES
	('aaaaaaaa-0000-0000-0000-aaaaaaaaaaaa', 'charjeedec2025002', 'Low voltage', 'Open'),
	('bbbbbbbb-0000-0000-0000-bbbbbbbbbbbb', 'charjeedec2025002', 'Illegal consumption', 'Resolved')
ON CONFLICT (id) DO NOTHING;

INSERT INTO wallet_ledger (user_id, session_id, amount, type)
VALUES
	('22222222-2222-2222-2222-222222222222', 'eeeeeeee-0000-0000-0000-eeeeeeeeeeee', 256.0, 'Debit');

INSERT INTO vendor_ledger (vendor_id, session_id, amount)
VALUES
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-0000-0000-0000-eeeeeeeeeeee', 204.8);
