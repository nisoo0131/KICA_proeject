import type { Role } from "@prisma/client";

// Single source of truth for the role matrix in design.md §13.1.
//
// The backend enforces it (see middleware/auth.ts requirePermission) and the frontend gates UI
// from the same table — /api/auth/me returns the caller's permission keys so the client never has
// to duplicate this matrix and drift from it.
//
// design.md marks several cells `△` ("프로젝트별 설정에 따라 허용 가능"). Per-project role config
// is not modeled at MVP (CLAUDE.md Permissions: "project-scoped first, org-wide role as fallback"
// is the target, not the current state), so every `△` is treated as ALLOWED here. Tightening this
// later means introducing a per-project role table and consulting it alongside this matrix.
//
// Reads are intentionally absent: any authenticated user may read anything. design.md §13.2 says
// to show the data and restrict only the actions ("조회 권한이 있으면 데이터는 보여주되 수정
// 버튼만 제한한다").

export const ALL_ROLES: Role[] = ["PLANNER", "UIUX", "DEVELOPER", "BUSINESS", "ADMIN"];

export type Permission =
  | "project.create"
  | "project.update"
  | "requirement.create"
  | "requirement.update"
  | "requirement.confirm"
  | "requirement.link"
  | "screen.write"
  | "wireframe.write"
  | "hifi.write"
  | "design.confirm"
  | "test.write"
  | "issue.write"
  | "comment.write"
  | "decision.write"
  | "admin.settings";

interface PermissionSpec {
  roles: Role[];
  /** Shown in the 403 body and as the frontend's disabled-control tooltip (design.md §11.3). */
  label: string;
}

const MATRIX: Record<Permission, PermissionSpec> = {
  "project.create": { roles: ["PLANNER", "ADMIN"], label: "프로젝트 생성" },
  "project.update": { roles: ["PLANNER", "ADMIN"], label: "프로젝트 설정 변경" },

  "requirement.create": { roles: ["PLANNER", "UIUX", "BUSINESS", "ADMIN"], label: "요구사항 등록" },
  "requirement.update": { roles: ["PLANNER", "BUSINESS", "ADMIN"], label: "요구사항 수정" },
  "requirement.confirm": { roles: ["PLANNER", "ADMIN"], label: "요구사항 확정" },
  // Linking/unlinking screens is a modification of the requirement, so it follows 요구사항 수정.
  "requirement.link": { roles: ["PLANNER", "BUSINESS", "ADMIN"], label: "요구사항-화면 연결" },

  "screen.write": { roles: ["PLANNER", "UIUX", "ADMIN"], label: "화면정의 등록/수정" },
  "wireframe.write": { roles: ["PLANNER", "UIUX", "ADMIN"], label: "와이어프레임 등록/수정" },
  "hifi.write": { roles: ["PLANNER", "UIUX", "ADMIN"], label: "Hi-Fi 디자인 등록/수정" },
  "design.confirm": { roles: ["PLANNER", "UIUX", "ADMIN"], label: "디자인 확정" },

  "test.write": { roles: ALL_ROLES, label: "테스트 결과 등록" },

  "issue.write": { roles: ALL_ROLES, label: "이슈 등록" },
  "comment.write": { roles: ALL_ROLES, label: "검토 의견 등록" },

  // Not enumerated in design.md §13.1. 의사결정 로그 records who decided what, so it is scoped to
  // the same authority as 요구사항 확정 rather than left open to every role.
  "decision.write": { roles: ["PLANNER", "ADMIN"], label: "의사결정 로그 등록" },

  "admin.settings": { roles: ["ADMIN"], label: "공통 코드/권한 설정" },
};

const ROLE_LABELS: Record<Role, string> = {
  PLANNER: "기획자",
  UIUX: "UI/UX",
  DEVELOPER: "개발자",
  BUSINESS: "사업부",
  ADMIN: "관리자",
};

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return MATRIX[permission].roles.includes(role);
}

/** Permission keys granted to a role — sent to the client so UI gating uses this same matrix. */
export function permissionsFor(role: Role | undefined): Permission[] {
  if (!role) return [];
  return (Object.keys(MATRIX) as Permission[]).filter((p) => can(role, p));
}

/**
 * Explains *why* an action is unavailable rather than denying it bare — design.md §11.3 prefers a
 * reason ("권한 없는 액션은 이유를 함께 안내") over a silently disabled control.
 */
export function denialMessage(permission: Permission): string {
  const { label, roles } = MATRIX[permission];
  const allowed = roles.map((r) => ROLE_LABELS[r]).join(", ");
  return `${label} 권한이 없습니다. ${allowed} 역할만 수행할 수 있어요.`;
}
