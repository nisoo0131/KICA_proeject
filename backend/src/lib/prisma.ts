import { PrismaClient } from "@prisma/client";

// Single shared instance (avoids exhausting Postgres connections under ts-node-dev/tsx watch reloads).
export const prisma = new PrismaClient();
