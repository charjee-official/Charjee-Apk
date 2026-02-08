import {
  activeSessions,
  alerts,
  bookings,
  dashboardStats,
  devices,
  sessionHistory,
  stations,
  vendors,
  walletTxns,
} from './mockData';
import type {
  Alert,
  Booking,
  DashboardStats,
  Device,
  Session,
  Station,
  Vendor,
  WalletTxn,
} from './types';
import { getToken } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE ?? '';

type AuthResult = { accessToken: string };

function getAuthBase() {
  if (!BASE_URL) {
    return '';
  }

  if (BASE_URL.endsWith('/api/admin')) {
    return BASE_URL.replace(/\/api\/admin\/?$/, '');
  }

  return BASE_URL;
}

async function requestJson<T>(path: string): Promise<T> {
  if (!BASE_URL) {
    throw new Error('API base missing');
  }

  const token = getToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function requestJsonWithBody<T>(
  path: string,
  method: 'POST' | 'PUT',
  body?: Record<string, unknown>,
): Promise<T> {
  if (!BASE_URL) {
    throw new Error('API base missing');
  }

  const token = getToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function withFallback<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch {
    return fallback;
  }
}

export async function apiLogin(username: string, password: string): Promise<AuthResult> {
  const authBase = getAuthBase();
  if (!authBase) {
    return { accessToken: `demo-${btoa(username)}` };
  }

  const response = await fetch(`${authBase}/auth/password/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Invalid credentials');
  }

  return response.json() as Promise<AuthResult>;
}

export function fetchDashboardStats(): Promise<DashboardStats> {
  return withFallback(() => requestJson('/dashboard'), dashboardStats);
}

export function fetchVendors(): Promise<Vendor[]> {
  return withFallback(() => requestJson('/vendors'), vendors);
}

export function fetchVendor(id: string): Promise<Vendor | null> {
  const fallback = vendors.find((item) => item.id === id) ?? null;
  return withFallback(() => requestJson(`/vendors/${id}`), fallback);
}

export function fetchStations(): Promise<Station[]> {
  return withFallback(() => requestJson('/stations'), stations);
}

export function fetchStation(id: string): Promise<Station | null> {
  const fallback = stations.find((item) => item.id === id) ?? null;
  return withFallback(() => requestJson(`/stations/${id}`), fallback);
}

export function fetchStationsByVendor(vendorId: string): Promise<Station[]> {
  const fallback = stations.filter((item) => item.vendorId === vendorId);
  return withFallback(() => requestJson(`/vendors/${vendorId}/stations`), fallback);
}

export function fetchDevices(): Promise<Device[]> {
  return withFallback(() => requestJson('/devices'), devices);
}

export function fetchDevice(id: string): Promise<Device | null> {
  const fallback = devices.find((item) => item.id === id) ?? null;
  return withFallback(() => requestJson(`/devices/${id}`), fallback);
}

export function fetchDevicesByVendor(vendorId: string): Promise<Device[]> {
  const fallback = devices.filter((item) => item.vendorId === vendorId);
  return withFallback(() => requestJson(`/vendors/${vendorId}/devices`), fallback);
}

export function fetchDevicesByStation(stationId: string): Promise<Device[]> {
  const fallback = devices.filter((item) => item.stationId === stationId);
  return withFallback(() => requestJson(`/stations/${stationId}/devices`), fallback);
}

export function fetchActiveSessions(): Promise<Session[]> {
  return withFallback(() => requestJson('/sessions/active'), activeSessions);
}

export function fetchSessionHistory(): Promise<Session[]> {
  return withFallback(() => requestJson('/sessions/history'), sessionHistory);
}

export async function fetchSession(id: string): Promise<Session | null> {
  const fallback = [...activeSessions, ...sessionHistory].find((item) => item.id === id) ?? null;
  return withFallback(() => requestJson(`/sessions/${id}`), fallback);
}

export function fetchFinanceSessions(): Promise<Session[]> {
  return withFallback(() => requestJson('/finance/sessions'), sessionHistory);
}

export function fetchWalletTransactions(): Promise<WalletTxn[]> {
  return withFallback(() => requestJson('/wallet/transactions'), walletTxns);
}

export function fetchBookings(): Promise<Booking[]> {
  return withFallback(() => requestJson('/bookings'), bookings);
}

export function fetchAlerts(): Promise<Alert[]> {
  return withFallback(() => requestJson('/alerts'), alerts);
}

export function approveVendor(id: string): Promise<Vendor | null> {
  const fallback = vendors.find((item) => item.id === id) ?? null;
  return withFallback(() => requestJsonWithBody(`/vendors/${id}/approve`, 'POST'), fallback);
}

export function suspendVendor(id: string): Promise<Vendor | null> {
  const fallback = vendors.find((item) => item.id === id) ?? null;
  return withFallback(() => requestJsonWithBody(`/vendors/${id}/suspend`, 'POST'), fallback);
}

export function enableStation(id: string): Promise<Station | null> {
  const fallback = stations.find((item) => item.id === id) ?? null;
  return withFallback(() => requestJsonWithBody(`/stations/${id}/enable`, 'POST'), fallback);
}

export function disableStation(id: string): Promise<Station | null> {
  const fallback = stations.find((item) => item.id === id) ?? null;
  return withFallback(() => requestJsonWithBody(`/stations/${id}/disable`, 'POST'), fallback);
}

export function enableDevice(id: string): Promise<Device | null> {
  const fallback = devices.find((item) => item.id === id) ?? null;
  return withFallback(() => requestJsonWithBody(`/devices/${id}/enable`, 'POST'), fallback);
}

export function disableDevice(id: string): Promise<Device | null> {
  const fallback = devices.find((item) => item.id === id) ?? null;
  return withFallback(() => requestJsonWithBody(`/devices/${id}/disable`, 'POST'), fallback);
}

export function forceStopSession(id: string): Promise<Session | null> {
  const fallback = [...activeSessions, ...sessionHistory].find((item) => item.id === id) ?? null;
  return withFallback(() => requestJsonWithBody(`/sessions/${id}/force-stop`, 'POST'), fallback);
}

export function fetchSettings(): Promise<{
  platformFeePct: number;
  minWalletCar: number;
  minWalletBike: number;
  bookingsEnabled: boolean;
}> {
  return withFallback(
    () => requestJson('/settings'),
    { platformFeePct: 20, minWalletCar: 700, minWalletBike: 300, bookingsEnabled: true },
  );
}

export function updateSettings(input: {
  platformFeePct?: number;
  minWalletCar?: number;
  minWalletBike?: number;
  bookingsEnabled?: boolean;
}): Promise<{
  platformFeePct: number;
  minWalletCar: number;
  minWalletBike: number;
  bookingsEnabled: boolean;
}> {
  return withFallback(
    () => requestJsonWithBody('/settings', 'PUT', input),
    { platformFeePct: input.platformFeePct ?? 20, minWalletCar: input.minWalletCar ?? 700, minWalletBike: input.minWalletBike ?? 300, bookingsEnabled: input.bookingsEnabled ?? true },
  );
}
