"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";
import { clearToken, getToken, setToken } from "./token";

/**
 * Permission keys mirror backend `src/lib/permissions.ts`. The list is not hardcoded here — the
 * server sends the caller's keys on login and on /api/auth/me, so the design.md §13.1 matrix lives
 * in exactly one place and the UI cannot drift from what the API actually enforces.
 */
export type Permission =
  | "project.create"
  | "project.update"
  | "requirement.create"
  | "requirement.update"
  | "requirement.confirm"
  | "requirement.link"
  | "screen.write"
  | "wireframe.write"
  | "hifi.write"
  | "design.confirm"
  | "test.write"
  | "issue.write"
  | "comment.write"
  | "decision.write"
  | "admin.settings";

export type Role = "PLANNER" | "UIUX" | "DEVELOPER" | "BUSINESS" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  company: string | null;
  permissions: Permission[];
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // Starts true so guards render a loading state instead of briefly deciding "logged out" and
  // bouncing an authenticated user to /login on every refresh.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setIsLoading(false);
      return;
    }
    // Re-validate the stored token against the server rather than trusting it blindly: it may be
    // expired, or the account may have been removed since it was issued.
    api
      .get<AuthUser>("/api/auth/me")
      .then(setUser)
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<LoginResponse>("/api/auth/login", { email, password });
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    // Full assign rather than a client transition so every cached page and in-memory fetch result
    // from the previous session is discarded.
    if (typeof window !== "undefined") window.location.assign("/login");
  }, []);

  const can = useCallback(
    (permission: Permission) => Boolean(user?.permissions.includes(permission)),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, can }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
