"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { ExternalLinkIcon, LockIcon } from "@/components/ui/Icons";
import { PermissionButton } from "@/components/ui/PermissionButton";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import type { Permission } from "@/lib/auth";
import { artifactStatus, formatDate } from "@/lib/labels";

interface ArtifactVersion {
  id: string; version: string; status: string; link: string | null; createdAt: string;
  author: { name: string } | null;
}
interface ScreenInfo {
  id: string; code: string; name: string; project: { name: string };
  requirements: { requirement: { id: string; code: string } }[];
}
interface Comment {
  id: string; author: { name: string } | null; content: string; status: string; createdAt: string;
}

export function ArtifactManagement({
  screenId,
  apiPath,
  targetType,
  title,
  writePermission,
}: {
  screenId: string;
  apiPath: string;
  targetType: "wireframe" | "hifi_design";
  title: string;
  /** wireframe.write or hifi.write — confirming is gated separately on design.confirm. */
  writePermission: Permission;
}) {
  const { data: screen } = useApi<ScreenInfo>(`/api/screens/${screenId}`);
  const { data: versions, loading, error, refetch } = useApi<ArtifactVersion[]>(`${apiPath}?screenId=${screenId}`);
  const { data: comments, refetch: refetchComments } = useApi<Comment[]>(`/api/comments?targetType=${targetType}&targetId=${screenId}`);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [commentFilter, setCommentFilter] = useState<"all" | "unresolved" | "resolved">("all");

  const selected = versions?.find((v) => v.id === selectedId) ?? versions?.[0];
  const unresolvedCount = comments?.filter((c) => c.status === "UNRESOLVED").length ?? 0;
  const filteredComments = comments?.filter((c) =>
    commentFilter === "all" ? true : commentFilter === "unresolved" ? c.status === "UNRESOLVED" : c.status === "RESOLVED"
  ) ?? [];

  async function changeStatus(status: string) {
    if (!selected) return;
    await api.patch(`${apiPath}/${selected.id}/status`, { status });
    refetch();
  }

  if (loading) return <Skeleton rows={8} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <>
      <PageHeader
        title={title}
        sub="대상 화면의 버전을 관리하고 검토 의견을 확인하세요."
        breadcrumb={[{ label: "화면기획", href: "/screens" }, { label: title, href: undefined }, { label: screen?.code ?? "" }]}
      />

      {screen && (
        <div className="card" style={{ marginBottom: 16, padding: "16px 22px", display: "flex", gap: 32 }}>
          <div>
            <div className="cell-sub">대상 화면</div>
            <Link href={`/screens/${screen.id}`} className="row-link cell-name">{screen.code}</Link>
          </div>
          <div>
            <div className="cell-sub">화면명</div>
            <div className="cell-name">{screen.name}</div>
          </div>
          <div>
            <div className="cell-sub">연관 프로젝트</div>
            <div>{screen.project.name}</div>
          </div>
        </div>
      )}

      <div className="col-2-1">
        <div>
          {!versions || versions.length === 0 ? (
            <div className="card"><div className="card-body"><EmptyState title="등록된 버전이 없어요." action={<PermissionButton permission={writePermission} className="btn btn-sm">+ 새 버전 업로드</PermissionButton>} /></div></div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <span className="card-title">최신 버전: {versions[0].version}</span>
                  <span className="pill-btns">
                    {selected?.link && (
                      <a href={selected.link} target="_blank" rel="noreferrer" className="btn btn-sm">
                        <ExternalLinkIcon /> 외부 링크 열기
                      </a>
                    )}
                    <PermissionButton permission={writePermission} className="btn btn-sm" onClick={() => changeStatus("REVIEW_REQUESTED")}>검토 요청</PermissionButton>
                    <PermissionButton permission="design.confirm" className="btn btn-sm btn-primary" onClick={() => changeStatus("CONFIRMED")}>확정</PermissionButton>
                  </span>
                </div>
                <div className="card-body">
                  {selected && (
                    <>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                        <Badge label={artifactStatus[selected.status].label} bucket={artifactStatus[selected.status].bucket} />
                        <span className="cell-sub">{selected.author?.name ?? "-"} · {formatDate(selected.createdAt)}</span>
                      </div>
                      <div className="thumb" style={{ width: "100%", height: 220 }}>
                        <ExternalLinkIcon />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title">검토 의견 ({comments?.length ?? 0})</span>
                </div>
                <div className="card-body">
                  <div className="pill-btns" style={{ marginBottom: 12 }}>
                    <button className={`btn btn-sm ${commentFilter === "all" ? "btn-primary" : ""}`} onClick={() => setCommentFilter("all")}>전체</button>
                    <button className={`btn btn-sm ${commentFilter === "unresolved" ? "btn-primary" : ""}`} onClick={() => setCommentFilter("unresolved")}>미해결 {unresolvedCount}</button>
                    <button className={`btn btn-sm ${commentFilter === "resolved" ? "btn-primary" : ""}`} onClick={() => setCommentFilter("resolved")}>해결됨</button>
                  </div>
                  {filteredComments.length === 0 ? (
                    <EmptyState title="해당하는 검토 의견이 없어요." />
                  ) : (
                    filteredComments.map((c) => (
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
            </>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><span className="card-title">버전 목록</span></div>
            <div className="card-body" style={{ padding: 8 }}>
              {versions?.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  style={{ width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: 8, background: selected?.id === v.id ? "var(--blue-light)" : "transparent" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700 }}>{v.version} {i === 0 && <span className="cell-sub">최신</span>}</span>
                    {v.status === "CONFIRMED" && <span className="version-locked"><LockIcon /></span>}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Badge label={artifactStatus[v.status].label} bucket={artifactStatus[v.status].bucket} />
                  </div>
                  <div className="cell-sub" style={{ marginTop: 4 }}>{formatDate(v.createdAt)} · {v.author?.name ?? "-"}</div>
                </button>
              ))}
            </div>
          </div>

          {screen && (
            <div className="card">
              <div className="card-header"><span className="card-title">관련 요구사항</span></div>
              <div className="card-body">
                {screen.requirements.length === 0 ? (
                  <EmptyState title="연결된 요구사항이 없어요." />
                ) : (
                  screen.requirements.map(({ requirement }) => (
                    <Link key={requirement.id} href={`/requirements/${requirement.id}`} className="chip" style={{ marginRight: 8, marginBottom: 8, display: "inline-flex" }}>
                      {requirement.code}
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
