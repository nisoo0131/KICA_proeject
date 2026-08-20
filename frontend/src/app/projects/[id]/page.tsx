"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StageRailLg, ProgressBar } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { Person } from "@/components/ui/Avatar";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { useApi } from "@/lib/useApi";
import { formatDate, projectStatus } from "@/lib/labels";

interface ProjectDetail {
  id: string; code: string; name: string; client: string | null; description: string | null;
  status: string; currentStage: string; progressRate: number; dueDate: string | null; createdAt: string;
  owner: { name: string } | null;
  requirements: { id: string; status: string }[];
  screens: { id: string; status: string }[];
  testScenarios: { id: string; status: string }[];
  issues: { id: string; code: string; title: string; severity: string; status: string }[];
  decisionLogs: { id: string; title: string; decision: string; decidedAt: string; decidedBy: { name: string } | null }[];
  recentActivity: { id: string; createdAt: string; afterValue: string | null; actor: { name: string } | null }[];
  risk: { pendingReviewCount: number; isDelayed: boolean; reason: string | null };
  artifactStatus: Record<string, { total: number; confirmed: number }>;
}

export default function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error, refetch } = useApi<ProjectDetail>(`/api/projects/${id}`);

  if (loading) return <Skeleton rows={8} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const artifactLabels: Record<string, string> = {
    requirements: "요구사항", screens: "화면정의", wireframes: "와이어프레임", hifiDesigns: "Hi-Fi 디자인", tests: "테스트",
  };

  return (
    <>
      <PageHeader
        title="프로젝트 개요"
        sub="프로젝트의 현재 상태와 핵심 정보를 한눈에 확인하세요."
        breadcrumb={[{ label: "프로젝트", href: "/projects" }, { label: data.name }]}
      />

      <div className="card" style={{ marginBottom: 24, padding: "24px 28px" }}>
        <StageRailLg currentStage={data.currentStage} />
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label" style={{ marginBottom: 10 }}>프로젝트 상태</div>
          <Badge label={projectStatus[data.status].label} bucket={projectStatus[data.status].bucket} />
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ marginBottom: 10 }}>진행률</div>
          <div className="stat-value" style={{ fontSize: 22, marginBottom: 8 }}>{data.progressRate}%</div>
          <ProgressBar value={data.progressRate} />
        </div>
        <div className="stat-card">
          <div className="stat-label">검토 대기</div>
          <div className="stat-value">{data.risk.pendingReviewCount}건</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">종료 예정일</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{formatDate(data.dueDate)}</div>
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">프로젝트 기본 정보</span></div>
          <div className="card-body">
            <div className="kv-row"><span className="kv-label">프로젝트명</span><span className="kv-value">{data.name}</span></div>
            <div className="kv-row"><span className="kv-label">프로젝트 코드</span><span className="kv-value">{data.code}</span></div>
            <div className="kv-row"><span className="kv-label">클라이언트</span><span className="kv-value">{data.client ?? "-"}</span></div>
            <div className="kv-row"><span className="kv-label">PM</span><span className="kv-value">{data.owner?.name ?? "-"}</span></div>
            <div className="kv-row"><span className="kv-label">설명</span><span className="kv-value">{data.description ?? "-"}</span></div>
            <div className="kv-row"><span className="kv-label">생성일</span><span className="kv-value">{formatDate(data.createdAt)}</span></div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">산출물 상태</span></div>
          <div className="card-body">
            {Object.entries(data.artifactStatus).map(([key, v]) => (
              <div key={key} className="kv-row" style={{ alignItems: "center" }}>
                <span className="kv-label">{artifactLabels[key] ?? key}</span>
                <span style={{ flex: 1 }}>
                  <ProgressBar value={v.total ? Math.round((v.confirmed / v.total) * 100) : 0} />
                </span>
                <span style={{ marginLeft: 10, fontSize: 12, color: "var(--text-tertiary)" }}>{v.confirmed}/{v.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header"><span className="card-title">미해결 이슈</span></div>
          <div className="card-body">
            {data.issues.length === 0 ? (
              <EmptyState title="미해결 이슈가 없어요." />
            ) : (
              data.issues.map((issue) => (
                <div key={issue.id} className="list-item">
                  <div style={{ flex: 1 }}>
                    <Link href="/test-issues" className="li-title row-link">{issue.code} {issue.title}</Link>
                  </div>
                  <Badge label={issue.severity} bucket={issue.severity === "HIGH" ? "red" : issue.severity === "MEDIUM" ? "orange" : "gray"} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">의사결정 로그</span></div>
          <div className="card-body">
            {data.decisionLogs.length === 0 ? (
              <EmptyState title="등록된 의사결정이 없어요." />
            ) : (
              data.decisionLogs.map((log) => (
                <div key={log.id} className="list-item">
                  <div style={{ flex: 1 }}>
                    <div className="li-title">{log.title}</div>
                    <div className="li-sub">{log.decision}</div>
                    <div className="li-sub">{formatDate(log.decidedAt)} · {log.decidedBy?.name ?? "-"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header"><span className="card-title">최근 변경사항</span></div>
        <div className="card-body">
          {data.recentActivity.length === 0 ? (
            <EmptyState title="최근 변경 내역이 없어요." />
          ) : (
            data.recentActivity.map((a) => (
              <div key={a.id} className="timeline-item">
                <span className="timeline-dot" />
                <span className="timeline-time">{formatDate(a.createdAt)}</span>
                <span className="timeline-body">{a.afterValue} · {a.actor?.name ?? "system"}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
