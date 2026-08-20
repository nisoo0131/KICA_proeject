// Korean label + badge-color-bucket maps for every enum in the Prisma schema.
// Bucket assignment follows design.md §2.2's 5-bucket semantic system exactly:
// blue = 정상/진행중, orange = 검토대기/일정임박, red = 지연/위험/실패, green(navy+check) = 완료/확정, gray = 보류/미실행.

export type Bucket = "blue" | "orange" | "red" | "green" | "gray";

interface Entry {
  label: string;
  bucket: Bucket;
}

export const projectStatus: Record<string, Entry> = {
  PREPARING: { label: "준비중", bucket: "gray" },
  IN_PROGRESS: { label: "진행중", bucket: "blue" },
  DELAYED: { label: "지연", bucket: "red" },
  TESTING: { label: "테스트중", bucket: "blue" },
  DONE: { label: "완료", bucket: "green" },
  ON_HOLD: { label: "보류", bucket: "gray" },
};

export const projectStage: Record<string, Entry> = {
  REQUIREMENT: { label: "요구사항", bucket: "blue" },
  SCHEDULE: { label: "일정수립", bucket: "blue" },
  SCREEN_DEF: { label: "화면정의", bucket: "blue" },
  WIREFRAME: { label: "와이어프레임", bucket: "blue" },
  HIFI: { label: "Hi-Fi 디자인", bucket: "blue" },
  INTEGRATION_TEST: { label: "통합테스트", bucket: "blue" },
  DONE: { label: "완료", bucket: "green" },
};
export const stageOrder = ["REQUIREMENT", "SCHEDULE", "SCREEN_DEF", "WIREFRAME", "HIFI", "INTEGRATION_TEST", "DONE"];

export const requirementStatus: Record<string, Entry> = {
  RECEIVED: { label: "접수", bucket: "gray" },
  IN_REVIEW: { label: "검토중", bucket: "orange" },
  CONFIRMED: { label: "확정", bucket: "green" },
  SCREEN_DEF: { label: "화면정의중", bucket: "blue" },
  DESIGN: { label: "디자인중", bucket: "blue" },
  TESTING: { label: "테스트중", bucket: "blue" },
  DONE: { label: "완료", bucket: "green" },
  ON_HOLD: { label: "보류", bucket: "gray" },
};

export const screenStatus: Record<string, Entry> = {
  PLANNING: { label: "기획중", bucket: "blue" },
  IN_REVIEW: { label: "검토중", bucket: "orange" },
  WIREFRAME: { label: "와이어프레임중", bucket: "blue" },
  DESIGN: { label: "디자인중", bucket: "blue" },
  CONFIRMED: { label: "확정", bucket: "green" },
  ON_HOLD: { label: "보류", bucket: "gray" },
};

export const artifactStatus: Record<string, Entry> = {
  DRAFT: { label: "작성중", bucket: "blue" },
  REVIEW_REQUESTED: { label: "검토요청", bucket: "orange" },
  REVISING: { label: "수정중", bucket: "blue" },
  CONFIRMED: { label: "확정", bucket: "green" },
  ON_HOLD: { label: "보류", bucket: "gray" },
};

export const testStatus: Record<string, Entry> = {
  NOT_RUN: { label: "미실행", bucket: "gray" },
  PASSED: { label: "성공", bucket: "green" },
  FAILED: { label: "실패", bucket: "red" },
  RETEST: { label: "재테스트 필요", bucket: "orange" },
};

export const issueStatus: Record<string, Entry> = {
  RECEIVED: { label: "접수", bucket: "gray" },
  IN_PROGRESS: { label: "조치중", bucket: "blue" },
  CONFIRM_WAIT: { label: "확인대기", bucket: "orange" },
  DONE: { label: "완료", bucket: "green" },
  ON_HOLD: { label: "보류", bucket: "gray" },
};

export const severity: Record<string, Entry> = {
  HIGH: { label: "High", bucket: "red" },
  MEDIUM: { label: "Medium", bucket: "orange" },
  LOW: { label: "Low", bucket: "gray" },
};

export const priority: Record<string, Entry> = {
  HIGH: { label: "높음", bucket: "red" },
  MEDIUM: { label: "보통", bucket: "orange" },
  LOW: { label: "낮음", bucket: "gray" },
};

export const role: Record<string, string> = {
  PLANNER: "기획자",
  UIUX: "UI/UX",
  DEVELOPER: "개발자",
  BUSINESS: "사업부",
  ADMIN: "관리자",
};

export const requirementType: Record<string, string> = {
  NEW: "신규",
  IMPROVEMENT: "개선",
  POLICY: "정책",
  BUG: "오류",
};

export function formatDate(value?: string | Date | null): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().slice(0, 10);
}
