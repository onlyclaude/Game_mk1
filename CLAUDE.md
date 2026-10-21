# 회색의 연대기 — 개발 메모 (Claude용 요약)

빌드 도구 없는 순수 HTML/CSS/JS(ES Modules) 2D 웹 RPG. 태블릿 우선. 서버/DB 없음, localStorage 저장.
진행 계획과 현재 단계는 `PLAN.md` 참고. 단계가 끝날 때마다 이 파일과 PLAN.md를 갱신한다.

## 실행 / 테스트
- 실행: `npm start` → http://localhost:8000 (tools/serve.mjs, 의존성 없음)
- 단위 테스트: `npm test` (node --test, tests/*.test.js — DOM 없는 로직만)
- E2E: `npm run test:e2e` (tests/e2e/run.mjs, 전역 Playwright 사용, 스크린샷은 test-results/에 저장·gitignore)

## 구조
- `index.html` — #screen-root(화면), #toast-layer, #modal-layer
- `styles/main.css` — :root 디자인 토큰(--font-scale, --anim-speed, 색상), 공통 컴포넌트(.panel .btn .choice .chip .topbar)
- `styles/responsive.css` — 화면 폭/높이/방향 대응, hover는 (hover:hover)에서만
- `js/main.js` — 화면 등록 + 시작
- `js/ui.js` — `h()` DOM 헬퍼(onClick은 자동으로 guard 적용), `registerScreen/showScreen`, `toast`, `openModal`(body에 close를 받는 함수 가능), `confirmDialog`, `applySettings`
- `js/game.js` — 흐름 제어(새 게임/이어하기/저장/자동 저장/설정). 화면은 여기 함수만 호출
- `js/gameState.js` — `createNewState()`, 상태 저장소(getState/setState/updateState/subscribe). SAVE_VERSION
- `js/saveSystem.js` — save/load/parseSave/validateSave/migrate/quarantineCorruptSave, 설정 저장. storage 주입 가능(테스트용)
- `js/art.js` — 임시 그래픽(emblem, portrait). def.image가 있으면 <img>로 교체
- `js/screens/*.js` — 각 화면 모듈: `render(params) => HTMLElement`, 선택적 `onLeave()`
- `data/*.js` — 게임 데이터(엔진 코드와 분리). 현재 stats.js

## 규칙
- 상태 변경은 `updateState(fn)` 사용 → 자동 저장(400ms 디바운스) 트리거
- 저장 구조 변경 시 SAVE_VERSION 올리고 saveSystem의 `migrations`에 변환 함수 추가
- 보상 지급은 `state.claimedRewards[key]`로 중복 방지(4단계)
- 전투/판정 계산은 DOM 없이 순수 함수로 작성하고 단위 테스트 추가
- 버튼에는 `data-action` 속성을 달아 E2E에서 찾는다
- 터치 대상 최소 높이 44px(--touch: 48px), 가로 스크롤 금지
- 미구현 기능은 "(준비 중)"으로 표시, 구현했다고 표기하지 않는다

## 저장 키
`gc.save`(진행 중인 플레이), `gc.save.corrupt`(손상 백업), `gc.settings`(설정). 기록실용 `gc.archive`는 5단계에서 추가.
