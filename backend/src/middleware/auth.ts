import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { ApiError } from "./errorHandler";
import { can, denialMessage, type Permission } from "../lib/permissions";
import { verifyToken } from "../lib/jwt";

export interface AuthedRequest extends Request {
  user?: { id: string; role: Role; name: string };
}

/**
 * Verifies a bearer token when present and attaches the caller. Never rejects — routes opt into
 * enforcement with requireAuth/requirePermission, which keeps /health and /api/auth/login open.
 *
 * The token is self-contained (id/role/name are claims), so this does no database work: an
 * unreachable database must not be able to break every authenticated request.
 */
export function attachCurrentUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (header?.startsWith("Bearer ")) {
    const payload = verifyToken(header.slice("Bearer ".length).trim());
    if (payload) {
      req.user = { id: payload.sub, role: payload.role, name: payload.name };
    }
  }
  next();
}

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(new ApiError(401, "로그인이 필요합니다."));
    return;
  }
  next();
}

/**
 * Enforces the design.md §13.1 matrix. The 403 body carries the reason and the roles that would be
 * allowed, so the client can surface "why" instead of an unexplained dead end (design.md §11.3).
 */
export function requirePermission(permission: Permission) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new ApiError(401, "로그인이 필요합니다."));
      return;
    }
    if (!can(req.user.role, permission)) {
      next(new ApiError(403, denialMessage(permission)));
      return;
    }
    next();
  };
}
