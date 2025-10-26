// Minimal auth helper: stores authToken + refreshToken, performs silent refresh, and provides fetchWithAuth

let refreshTimeout: number | null = null;

function parseJwt(token: string | null) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (e) {
    return null;
  }
}

function scheduleRefresh() {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout as any);
    refreshTimeout = null;
  }

  const token = localStorage.getItem('authToken');
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return;

  const expiresAt = decoded.exp * 1000;
  const now = Date.now();
  // refresh 60s before expiry, or immediately if already expired
  const msUntilRefresh = Math.max(0, expiresAt - now - 60000);

  refreshTimeout = window.setTimeout(() => {
    refreshTokens().catch(() => {
      // if refresh fails, force logout
      clearSession();
      window.location.href = '/auth';
    });
  }, msUntilRefresh);
}

async function refreshTokens() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    throw new Error('Refresh failed');
  }

  const body = await res.json();
  if (body.token) localStorage.setItem('authToken', body.token);
  if (body.refreshToken) localStorage.setItem('refreshToken', body.refreshToken);
  scheduleRefresh();
  return body;
}

export async function login(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Login failed');
  }

  const body = await res.json();

  if (body.token) localStorage.setItem('authToken', body.token);
  if (body.refreshToken) localStorage.setItem('refreshToken', body.refreshToken);

  scheduleRefresh();
  return body;
}

export async function logout() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch (e) {
    // ignore
  }
  clearSession();
}

function clearSession() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  if (refreshTimeout) {
    clearTimeout(refreshTimeout as any);
    refreshTimeout = null;
  }
}

// fetch wrapper that attempts to refresh then retry on 401
export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  const token = localStorage.getItem('authToken');
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(input, { ...init, headers });

  if (res.status !== 401) return res;

  // try refresh and retry once
  try {
    await refreshTokens();
  } catch (e) {
    // refresh failed
    clearSession();
    return res;
  }

  const newToken = localStorage.getItem('authToken');
  if (!newToken) return res;

  const headers2 = new Headers(init.headers || {});
  headers2.set('Authorization', `Bearer ${newToken}`);
  return fetch(input, { ...init, headers: headers2 });
}

// on module init, schedule refresh if token exists
try {
  // When running in SSR-less env (Vite dev), window exists. For node, this will throw silently.
  if (typeof window !== 'undefined') scheduleRefresh();
} catch (e) {}

export function getAuthToken() {
  return localStorage.getItem('authToken');
}

export function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}
