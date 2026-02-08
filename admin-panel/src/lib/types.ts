export interface Vendor {
  id: string;
  name: string;
  kyc: 'Pending' | 'Approved' | 'Rejected';
  status: 'Active' | 'Suspended';
  revenue: number;
}

export interface Station {
  id: string;
  name: string;
  vendorId: string;
  status: 'Active' | 'Disabled';
  deviceCount: number;
}

export interface Device {
  id: string;
  stationId: string;
  vendorId: string;
  status: 'Online' | 'Offline';
  lastHeartbeat: string;
  fault: string | null;
}

export interface Session {
  id: string;
  deviceId: string;
  user: string;
  status: 'Active' | 'Stopped';
  startTime: string;
  startedAt?: string;
  endedAt?: string;
  energyKwh: number;
  cost: number;
  closeReason?: string;
  illegal?: boolean;
}

export interface Booking {
  id: string;
  deviceId: string;
  user: string;
  status: 'Booked' | 'Active' | 'Completed' | 'Expired';
  startAt: string;
  endAt: string;
}

export interface WalletTxn {
  id: string;
  user: string;
  sessionId: string;
  amount: number;
  type: 'Debit' | 'Credit';
  reason: string;
}

export interface Alert {
  id: string;
  deviceId: string;
  type: string;
  status: 'Open' | 'Resolved';
  createdAt: string;
}

export interface DashboardStats {
  vendors: number;
  stations: number;
  devices: number;
  devicesOnline: number;
  activeSessions: number;
  energyToday: number;
  revenueToday: number;
  platformEarnings: number;
  criticalAlerts: number;
}
