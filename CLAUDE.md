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
- `js/art.js` — 애니풍 SVG 초상화 생성기 `portrait(def)`(look: hair/hairStyle/eyes/skin/outfit/outfitColor/accent/accessory/expression/bg), `emblem()`, `sceneStyle()`. def.image가 있으면 <img>로 교체. 미리보기: tools/portrait-preview.html
- `js/checkSystem.js` — 판정(순수): 2d6+능력치+보정 vs 난이도 → critical/success/partial(≥DC-2)/fail/fumble, 운 구제, `checkChances`(36조합 전수), `difficultyOf`(scale=능력치 비례)
- `js/eventSystem.js` — 사건 엔진(순수): checkCondition, pickNextEvent(대기열→메인 priority→가중 무작위→filler), beginEvent, resolveChoice, applyEffects. YEAR_STEPS=4
- `js/characterSystem.js` — 캐릭터 생성(validateCreation/previewStats/applyCreation), 관계 표시 도우미
- `js/screens/*.js` — 각 화면 모듈: `render(params) => HTMLElement`. title, newGame(생성), hub, event, settingsModal, helpModal
- `data/` — stats, origins(출신 4·특성 8), characters(인물 5 + 조직 3 + 주인공 외형 4), scenes(배경 9), events(사건 13 + 일상 2; 형식은 파일 상단 주석)

## 규칙
- 상태 변경은 `updateState(fn)` 사용 → 자동 저장(400ms 디바운스) 트리거
- 저장 구조 변경 시 SAVE_VERSION 올리고 saveSystem의 `migrations`에 변환 함수 추가
- 사건 추가: data/events.js에 객체 추가만 하면 됨. 항상 고를 수 있는(조건 없는) 선택지 1개 이상 필수 — 무결성 테스트가 검사
- 판정 난이도 기준: 시작 능력치 4 기준 난이도 11 ≈ 성공 58%
- 보상 지급은 `state.claimedRewards[key]`로 중복 방지(4단계)
- 전투/판정 계산은 DOM 없이 순수 함수로 작성하고 단위 테스트 추가
- 버튼에는 `data-action` 속성을 달아 E2E에서 찾는다
- 터치 대상 최소 높이 44px(--touch: 48px), 가로 스크롤 금지
- 미구현 기능은 "(준비 중)"으로 표시, 구현했다고 표기하지 않는다

## 저장 키
`gc.save`(진행 중인 플레이, SAVE_VERSION 2), `gc.save.corrupt`(손상 백업), `gc.settings`(설정). 기록실용 `gc.archive`는 5단계에서 추가.
