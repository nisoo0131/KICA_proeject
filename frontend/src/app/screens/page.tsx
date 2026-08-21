"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { RelationChips } from "@/components/ui/RelationChip";
import { Person } from "@/components/ui/Avatar";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { useApi } from "@/lib/useApi";
import { artifactStatus, formatDate, screenStatus } from "@/lib/labels";
import { PermissionButton } from "@/components/ui/PermissionButton";

interface ScreenRow {
  id: string; code: string; name: string; menuPath: string | null; status: string; updatedAt: string;
  owner: { name: string } | null;
  requirements: { requirement: { id: string; code: string } }[];
  wireframes: { status: string; version: string }[];
  hifiDesigns: { status: string; version: string }[];
}

export default function ScreenListPage() {
  const { data, loading, error, refetch } = useApi<ScreenRow[]>("/api/screens");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((s) => {
      if (search && !s.name.includes(search) && !s.code.includes(search)) return false;
      if (status && s.status !== status) return false;
      return true;
    });
  }, [data, search, status]);

  return (
    <>
      <PageHeader
        title="화면 목록"
        sub="프로젝트 내 모든 화면의 기획·와이어프레임·디자인 진행 상태를 한 번에 비교합니다."
        actions={<PermissionButton permission="screen.write" className="btn btn-primary">+ 화면 추가</PermissionButton>}
      />

      <div className="filter-bar">
        <input className="input" placeholder="화면명 또는 ID 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">전체 상태</option>
          {Object.entries(screenStatus).map(([key, entry]) => (
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
                    <th>화면 ID</th>
                    <th>화면명</th>
                    <th>메뉴 경로</th>
                    <th>화면 상태</th>
                    <th>관련 요구사항</th>
                    <th>와이어프레임</th>
                    <th>Hi-Fi</th>
                    <th>담당자</th>
                    <th>최근 수정일</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const wf = s.wireframes[0];
                    const hifi = s.hifiDesigns[0];
                    return (
                      <tr key={s.id}>
                        <td><Link href={`/screens/${s.id}`} className="row-link">{s.code}</Link></td>
                        <td className="cell-name">{s.name}</td>
                        <td className="cell-sub">{s.menuPath ?? "-"}</td>
                        <td><Badge label={screenStatus[s.status].label} bucket={screenStatus[s.status].bucket} /></td>
                        <td><RelationChips items={s.requirements.map((r) => r.requirement)} hrefBase="/requirements" /></td>
                        <td>{wf ? <Badge label={`${artifactStatus[wf.status].label} · ${wf.version}`} bucket={artifactStatus[wf.status].bucket} /> : "-"}</td>
                        <td>{hifi ? <Badge label={`${artifactStatus[hifi.status].label} · ${hifi.version}`} bucket={artifactStatus[hifi.status].bucket} /> : "-"}</td>
                        <td>{s.owner && <Person name={s.owner.name} />}</td>
                        <td className="cell-sub">{formatDate(s.updatedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
