import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import type { AuthedRequest } from "../middleware/auth";

export const decisionLogsRouter = Router();

const createSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  decision: z.string().min(1),
  reason: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional(),
});

decisionLogsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { projectId } = req.query as Record<string, string | undefined>;
    const logs = await prisma.decisionLog.findMany({
      where: { projectId: projectId || undefined },
      include: { decidedBy: true },
      orderBy: { decidedAt: "desc" },
    });
    res.json(logs);
  })
);

decisionLogsRouter.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body);
    const log = await prisma.decisionLog.create({ data: { ...data, decidedById: req.user?.id } });
    res.status(201).json(log);
  })
);
