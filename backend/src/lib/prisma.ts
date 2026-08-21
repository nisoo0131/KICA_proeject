import { PrismaClient } from "@prisma/client";

// Single shared instance (avoids exhausting Postgres connections under ts-node-dev/tsx watch reloads).
//
// `omit` strips passwordHash from EVERY user read globally, including nested includes like
// `include: { owner: true }` that routes use all over the app. Doing it here rather than at each
// call site means a new route cannot leak hashes by forgetting to select-list its fields.
// The login handler opts back in explicitly (omit: { passwordHash: false }) for that one query.
export const prisma = new PrismaClient({
  omit: { user: { passwordHash: true } },
});
