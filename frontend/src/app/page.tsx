"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StageRail } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { Person } from "@/components/ui/Avatar";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { AlertIcon, BriefcaseIcon, ClockIcon, ShieldIcon, UserIcon } from "@/components/ui/Icons";
import { useApi } from "@/lib/useApi";
import { formatDate } from "@/lib/labels";

function upcomingDeadlines(projects: DashboardData["projectProgress"]) {
  const now = Date.now();
  const horizon = 14 * 24 * 60 * 60 * 1000;
  return projects
    .filter((p) => p.dueDate && new Date(p.dueDate).getTime() - now <= horizon && new Date(p.dueDate).getTime() - now >= 0)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);
}

interface DashboardData {
  summary: { inProgressCount: number; delayedCount: number; pendingReviewCount: number; openIssueCount: number };
  projectProgress: Array<{
    id: string; code: string; name: string; currentStage: string; progressRate: number;
    isDelayed: boolean; delayedDays: number; pendingReviewCount: number; issueCount: number;
    dueDate: string | null; owner: { name: string } | null;
  }>;
  riskProjects: Array<{ id: string; name: string; reason: string; delayedDays: number; dueDate: string | null; owner: { name: string } | null }>;
  myActionItems: Array<{ key: string; label: string; description: string; count: number }>;
  recentActivity: Array<{ id: string; createdAt: string; targetType: string; eventType: string; afterValue: string | null; actor: { name: string } | null; project: { name: string } | null }>;
}

export default function HomePage() {
  const { data, loading, error, refetch } = useApi<DashboardData>("/api/dashboard");

  return (
    <>
      <PageHeader
        title="홈"
        sub="프로젝트 진행 현황과 내 업무를 한눈에 확인하세요."
        actions={
          <Link href="/projects" className="btn btn-primary">
            프로젝트 목록
          </Link>
        }
      />

      {loading && <Skeleton rows={6} />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {data && (
        <>
          <div className="stat-grid">
            <StatCard label="진행 중 프로젝트 수" value={data.summary.inProgressCount} icon={BriefcaseIcon} emphasis="blue" />
            <StatCard label="지연 프로젝트 수" value={data.summary.delayedCount} icon={ClockIcon} emphasis={data.summary.delayedCount > 0 ? "red" : "neutral"} />
            <StatCard label="검토 대기 건수" value={data.summary.pendingReviewCount} icon={UserIcon} emphasis={data.summary.pendingReviewCount > 0 ? "orange" : "neutral"} />
            <StatCard label="미해결 이슈 수" value={data.summary.openIssueCount} icon={ShieldIcon} emphasis="neutral" />
          </div>

          <div className="col-2-1" style={{ marginBottom: 16 }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">프로젝트 진행 위치</span>
                <Link href="/projects" className="card-link">전체 프로젝트 보기</Link>
              </div>
              <div className="card-body">
                {data.projectProgress.length === 0 ? (
                  <EmptyState title="아직 진행 중인 프로젝트가 없어요." />
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>프로젝트명</th>
                          <th>단계</th>
                          <th>진행률</th>
                          <th>검토대기</th>
                          <th>이슈</th>
                          <th>마감일</th>
                          <th>담당자</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.projectProgress.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <Link href={`/projects/${p.id}`} className="row-link cell-name">{p.name}</Link>
                            </td>
                            <td style={{ width: 180 }}>
                              <StageRail currentStage={p.currentStage} delayed={p.isDelayed} />
                            </td>
                            <td>{p.progressRate}%</td>
                            <td>{p.pendingReviewCount > 0 ? <Badge label={`${p.pendingReviewCount}건`} bucket="orange" /> : "-"}</td>
                            <td>{p.issueCount > 0 ? <Badge label={`${p.issueCount}건`} bucket="red" /> : "-"}</td>
                            <td className={p.isDelayed ? "" : ""} style={{ color: p.isDelayed ? "var(--red)" : undefined }}>
                              {formatDate(p.dueDate)}
                            </td>
                            <td>{p.owner && <Person name={p.owner.name} />}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">위험 프로젝트</span>
              </div>
              <div className="card-body">
                {data.riskProjects.length === 0 ? (
                  <EmptyState title="현재 위험 신호가 있는 프로젝트가 없어요." />
                ) : (
                  data.riskProjects.map((p) => (
                    <div key={p.id} className="list-item">
                      <AlertIcon className="text-[var(--red)]" />
                      <div style={{ flex: 1 }}>
                        <Link href={`/projects/${p.id}`} className="li-title row-link">{p.name}</Link>
                        <div className="li-sub">{p.reason}</div>
                        <div className="li-sub">마감일 {formatDate(p.dueDate)} · 담당자 {p.owner?.name ?? "-"}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="three-col">
            <div className="card">
              <div className="card-header"><span className="card-title">내 액션 아이템</span></div>
              <div className="card-body">
                {data.myActionItems.map((item) => (
                  <div key={item.key} className="list-item">
                    <div style={{ flex: 1 }}>
                      <div className="li-title">{item.label}</div>
                      <div className="li-sub">{item.description}</div>
                    </div>
                    {item.count > 0 && <span className="li-count">{item.count}</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">최근 변경사항</span></div>
              <div className="card-body">
                {data.recentActivity.length === 0 ? (
                  <EmptyState title="최근 변경 내역이 없어요." />
                ) : (
                  data.recentActivity.map((a) => (
                    <div key={a.id} className="timeline-item">
                      <span className="timeline-dot" />
                      <span className="timeline-time">{new Date(a.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="timeline-body">
                        {a.project?.name} - {a.afterValue} · {a.actor?.name ?? "system"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">마감 임박</span></div>
              <div className="card-body">
                {upcomingDeadlines(data.projectProgress).length === 0 ? (
                  <EmptyState title="14일 내 마감 예정인 프로젝트가 없어요." />
                ) : (
                  upcomingDeadlines(data.projectProgress).map((p) => (
                    <div key={p.id} className="list-item">
                      <div style={{ flex: 1 }}>
                        <Link href={`/projects/${p.id}`} className="li-title row-link">{p.name}</Link>
                        <div className="li-sub">마감일 {formatDate(p.dueDate)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
