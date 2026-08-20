import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";

export interface AuthedRequest extends Request {
  user?: { id: string; role: string; name: string };
}

// STUB AUTH: real login/session verification is deferred (see CLAUDE.md Permissions section).
// Reads an `x-user-id` header if the client sends one, otherwise falls back to the first seeded
// admin user so the API is usable without a login flow during MVP development. Replace this with
// real session/JWT verification before any non-local deployment.
export async function attachCurrentUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const headerUserId = req.header("x-user-id");
    const user = headerUserId
      ? await prisma.user.findUnique({ where: { id: headerUserId } })
      : await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });

    if (user) {
      req.user = { id: user.id, role: user.role, name: user.name };
    }
  } catch (err) {
    // Degrade to "no current user" instead of hanging the request (e.g. DB unreachable) — this
    // runs on every request, so a lookup failure here must never block routes like /health.
    console.error("attachCurrentUser failed, continuing without a user:", err);
  }
  next();
}
