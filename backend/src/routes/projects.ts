import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import { computeProjectRisk } from "../lib/risk";
import { computeProgressRate } from "../lib/progress";
import { logActivity } from "../lib/activity";
import type { AuthedRequest } from "../middleware/auth";

export const projectsRouter = Router();

const createProjectSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  client: z.string().optional(),
  description: z.string().optional(),
  ownerId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  startDate: z.coerce.date().optional(),
});

const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(["PREPARING", "IN_PROGRESS", "DELAYED", "TESTING", "DONE", "ON_HOLD"]).optional(),
  currentStage: z
    .enum(["REQUIREMENT", "SCHEDULE", "SCREEN_DEF", "WIREFRAME", "HIFI", "INTEGRATION_TEST", "DONE"])
    .optional(),
});

projectsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, ownerId, search } = req.query as Record<string, string | undefined>;

    const projects = await prisma.project.findMany({
      where: {
        status: status ? (status as any) : undefined,
        ownerId: ownerId || undefined,
        name: search ? { contains: search, mode: "insensitive" } : undefined,
      },
      include: {
        owner: true,
        _count: { select: { requirements: true, screens: true, issues: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const withRisk = await Promise.all(
      projects.map(async (p) => {
        const risk = await computeProjectRisk(p.id, p.dueDate);
        return { ...p, risk };
      })
    );

    res.json(withRisk);
  })
);

projectsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: true,
        requirements: { select: { id: true, status: true } },
        screens: {
          include: {
            wireframes: { orderBy: { createdAt: "desc" }, take: 1 },
            hifiDesigns: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
        testScenarios: { select: { id: true, status: true } },
        issues: { where: { status: { notIn: ["DONE"] } }, orderBy: { createdAt: "desc" } },
        decisionLogs: { orderBy: { decidedAt: "desc" }, take: 10, include: { decidedBy: true } },
      },
    });
    if (!project) throw new ApiError(404, "프로젝트를 찾을 수 없습니다.");

    const activity = await prisma.activityLog.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { actor: true },
    });

    const risk = await computeProjectRisk(project.id, project.dueDate);

    const artifactStatus = {
      requirements: {
        total: project.requirements.length,
        confirmed: project.requirements.filter((r) => r.status !== "RECEIVED" && r.status !== "IN_REVIEW").length,
      },
      screens: {
        total: project.screens.length,
        confirmed: project.screens.filter((s) => s.status === "CONFIRMED").length,
      },
      wireframes: {
        total: project.screens.length,
        confirmed: project.screens.filter((s) => s.wireframes[0]?.status === "CONFIRMED").length,
      },
      hifiDesigns: {
        total: project.screens.length,
        confirmed: project.screens.filter((s) => s.hifiDesigns[0]?.status === "CONFIRMED").length,
      },
      tests: {
        total: project.testScenarios.length,
        confirmed: project.testScenarios.filter((t) => t.status === "PASSED").length,
      },
    };

    res.json({ ...project, risk, artifactStatus, recentActivity: activity });
  })
);

projectsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createProjectSchema.parse(req.body);
    const project = await prisma.project.create({ data });
    res.status(201).json(project);
  })
);

projectsRouter.patch(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = updateProjectSchema.parse(req.body);
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, "프로젝트를 찾을 수 없습니다.");

    let progressRate = existing.progressRate;
    if (data.currentStage) {
      // Simplified stage-confirmation ratio; see lib/progress.ts for the full rule.
      progressRate = computeProgressRate(data.currentStage, 0.5);
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { ...data, progressRate },
    });

    await logActivity({
      projectId: project.id,
      actorId: req.user?.id,
      targetType: "project",
      targetId: project.id,
      eventType: data.status ? "status_changed" : data.currentStage ? "stage_changed" : "updated",
      beforeValue: existing.status,
      afterValue: project.status,
    });

    res.json(project);
  })
);
