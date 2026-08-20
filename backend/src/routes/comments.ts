import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import type { AuthedRequest } from "../middleware/auth";

export const commentsRouter = Router();

const createSchema = z.object({
  targetType: z.enum(["requirement", "screen", "wireframe", "hifi_design"]),
  targetId: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(["GENERAL", "CHANGE_REQUEST", "CONFIRM_REQUEST", "DECISION_NEEDED"]).default("GENERAL"),
});

// Generic polymorphic comment thread (design.md §4.7 / §8.6): the unresolved count and target
// context are read from here by whichever detail page (요구사항/화면정의/와이어프레임/Hi-Fi) hosts it.
commentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { targetType, targetId } = req.query as Record<string, string | undefined>;
    if (!targetType || !targetId) throw new ApiError(400, "targetType과 targetId가 필요합니다.");
    const comments = await prisma.reviewComment.findMany({
      where: { targetType, targetId },
      include: { author: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(comments);
  })
);

commentsRouter.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body);
    const comment = await prisma.reviewComment.create({
      data: { ...data, authorId: req.user?.id },
    });
    res.status(201).json(comment);
  })
);

commentsRouter.patch(
  "/:id/resolve",
  asyncHandler(async (req, res) => {
    const { resolved } = z.object({ resolved: z.boolean() }).parse(req.body);
    const comment = await prisma.reviewComment.update({
      where: { id: req.params.id },
      data: { status: resolved ? "RESOLVED" : "UNRESOLVED" },
    });
    res.json(comment);
  })
);
