"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Person } from "@/components/ui/Avatar";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { FlaskIcon, ShieldIcon } from "@/components/ui/Icons";
import { useApi } from "@/lib/useApi";
import { formatDate, issueStatus, severity, testStatus } from "@/lib/labels";
import { PermissionButton } from "@/components/ui/PermissionButton";

interface TestScenarioRow {
  id: string; code: string; title: string; status: string; owner: { name: string } | null;
  relations: { requirement: { code: string } | null; screen: { code: string } | null }[];
  issues: { id: string }[];
}
interface IssueRow {
  id: string; code: string; title: string; severity: string; status: string; owner: { name: string } | null;
  relatedRequirement: { code: string } | null; relatedScreen: { code: string } | null; createdAt: string;
}

export default function TestIssueListPage() {
  const [tab, setTab] = useState<"scenarios" | "issues">("scenarios");
  const { data: scenarios, loading: sLoading, error: sError, refetch: sRefetch } = useApi<TestScenarioRow[]>("/api/test-scenarios");
  const { data: issues, loading: iLoading, error: iError, refetch: iRefetch } = useApi<IssueRow[]>("/api/issues");

  const kpi = useMemo(() => {
    const total = scenarios?.length ?? 0;
    const passed = scenarios?.filter((s) => s.status === "PASSED").length ?? 0;
    const failed = scenarios?.filter((s) => s.status === "FAILED").length ?? 0;
    const notRun = scenarios?.filter((s) => s.status === "NOT_RUN").length ?? 0;
    const openIssues = issues?.filter((i) => i.status !== "DONE").length ?? 0;
    const highIssues = issues?.filter((i) => i.severity === "HIGH" && i.status !== "DONE").length ?? 0;
    const successRate = total ? Math.round((passed / total) * 100) : 0;
    return { total, successRate, failed, notRun, openIssues, highIssues };
  }, [scenarios, issues]);

  return (
    <>
      <PageHeader
        title="테스트/이슈 목록"
        sub="테스트 시나리오 실행 결과와 결함/이슈를 통합 관리하고, 품질 현황을 확인하세요."
        actions={<PermissionButton permission="issue.write" className="btn btn-primary">+ 이슈 등록</PermissionButton>}
      />

      <div className="stat-mini-row">
        <StatCard label="전체 시나리오 수" value={kpi.total} icon={FlaskIcon} />
        <StatCard label="성공률" value={`${kpi.successRate}%`} icon={FlaskIcon} emphasis="blue" />
        <StatCard label="실패 수" value={kpi.failed} icon={ShieldIcon} emphasis={kpi.failed > 0 ? "red" : "neutral"} />
        <StatCard label="미실행 수" value={kpi.notRun} icon={FlaskIcon} />
        <StatCard label="미해결 이슈 수" value={kpi.openIssues} icon={ShieldIcon} emphasis={kpi.openIssues > 0 ? "orange" : "neutral"} />
        <StatCard label="High 이슈 수" value={kpi.highIssues} icon={ShieldIcon} emphasis={kpi.highIssues > 0 ? "red" : "neutral"} />
      </div>

      <div className="tabs">
        <button className={`tab ${tab === "scenarios" ? "active" : ""}`} onClick={() => setTab("scenarios")}>테스트 시나리오</button>
        <button className={`tab ${tab === "issues" ? "active" : ""}`} onClick={() => setTab("issues")}>이슈 관리</button>
      </div>

      {tab === "scenarios" && (
        <div className="card">
          {sLoading && <div className="card-body"><Skeleton rows={5} /></div>}
          {sError && <div className="card-body"><ErrorState message={sError} onRetry={sRefetch} /></div>}
          {scenarios && (
            scenarios.length === 0 ? (
              <div className="card-body"><EmptyState title="등록된 테스트 시나리오가 없어요." /></div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th><th>시나리오명</th><th>관련 요구사항</th><th>관련 화면</th><th>담당자</th><th>상태</th><th>결함 수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((s) => (
                      <tr key={s.id}>
                        <td className="row-link">{s.code}</td>
                        <td className="cell-name">{s.title}</td>
                        <td>{s.relations.map((r) => r.requirement?.code).filter(Boolean).join(", ") || "-"}</td>
                        <td>{s.relations.map((r) => r.screen?.code).filter(Boolean).join(", ") || "-"}</td>
                        <td>{s.owner && <Person name={s.owner.name} />}</td>
                        <td><Badge label={testStatus[s.status].label} bucket={testStatus[s.status].bucket} /></td>
                        <td>{s.issues.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {tab === "issues" && (
        <div className="card">
          {iLoading && <div className="card-body"><Skeleton rows={5} /></div>}
          {iError && <div className="card-body"><ErrorState message={iError} onRetry={iRefetch} /></div>}
          {issues && (
            issues.length === 0 ? (
              <div className="card-body"><EmptyState title="등록된 이슈가 없어요." /></div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th><th>제목</th><th>관련 화면</th><th>관련 요구사항</th><th>심각도</th><th>상태</th><th>담당자</th><th>등록일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((i) => (
                      <tr key={i.id}>
                        <td className="row-link">{i.code}</td>
                        <td className="cell-name">{i.title}</td>
                        <td>{i.relatedScreen?.code ?? "-"}</td>
                        <td>{i.relatedRequirement?.code ?? "-"}</td>
                        <td><Badge label={severity[i.severity].label} bucket={severity[i.severity].bucket} /></td>
                        <td><Badge label={issueStatus[i.status].label} bucket={issueStatus[i.status].bucket} /></td>
                        <td>{i.owner && <Person name={i.owner.name} />}</td>
                        <td className="cell-sub">{formatDate(i.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}
