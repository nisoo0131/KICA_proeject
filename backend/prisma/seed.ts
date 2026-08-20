import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY);

async function main() {
  console.log("Seeding...");

  // Clear in FK-safe order for repeatable local seeding.
  await prisma.activityLog.deleteMany();
  await prisma.decisionLog.deleteMany();
  await prisma.reviewComment.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.testRelation.deleteMany();
  await prisma.testScenario.deleteMany();
  await prisma.hiFiDesign.deleteMany();
  await prisma.wireframe.deleteMany();
  await prisma.requirementScreenMap.deleteMany();
  await prisma.screen.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const [minsoo, jihyun, jungwoo, yuri, jaehoon, soyeon, daeun, sumin] = await Promise.all([
    prisma.user.create({ data: { name: "김민수", email: "minsoo.kim@planflow.io", role: "ADMIN", company: "플랜플로우 주식회사" } }),
    prisma.user.create({ data: { name: "이지현", email: "jihyun.lee@planflow.io", role: "BUSINESS", company: "플랜플로우 주식회사" } }),
    prisma.user.create({ data: { name: "박정우", email: "jungwoo.park@planflow.io", role: "UIUX", company: "플랜플로우 주식회사" } }),
    prisma.user.create({ data: { name: "최유리", email: "yuri.choi@planflow.io", role: "DEVELOPER", company: "플랜플로우 주식회사" } }),
    prisma.user.create({ data: { name: "이재훈", email: "jaehoon.lee@planflow.io", role: "DEVELOPER", company: "플랜플로우 주식회사" } }),
    prisma.user.create({ data: { name: "한소연", email: "soyeon.han@planflow.io", role: "PLANNER", company: "플랜플로우 주식회사" } }),
    prisma.user.create({ data: { name: "정다은", email: "daeun.jung@planflow.io", role: "PLANNER", company: "플랜플로우 주식회사" } }),
    prisma.user.create({ data: { name: "이수민", email: "sumin.lee@planflow.io", role: "BUSINESS", company: "플랜플로우 주식회사" } }),
  ]);

  const projectDefs = [
    { code: "AUTH-2025-01", name: "통합인증 리뉴얼", client: "플랜플로우 주식회사", ownerId: minsoo.id, status: "IN_PROGRESS", currentStage: "WIREFRAME", dueDate: daysFromNow(30), description: "기존 통합인증 시스템의 보안 강화 및 사용자 경험 개선을 위한 전면 리뉴얼 프로젝트입니다." },
    { code: "KICA-2025-02", name: "KICA 대시보드 고도화", client: "데이터서비스팀", ownerId: jihyun.id, status: "DELAYED", currentStage: "SCREEN_DEF", dueDate: daysFromNow(-5), description: "KICA 운영 대시보드의 지표 표시 및 알림 기능을 고도화합니다." },
    { code: "MOB-2025-03", name: "모바일 신청 개선", client: "모바일서비스팀", ownerId: jungwoo.id, status: "IN_PROGRESS", currentStage: "SCHEDULE", dueDate: daysFromNow(20), description: "모바일 신청 플로우의 이탈률을 낮추기 위한 UX 개선 프로젝트입니다." },
    { code: "MEM-2025-04", name: "회원센터 개편", client: "CX혁신팀", ownerId: yuri.id, status: "TESTING", currentStage: "INTEGRATION_TEST", dueDate: daysFromNow(15), description: "회원센터 전체 메뉴 구조와 화면을 재설계합니다." },
    { code: "NOTI-2025-05", name: "알림 시스템 고도화", client: "플랫폼개발팀", ownerId: jaehoon.id, status: "DELAYED", currentStage: "SCREEN_DEF", dueDate: daysFromNow(-3), description: "채널별 알림 발송 조건과 템플릿 관리 기능을 개선합니다." },
    { code: "FIN-2025-06", name: "정산 프로세스 자동화", client: "경영지원팀", ownerId: soyeon.id, status: "IN_PROGRESS", currentStage: "HIFI", dueDate: daysFromNow(5), description: "수기로 처리되던 정산 프로세스를 자동화합니다." },
    { code: "MYPG-2025-07", name: "마이페이지 개편", client: "디자인팀", ownerId: daeun.id, status: "IN_PROGRESS", currentStage: "SCREEN_DEF", dueDate: daysFromNow(40), description: "마이페이지 정보 구조를 단순화합니다." },
    { code: "RPT-2025-08", name: "보고서 자동 생성", client: "데이터서비스팀", ownerId: sumin.id, status: "TESTING", currentStage: "INTEGRATION_TEST", dueDate: daysFromNow(25), description: "정기 보고서를 자동으로 생성하는 기능을 추가합니다." },
  ] as const;

  const projects = [];
  for (const def of projectDefs) {
    const stageIndex = ["REQUIREMENT", "SCHEDULE", "SCREEN_DEF", "WIREFRAME", "HIFI", "INTEGRATION_TEST", "DONE"].indexOf(def.currentStage);
    const progressRate = Math.round(((stageIndex + 0.5) / 6) * 100);
    const project = await prisma.project.create({ data: { ...def, progressRate, startDate: daysFromNow(-60) } });
    projects.push(project);
  }
  const [authProj, kicaProj, mobProj, memProj, notiProj, finProj] = projects;

  // ---- 통합인증 리뉴얼: fully fleshed out requirement -> screen -> wireframe -> hifi -> test chain ----
  const req103 = await prisma.requirement.create({
    data: {
      code: "REQ-103",
      projectId: authProj.id,
      title: "비밀번호 재설정 정책 개선",
      type: "POLICY",
      priority: "HIGH",
      status: "IN_REVIEW",
      background: "최근 보안 정책 강화 및 고객 요청에 따라 비밀번호 재설정 정책을 개선합니다.",
      description:
        "- 비밀번호 재설정 시 본인 확인 절차 강화 (이메일 인증 + SMS 인증)\n- 비밀번호 최소 길이 10자 이상, 영문/숫자/특수문자 포함 필수\n- 최근 5회 사용한 비밀번호 재사용 제한\n- 비밀번호 만료 기간 90일 적용",
      requesterId: jungwoo.id,
      ownerId: jihyun.id,
      requestedAt: daysFromNow(-20),
      targetDate: daysFromNow(10),
    },
  });
  const req121 = await prisma.requirement.create({
    data: {
      code: "REQ-121",
      projectId: authProj.id,
      title: "휴대폰 인증 추가",
      type: "NEW",
      priority: "HIGH",
      status: "IN_REVIEW",
      requesterId: yuri.id,
      ownerId: jihyun.id,
      requestedAt: daysFromNow(-18),
      targetDate: daysFromNow(12),
      description: "본인확인 수단으로 휴대폰 SMS 인증을 추가합니다.",
    },
  });
  await prisma.requirement.create({
    data: { code: "REQ-118", projectId: kicaProj.id, title: "메인 대시보드 KPI 위젯 추가", type: "NEW", priority: "MEDIUM", status: "CONFIRMED", requesterId: sumin.id, ownerId: jihyun.id, requestedAt: daysFromNow(-15), targetDate: daysFromNow(8) },
  });
  await prisma.requirement.create({
    data: { code: "REQ-110", projectId: kicaProj.id, title: "알림 설정 고도화", type: "IMPROVEMENT", priority: "MEDIUM", status: "SCREEN_DEF", requesterId: jaehoon.id, ownerId: jihyun.id, requestedAt: daysFromNow(-14), targetDate: daysFromNow(9) },
  });
  await prisma.requirement.create({
    data: { code: "REQ-090", projectId: mobProj.id, title: "결제 라인 요청", type: "IMPROVEMENT", priority: "HIGH", status: "IN_REVIEW", requesterId: soyeon.id, ownerId: jungwoo.id, requestedAt: daysFromNow(-10), targetDate: daysFromNow(15) },
  });
  await prisma.requirement.create({
    data: { code: "REQ-095", projectId: mobProj.id, title: "다크 모드 지원", type: "NEW", priority: "LOW", status: "ON_HOLD", requesterId: jihyun.id, ownerId: jungwoo.id, requestedAt: daysFromNow(-30), targetDate: daysFromNow(60) },
  });

  const scr024 = await prisma.screen.create({
    data: { code: "SCR-024", projectId: authProj.id, name: "인증서 신청", menuPath: "인증 관리 > 인증서 신청", purpose: "사용자가 전자서명을 위한 인증서를 신청하고, 신청 내역을 조회할 수 있다.", status: "DESIGN", ownerId: jungwoo.id },
  });
  const scr210 = await prisma.screen.create({
    data: { code: "SCR-210", projectId: authProj.id, name: "비밀번호 재설정 요청", menuPath: "인증/보안 > 비밀번호 재설정", purpose: "사용자가 비밀번호 재설정을 요청한다.", status: "IN_REVIEW", ownerId: jungwoo.id },
  });
  const scr211 = await prisma.screen.create({
    data: { code: "SCR-211", projectId: authProj.id, name: "본인 인증 (이메일/SMS)", menuPath: "인증/보안 > 본인확인", purpose: "이메일 또는 SMS로 본인 확인을 진행한다.", status: "WIREFRAME", ownerId: jungwoo.id },
  });
  await prisma.screen.create({
    data: { code: "SCR-025", projectId: authProj.id, name: "본인확인", menuPath: "인증/보안 > 본인확인", purpose: "본인확인 절차를 처리한다.", status: "CONFIRMED", ownerId: jungwoo.id },
  });
  await prisma.screen.create({
    data: { code: "SCR-030", projectId: kicaProj.id, name: "고객센터 메인", menuPath: "고객지원 > 고객센터", purpose: "고객센터 진입 메인 화면.", status: "PLANNING", ownerId: jihyun.id },
  });

  await prisma.requirementScreenMap.createMany({
    data: [
      { requirementId: req103.id, screenId: scr024.id, createdBy: jungwoo.id },
      { requirementId: req103.id, screenId: scr210.id, createdBy: jungwoo.id },
      { requirementId: req103.id, screenId: scr211.id, createdBy: jungwoo.id },
      { requirementId: req121.id, screenId: scr024.id, createdBy: jungwoo.id },
    ],
  });

  await prisma.wireframe.createMany({
    data: [
      { screenId: scr024.id, version: "v1", status: "CONFIRMED", link: "https://figma.com/file/scr024-v1", authorId: minsoo.id, createdAt: daysFromNow(-10) },
      { screenId: scr024.id, version: "v2", status: "REVISING", link: "https://figma.com/file/scr024-v2", authorId: jungwoo.id, createdAt: daysFromNow(-6) },
      { screenId: scr024.id, version: "v3", status: "CONFIRMED", link: "https://figma.com/file/scr024-v3", authorId: jihyun.id, createdAt: daysFromNow(-3) },
      { screenId: scr024.id, version: "v4", status: "REVIEW_REQUESTED", link: "https://figma.com/file/scr024-v4", authorId: minsoo.id, createdAt: daysFromNow(-1) },
    ],
  });

  await prisma.hiFiDesign.createMany({
    data: [
      { screenId: scr024.id, version: "v0.9", status: "REVIEW_REQUESTED", link: "https://figma.com/file/scr024-hifi-v0.9", authorId: jihyun.id, createdAt: daysFromNow(-9) },
      { screenId: scr024.id, version: "v2", status: "CONFIRMED", link: "https://figma.com/file/scr024-hifi-v2", authorId: jungwoo.id, createdAt: daysFromNow(-5) },
      { screenId: scr024.id, version: "v3", status: "REVIEW_REQUESTED", link: "https://figma.com/file/scr024-hifi-v3", authorId: jihyun.id, createdAt: daysFromNow(-1) },
    ],
  });

  await prisma.reviewComment.createMany({
    data: [
      { targetType: "requirement", targetId: req103.id, authorId: jaehoon.id, type: "CHANGE_REQUEST", content: "비밀번호 규칙 안내 툴팁 문구를 보완하고, 인증서 용도 선택 옵션을 최신 목록으로 업데이트해주세요.", status: "UNRESOLVED", createdAt: daysFromNow(-4) },
      { targetType: "requirement", targetId: req103.id, authorId: yuri.id, type: "CONFIRM_REQUEST", content: "승인 후 다운로드 URL 제공 방식은 S3 pre-signed URL로 진행하면 될 것 같습니다.", status: "UNRESOLVED", createdAt: daysFromNow(-2) },
      { targetType: "screen", targetId: scr024.id, authorId: minsoo.id, type: "GENERAL", content: "'인증서 선택' 영역의 라벨을 더 명확하게 변경해 주세요.", status: "UNRESOLVED", createdAt: daysFromNow(-5) },
      { targetType: "hifi_design", targetId: scr024.id, authorId: jungwoo.id, type: "GENERAL", content: "입력 필드 도움말 문구를 더 명확하게 수정해주세요.", status: "UNRESOLVED", createdAt: daysFromNow(-1) },
    ],
  });

  const tc045 = await prisma.testScenario.create({
    data: { code: "TC-045", projectId: authProj.id, title: "비밀번호 재설정 - 이메일 인증 시나리오", status: "PASSED", ownerId: yuri.id },
  });
  const tc046 = await prisma.testScenario.create({
    data: { code: "TC-046", projectId: authProj.id, title: "비밀번호 재설정 - SMS 인증 시나리오", status: "NOT_RUN", ownerId: yuri.id },
  });
  await prisma.testRelation.createMany({
    data: [
      { testId: tc045.id, requirementId: req103.id, screenId: scr210.id },
      { testId: tc046.id, requirementId: req103.id, screenId: scr210.id },
    ],
  });

  await prisma.issue.createMany({
    data: [
      { code: "ISS-246", projectId: authProj.id, title: "로그인 시 간헐적으로 세션이 만료되는 현상", severity: "HIGH", status: "RECEIVED", ownerId: minsoo.id, relatedScreenId: scr210.id, createdAt: daysFromNow(-2) },
      { code: "ISS-245", projectId: kicaProj.id, title: "대시보드 지표 클릭 시 상세 데이터 미표시", severity: "MEDIUM", status: "IN_PROGRESS", ownerId: jaehoon.id, createdAt: daysFromNow(-3) },
      { code: "ISS-238", projectId: mobProj.id, title: "역할 권한 변경 후 즉시 반영되지 않는 문제", severity: "HIGH", status: "IN_PROGRESS", ownerId: jaehoon.id, createdAt: daysFromNow(-4) },
      { code: "ISS-233", projectId: mobProj.id, title: "대용량 파일 업로드 시 타임아웃 발생", severity: "HIGH", status: "IN_PROGRESS", ownerId: jaehoon.id, createdAt: daysFromNow(-6) },
    ],
  });

  await prisma.decisionLog.create({
    data: {
      projectId: finProj.id,
      title: "정산 정책 변경 확정",
      decision: "월 1회 정산 주기를 월 2회로 변경한다.",
      reason: "사업부 요청에 따라 정산 지연 이슈를 해소하기 위함.",
      decidedById: soyeon.id,
      decidedAt: daysFromNow(-1),
      relatedEntityType: "project",
      relatedEntityId: finProj.id,
    },
  });

  await prisma.activityLog.createMany({
    data: [
      { projectId: authProj.id, actorId: jihyun.id, targetType: "requirement", targetId: req103.id, eventType: "updated", afterValue: "비밀번호 재설정 요구사항이 수정되었습니다.", createdAt: daysFromNow(-0.08) },
      { projectId: memProj.id, actorId: yuri.id, targetType: "screen", targetId: scr024.id, eventType: "design_updated", afterValue: "마이페이지 화면 디자인이 업데이트되었습니다.", createdAt: daysFromNow(-0.17) },
      { projectId: mobProj.id, actorId: jungwoo.id, targetType: "requirement", targetId: req103.id, eventType: "created", afterValue: "본인인증 요구사항이 추가되었습니다.", createdAt: daysFromNow(-0.7) },
      { projectId: kicaProj.id, actorId: jaehoon.id, targetType: "test_scenario", targetId: tc045.id, eventType: "result_registered", afterValue: "통합 테스트 1차 결과가 등록되었습니다.", createdAt: daysFromNow(-0.85) },
      { projectId: finProj.id, actorId: soyeon.id, targetType: "decision_log", targetId: finProj.id, eventType: "decided", afterValue: "정책 변경에 대한 의사결정이 완료되었습니다.", createdAt: daysFromNow(-1.2) },
    ],
  });

  console.log("Seed complete:", { users: 8, projects: projects.length });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
