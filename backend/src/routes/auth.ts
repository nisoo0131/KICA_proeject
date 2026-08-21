import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import { signToken } from "../lib/jwt";
import { permissionsFor } from "../lib/permissions";
import { requireAuth, type AuthedRequest } from "../middleware/auth";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
});

// Deliberately identical for "unknown email" and "wrong password" — revealing which one was wrong
// turns the login form into an account-existence oracle.
const INVALID_CREDENTIALS = "이메일 또는 비밀번호가 올바르지 않습니다.";

// A pre-computed hash of a throwaway value. When the email doesn't exist we still run a bcrypt
// comparison against this so the response time matches the "user found, wrong password" path and
// doesn't leak which emails are registered.
const DUMMY_HASH = bcrypt.hashSync("timing-equalizer-not-a-real-password", 10);

// --- Login rate limit ------------------------------------------------------------------------
// In-memory and therefore PER PROCESS INSTANCE: it blunts naive brute force against a single
// server but is not a cluster-wide control. If this is ever scaled past one instance, move it to
// shared storage (Redis) or an edge/WAF rule.
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

function clearAttempts(key: string): void {
  attempts.delete(key);
}

// Bounded cleanup so a long-running instance under attack can't grow this map without limit.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (now > entry.resetAt) attempts.delete(key);
  }
}, ATTEMPT_WINDOW_MS).unref();

// --- Routes ----------------------------------------------------------------------------------

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const rateKey = req.ip ?? "unknown";

    if (tooManyAttempts(rateKey)) {
      throw new ApiError(429, "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.");
    }

    // passwordHash is omitted globally (see lib/prisma.ts); this is the one place it's read.
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      omit: { passwordHash: false },
    });

    const hash = user?.passwordHash ?? DUMMY_HASH;
    const passwordMatches = await bcrypt.compare(password, hash);

    // `user.passwordHash` being null means the account exists but has no credentials set; it must
    // not be loggable-into even though bcrypt just compared against the dummy hash.
    if (!user || !user.passwordHash || !passwordMatches) {
      throw new ApiError(401, INVALID_CREDENTIALS);
    }

    clearAttempts(rateKey);

    const token = signToken({ sub: user.id, role: user.role, name: user.name });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        permissions: permissionsFor(user.role),
      },
    });
  })
);

// No logout endpoint: tokens are stateless and the client simply discards its copy. Server-side
// revocation would need a token denylist, which is out of scope for the MVP.

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      // Token is validly signed but the account is gone (deleted since issue).
      throw new ApiError(401, "로그인이 필요합니다.");
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      permissions: permissionsFor(user.role),
    });
  })
);
