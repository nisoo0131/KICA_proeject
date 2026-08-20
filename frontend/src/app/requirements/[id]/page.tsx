"use client";

import { use, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ErrorState, Skeleton, EmptyState } from "@/components/ui/Feedback";
import { AlertIcon } from "@/components/ui/Icons";
import { useApi } from "@/lib/useApi";
import { formatDate, priority, requirementStatus, screenStatus } from "@/lib/labels";

interface RequirementDetail {
  id: string; code: string; title: string; status: string; priority: string; updatedAt: string;
  background: string | null; description: string | null; requestedAt: string | null; targetDate: string | null;
  requester: { name: string } | null; owner: { name: string } | null;
  screens: { screen: { id: string; code: string; name: string; status: string } }[];
  testRelations: { test: { id: string; code: string; title: string; status: string } }[];
  comments: { id: string; author: { name: string } | null; content: string; status: string; createdAt: string; type: string }[];
}

const TABS = ["상세 내용", "관련 화면", "검토 의견", "변경 이력"] as const;

export default function RequirementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error, refetch } = useApi<RequirementDetail>(`/api/requirements/${id}`);
  const [tab, setTab] = useState<(typeof TABS)[number]>("상세 내용");

  if (loading) return <Skeleton rows={8} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const unresolvedCount = data.comments.filter((c) => c.status === "UNRESOLVED").length;

  return (
    <>
      <PageHeader
        title="요구사항 상세"
        sub="요구사항의 상세 정보와 연관 정보를 확인하고 관리할 수 있습니다."
        breadcrumb={[{ label: "요구사항", href: "/requirements" }, { label: data.code }]}
        actions={
          <>
            <button className="btn">검토 요청</button>
            <button className="btn btn-primary">확정</button>
            <button className="btn">수정</button>
            <button className="btn btn-ghost">더보기</button>
          </>
        }
      />

      <div className="card" style={{ marginBottom: 18, padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontWeight: 700, color: "var(--blue)" }}>{data.code}</span>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>{data.title}</h3>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Badge label={requirementStatus[data.status].label} bucket={requirementStatus[data.status].bucket} />
          <Badge label={priority[data.priority].label} bucket={priority[data.priority].bucket} />
          <span className="cell-sub">담당자 {data.owner?.name ?? "-"} · 최종 수정일 {formatDate(data.updatedAt)}</span>
        </div>
      </div>

      {(data.screens.length > 0 || data.testRelations.length > 0) && (
        <div className="warn-banner">
          <span className="warn-banner-left">
            <AlertIcon />
            이 요구사항은 {data.screens.length}개 화면과 {data.testRelations.length}개 테스트 시나리오에 연결되어 있습니다. 변경 시 관련 항목의 재검토가 필요할 수 있습니다.
          </span>
        </div>
      )}

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t}
            {t === "검토 의견" && unresolvedCount > 0 && ` (${unresolvedCount})`}
          </button>
        ))}
      </div>

      {tab === "상세 내용" && (
        <div className="card">
          <div className="card-body">
            <div className="kv-row"><span className="kv-label">배경/목적</span><span className="kv-value">{data.background ?? "-"}</span></div>
            <div className="kv-row"><span className="kv-label">상세 내용</span><span className="kv-value" style={{ whiteSpace: "pre-line" }}>{data.description ?? "-"}</span></div>
            <div className="kv-row"><span className="kv-label">요청자</span><span className="kv-value">{data.requester?.name ?? "-"}</span></div>
            <div className="kv-row"><span className="kv-label">목표 반영일</span><span className="kv-value">{formatDate(data.targetDate)}</span></div>
          </div>
        </div>
      )}

      {tab === "관련 화면" && (
        <div className="card">
          <div className="card-body">
            {data.screens.length === 0 ? (
              <EmptyState title="연결된 화면이 없어요." />
            ) : (
              data.screens.map(({ screen }) => (
                <div key={screen.id} className="list-item">
                  <div style={{ flex: 1 }}>
                    <Link href={`/screens/${screen.id}`} className="li-title row-link">{screen.code} {screen.name}</Link>
                  </div>
                  <Badge label={screenStatus[screen.status].label} bucket={screenStatus[screen.status].bucket} />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "검토 의견" && (
        <div className="card">
          <div className="card-body">
            {data.comments.length === 0 ? (
              <EmptyState title="등록된 검토 의견이 없어요." />
            ) : (
              data.comments.map((c) => (
                <div key={c.id} className="comment">
                  <div style={{ flex: 1 }}>
                    <div className="c-head">
                      <span className="c-name">{c.author?.name ?? "익명"}</span>
                      <span className="c-time">{formatDate(c.createdAt)}</span>
                    </div>
                    <div className="c-body">{c.content}</div>
                    <Badge label={c.status === "UNRESOLVED" ? "미해결" : "해결됨"} bucket={c.status === "UNRESOLVED" ? "orange" : "green"} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "변경 이력" && (
        <div className="card">
          <div className="card-body">
            <EmptyState title="이 화면은 프로젝트 개요의 최근 변경사항에서 통합해 확인할 수 있어요." />
          </div>
        </div>
      )}
    </>
  );
}
