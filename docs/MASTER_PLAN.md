# Study Office — 마스터 개선 계획서

## 현재 상태 (v0.1)
- ✅ Phaser 3 + Vite + TypeScript 클라이언트
- ✅ Express + Socket.IO 서버
- ✅ Boot → Lobby (3개 방) → Room 씬 전환
- ✅ 8방향 이동 (키보드 + 모바일 조이스틱)
- ✅ 픽셀아트 캐릭터 4방향 걷기 애니메이션
- ✅ WebRTC 시그널링 + P2P 음성 통화 구조
- ✅ Vercel 배포 (클라이언트)
- ⬜ 서버 미배포 (멀티플레이어 미작동)

---

## Phase 1: 핵심 인프라 (서버 + 멀티플레이어)
> **목표:** 실제로 2명 이상이 접속해서 같은 방에서 만날 수 있는 상태

| PR | 작업 | 담당 |
|----|------|------|
| PR-01 | 서버 Railway/Render 배포 + Vercel 환경변수 연동 | Backend |
| PR-02 | 닉네임 입력 (로비 진입 전) + 서버에 닉네임 전파 | Frontend |
| PR-03 | 방 인원수 실시간 표시 (로비) | Frontend + Backend |
| PR-04 | WebRTC 음성 연결 안정화 (ICE restart, 재접속) | Backend |
| PR-05 | 모바일 마이크 권한 UX (안내 팝업, 거부 시 처리) | Frontend |

## Phase 2: 공간 & 인터랙션
> **목표:** 단순 이동 → 실제 "공간감" 있는 스터디룸

| PR | 작업 | 담당 |
|----|------|------|
| PR-06 | 방별 맵 디자인 (벽, 책상, 의자 오브젝트 배치) | Design + Frontend |
| PR-07 | 충돌 처리 (벽/가구에 못 지나가게) | Frontend |
| PR-08 | 근접 음성 (거리 기반 볼륨 조절 — 가까울수록 크게) | Frontend + Backend |
| PR-09 | 캐릭터 커스터마이징 (색상/스타일 선택) | Frontend |
| PR-10 | 이모지 리액션 (캐릭터 위 말풍선) | Frontend |
| PR-11 | 타이머/뽀모도로 공유 위젯 (방 단위) | Frontend + Backend |

## Phase 3: 소셜 & 게이미피케이션
> **목표:** 재방문 동기부여

| PR | 작업 | 담당 |
|----|------|------|
| PR-12 | 출석/공부시간 기록 (서버 저장) | Backend |
| PR-13 | 랭킹/리더보드 (일간/주간 공부시간) | Frontend + Backend |
| PR-14 | 친구 추가 / 초대 링크 | Frontend + Backend |
| PR-15 | 채팅 (텍스트 메시지, 방 단위) | Frontend + Backend |
| PR-16 | 알림 (친구 접속 시 푸시) | Backend |

## Phase 4: 퀄리티 & 최적화
> **목표:** 프로덕션 수준

| PR | 작업 | 담당 |
|----|------|------|
| PR-17 | 에셋 고도화 (타일맵 + 오브젝트 스프라이트시트) | Design |
| PR-18 | BGM + SFX (입장음, 이동음, 알림음) | Design |
| PR-19 | PWA 설정 (홈화면 추가, 오프라인 fallback) | Frontend |
| PR-20 | 성능 최적화 (코드 스플리팅, 에셋 레이지 로딩) | Frontend |
| PR-21 | E2E 테스트 (Playwright) | QA |
| PR-22 | 모니터링 + 에러 트래킹 (Sentry) | Backend |

---

## 에이전트 구조

### 리더 에이전트 (Leader)
- 전체 진행 관리, PR 우선순위 결정, 블로커 해결
- 이 채널에 상태판 업데이트

### Frontend 에이전트
- Phaser 씬, UI, 모바일 UX, 애니메이션
- client/ 디렉토리 담당

### Backend 에이전트
- Socket.IO, WebRTC, 서버 배포, DB
- server/ 디렉토리 담당

### Design 에이전트
- 맵/타일/오브젝트 에셋, UI 디자인, impeccable 기준 검증

### QA 에이전트
- 테스트 작성, 크로스브라우저/모바일 검증

---

## 실행 규칙
1. Phase 순서대로 진행 (1 → 2 → 3 → 4)
2. 각 PR은 담당 에이전트가 작업 → 리더 검증 → 푸시
3. 이 채널에 PR 단위로 진행상황 보고
4. 블로커 발생 시 즉시 리더에게 보고
5. Phase 1 완료 = **MVP 배포 가능 상태**

---

## 우선 실행 순서 (오늘)
1. **PR-01**: 서버 배포 (Railway) → 멀티플레이어 동작
2. **PR-02**: 닉네임 입력
3. **PR-03**: 방 인원수 표시

이 3개 끝나면 실제로 링크 공유해서 친구랑 같은 방에서 만날 수 있는 상태가 됨.
