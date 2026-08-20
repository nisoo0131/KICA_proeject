import { prisma } from "./prisma";

const REVIEW_PENDING_DAYS_THRESHOLD = 3;
const DUE_SOON_DAYS_THRESHOLD = 7;

export interface ProjectRiskInfo {
  isDelayed: boolean;
  delayedDays: number;
  pendingReviewCount: number;
  openHighIssueCount: number;
  reason: string | null;
}

// Risk rules per CLAUDE.md/PRD §5.6: overdue schedule, long-pending reviews, open High issues,
// or an imminent due date with unconfirmed required artifacts.
export async function computeProjectRisk(projectId: string, dueDate: Date | null): Promise<ProjectRiskInfo> {
  const now = new Date();

  const [requirementIds, screenIds, openHighIssueCount] = await Promise.all([
    prisma.requirement.findMany({ where: { projectId }, select: { id: true } }).then((r) => r.map((x) => x.id)),
    prisma.screen.findMany({ where: { projectId }, select: { id: true } }).then((r) => r.map((x) => x.id)),
    prisma.issue.count({ where: { projectId, severity: "HIGH", status: { notIn: ["DONE"] } } }),
  ]);

  const staleThreshold = new Date(now.getTime() - REVIEW_PENDING_DAYS_THRESHOLD * 24 * 60 * 60 * 1000);
  const pendingReviewCount = await prisma.reviewComment.count({
    where: {
      status: "UNRESOLVED",
      createdAt: { lte: staleThreshold },
      targetId: { in: [...requirementIds, ...screenIds] },
    },
  });

  const isDelayed = !!dueDate && dueDate.getTime() < now.getTime();
  const delayedDays = isDelayed ? Math.floor((now.getTime() - dueDate!.getTime()) / (24 * 60 * 60 * 1000)) : 0;
  const isDueSoon =
    !!dueDate && !isDelayed && dueDate.getTime() - now.getTime() <= DUE_SOON_DAYS_THRESHOLD * 24 * 60 * 60 * 1000;

  let reason: string | null = null;
  if (isDelayed) reason = `마감일이 지났거나 지연이 발생한 프로젝트입니다.`;
  else if (openHighIssueCount > 0) reason = `해결되지 않은 High 이슈가 ${openHighIssueCount}건 있습니다.`;
  else if (pendingReviewCount > 0) reason = `검토 요청 후 ${REVIEW_PENDING_DAYS_THRESHOLD}일 이상 처리되지 않은 항목이 있습니다.`;
  else if (isDueSoon) reason = `종료 예정일이 임박했습니다.`;

  return { isDelayed, delayedDays, pendingReviewCount, openHighIssueCount, reason };
}
