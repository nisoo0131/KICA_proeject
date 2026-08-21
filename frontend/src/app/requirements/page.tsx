"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { RelationChips } from "@/components/ui/RelationChip";
import { Person } from "@/components/ui/Avatar";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { useApi } from "@/lib/useApi";
import { formatDate, priority, requirementStatus, requirementType } from "@/lib/labels";
import { PermissionButton } from "@/components/ui/PermissionButton";

interface RequirementRow {
  id: string; code: string; title: string; type: string; priority: string; status: string; updatedAt: string;
  owner: { name: string } | null; requester: { name: string } | null;
  screens: { screen: { id: string; code: string } }[];
}

export default function RequirementListPage() {
  const { data, loading, error, refetch } = useApi<RequirementRow[]>("/api/requirements");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((r) => {
      if (search && !r.title.includes(search) && !r.code.includes(search)) return false;
      if (status && r.status !== status) return false;
      return true;
    });
  }, [data, search, status]);

  return (
    <>
      <PageHeader
        title="요구사항 목록"
        sub="프로젝트별 요구사항을 우선순위, 상태, 화면 연결 여부, 담당자 기준으로 관리합니다."
        actions={<PermissionButton permission="requirement.create" className="btn btn-primary">+ 요구사항 등록</PermissionButton>}
      />

      <div className="filter-bar">
        <input className="input" placeholder="요구사항명 또는 ID 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">전체 상태</option>
          {Object.entries(requirementStatus).map(([key, entry]) => (
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
                    <th>요구사항 ID</th>
                    <th>요구사항명</th>
                    <th>구분</th>
                    <th>우선순위</th>
                    <th>상태</th>
                    <th>관련 화면</th>
                    <th>담당자</th>
                    <th>요청자</th>
                    <th>최근 수정일</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td><Link href={`/requirements/${r.id}`} className="row-link">{r.code}</Link></td>
                      <td className="cell-name">{r.title}</td>
                      <td>{requirementType[r.type]}</td>
                      <td><Badge label={priority[r.priority].label} bucket={priority[r.priority].bucket} /></td>
                      <td><Badge label={requirementStatus[r.status].label} bucket={requirementStatus[r.status].bucket} /></td>
                      <td><RelationChips items={r.screens.map((s) => s.screen)} hrefBase="/screens" /></td>
                      <td>{r.owner && <Person name={r.owner.name} />}</td>
                      <td>{r.requester?.name ?? "-"}</td>
                      <td className="cell-sub">{formatDate(r.updatedAt)}</td>
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
