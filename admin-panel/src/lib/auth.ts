import { formatDateTime } from './dateTime';

const TOKEN_KEY = 'admin_token';
const ACTIVITY_KEY = 'admin_last_activity';
const LOGIN_LOG_KEY = 'admin_login_log';

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  touchActivity();
}

export function getToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ACTIVITY_KEY);
}

export function recordLogin(username: string) {
  const log = getLoginActivity();
  log.unshift({
    username,
    at: formatDateTime(new Date()),
    agent: navigator.userAgent,
  });
  localStorage.setItem(LOGIN_LOG_KEY, JSON.stringify(log.slice(0, 12)));
}

export function getLoginActivity(): { username: string; at: string; agent: string }[] {
  if (typeof window === 'undefined') {
    return [];
  }
  const raw = localStorage.getItem(LOGIN_LOG_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as { username: string; at: string; agent: string }[];
  } catch {
    return [];
  }
}

export function startActivityMonitor() {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = () => touchActivity();
  ['click', 'keydown', 'mousemove'].forEach((event) => window.addEventListener(event, handler));
  return () => ['click', 'keydown', 'mousemove'].forEach((event) => window.removeEventListener(event, handler));
}

export function isSessionExpired() {
  if (typeof window === 'undefined') {
    return true;
  }

  const timeoutMinutes = Number(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES ?? 30);
  const timeoutMs = Number.isFinite(timeoutMinutes) ? timeoutMinutes * 60_000 : 1_800_000;
  const last = localStorage.getItem(ACTIVITY_KEY);
  if (!last) {
    return false;
  }
  const lastAt = Number(last);
  return Date.now() - lastAt > timeoutMs;
}

function touchActivity() {
  localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
}
