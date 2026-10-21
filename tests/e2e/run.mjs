// 브라우저 E2E 테스트 (Playwright). 사용법: npm run test:e2e
// Playwright가 프로젝트에 설치되어 있지 않으면 전역 설치본을 찾는다.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { startServer } from '../../tools/serve.mjs';

async function loadPlaywright() {
  try { return await import('playwright'); } catch { /* 전역 설치본 사용 */ }
  const globalRoot = execSync('npm root -g').toString().trim();
  return createRequire(globalRoot + '/')('playwright');
}

const { chromium } = await loadPlaywright();
const PORT = 8123;
const BASE = `http://localhost:${PORT}/`;
const OUT = 'test-results';
mkdirSync(OUT, { recursive: true });

const server = await startServer(PORT);
const browser = await chromium.launch();
const results = [];
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    results.push(`  ✔ ${name}`);
  } catch (e) {
    failed++;
    results.push(`  ✘ ${name}\n      ${e.message.split('\n')[0]}`);
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

async function newPage(viewport = { width: 1180, height: 820 }) {
  const ctx = await browser.newContext({ viewport, hasTouch: true, isMobile: viewport.width < 1000, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  await page.goto(BASE);
  await page.waitForSelector('[data-screen="title"]');
  return page;
}
const act = (page, a) => page.locator(`[data-action="${a}"]`).first();

async function startGame(page, name) {
  await act(page, 'new-game').click();
  await page.waitForSelector('[data-screen="newGame"]');
  await page.fill('#player-name', name);
  await act(page, 'start').click();
  await page.waitForSelector('[data-screen="hub"]');
}

// --- 기능 테스트 ---
await check('시작 화면이 오류 없이 열린다', async () => {
  const page = await newPage();
  assert(await act(page, 'continue').isDisabled(), '저장 데이터가 없는데 이어하기가 활성화됨');
  assert(page.errors.length === 0, '콘솔 오류: ' + page.errors.join(' | '));
  await page.context().close();
});

await check('새 게임 → 이름 입력 → 거점 화면에 이름 표시', async () => {
  const page = await newPage();
  await startGame(page, '하린');
  assert((await page.textContent('.topbar-title')).includes('하린'), '이름이 표시되지 않음');
  assert(page.errors.length === 0, '콘솔 오류: ' + page.errors.join(' | '));
  await page.context().close();
});

await check('새로고침 후 저장 데이터 유지 및 이어하기', async () => {
  const page = await newPage();
  await startGame(page, '유지테스트');
  await act(page, 'save').click();
  await page.reload();
  await page.waitForSelector('[data-screen="title"]');
  const btn = act(page, 'continue');
  assert(!(await btn.isDisabled()), '이어하기가 비활성화됨');
  assert((await btn.textContent()).includes('유지테스트'), '이어하기에 이름이 없음');
  await btn.click();
  await page.waitForSelector('[data-screen="hub"]');
  assert((await page.textContent('.topbar-title')).includes('유지테스트'), '불러온 이름이 다름');
  await page.context().close();
});

await check('자동 저장: 수동 저장 없이 새로고침해도 유지', async () => {
  const page = await newPage();
  await startGame(page, '자동저장');
  await page.reload();
  await page.waitForSelector('[data-screen="title"]');
  assert((await act(page, 'continue').textContent()).includes('자동저장'), '자동 저장되지 않음');
  await page.context().close();
});

await check('손상된 저장 데이터를 안전하게 처리', async () => {
  const page = await newPage();
  await page.evaluate(() => localStorage.setItem('gc.save', '{broken json'));
  await page.reload();
  await page.waitForSelector('[data-screen="title"]');
  assert(await act(page, 'clean-corrupt').isVisible(), '손상 안내가 표시되지 않음');
  assert(await act(page, 'continue').isDisabled(), '손상 데이터인데 이어하기 활성화');
  await act(page, 'clean-corrupt').click();
  await page.locator('.modal [data-value="true"]').click();
  await page.waitForSelector('[data-action="clean-corrupt"]', { state: 'detached' });
  const kept = await page.evaluate(() => localStorage.getItem('gc.save.corrupt'));
  assert(kept === '{broken json', '원본 백업이 없음');
  assert(page.errors.length === 0, '콘솔 오류: ' + page.errors.join(' | '));
  await page.context().close();
});

await check('빠른 연속 터치가 중복 실행되지 않음', async () => {
  const page = await newPage();
  await startGame(page, '연타');
  await page.waitForTimeout(400); // 화면 전환 직후의 잠금 시간이 지난 뒤
  const btn = act(page, 'save');
  await btn.dispatchEvent('click');
  await btn.dispatchEvent('click');
  await btn.dispatchEvent('click');
  const n = await page.locator('.toast').count();
  assert(n === 1, `저장이 ${n}번 실행됨`);
  await page.context().close();
});

await check('설정: 글자 크기 변경이 적용되고 유지됨', async () => {
  const page = await newPage();
  await act(page, 'settings').click();
  await page.locator('.modal .segmented >> text=아주 크게').click();
  const fs = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
  assert(fs === '20.8px', `글자 크기 적용 안 됨: ${fs}`);
  await page.reload();
  await page.waitForSelector('[data-screen="title"]');
  const fs2 = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
  assert(fs2 === '20.8px', `새로고침 후 유지 안 됨: ${fs2}`);
  await page.context().close();
});

await check('저장 데이터 초기화는 확인 후에만 삭제', async () => {
  const page = await newPage();
  await startGame(page, '초기화');
  await act(page, 'settings').click();
  await act(page, 'reset-save').click();
  await page.locator('.modal [data-value="false"]').click(); // 취소
  assert(await page.evaluate(() => localStorage.getItem('gc.save') !== null), '취소했는데 삭제됨');
  await act(page, 'settings').click();
  await act(page, 'reset-save').click();
  await page.locator('.modal [data-value="true"]').click();
  await page.waitForSelector('[data-screen="title"]');
  assert(await act(page, 'continue').isDisabled(), '삭제 후 이어하기가 활성화됨');
  await page.context().close();
});

// --- 화면 크기 테스트 ---
const VIEWPORTS = [
  ['iPad 세로', { width: 820, height: 1180 }],
  ['iPad 가로', { width: 1180, height: 820 }],
  ['소형 태블릿 세로', { width: 600, height: 960 }],
  ['휴대폰 세로', { width: 390, height: 844 }],
  ['휴대폰 가로', { width: 844, height: 390 }],
];

async function layoutCheck(page, label) {
  const issues = await page.evaluate(() => {
    const out = [];
    const vw = window.innerWidth;
    if (document.documentElement.scrollWidth > vw + 1) out.push(`가로 스크롤 발생(${document.documentElement.scrollWidth}px)`);
    for (const b of document.querySelectorAll('#screen-root button, #screen-root input')) {
      const r = b.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.height < 44) out.push(`${b.textContent.trim() || b.id} 높이 ${Math.round(r.height)}px`);
      if (r.left < -1 || r.right > vw + 1) out.push(`${b.textContent.trim()} 화면 밖`);
    }
    return out;
  });
  assert(issues.length === 0, `${label}: ${issues.join(', ')}`);
}

for (const [label, vp] of VIEWPORTS) {
  await check(`${label} ${vp.width}x${vp.height}: 레이아웃`, async () => {
    const page = await newPage(vp);
    await layoutCheck(page, '타이틀');
    await page.waitForTimeout(400); // 화면 전환 애니메이션 종료 대기
    await page.screenshot({ path: `${OUT}/title-${vp.width}x${vp.height}.png` });
    await startGame(page, '화면테스트');
    await layoutCheck(page, '거점');
    // 스크롤 영역 안의 모든 버튼에 실제로 터치가 닿는지 확인
    for (const a of ['save', 'settings']) {
      await act(page, a).scrollIntoViewIfNeeded();
      await act(page, a).tap({ trial: true });
    }
    await page.waitForTimeout(400); // 화면 전환 애니메이션 종료 대기
    await page.screenshot({ path: `${OUT}/hub-${vp.width}x${vp.height}.png` });
    await page.context().close();
  });
}

await browser.close();
server.close();
console.log(results.join('\n'));
console.log(`\n${results.length - failed}/${results.length} 통과`);
process.exit(failed ? 1 : 0);
