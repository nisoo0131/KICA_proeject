# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

Planning artifacts plus a working MVP scaffold:

- `docs/project_planning_design_platform_PRD_3tier.md` — the full PRD (Korean). Source of truth for everything summarized below.
- `design.md` — the UI design system spec (colors, spacing, typography, per-screen structure). Its "Anchor Screen 01–10" sections map 1:1 to `mockups/html/`.
- `mockups/html/*.html` + `shared.css` — finished, design.md-conformant static reference implementations of the 10 core screens. `frontend/` ports these directly (same class names/tokens via `frontend/src/styles/design-system.css`, copied verbatim from `shared.css`) — treat the mockups as the approved visual/content source of truth, not something to redesign.
- `mockups/*.png` — the original AI-generated moodboard images the HTML mockups were built from; superseded by the HTML versions for implementation purposes.
- `frontend/` — Next.js (App Router, TypeScript) + Tailwind CSS. Client-side data fetching against the backend API (see `src/lib/api.ts`, `src/lib/useApi.ts`); no server-side fetching from Supabase.
- `backend/` — Express + TypeScript REST API, Prisma ORM targeting Supabase Postgres. Routes in `src/routes/`, schema in `prisma/schema.prisma`, sample data in `prisma/seed.ts`.

### Commands

Backend (`cd backend`): `npm install`, `npm run dev` (tsx watch on :4000), `npm run build` / `npm start`, `npm run lint` (`tsc --noEmit`), `npm run prisma:generate`, `npm run prisma:validate`, `npm run prisma:migrate`, `npm run prisma:seed`. Needs `DATABASE_URL` in `backend/.env` (copy `.env.example`) pointing at a real Supabase Postgres connection string — `generate`/`validate` work without a live DB, but `migrate`/`seed`/`dev` need one.

Frontend (`cd frontend`): `npm install`, `npm run dev` (:3000), `npm run build`, `npm run lint`. Needs `NEXT_PUBLIC_API_URL` in `frontend/.env.local` (copy `.env.example`) pointing at the running backend.

### Deferred (needs the user's own cloud accounts)

Real authentication/login (current backend uses a stub `x-user-id` header, see `backend/src/middleware/auth.ts`), a live Supabase database connection, and actual deployment to Vercel/Render/Supabase. The three CLIs are installed locally but not yet logged in — deploying is a follow-up once the user runs `vercel login` / `supabase login` / `render login` themselves.

## Product summary

This is a B2B SaaS platform for centrally managing **planning and design deliverables** for internal projects (기획·디자인 산출물 통합 관리 플랫폼). It is explicitly **not** a Jira-style dev task tracker — it exists to connect requirements → screen definitions → wireframes → Hi-Fi designs → test scenarios into one traceable chain, and to track review/decision status on those deliverables. Primary users: 기획자 (planners/PMs), UI/UX designers, developers, business-side requesters (사업부), and admins.

One-line definition (§20 of the PRD): a planning-centric B2B SaaS platform that connects requirements, screens, designs, and tests across multiple projects and gives a single view of the latest deliverables and their review status.

## Target architecture (3-tier)

The PRD defines "3-tier" as system architecture layers, not information architecture — don't confuse this with the separate "IA" section.

| Tier | Layer | Responsibility | Deploy target |
|---|---|---|---|
| 1 | Frontend | Rendering, user input, client-side state, calls Backend API, hides/disables actions the user's role can't perform (real enforcement stays server-side) | Vercel |
| 2 | Backend | Auth/authz, all CRUD for projects/requirements/screens/tests, N:M relationship management, business rules for risky actions (confirm/unconfirm/delete/schedule changes), writes change-history records | Render |
| 3 | Database | Postgres via Supabase; relational storage for projects, requirements, screens, tests, issues, decision logs; indexes on project_id/status/owner/screen_id/requirement_id | Supabase |

Mandated data flow: **Vercel Frontend → Render Backend → Supabase Database**. The frontend must not talk to Supabase directly — all reads/writes and permission checks go through the Render backend API.

Feature priority is tracked separately as **Release Phases** (Phase 1/Core, Phase 2/Collaboration, Phase 3/Governance & Insight) — do not conflate these with the 3 architecture tiers.

## Core UX concept

Three verbs frame the product experience (§1.1): **See** (surface project status and risk at a glance on the home dashboard), **Trace** (follow the requirement → screen → wireframe → Hi-Fi design → test chain and trace back where a change originated), **Decide** (make review/confirm/hold state explicit and always record the reason behind a decision).

Design principles to preserve when building UI (§1.2–1.3):
- Home surfaces only prioritization info (delayed projects, pending reviews, "my action items") — detailed data lives in the project workspace, not the home dashboard (this is Risk 10 in the PRD — resist scope creep on the home screen).
- Deliverables are relational data, not standalone files — every detail view must offer navigation to related requirements/screens/tests.
- "검토·확정 여부" (reviewed/confirmed status) matters more than raw "done" status.
- Minimize required fields on creation; let relationships and details be filled in progressively. Author, timestamps, and version are always system-recorded, never user-entered.
- Status is shown via text + icon/badge, never color alone. Don't mix state-color and priority-color into the same scheme, and don't use more than one status color competing within a single component.

## Information architecture

Three-level hierarchy: **Portfolio** (home, project list, my action items, risk alerts) → **Project Workspace** (overview, schedule, requirements/screens/artifacts/tests scoped to one project, decision log) → **Artifact Detail** (requirement/screen/wireframe/Hi-Fi/test/issue detail, comments, change history).

Every Level 2/3 screen must keep a persistent breadcrumb-style context header: `프로젝트명 > 업무 영역 > 상세 항목` (e.g. `통합인증 리뉴얼 > 화면기획 > SCR-024 인증서 신청`), so users never lose track of which project/area they're in.

## Data model

Core entities (§14.1) and their relationships (§14.2):

- **Project** 1—N **Requirement**, **Screen**, **TestScenario**, **Issue**, **DecisionLog**
- **Requirement** N—M **Screen** via `RequirementScreenMap`
- **Screen** 1—N **Wireframe**, 1—N **HiFiDesign** (both versioned: new version rows are appended, never overwritten — see versioning rule below)
- **Requirement** N—M **TestScenario**, **Screen** N—M **TestScenario** via `TestRelation` (requirement_id/screen_id nullable, so a test can validate either or both)
- **Issue** optionally links to a requirement, screen, and/or test via nullable FKs
- **ReviewComment** and **ActivityLog** are polymorphic (`target_type`/`target_id`) and attach to any entity
- **DecisionLog** also polymorphic via `related_entity_type`/`related_entity_id`, records decision + reason + decider

Key invariant: confirmed wireframe/design versions are locked; changing a confirmed artifact means unconfirm (with required reason) → add new version → reconfirm. Never overwrite a confirmed version in place (this is Risk 7 in the PRD).

### Status vocabularies (§15)
- Project: 준비중 / 진행중 / 지연 / 테스트중 / 완료 / 보류
- Requirement: 접수 → 검토중 → 확정 → 화면정의중 → 디자인중 → 테스트중 → 완료 (with a 보류 branch off 검토중)
- Screen: 기획중 / 검토중 / 와이어프레임중 / 디자인중 / 확정 / 보류
- Wireframe/Hi-Fi design: 작성중 → 검토요청 → 수정중 → 확정 / 보류
- Issue: 접수 → 조치중 → 확인대기 → 완료 / 보류

Keep "current stage" (project workflow position) and "status" (e.g. 지연/위험) as distinct fields — don't conflate them (§15.6). Only define a state if it maps to a real, distinct next action; avoid proliferating fine-grained states that don't change what a user can do next (Risk 2).

## Permissions

Role-based, project-scoped first, org-wide role as fallback (§13.2). Roles: 기획자 (planner), UI/UX, 개발자 (dev), 사업부 (business), 관리자 (admin). The permission matrix in §13.1 of the PRD is the source of truth for which role can do what; `△` marks project-configurable permissions. UI must distinguish "menu hidden" from "action disabled" — if a user can view an entity, show the data read-only rather than hiding it, and explain *why* an action is blocked rather than just disabling it silently.

## Known risks to guard against (§16)

These are explicit anti-goals called out in the PRD — when implementing features, check proposals against this list:
1. Don't let this expand into a Jira-style dev/sprint/deployment tracker — external tool links only for dev task detail.
2. Don't over-fragment status values; every status must gate a real next action.
3. Don't render full N:M relationship graphs inline — show a count + 1–2 representative items inline, full detail in a side panel/tab.
4. Don't try to replace Figma/design tools — store external links, version, review status, and decision history only, not files themselves.
5. Auto-populate author/timestamp/history/inherited project context wherever possible to avoid manual-entry fatigue.
6. Don't trust user-entered "progress %" — compute it from stage weighting + required-artifact confirmation rate, or fall back to "current stage + risk signals" if the org's process varies too much.
7. Confirmed artifacts are locked; changes go through unconfirm→new version→reconfirm, never in-place overwrite.
8. Track review-request timestamps and surface an alert when a review has been pending N+ days (review bottlenecks don't show up as data problems otherwise).
9. Default to project-role RBAC; only admins get individual permission exceptions.
10. Keep the home dashboard limited to: summary counts, project progress rail, risk list, my action items, recent changes — nothing else.

## MVP scope (§18)

Phase 1/Core MVP includes: home dashboard, project list/overview, requirement list/detail/create, screen list/screen-definition, requirement↔screen N:M linking, wireframe/Hi-Fi link+status management, artifact list, test/issue list, basic change history, RBAC, and confirmation dialogs for risky actions. Explicitly deferred: complex WBS dependencies, real-time co-editing, storing design files natively, dev sprint management, advanced reporting, AI summarization.
