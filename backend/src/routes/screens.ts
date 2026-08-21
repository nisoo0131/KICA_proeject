import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import { nextCode } from "../lib/codes";
import { logActivity } from "../lib/activity";
import { requirePermission, type AuthedRequest } from "../middleware/auth";

export const screensRouter = Router();

const createSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
  menuPath: z.string().optional(),
  purpose: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().optional(),
  menuPath: z.string().optional(),
  purpose: z.string().optional(),
  ownerId: z.string().optional(),
  status: z.enum(["PLANNING", "IN_REVIEW", "WIREFRAME", "DESIGN", "CONFIRMED", "ON_HOLD"]).optional(),
});

screensRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { projectId, status, ownerId, search } = req.query as Record<string, string | undefined>;

    const screens = await prisma.screen.findMany({
      where: {
        projectId: projectId || undefined,
        status: status ? (status as any) : undefined,
        ownerId: ownerId || undefined,
        name: search ? { contains: search, mode: "insensitive" } : undefined,
      },
      include: {
        owner: true,
        requirements: { include: { requirement: true } },
        wireframes: { orderBy: { createdAt: "desc" }, take: 1 },
        hifiDesigns: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json(screens);
  })
);

screensRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const screen = await prisma.screen.findUnique({
      where: { id: req.params.id },
      include: {
        project: true,
        owner: true,
        requirements: { include: { requirement: true } },
        wireframes: { orderBy: { createdAt: "desc" } },
        hifiDesigns: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!screen) throw new ApiError(404, "화면을 찾을 수 없습니다.");

    const comments = await prisma.reviewComment.findMany({
      where: { targetType: "screen", targetId: screen.id },
      include: { author: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ ...screen, comments });
  })
);

screensRouter.post(
  "/",
  requirePermission("screen.write"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body);
    const code = await nextCode("screen");
    const screen = await prisma.screen.create({ data: { ...data, code, ownerId: req.user?.id } });

    await logActivity({
      projectId: screen.projectId,
      actorId: req.user?.id,
      targetType: "screen",
      targetId: screen.id,
      eventType: "created",
      afterValue: screen.code,
    });

    res.status(201).json(screen);
  })
);

screensRouter.patch(
  "/:id",
  requirePermission("screen.write"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = updateSchema.parse(req.body);
    const existing = await prisma.screen.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, "화면을 찾을 수 없습니다.");

    const screen = await prisma.screen.update({ where: { id: req.params.id }, data });

    if (data.status && data.status !== existing.status) {
      await logActivity({
        projectId: screen.projectId,
        actorId: req.user?.id,
        targetType: "screen",
        targetId: screen.id,
        eventType: "status_changed",
        beforeValue: existing.status,
        afterValue: screen.status,
      });
    }

    res.json(screen);
  })
);
