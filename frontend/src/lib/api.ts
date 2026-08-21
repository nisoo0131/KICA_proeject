import { clearToken, getToken } from "./token";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * A 401 from any endpoint other than login means the stored token is missing, expired, or was
 * issued for a since-deleted account. Drop it and send the user to /login, remembering where they
 * were so they land back there after signing in.
 *
 * Login itself is excluded: a 401 there is "wrong password", which the form must render inline
 * rather than treating as a session expiry.
 */
function handleUnauthorized(path: string): void {
  if (path.startsWith("/api/auth/login")) return;
  clearToken();
  if (typeof window === "undefined") return;

  const here = window.location.pathname + window.location.search;
  const target = here === "/login" ? "/login" : `/login?next=${encodeURIComponent(here)}`;
  window.location.assign(target);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) handleUnauthorized(path);
    throw new ApiError(res.status, body.error ?? "요청을 처리하지 못했습니다.");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
