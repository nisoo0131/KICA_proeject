import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import { nextCode } from "../lib/codes";
import { logActivity } from "../lib/activity";
import { requirePermission, type AuthedRequest } from "../middleware/auth";

export const testScenariosRouter = Router();

const createSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  requirementId: z.string().optional(),
  screenId: z.string().optional(),
});

testScenariosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { projectId, status } = req.query as Record<string, string | undefined>;
    const scenarios = await prisma.testScenario.findMany({
      where: { projectId: projectId || undefined, status: status ? (status as any) : undefined },
      include: { owner: true, relations: { include: { requirement: true, screen: true } }, issues: true },
      orderBy: { updatedAt: "desc" },
    });
    res.json(scenarios);
  })
);

testScenariosRouter.post(
  "/",
  requirePermission("test.write"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body);
    const code = await nextCode("testScenario");
    const scenario = await prisma.testScenario.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        code,
        ownerId: req.user?.id,
        relations: data.requirementId || data.screenId
          ? { create: [{ requirementId: data.requirementId, screenId: data.screenId }] }
          : undefined,
      },
    });

    await logActivity({
      projectId: scenario.projectId,
      actorId: req.user?.id,
      targetType: "test_scenario",
      targetId: scenario.id,
      eventType: "created",
      afterValue: scenario.code,
    });

    res.status(201).json(scenario);
  })
);

testScenariosRouter.patch(
  "/:id",
  requirePermission("test.write"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = z
      .object({ status: z.enum(["NOT_RUN", "PASSED", "FAILED", "RETEST"]).optional(), title: z.string().optional() })
      .parse(req.body);
    const existing = await prisma.testScenario.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, "테스트 시나리오를 찾을 수 없습니다.");

    const scenario = await prisma.testScenario.update({ where: { id: req.params.id }, data });

    if (data.status && data.status !== existing.status) {
      await logActivity({
        projectId: scenario.projectId,
        actorId: req.user?.id,
        targetType: "test_scenario",
        targetId: scenario.id,
        eventType: "result_registered",
        beforeValue: existing.status,
        afterValue: scenario.status,
      });
    }

    res.json(scenario);
  })
);
