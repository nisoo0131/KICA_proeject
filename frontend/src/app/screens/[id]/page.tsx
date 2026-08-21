"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { useApi } from "@/lib/useApi";
import { artifactStatus, formatDate, screenStatus } from "@/lib/labels";
import { PermissionButton } from "@/components/ui/PermissionButton";

interface ScreenDetail {
  id: string; code: string; name: string; menuPath: string | null; purpose: string | null; status: string; updatedAt: string;
  project: { id: string; name: string };
  owner: { name: string } | null;
  requirements: { requirement: { id: string; code: string; title: string } }[];
  wireframes: { id: string; version: string; status: string; link: string | null; createdAt: string }[];
  hifiDesigns: { id: string; version: string; status: string; link: string | null; createdAt: string }[];
  comments: { id: string; author: { name: string } | null; content: string; status: string; createdAt: string }[];
}

export default function ScreenDefinitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error, refetch } = useApi<ScreenDetail>(`/api/screens/${id}`);

  if (loading) return <Skeleton rows={8} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const latestWireframe = data.wireframes[0];
  const latestHifi = data.hifiDesigns[0];

  return (
    <>
      <PageHeader
        title="화면정의"
        sub={data.purpose ?? undefined}
        breadcrumb={[{ label: "화면기획", href: "/screens" }, { label: data.code }]}
        actions={
          <>
            <PermissionButton permission="screen.write" className="btn">검토 요청</PermissionButton>
            <PermissionButton permission="screen.write" className="btn btn-primary">확정</PermissionButton>
            <PermissionButton permission="screen.write" className="btn">수정</PermissionButton>
          </>
        }
      />

      <div className="col-2-1">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><span className="card-title">기본 정보</span></div>
            <div className="card-body">
              <div className="kv-row"><span className="kv-label">화면 ID</span><span className="kv-value">{data.code}</span></div>
              <div className="kv-row"><span className="kv-label">화면명</span><span className="kv-value">{data.name}</span></div>
              <div className="kv-row"><span className="kv-label">메뉴 경로</span><span className="kv-value">{data.menuPath ?? "-"}</span></div>
              <div className="kv-row"><span className="kv-label">화면 목적</span><span className="kv-value">{data.purpose ?? "-"}</span></div>
              <div className="kv-row"><span className="kv-label">화면 상태</span><span className="kv-value"><Badge label={screenStatus[data.status].label} bucket={screenStatus[data.status].bucket} /></span></div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><span className="card-title">관련 요구사항</span></div>
            <div className="card-body">
              {data.requirements.length === 0 ? (
                <EmptyState title="연결된 요구사항이 없어요." action={<PermissionButton permission="requirement.link" className="btn btn-sm">+ 요구사항 추가</PermissionButton>} />
              ) : (
                <>
                  {data.requirements.map(({ requirement }) => (
                    <Link key={requirement.id} href={`/requirements/${requirement.id}`} className="chip" style={{ marginRight: 8, marginBottom: 8, display: "inline-flex" }}>
                      {requirement.code} {requirement.title}
                    </Link>
                  ))}
                  <div style={{ marginTop: 10 }}>
                    <PermissionButton permission="requirement.link" className="btn btn-sm">+ 요구사항 추가</PermissionButton>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">디자인 산출물</span></div>
            <div className="card-body">
              <div className="kv-row" style={{ alignItems: "center" }}>
                <span className="kv-label">Wireframe</span>
                <span style={{ flex: 1 }}>
                  {latestWireframe ? (
                    <Link href={`/screens/${id}/wireframe`} className="row-link">{latestWireframe.version}</Link>
                  ) : "-"}
                </span>
                {latestWireframe && <Badge label={artifactStatus[latestWireframe.status].label} bucket={artifactStatus[latestWireframe.status].bucket} />}
              </div>
              <div className="kv-row" style={{ alignItems: "center" }}>
                <span className="kv-label">Hi-Fi</span>
                <span style={{ flex: 1 }}>
                  {latestHifi ? (
                    <Link href={`/screens/${id}/hifi`} className="row-link">{latestHifi.version}</Link>
                  ) : "-"}
                </span>
                {latestHifi && <Badge label={artifactStatus[latestHifi.status].label} bucket={artifactStatus[latestHifi.status].bucket} />}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header"><span className="card-title">협업 · 검토 의견</span></div>
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
