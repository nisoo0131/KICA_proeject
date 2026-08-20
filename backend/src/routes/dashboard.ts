import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { computeProjectRisk } from "../lib/risk";
import type { AuthedRequest } from "../middleware/auth";

export const dashboardRouter = Router();

// Backs 01-home-dashboard: summary counts, project progress rail, risk list, my action items,
// recent activity. Deliberately nothing beyond what CLAUDE.md's Risk 10 allows on this screen —
// everything else lives in the project workspace.
dashboardRouter.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const projects = await prisma.project.findMany({
      include: { owner: true, _count: { select: { requirements: true, screens: true, issues: true } } },
    });

    const projectsWithRisk = await Promise.all(
      projects.map(async (p) => {
        const risk = await computeProjectRisk(p.id, p.dueDate);
        const pendingReviewCount = risk.pendingReviewCount;
        const issueCount = await prisma.issue.count({ where: { projectId: p.id, status: { notIn: ["DONE"] } } });
        return { ...p, risk, pendingReviewCount, issueCount };
      })
    );

    // Sort order per PRD §5.5: delayed > at-risk > oldest pending review > nearest due date > rest.
    const sorted = [...projectsWithRisk].sort((a, b) => {
      if (a.risk.isDelayed !== b.risk.isDelayed) return a.risk.isDelayed ? -1 : 1;
      const aRisk = !!a.risk.reason;
      const bRisk = !!b.risk.reason;
      if (aRisk !== bRisk) return aRisk ? -1 : 1;
      if (a.pendingReviewCount !== b.pendingReviewCount) return b.pendingReviewCount - a.pendingReviewCount;
      const aDue = a.dueDate?.getTime() ?? Infinity;
      const bDue = b.dueDate?.getTime() ?? Infinity;
      return aDue - bDue;
    });

    const inProgressCount = projects.filter((p) => p.status === "IN_PROGRESS").length;
    const delayedCount = projects.filter((p) => p.status === "DELAYED").length;
    const pendingReviewTotal = projectsWithRisk.reduce((sum, p) => sum + p.pendingReviewCount, 0);
    const openIssueTotal = await prisma.issue.count({ where: { status: { notIn: ["DONE"] } } });

    const riskProjects = sorted.filter((p) => p.risk.reason).slice(0, 5);

    // My action items: approximated per-bucket counts. Real per-user assignment is deferred with
    // auth (see middleware/auth.ts) — for now these are org-wide open-work counts, not "assigned to me".
    const [pendingReqReview, pendingDesignReview, recentDecisions, openIssuesOrRetest] = await Promise.all([
      prisma.reviewComment.count({ where: { targetType: "requirement", status: "UNRESOLVED" } }),
      prisma.reviewComment.count({ where: { targetType: { in: ["wireframe", "hifi_design"] }, status: "UNRESOLVED" } }),
      prisma.decisionLog.count({ where: { decidedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      prisma.issue.count({ where: { status: { notIn: ["DONE"] } } }),
    ]);

    const recentActivity = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actor: true, project: true },
    });

    res.json({
      summary: {
        inProgressCount,
        delayedCount,
        pendingReviewCount: pendingReviewTotal,
        openIssueCount: openIssueTotal,
      },
      projectProgress: sorted.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        currentStage: p.currentStage,
        progressRate: p.progressRate,
        isDelayed: p.risk.isDelayed,
        delayedDays: p.risk.delayedDays,
        pendingReviewCount: p.pendingReviewCount,
        issueCount: p.issueCount,
        dueDate: p.dueDate,
        owner: p.owner,
      })),
      riskProjects: riskProjects.map((p) => ({
        id: p.id,
        name: p.name,
        reason: p.risk.reason,
        delayedDays: p.risk.delayedDays,
        dueDate: p.dueDate,
        owner: p.owner,
      })),
      myActionItems: [
        { key: "requirement_review", label: "요구사항 검토", description: "검토가 필요한 요구사항이 있습니다.", count: pendingReqReview },
        { key: "design_review", label: "디자인 확인", description: "확인이 필요한 디자인이 있습니다.", count: pendingDesignReview },
        { key: "decision_review", label: "의사결정 확인", description: "의사결정이 필요한 항목이 있습니다.", count: recentDecisions },
        { key: "test_issue", label: "테스트/이슈 처리", description: "확인 및 처리가 필요한 항목이 있습니다.", count: openIssuesOrRetest },
      ],
      recentActivity,
    });
  })
);
