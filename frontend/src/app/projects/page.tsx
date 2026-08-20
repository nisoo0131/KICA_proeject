"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Person } from "@/components/ui/Avatar";
import { ProgressBar, StageRail } from "@/components/ui/Progress";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { useApi } from "@/lib/useApi";
import { formatDate, projectStage, projectStatus } from "@/lib/labels";

interface ProjectRow {
  id: string; code: string; name: string; status: string; currentStage: string; progressRate: number;
  dueDate: string | null; startDate: string | null; updatedAt: string; owner: { name: string } | null;
  risk: { pendingReviewCount: number; isDelayed: boolean; delayedDays: number; reason: string | null };
  _count: { requirements: number; screens: number; issues: number };
}

export default function ProjectListPage() {
  const { data, loading, error, refetch } = useApi<ProjectRow[]>("/api/projects");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((p) => {
      if (search && !p.name.includes(search)) return false;
      if (status && p.status !== status) return false;
      return true;
    });
  }, [data, search, status]);

  return (
    <>
      <PageHeader title="프로젝트 목록" sub="전체 프로젝트의 진행 현황을 확인하고 관리하세요." />

      <div className="filter-bar">
        <input className="input" placeholder="프로젝트명 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">전체 상태</option>
          {Object.entries(projectStatus).map(([key, entry]) => (
            <option key={key} value={key}>{entry.label}</option>
          ))}
        </select>
      </div>

      {loading && <Skeleton rows={6} />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {data && (
        <div className="card">
          {filtered.length === 0 ? (
            <div className="card-body">
              <EmptyState title="조건에 맞는 결과가 없어요." action={<button className="btn btn-sm" onClick={() => { setSearch(""); setStatus(""); }}>필터 초기화</button>} />
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>프로젝트명</th>
                    <th>상태</th>
                    <th>현재 단계</th>
                    <th>진행률</th>
                    <th>검토 대기</th>
                    <th>이슈</th>
                    <th>담당자</th>
                    <th>종료 예정일</th>
                    <th>최근 변경</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/projects/${p.id}`} className="row-link cell-name">{p.name}</Link>
                        <div className="cell-sub">{p.code}</div>
                      </td>
                      <td><Badge label={projectStatus[p.status].label} bucket={projectStatus[p.status].bucket} /></td>
                      <td>{projectStage[p.currentStage].label}</td>
                      <td style={{ minWidth: 120 }}>
                        <div style={{ marginBottom: 4 }}>{p.progressRate}%</div>
                        <ProgressBar value={p.progressRate} />
                      </td>
                      <td>{p.risk.pendingReviewCount > 0 ? <Badge label={`${p.risk.pendingReviewCount}건`} bucket="orange" /> : "-"}</td>
                      <td>{p._count.issues > 0 ? <Badge label={`${p._count.issues}건`} bucket="red" /> : "-"}</td>
                      <td>{p.owner && <Person name={p.owner.name} />}</td>
                      <td style={{ color: p.risk.isDelayed ? "var(--red)" : undefined, fontWeight: p.risk.isDelayed ? 700 : 400 }}>
                        {formatDate(p.dueDate)}
                      </td>
                      <td className="cell-sub">{formatDate(p.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
