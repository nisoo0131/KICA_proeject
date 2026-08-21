// Token storage lives in its own module so the API client and the auth context can both reach it
// without importing each other (api.ts must clear the token on 401, and auth.tsx must set it on
// login — a direct dependency either way would be circular).
//
// localStorage rather than a cookie: the frontend (Vercel) and API (Render) are on different
// registrable domains, so a session cookie would be third-party and unreliable under Chrome's
// third-party cookie restrictions. The tradeoff is that a successful XSS can read the token, so
// keep the app free of unsanitized HTML injection.

const TOKEN_KEY = "planflow.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    // Private-mode / storage-disabled browsers: behave as logged out rather than throwing.
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore — the session simply won't persist across reloads */
  }
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
