# PlanFlow

> 여러 프로젝트의 요구사항부터 화면, 디자인, 테스트까지 연결하고 최신 산출물과 검토 상태를 한눈에 추적하는 기획 중심 B2B SaaS 플랫폼.

프로젝트 기획·디자인 산출물을 파일이 아닌 **관계형 데이터**로 관리합니다. 요구사항 → 화면정의 → 와이어프레임 → Hi-Fi 디자인 → 테스트 시나리오가 서로 연결되어, 어느 산출물에서 변경이 발생했는지 역추적하고 검토·확정 상태를 추적할 수 있습니다.

Jira 형태의 개발 태스크 관리 도구가 아니며, 기획 산출물의 **검토·확정 여부**를 핵심 상태로 다룹니다.

## 핵심 개념

| | 설명 |
|---|---|
| **See** | 홈 대시보드에서 프로젝트 진행 위치, 지연·위험 신호, 내 액션 아이템을 즉시 확인 |
| **Trace** | 요구사항 ↔ 화면 ↔ 디자인 ↔ 테스트의 N:M 연결 관계를 양방향 추적 |
| **Decide** | 검토 요청 → 의견 → 확정 흐름과 의사결정 근거·변경 이력 기록 |

## 아키텍처 (3-Tier)

```
1 Tier  Frontend  │ Next.js (App Router)  │ Vercel
                  ↓ REST API
2 Tier  Backend   │ Express + Prisma      │ Render
                  ↓ SQL
3 Tier  Database  │ PostgreSQL            │ Supabase
```

프론트엔드는 데이터베이스에 직접 접근하지 않습니다. 모든 데이터 조회·저장과 권한 검증은 `Frontend → Backend → Database` 흐름을 따릅니다.

## 기술 스택

- **Frontend** — Next.js (App Router, TypeScript), Tailwind CSS, 클라이언트 사이드 데이터 페칭
- **Backend** — Express, TypeScript, Prisma ORM, Zod 입력 검증
- **Database** — PostgreSQL (Supabase), 트랜잭션 풀러 기반 연결

## 시작하기

### 사전 요구사항

- Node.js 20 이상
- Supabase 프로젝트 (PostgreSQL)

### 백엔드

```bash
cd backend
npm install
cp .env.example .env      # DATABASE_URL, DIRECT_URL 입력
npm run prisma:generate
npm run prisma:migrate    # 스키마 생성
npm run prisma:seed       # 샘플 데이터 투입
npm run dev               # http://localhost:4000
```

`.env` 설정 시 주의할 점:

- **`DATABASE_URL`** — 런타임 연결. Supabase **트랜잭션 풀러(6543 포트)** + `?pgbouncer=true` 를 사용합니다. 세션 모드(5432)는 동시 클라이언트가 15개로 제한되어 대시보드·프로젝트 목록 API가 커넥션을 소진합니다.
- **`DIRECT_URL`** — 마이그레이션 전용. 세션 모드(5432 포트)를 사용합니다.

### 프론트엔드

```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL 입력
npm run dev                  # http://localhost:3000
```

## 프로젝트 구조

```
├─ backend/            Express REST API
│  ├─ prisma/          스키마 · 마이그레이션 · 시드
│  └─ src/
│     ├─ routes/       도메인별 라우터
│     ├─ lib/          진행률 · 위험도 계산, 산출물 버전 관리
│     └─ middleware/   인증(스텁) · 에러 핸들링
├─ frontend/           Next.js App Router
│  └─ src/
│     ├─ app/          10개 화면 라우트
│     ├─ components/   공통 UI 컴포넌트
│     └─ styles/       디자인 시스템 토큰
├─ mockups/html/       승인된 화면 시안 (정적 HTML)
├─ docs/               PRD
├─ design.md           UI 디자인 시스템 명세
└─ CLAUDE.md           아키텍처 · 데이터 모델 요약
```

## 주요 화면

| # | 화면 | 목적 |
|---|---|---|
| 1 | 홈 대시보드 | 전체 프로젝트 상태와 개인 액션 파악 |
| 2 | 프로젝트 목록 | 프로젝트 탐색 및 상태 비교 |
| 3 | 프로젝트 개요 | 단계·일정·산출물·참여자 단일 진입점 |
| 4 | 요구사항 목록 | 상태·우선순위·연결 관계 관리 |
| 5 | 요구사항 상세 | 검토·확정 및 변경 영향 추적 |
| 6 | 화면 목록 | 화면별 기획·디자인 진행 상황 비교 |
| 7 | 화면정의 | 정책·기능·입출력·예외 정의 |
| 8 | 와이어프레임 관리 | 버전 및 검토 상태 관리 |
| 9 | Hi-Fi 디자인 관리 | 최종 디자인 링크와 확정 이력 |
| 10 | 테스트/이슈 | 테스트 준비와 미해결 이슈 관리 |

## 설계 원칙

- **확정본은 잠금** — 확정된 와이어프레임·디자인은 덮어쓰지 않습니다. `확정 해제(사유 필수) → 신규 버전 → 재확정` 흐름을 따릅니다.
- **상태는 색상 단독으로 구분하지 않음** — 텍스트 + 아이콘/배지를 함께 사용합니다.
- **최소 입력, 최대 추적** — 생성 시 필수 입력을 최소화하고, 작성자·수정일·이력·버전은 시스템이 자동 기록합니다.
- **관계는 압축 표현** — N:M 연결은 대표 1~2개 + `+N` 형태로 노출하고 전체는 별도 패널에서 확인합니다.
- **진행률은 계산값** — 사용자 입력이 아닌 `단계 가중치 + 필수 산출물 확정률`로 산출합니다.

자세한 내용은 [`design.md`](./design.md)와 [`docs/`](./docs/)의 PRD를 참고하세요.

## 현재 상태

Phase 1 / Core MVP 구현 완료 — 홈 대시보드, 프로젝트, 요구사항, 화면정의, 와이어프레임/Hi-Fi 관리, 테스트·이슈, 요구사항↔화면 N:M 연결, 변경 이력.

**미구현 (후속 작업)**

- 실제 인증·세션 (현재 `x-user-id` 헤더 기반 스텁)
- 검토 요청 알림, 실시간 협업
- 외부 도구(Figma·Jira·Slack) 연동
