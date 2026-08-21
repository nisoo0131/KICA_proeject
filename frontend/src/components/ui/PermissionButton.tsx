"use client";

import { useAuth, type Permission } from "@/lib/auth";

const ROLE_LABELS: Record<string, string> = {
  PLANNER: "기획자",
  UIUX: "UI/UX",
  DEVELOPER: "개발자",
  BUSINESS: "사업부",
  ADMIN: "관리자",
};

/** Mirrors the labels/roles in backend src/lib/permissions.ts, for the disabled-state tooltip. */
const PERMISSION_INFO: Record<Permission, { label: string; roles: string[] }> = {
  "project.create": { label: "프로젝트 생성", roles: ["PLANNER", "ADMIN"] },
  "project.update": { label: "프로젝트 설정 변경", roles: ["PLANNER", "ADMIN"] },
  "requirement.create": { label: "요구사항 등록", roles: ["PLANNER", "UIUX", "BUSINESS", "ADMIN"] },
  "requirement.update": { label: "요구사항 수정", roles: ["PLANNER", "BUSINESS", "ADMIN"] },
  "requirement.confirm": { label: "요구사항 확정", roles: ["PLANNER", "ADMIN"] },
  "requirement.link": { label: "요구사항-화면 연결", roles: ["PLANNER", "BUSINESS", "ADMIN"] },
  "screen.write": { label: "화면정의 등록/수정", roles: ["PLANNER", "UIUX", "ADMIN"] },
  "wireframe.write": { label: "와이어프레임 등록/수정", roles: ["PLANNER", "UIUX", "ADMIN"] },
  "hifi.write": { label: "Hi-Fi 디자인 등록/수정", roles: ["PLANNER", "UIUX", "ADMIN"] },
  "design.confirm": { label: "디자인 확정", roles: ["PLANNER", "UIUX", "ADMIN"] },
  "test.write": { label: "테스트 결과 등록", roles: ["PLANNER", "UIUX", "DEVELOPER", "BUSINESS", "ADMIN"] },
  "issue.write": { label: "이슈 등록", roles: ["PLANNER", "UIUX", "DEVELOPER", "BUSINESS", "ADMIN"] },
  "comment.write": { label: "검토 의견 등록", roles: ["PLANNER", "UIUX", "DEVELOPER", "BUSINESS", "ADMIN"] },
  "decision.write": { label: "의사결정 로그 등록", roles: ["PLANNER", "ADMIN"] },
  "admin.settings": { label: "공통 코드/권한 설정", roles: ["ADMIN"] },
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission: Permission;
  children: React.ReactNode;
}

/**
 * An action button gated on the caller's permissions.
 *
 * design.md §11.3 prefers explaining the restriction over a bare disabled control ("권한 없는
 * 액션은 이유를 함께 안내"), so the button stays visible and carries a tooltip naming the roles
 * that may perform it — rather than vanishing and leaving the user wondering where it went.
 *
 * This is UX only. The backend enforces the same matrix on every mutating route; a user who
 * bypasses the disabled state still gets a 403.
 */
export function PermissionButton({ permission, children, className, disabled, ...rest }: Props) {
  const { can } = useAuth();
  const allowed = can(permission);
  const info = PERMISSION_INFO[permission];
  const reason = `${info.label} 권한이 없습니다. ${info.roles
    .map((r) => ROLE_LABELS[r] ?? r)
    .join(", ")} 역할만 수행할 수 있어요.`;

  return (
    <button
      {...rest}
      className={className}
      disabled={disabled || !allowed}
      title={allowed ? rest.title : reason}
      aria-disabled={!allowed}
      style={{ ...rest.style, ...(allowed ? null : { opacity: 0.5, cursor: "not-allowed" }) }}
    >
      {children}
    </button>
  );
}
