import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import { nextCode } from "../lib/codes";
import { logActivity } from "../lib/activity";
import type { AuthedRequest } from "../middleware/auth";

export const issuesRouter = Router();

const createSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  severity: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  relatedRequirementId: z.string().optional(),
  relatedScreenId: z.string().optional(),
  relatedTestId: z.string().optional(),
});

issuesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { projectId, status, severity, ownerId } = req.query as Record<string, string | undefined>;
    const issues = await prisma.issue.findMany({
      where: {
        projectId: projectId || undefined,
        status: status ? (status as any) : undefined,
        severity: severity ? (severity as any) : undefined,
        ownerId: ownerId || undefined,
      },
      include: { owner: true, relatedRequirement: true, relatedScreen: true, relatedTest: true },
      orderBy: [{ severity: "asc" }, { updatedAt: "desc" }],
    });
    res.json(issues);
  })
);

issuesRouter.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body);
    const code = await nextCode("issue");
    const issue = await prisma.issue.create({ data: { ...data, code, ownerId: req.user?.id } });

    await logActivity({
      projectId: issue.projectId,
      actorId: req.user?.id,
      targetType: "issue",
      targetId: issue.id,
      eventType: "created",
      afterValue: issue.code,
    });

    res.status(201).json(issue);
  })
);

issuesRouter.patch(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = z
      .object({
        status: z.enum(["RECEIVED", "IN_PROGRESS", "CONFIRM_WAIT", "DONE", "ON_HOLD"]).optional(),
        ownerId: z.string().optional(),
        severity: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
      })
      .parse(req.body);
    const existing = await prisma.issue.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, "이슈를 찾을 수 없습니다.");

    const issue = await prisma.issue.update({ where: { id: req.params.id }, data });

    if (data.status && data.status !== existing.status) {
      await logActivity({
        projectId: issue.projectId,
        actorId: req.user?.id,
        targetType: "issue",
        targetId: issue.id,
        eventType: "status_changed",
        beforeValue: existing.status,
        afterValue: issue.status,
      });
    }

    res.json(issue);
  })
);
