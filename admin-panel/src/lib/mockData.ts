import type { Alert, Booking, Device, Session, Station, Vendor, WalletTxn } from './types';

export const navItems = [
  { href: '/dashboard', label: 'Dashboard', caption: 'KPIs + health' },
  { href: '/vendors', label: 'Vendors', caption: 'KYC + revenue' },
  { href: '/stations', label: 'Stations', caption: 'Locations + status' },
  { href: '/devices', label: 'Devices', caption: 'Live chargers' },
  { href: '/sessions/active', label: 'Active Sessions', caption: 'Realtime' },
  { href: '/sessions/history', label: 'Session History', caption: 'Audit trail' },
  { href: '/finance', label: 'Finance', caption: 'Revenue splits' },
  { href: '/wallet', label: 'Wallet', caption: 'Debits + refunds' },
  { href: '/bookings', label: 'Bookings', caption: 'Schedules' },
  { href: '/alerts', label: 'Alerts', caption: 'Faults + incidents' },
  { href: '/settings', label: 'Settings', caption: 'Platform rules' },
  { href: '/activity', label: 'Login Activity', caption: 'Admin access' },
];

export const vendors: Vendor[] = [
  { id: 'VEND-01', name: 'Metro Charge', kyc: 'Approved', status: 'Active', revenue: 152400 },
  { id: 'VEND-02', name: 'Green Spark', kyc: 'Pending', status: 'Active', revenue: 80400 },
  { id: 'VEND-03', name: 'City Plug', kyc: 'Approved', status: 'Suspended', revenue: 12600 },
];

export const stations: Station[] = [
  { id: 'ST-001', name: 'MG Road Hub', vendorId: 'VEND-01', status: 'Active', deviceCount: 12 },
  { id: 'ST-009', name: 'Airport Lot', vendorId: 'VEND-02', status: 'Active', deviceCount: 8 },
  { id: 'ST-014', name: 'Riverside Dock', vendorId: 'VEND-03', status: 'Disabled', deviceCount: 4 },
];

export const devices: Device[] = [
  { id: 'charjeedec2025001', stationId: 'ST-001', vendorId: 'VEND-01', status: 'Online', lastHeartbeat: '2m ago', fault: null },
  { id: 'charjeedec2025002', stationId: 'ST-001', vendorId: 'VEND-01', status: 'Offline', lastHeartbeat: '1h ago', fault: 'Low voltage' },
  { id: 'charjeedec2025009', stationId: 'ST-009', vendorId: 'VEND-02', status: 'Online', lastHeartbeat: '30s ago', fault: null },
];

export const activeSessions: Session[] = [
  {
    id: 'SESS-001',
    deviceId: 'charjeedec2025001',
    user: '********31',
    status: 'Active',
    startTime: '08-02-2026 10:14',
    startedAt: '08-02-2026 10:14',
    energyKwh: 4.2,
    cost: 84,
  },
  {
    id: 'SESS-002',
    deviceId: 'charjeedec2025009',
    user: '********42',
    status: 'Active',
    startTime: '08-02-2026 10:21',
    startedAt: '08-02-2026 10:21',
    energyKwh: 1.6,
    cost: 32,
  },
];

export const sessionHistory: Session[] = [
  {
    id: 'SESS-989',
    deviceId: 'charjeedec2025002',
    user: '********77',
    status: 'Stopped',
    startTime: '08-02-2026 08:10',
    startedAt: '08-02-2026 08:10',
    endedAt: '08-02-2026 08:55',
    energyKwh: 12.8,
    cost: 256,
    closeReason: 'Normal',
  },
  {
    id: 'SESS-990',
    deviceId: 'charjeedec2025001',
    user: '********21',
    status: 'Stopped',
    startTime: '08-02-2026 09:02',
    startedAt: '08-02-2026 09:02',
    endedAt: '08-02-2026 09:41',
    energyKwh: 8.4,
    cost: 168,
    closeReason: 'Timeout',
    illegal: false,
  },
];

export const bookings: Booking[] = [
  {
    id: 'BK-22',
    deviceId: 'charjeedec2025001',
    user: '********21',
    status: 'Booked',
    startAt: '08-02-2026 14:00',
    endAt: '08-02-2026 14:30',
  },
  {
    id: 'BK-23',
    deviceId: 'charjeedec2025002',
    user: '********11',
    status: 'Expired',
    startAt: '08-02-2026 12:00',
    endAt: '08-02-2026 12:20',
  },
];

export const walletTxns: WalletTxn[] = [
  { id: 'WT-101', user: '********21', sessionId: 'SESS-990', amount: 168, type: 'Debit', reason: 'Charging' },
  { id: 'WT-102', user: '********09', sessionId: 'SESS-987', amount: 90, type: 'Credit', reason: 'Manual refund' },
];

export const alerts: Alert[] = [
  { id: 'AL-1', deviceId: 'charjeedec2025002', type: 'Low voltage', status: 'Open', createdAt: '08-02-2026 10:05' },
  { id: 'AL-2', deviceId: 'charjeedec2025005', type: 'Illegal consumption', status: 'Resolved', createdAt: '08-02-2026 09:20' },
];

export const dashboardStats = {
  vendors: 24,
  stations: 62,
  devices: 312,
  devicesOnline: 278,
  activeSessions: 48,
  energyToday: 1240.5,
  revenueToday: 186240,
  platformEarnings: 37248,
  criticalAlerts: 3,
};
