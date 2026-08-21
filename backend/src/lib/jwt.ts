import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

const TOKEN_TTL = "12h";

export interface TokenPayload {
  sub: string;
  role: Role;
  name: string;
}

/**
 * Fail fast rather than defaulting: a silent fallback secret would mean anyone could mint valid
 * tokens for this deployment. Resolved lazily so importing this module (e.g. from a test or a
 * script) does not require the variable until a token is actually signed or verified.
 */
function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "JWT_SECRET 환경변수가 설정되지 않았거나 너무 짧습니다(32자 이상 필요). 서버를 시작할 수 없습니다."
    );
  }
  return value;
}

/** Throws if JWT_SECRET is missing — called once at boot so misconfiguration fails loudly. */
export function assertJwtConfigured(): void {
  secret();
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign({ role: payload.role, name: payload.name }, secret(), {
    subject: payload.sub,
    expiresIn: TOKEN_TTL,
  });
}

/** Returns null for any invalid/expired/tampered token — callers treat that as "not logged in". */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, secret());
    if (typeof decoded === "string" || !decoded.sub) return null;
    return {
      sub: String(decoded.sub),
      role: (decoded as jwt.JwtPayload).role as Role,
      name: String((decoded as jwt.JwtPayload).name ?? ""),
    };
  } catch {
    return null;
  }
}
