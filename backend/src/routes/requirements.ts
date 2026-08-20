import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import { nextCode } from "../lib/codes";
import { logActivity } from "../lib/activity";
import type { AuthedRequest } from "../middleware/auth";

export const requirementsRouter = Router();

const createSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  background: z.string().optional(),
  requesterId: z.string().optional(),
  type: z.enum(["NEW", "IMPROVEMENT", "POLICY", "BUG"]).default("NEW"),
});

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  background: z.string().optional(),
  type: z.enum(["NEW", "IMPROVEMENT", "POLICY", "BUG"]).optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  ownerId: z.string().optional(),
  targetDate: z.coerce.date().optional(),
  status: z
    .enum(["RECEIVED", "IN_REVIEW", "CONFIRMED", "SCREEN_DEF", "DESIGN", "TESTING", "DONE", "ON_HOLD"])
    .optional(),
  // Required when moving OUT of CONFIRMED (design.md §16 dialog structure: "확정 해제" needs a reason).
  statusChangeReason: z.string().optional(),
});

requirementsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { projectId, status, ownerId, priority, hasScreen, search } = req.query as Record<
      string,
      string | undefined
    >;

    const requirements = await prisma.requirement.findMany({
      where: {
        projectId: projectId || undefined,
        status: status ? (status as any) : undefined,
        ownerId: ownerId || undefined,
        priority: priority ? (priority as any) : undefined,
        title: search ? { contains: search, mode: "insensitive" } : undefined,
        screens: hasScreen === "true" ? { some: {} } : hasScreen === "false" ? { none: {} } : undefined,
      },
      include: {
        owner: true,
        requester: true,
        screens: { include: { screen: true } },
        _count: { select: { screens: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json(requirements);
  })
);

requirementsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const requirement = await prisma.requirement.findUnique({
      where: { id: req.params.id },
      include: {
        project: true,
        owner: true,
        requester: true,
        screens: { include: { screen: { include: { wireframes: true, hifiDesigns: true } } } },
        testRelations: { include: { test: true } },
      },
    });
    if (!requirement) throw new ApiError(404, "요구사항을 찾을 수 없습니다.");

    const comments = await prisma.reviewComment.findMany({
      where: { targetType: "requirement", targetId: requirement.id },
      include: { author: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ ...requirement, comments });
  })
);

requirementsRouter.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body);
    const code = await nextCode("requirement");
    const requirement = await prisma.requirement.create({
      data: { ...data, code, ownerId: req.user?.id, requestedAt: new Date() },
    });

    await logActivity({
      projectId: requirement.projectId,
      actorId: req.user?.id,
      targetType: "requirement",
      targetId: requirement.id,
      eventType: "created",
      afterValue: requirement.code,
    });

    res.status(201).json(requirement);
  })
);

requirementsRouter.patch(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = updateSchema.parse(req.body);
    const existing = await prisma.requirement.findUnique({
      where: { id: req.params.id },
      include: { screens: true, testRelations: true },
    });
    if (!existing) throw new ApiError(404, "요구사항을 찾을 수 없습니다.");

    // Risk 7 / PRD §12: unconfirming a requirement (leaving CONFIRMED) requires a reason.
    if (existing.status === "CONFIRMED" && data.status && data.status !== "CONFIRMED" && !data.statusChangeReason) {
      throw new ApiError(400, "확정을 해제하려면 변경 사유를 입력해 주세요.");
    }

    const { statusChangeReason, ...updateData } = data;
    const requirement = await prisma.requirement.update({ where: { id: req.params.id }, data: updateData });

    if (data.status && data.status !== existing.status) {
      await logActivity({
        projectId: requirement.projectId,
        actorId: req.user?.id,
        targetType: "requirement",
        targetId: requirement.id,
        eventType: "status_changed",
        beforeValue: existing.status,
        afterValue: requirement.status,
      });
    }

    // Impact warning payload (PRD §6.3): surfaced by the frontend when confirmed reqs change.
    const impactedScreens = existing.screens.length;
    const impactedTests = existing.testRelations.length;

    res.json({ requirement, impact: { impactedScreens, impactedTests } });
  })
);

requirementsRouter.post(
  "/:id/screens",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { screenId } = z.object({ screenId: z.string().min(1) }).parse(req.body);
    const requirement = await prisma.requirement.findUnique({ where: { id: req.params.id } });
    if (!requirement) throw new ApiError(404, "요구사항을 찾을 수 없습니다.");

    const link = await prisma.requirementScreenMap.upsert({
      where: { requirementId_screenId: { requirementId: req.params.id, screenId } },
      create: { requirementId: req.params.id, screenId, createdBy: req.user?.id },
      update: {},
    });

    await logActivity({
      projectId: requirement.projectId,
      actorId: req.user?.id,
      targetType: "requirement",
      targetId: requirement.id,
      eventType: "screen_linked",
      afterValue: screenId,
    });

    res.status(201).json(link);
  })
);

// Unlink is intentionally non-destructive to the underlying entities — the frontend should offer
// an Undo toast per design.md §4.6.
requirementsRouter.delete(
  "/:id/screens/:screenId",
  asyncHandler(async (req, res) => {
    await prisma.requirementScreenMap.delete({
      where: { requirementId_screenId: { requirementId: req.params.id, screenId: req.params.screenId } },
    });
    res.status(204).send();
  })
);
