# PlanFlow UI Design Specification

> **문서명**: `design.md`  
> **대상 서비스**: 프로젝트 기획·디자인 산출물 통합 관리 플랫폼  
> **제품 유형**: B2B SaaS / 기획 중심 프로젝트 관리 플랫폼  
> **기준 해상도**: Desktop 1440px 기준, 최소 1280px 대응  
> **연계 PRD**: `project_planning_design_platform_PRD_3tier.md`  
> **Frontend 배포 환경**: Vercel  
> **Backend**: Render  
> **Database**: Supabase(PostgreSQL)

---

# 1. 디자인 목표

PlanFlow의 UI는 여러 프로젝트의 요구사항, 화면정의, 와이어프레임, Hi-Fi 디자인, 테스트/이슈 상태를 **한눈에 보고, 연결 관계를 추적하고, 검토·확정 액션을 빠르게 수행하는 것**을 목표로 한다.

핵심 키워드는 다음과 같다.

- **한눈에 파악**: 대시보드에서 위험·검토대기·현재 단계를 즉시 확인
- **연결성**: 요구사항 ↔ 화면 ↔ 와이어프레임 ↔ Hi-Fi ↔ 테스트 간 이동이 자연스러움
- **기획자 중심**: 개발 태스크보다 산출물 상태, 검토 의견, 변경 이력을 우선
- **상태 중심**: 사용자가 문서를 열지 않아도 진행 상태를 파악
- **절제된 B2B SaaS**: 화려한 장식보다 정보 위계와 업무 효율을 우선

## 1.1 Visual Direction

- 토스 계열의 간결한 정보 구조와 충분한 여백을 참고한다.
- KICA 스타일의 네이비/블루 중심 색상 체계와 절제된 보더 사용 원칙을 웹 UI에 맞게 적용한다.
- PPT 전용 요소인 전면 그라데이션 배너, 섹션 번호 배너, 3분할 푸터는 웹 애플리케이션에는 적용하지 않는다.
- 강한 그림자, 과한 라운드, 장식성 일러스트는 사용하지 않는다.
- 상태 정보는 **색상 + 텍스트 + 아이콘/배지**를 함께 사용한다.

---

# 2. Design Tokens

## 2.1 Core Color

| Token | Hex | 용도 |
|---|---|---|
| `color-navy-900` | `#12224B` | 제목, 핵심 텍스트, 강한 정보 강조 |
| `color-primary-600` | `#0155FF` | Primary CTA, 선택 상태, 링크, 현재 단계 |
| `color-danger-600` | `#FE5B01` | 지연, 위험, 삭제, 실패 |
| `color-warning-500` | `#FE9704` | 검토 대기, 일정 임박, 주의 |
| `color-primary-100` | `#CCDDFF` | 선택 배경, Primary tint |
| `color-navy-100` | `#DDE5F7` | 네이비 계열 연한 배경 |
| `color-danger-100` | `#FFDECC` | 위험/지연 연한 배경 |
| `color-warning-100` | `#FFEACD` | 경고/검토대기 연한 배경 |
| `color-bg-default` | `#FFFFFF` | 기본 카드/본문 배경 |
| `color-bg-subtle` | `#F5F5F5` | 페이지 배경, 비활성 영역 |
| `color-border` | `#E7E6E6` | 카드/테이블/입력 필드 보더 |
| `color-text-primary` | `#1F1F1F` | 기본 본문 |
| `color-text-secondary` | `#5F6673` | 보조 설명 |
| `color-text-tertiary` | `#9096A2` | 메타정보/비활성 텍스트 |

## 2.2 Semantic Status

KICA Core Color를 우선 사용하고 상태 의미가 겹치지 않도록 다음 규칙으로 제한한다.

| 의미 | 표현 |
|---|---|
| 정상 / 진행중 | Primary Blue + 텍스트 배지 |
| 검토 대기 / 일정 임박 | Warning Orange + Clock/Review Icon |
| 지연 / 위험 / 실패 | Danger Orange-Red + Warning Icon |
| 완료 / 확정 | Navy 또는 Primary Tint + Check Icon |
| 보류 / 미실행 | Neutral Gray |

> 완료 상태는 별도 유채색을 추가하기보다 `체크 아이콘 + 네이비/블루 계열`을 우선 사용한다.

## 2.3 Typography

### Web UI 기본

- **Primary Font**: Pretendard
- **Fallback**: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Malgun Gothic", sans-serif`

### KICA 내부 전용 모드

라이선스가 확인된 내부 KICA 환경에서만 Daki 계열을 브랜드 타이틀 용도로 사용할 수 있다.

### Type Scale

| Style | Size | Weight | 용도 |
|---|---:|---:|---|
| Display | 28px | 700 | 주요 페이지 타이틀 |
| Heading 1 | 24px | 700 | 대시보드/상세 화면 제목 |
| Heading 2 | 20px | 700 | 카드 그룹/섹션 제목 |
| Heading 3 | 16px | 600 | 카드 제목 |
| Body M | 14px | 400 | 기본 본문 |
| Body S | 13px | 400 | 테이블/보조 정보 |
| Caption | 12px | 400 | 메타데이터, 날짜, 도움말 |
| Metric | 28~32px | 700 | KPI 수치 |

## 2.4 Spacing

4px 기반 spacing system을 사용한다.

```text
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48
```

권장값:

- 페이지 좌우 패딩: `28~32px`
- 섹션 간격: `24~32px`
- 카드 내부 패딩: `20~24px`
- 카드 간격: `16px`
- 테이블 셀 세로 패딩: `14~16px`
- 필터 컨트롤 간격: `12px`

## 2.5 Radius / Border / Shadow

```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 12px;
--border-default: 1px solid #E7E6E6;
--shadow-card: 0 1px 4px rgba(18, 34, 75, 0.05);
```

원칙:

- 카드 기본 radius는 `10~12px` 이하
- 버튼/인풋은 `8~10px`
- Pill/Badge만 full radius 사용
- 카드마다 그림자를 넣지 않는다.
- 기본 구획은 **얇은 보더 + 배경 차이**로 해결한다.

---

# 3. Global Layout

## 3.1 Desktop Frame

```text
┌──────────────┬───────────────────────────────────────────────┐
│ Sidebar      │ Top Bar                                       │
│ 208px        ├───────────────────────────────────────────────┤
│              │ Breadcrumb / Page Header                      │
│              │                                               │
│              │ Main Content                                   │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

### Sidebar

- Width: `208px`
- Background: `#FFFFFF`
- Border-right: `1px solid #E7E6E6`
- 메뉴 높이: `44px`
- 선택 메뉴: Primary tint 배경 + Primary Blue 아이콘/텍스트

Navigation:

1. 홈
2. 프로젝트
3. 요구사항
4. 화면기획
5. 테스트/이슈

### Top Bar

- Height: `64px`
- Search: 최대 `360px`
- 오른쪽: 검색 → 알림 → 사용자 프로필
- Border-bottom: `1px solid #E7E6E6`

### Content Area

- Max content width: `1440px - sidebar`
- Padding: `28~32px`
- 배경: `#FAFBFC` 또는 `#F5F5F5`
- 주요 콘텐츠는 white card 기반

---

# 4. Global Component Rules

## 4.1 Page Header

구성:

```text
Breadcrumb
Page Title                [Primary Action] [Secondary Action]
Helper Text
```

- 페이지 타이틀은 화면당 1개
- Primary CTA는 최대 1개
- 위험 액션은 우측 `더보기` 메뉴로 분리

## 4.2 Summary Metric Card

구성:

- Label
- 큰 수치
- 보조 설명
- 의미 아이콘

규칙:

- 숫자가 핵심
- 그래프는 꼭 필요한 경우에만
- 한 행 4~6개 카드까지 허용
- 위험/지연 카드만 semantic color 강조

## 4.3 Status Badge

```text
[icon optional] 상태명
```

예:

- 진행중
- 지연
- 검토 대기
- 확정
- 보류

규칙:

- 높이 `24~28px`
- 배경은 semantic tint
- 텍스트는 semantic strong color
- 색상만으로 상태를 구분하지 않는다.

## 4.4 Data Table

### 기본 원칙

- Column header는 sticky 가능
- 핵심 컬럼은 좌측 배치
- ID는 링크 스타일
- 관계 데이터는 Chip 사용
- 날짜/수치는 우측 또는 고정 폭 사용
- 행 hover 시 아주 연한 Primary tint

### Row Action

기본 액션은 `···` 메뉴로 통합한다.

예:

- 상세 보기
- 상태 변경
- 화면 연결
- 담당자 변경
- 검토 요청

## 4.5 Filter Bar

- 검색 + 핵심 필터 4~6개
- 상세 필터는 2행 또는 접기 영역
- `초기화`는 Secondary
- `검색` 또는 `등록`이 Primary

## 4.6 Relation Chip

예:

```text
REQ-103
REQ-121
+2
```

- N:M 관계를 압축 표현
- 최대 2개까지 노출 후 `+N`
- 클릭 시 관계 Side Panel 또는 상세 화면 이동

## 4.7 Review Comment

- Avatar
- 작성자
- 역할
- 작성 시간
- 본문
- `미해결 / 해결됨`
- Reply Thread

미해결 의견은 개수와 상태를 항상 상단에 노출한다.

## 4.8 Version List

```text
v4   최신 / 검토요청
v3   확정
v2   수정중
v1   작성중
```

- 최신 버전은 항상 최상단
- 확정 버전은 Lock 상태
- 기존 확정본 덮어쓰기 금지
- 신규 버전 추가 방식을 사용

---

# 5. Anchor Screen 01 — 홈

## 목적

사용자가 로그인 후 가장 먼저 보는 화면으로, 여러 프로젝트의 **현재 단계, 위험, 검토 대기, 내 액션**을 한 번에 확인한다.

## Layout

```text
[Page Header]

[진행 중] [지연] [검토 대기] [미해결 이슈]

[프로젝트 진행 위치-----------------------] [위험 프로젝트]

[내 액션 아이템] [최근 변경사항----------] [오늘의 일정]
```

## 필수 컴포넌트

### Summary Card

- 진행 중 프로젝트 수
- 지연 프로젝트 수
- 검토 대기 건수
- 미해결 이슈 수

### 프로젝트 진행 위치

단계:

```text
요구사항 → 일정수립 → 화면정의 → 와이어프레임 → Hi-Fi 디자인 → 통합테스트 → 완료
```

프로젝트 Row:

- 프로젝트명
- 단계 Rail
- 진행률
- 지연 여부
- 검토 대기
- 이슈
- 마감일
- 담당자

### 위험 프로젝트

위험도 순 정렬:

1. 일정 지연
2. High 이슈
3. 검토 장기 미처리
4. 종료 임박 + 미확정 산출물

### 내 액션 아이템

- 요구사항 검토
- 디자인 확인
- 의사결정 확인
- 테스트/이슈 처리

### 최근 변경사항

```text
시간 + 유형 + 프로젝트/대상 + 변경 내용 + 변경자
```

---

# 6. Anchor Screen 02 — 프로젝트 목록

## 목적

전체 프로젝트를 상태, 현재 단계, 진행률, 일정 위험 기준으로 비교한다.

## Layout

```text
Page Header
Filter / Search / Sort / View Toggle
Summary Cards
Project Data Table
Pagination
```

## Filter

- 프로젝트명 검색
- 상태
- 담당자
- 종료 예정일
- 정렬
- Table / Card View Toggle

## Table Columns

1. 프로젝트명
2. 상태
3. 현재 단계
4. 진행률
5. 검토 대기
6. 이슈
7. 담당자
8. 시작일
9. 종료 예정일
10. 최근 변경

## 상태 강조

- 지연 프로젝트의 종료 예정일은 Danger text
- 진행률 Progress bar는 Primary Blue
- 검토 대기 수는 Warning
- 이슈 수는 High issue가 있을 때만 Danger

---

# 7. Anchor Screen 03 — 프로젝트 개요

## 목적

특정 프로젝트의 단계, 일정, 산출물, 참여자, 다음 액션을 한 화면에서 확인한다.

## 상단

### Breadcrumb

```text
프로젝트 > 통합인증 리뉴얼
```

### Stage Rail

```text
요구사항 — 일정수립 — 화면정의 — 와이어프레임 — Hi-Fi 디자인 — 통합테스트 — 완료
```

현재 단계는 Primary Blue, 완료는 Check, 예정은 Gray.

## Summary

- 프로젝트 상태
- 진행률
- 검토 대기
- 미해결 이슈
- 종료 예정일

## Main Grid

### 프로젝트 기본 정보
- 프로젝트명
- 프로젝트 코드
- 클라이언트
- PM
- 설명
- 생성일

### 일정 / 마일스톤
- 마일스톤명
- 상태
- 예정일

### 산출물 상태
- 요구사항
- 화면정의
- 와이어프레임
- Hi-Fi 디자인
- 테스트

### 참여자 / 역할
- 사용자
- 역할
- 직무
- 연락처

### 최근 변경사항
Activity Feed 사용

### 다음 액션
- 업무명
- 담당자
- 마감일
- 우선순위

---

# 8. Anchor Screen 04 — 요구사항 목록

## 목적

요구사항을 상태, 우선순위, 연결 화면, 담당자, 검토 대기 기준으로 관리한다.

## Filters

- 프로젝트
- 검색
- 상태
- 담당자
- 우선순위
- 연결 화면 유무
- 변경 여부

Primary CTA:

```text
+ 요구사항 등록
```

## Columns

1. 요구사항 ID
2. 요구사항명
3. 구분
4. 우선순위
5. 상태
6. 관련 화면
7. 담당자
8. 요청자
9. 최근 수정일
10. 검토 대기
11. 작업

## Quick Menu

- 상세 보기
- 상태 변경
- 화면 연결
- 담당자 변경
- 검토 요청

---

# 9. Anchor Screen 05 — 요구사항 상세

## 목적

하나의 요구사항을 검토, 확정하고 연결 화면 및 테스트 영향도를 추적한다.

## Header Summary

- REQ ID
- 제목
- 상태
- 우선순위
- 담당자
- 최종 수정일

Actions:

```text
[검토 요청] [확정] [수정] [더보기]
```

## Impact Warning

연결 대상이 있을 경우 항상 노출:

> 이 요구사항은 3개 화면과 2개 테스트 시나리오에 연결되어 있습니다. 변경 시 관련 항목의 재검토가 필요할 수 있습니다.

## Tabs

- 상세 내용
- 관련 화면
- 검토 의견
- 변경 이력

## 상세 내용

- 배경 / 목적
- 상세 요구사항
- 요청자
- 목표 반영일
- 첨부 / 참고 링크

## Related Screens Panel

- 화면 Thumbnail
- Screen ID
- 화면명
- 화면 상태
- 버전
- 담당자

## Related Test Scenarios

- Test ID
- 시나리오명
- 상태

---

# 10. Anchor Screen 06 — 화면 목록

## 목적

화면별 기획/와이어프레임/Hi-Fi 상태를 비교하고 누락 산출물을 찾는다.

## Filters

- 프로젝트
- 화면 상태
- 메뉴 경로
- 담당자
- 관련 요구사항
- 와이어프레임 상태
- Hi-Fi 상태
- 검토 대기 여부

## Columns

1. 화면 ID
2. 화면명
3. 메뉴 경로
4. 화면 상태
5. 관련 요구사항
6. 와이어프레임
7. Hi-Fi
8. 검토 대기
9. 담당자
10. 최근 수정일
11. 작업

## Relation 표현

관련 요구사항은:

```text
REQ-003  REQ-007  +2
```

형태로 노출한다.

---

# 11. Anchor Screen 07 — 화면정의

## 목적

화면의 정책, 기능, 입출력, 권한, 메시지, 디자인 산출물을 하나의 기준 문서로 관리한다.

## Header

```text
화면기획 > SCR-024
화면정의
```

Actions:

```text
[검토 요청] [확정] [수정] [더보기]
```

## Main Sections

### A. 기본 정보

- 화면 ID
- 화면명
- 메뉴 경로
- 화면 목적
- 화면 상태

### B. 관련 요구사항

- Relation Chip
- 삭제 X
- `+ 요구사항 추가`

### C. 화면 기능

- 주요 기능
- 버튼/액션
- 권한 조건

### D. 입출력 정의

#### Input Table

| 항목명 | 설명 | 필수 | 데이터 타입 | 비고 |
|---|---|---|---|---|

#### Output Table

| 항목명 | 설명 | 데이터 타입 | 비고 |
|---|---|---|---|

### E. 메시지 / 예외

| 발생 조건 | 메시지 | 사용자 액션 |
|---|---|---|

### F. 디자인 산출물

- Wireframe
- Hi-Fi
- Prototype

각 항목:

- 파일/링크명
- 상태
- 외부 링크
- 다운로드

### G. 협업

- 검토 의견
- 변경 이력

## Right Metadata Panel

- 작성자
- 최종 수정자
- 검토 상태
- 버전
- 생성일
- 최종 수정일
- 참조 문서
- 첨부 파일

---

# 12. Anchor Screen 08 — 와이어프레임 관리

## 목적

와이어프레임 최신 버전과 과거 버전, 검토 의견, 확정 상태를 관리한다.

## Layout

```text
Target Screen Summary

[Version List] [Wireframe Preview----------------] [Screen Info]
               [Review Comments-----------------] [Activity]
```

## Version List

- v4 최신
- v3 확정
- v2 수정중
- v1 작성중

## Main Preview

Header:

- Wireframe v4
- 최신
- 작성자
- 업데이트 시각
- 파일명

Actions:

```text
[외부 링크 열기] [검토 요청] [확정]
```

## Review Comments

Tabs:

- 전체
- 미해결
- 해결됨

댓글은 Thread 형식으로 구성한다.

## Side Information

### 화면 정보
- 화면 유형
- 화면 카테고리
- 우선순위
- 담당 디자이너
- 연관 프로젝트
- 최초 등록일
- 최종 업데이트

### 활동 내역
- 업로드
- 확정
- 버전 변경
- 화면 생성

---

# 13. Anchor Screen 09 — Hi-Fi 디자인 관리

## 목적

최신 Hi-Fi 디자인과 이전 버전, 검토 의견, 확정 이력을 관리한다.

## Main Area

### 최신 디자인

- Hi-Fi v3
- 검토 상태
- 검토 의견 건수
- 작성자
- 업데이트일
- 설명

Actions:

```text
[외부 링크 열기] [검토 요청] [확정]
```

### Design Preview

- Desktop / Mobile Preview Toggle
- Zoom
- Fullscreen
- 외부 원본은 Figma 등 외부 도구

### Unresolved Review Warning

미해결 검토 의견이 있으면 확정 버튼 근처 또는 preview 하단에 Warning Banner 노출.

## Right Column

### 버전 히스토리

- 최신 버전
- 확정 버전
- 검토 중
- 초안

### 검토 의견

- 미해결/전체 Count
- 의견 유형
- 작성자
- 상태

### 파일 첨부

- 프로토타입
- Spec PDF
- 기타 첨부

## Lower Area

### 관련 화면정의
- 화면정의서
- 컴포넌트 명세
- 플로우 정의서

### 관련 요구사항
- REQ ID
- 제목
- 상태

### 확정 이력
- 버전
- 확정자
- 확정일
- 확정 코멘트

---

# 14. Anchor Screen 10 — 테스트/이슈 목록

## 목적

테스트 실행 현황과 결함/이슈를 통합해 품질 위험을 확인한다.

## KPI Cards

- 전체 시나리오 수
- 성공률
- 실패 수
- 미실행 수
- 미해결 이슈 수
- High 이슈 수

## Local Tabs

```text
테스트 시나리오 | 테스트 결과 | 결함 관리 | 이슈 관리 | 조치 현황
```

## Issue Table

Columns:

1. ID
2. 유형
3. 제목
4. 관련 화면
5. 관련 요구사항
6. 심각도
7. 상태
8. 담당자
9. 최근 결과 / 조치 예정일

Severity:

- High
- Medium
- Low

Status:

- 접수
- 조치중
- 확인대기
- 완료
- 보류

## Right Panel

### 최근 테스트 결과

- 테스트명
- 성공 건수
- 실패 건수
- 실행일시

### 미해결 High 이슈

- ID
- 요약
- 상태

---

# 15. Empty / Loading / Error / Permission

## 15.1 Empty State

### First Empty

```text
아직 등록된 화면이 없어요.
화면을 등록하고 요구사항과 연결해 보세요.

[화면 추가]
```

### Filter Empty

```text
조건에 맞는 결과가 없어요.

[필터 초기화]
```

## 15.2 Loading

- Skeleton UI 사용
- Page 전체 Spinner 금지
- 카드/표/리스트 구조를 유지한 Skeleton 권장

## 15.3 Error

```text
정보를 불러오지 못했어요.

[다시 시도]
```

- 저장 실패 시 입력값 유지
- 테이블 일부 실패 시 Widget 단위 Error 처리

## 15.4 Permission

### 조회 가능 / 수정 불가

- Read-only UI
- 수정 버튼 숨김 또는 Disabled
- 이유 Tooltip 제공

### 접근 불가

```text
이 화면을 볼 권한이 없어요.

[이전 화면으로]
```

---

# 16. 위험 액션

다음 액션은 Confirmation 또는 Destructive Dialog를 사용한다.

- 요구사항 삭제
- 요구사항 확정 해제
- 화면 삭제
- 화면 확정
- 와이어프레임 확정
- Hi-Fi 디자인 확정
- 일정 변경
- 의사결정 로그 삭제
- 프로젝트 완료

## Dialog Structure

```text
[Title]
요구사항 확정을 해제할까요?

[Description]
연결된 3개 화면의 검토 상태에 영향을 줄 수 있어요.
확정을 해제하려면 변경 사유를 입력해 주세요.

[변경 사유 Input]

[취소] [확정 해제]
```

원칙:

- `정말 진행하시겠습니까?` 같은 추상 문구 금지
- 영향 대상을 구체적으로 안내
- 데이터 삭제/확정해제는 결과를 명시

---

# 17. Responsive Rules

## >= 1440px

- 기본 Desktop Layout
- Sidebar 208px
- 3-column card layout 허용

## 1280~1439px

- Sidebar 유지
- 카드 3열 → 2열 가능
- Table horizontal scroll 허용

## 1024~1279px

- Sidebar compact mode 권장
- Right side panel은 아래로 이동
- KPI card 4~6개 → 2~3열 wrap

## < 1024px

MVP에서는 완전한 모바일 업무 UI보다 조회 중심 반응형을 우선한다.

- Sidebar Drawer
- Table → horizontal scroll
- 상세 화면은 1-column
- 위험 액션/검토 요청 CTA는 Bottom Sticky 가능

---

# 18. Accessibility

- 일반 텍스트 대비 `4.5:1` 이상 권장
- 상태는 색상 단독 사용 금지
- Icon button에는 Tooltip/aria-label 필요
- Focus ring은 Primary Blue 사용
- 클릭 영역 최소 `40x40px`
- Keyboard Navigation 지원
- Data Table은 헤더/행 구조가 스크린리더에서 구분 가능해야 함

---

# 19. Implementation Notes

## 19.1 Frontend

Frontend는 Vercel 배포를 전제로 하며 UI에서 직접 Database에 접근하지 않는다.

```text
Frontend / Vercel
      ↓ API
Backend / Render
      ↓
Supabase / PostgreSQL
```

UI 권한 제어는 UX를 위한 사전 제어이며 실제 권한 검증은 Backend에서 수행한다.

## 19.2 Componentization

추천 구조:

```text
components/
├─ navigation/
│  ├─ GlobalSidebar
│  ├─ TopBar
│  └─ Breadcrumb
├─ data-display/
│  ├─ DataTable
│  ├─ StatusBadge
│  ├─ RelationChip
│  ├─ MetricCard
│  └─ ProgressRail
├─ artifact/
│  ├─ ArtifactCard
│  ├─ VersionList
│  ├─ DesignPreview
│  └─ AttachmentList
├─ collaboration/
│  ├─ ReviewThread
│  ├─ ActivityFeed
│  └─ DecisionLog
├─ feedback/
│  ├─ EmptyState
│  ├─ ErrorState
│  ├─ WarningBanner
│  ├─ ConfirmDialog
│  └─ Toast
└─ form/
   ├─ SearchInput
   ├─ Select
   ├─ UserPicker
   ├─ RelationshipPicker
   └─ TableForm
```

---

# 20. Do / Don't

## Do

- 한 화면에 가장 중요한 Primary CTA는 1개만 둔다.
- 표는 비교, 카드는 요약, Timeline/Rail은 흐름에 사용한다.
- ID, 상태, 담당자, 최근 수정일을 반복적으로 동일 위치에 둔다.
- 관계 정보는 Chip + Count로 압축한다.
- 최신/확정 버전을 명확하게 구분한다.
- 지연/위험/검토대기는 사용자가 조치할 수 있는 경우에만 강조한다.

## Don't

- 모든 상태를 서로 다른 유채색으로 만들지 않는다.
- 카드마다 강한 그림자를 사용하지 않는다.
- 지나치게 큰 radius를 사용하지 않는다.
- 정보가 많은 화면에서 icon-only UI를 남발하지 않는다.
- 디자인 파일 원본을 PlanFlow가 직접 대체하려 하지 않는다.
- 확정본을 덮어쓰지 않는다.
- Jira처럼 개발 task/sprint 관리 UI로 확장하지 않는다.

---

# 21. 화면 설계 체크리스트

## Navigation

- [ ] 현재 프로젝트 컨텍스트를 항상 알 수 있는가?
- [ ] 상위 목록으로 쉽게 돌아갈 수 있는가?
- [ ] Sidebar와 Breadcrumb이 일관적인가?

## Status

- [ ] 현재 단계와 객체 상태를 구분했는가?
- [ ] 상태별 다음 액션이 명확한가?
- [ ] 색상 외 텍스트/아이콘으로도 상태가 전달되는가?

## Relationship

- [ ] 요구사항 ↔ 화면이 양방향으로 연결되는가?
- [ ] 화면 ↔ 디자인 ↔ 테스트를 추적할 수 있는가?
- [ ] 변경 시 영향 대상을 바로 확인할 수 있는가?

## Collaboration

- [ ] 검토 요청 대상과 요청일이 보이는가?
- [ ] 미해결 의견을 빠르게 찾을 수 있는가?
- [ ] 확정 버전을 명확히 인지할 수 있는가?

## Error / Permission

- [ ] Empty State에 다음 행동이 있는가?
- [ ] 저장 실패 시 입력값이 유지되는가?
- [ ] 권한 제한 사유를 알 수 있는가?
- [ ] 위험 액션의 영향 범위를 확인할 수 있는가?

---

# 22. One-line Design Definition

> **PlanFlow는 최소한의 색과 명확한 상태 표현을 사용해 여러 프로젝트의 기획 산출물과 검토 흐름을 빠르게 파악하고 추적할 수 있게 하는 B2B SaaS 업무 UI다.**
