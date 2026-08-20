import { prisma } from "./prisma";

interface LogActivityInput {
  projectId?: string | null;
  actorId?: string | null;
  targetType: string;
  targetId: string;
  eventType: string;
  beforeValue?: string | null;
  afterValue?: string | null;
}

// Every status/version/decision change writes here (CLAUDE.md: "Status changed, version changed,
// decisions... automatically recorded"). Callers should await this after the primary write succeeds.
export function logActivity(input: LogActivityInput) {
  return prisma.activityLog.create({
    data: {
      projectId: input.projectId ?? undefined,
      actorId: input.actorId ?? undefined,
      targetType: input.targetType,
      targetId: input.targetId,
      eventType: input.eventType,
      beforeValue: input.beforeValue ?? undefined,
      afterValue: input.afterValue ?? undefined,
    },
  });
}
