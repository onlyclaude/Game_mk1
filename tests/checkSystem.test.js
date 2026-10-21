import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNewState } from '../js/gameState.js';
import { resolveCheck, checkChances, classify, luckRescueChance, difficultyOf } from '../js/checkSystem.js';
import { seqRng, die } from './helpers.js';

const mk = (stats = {}, extra = {}) => {
  const s = createNewState({ stats: { luck: 0, ...stats } });
  Object.assign(s.player, extra);
  return s;
};

test('합계 = 주사위 두 개 + 능력치', () => {
  const s = mk({ sense: 4 });
  const r = resolveCheck(s, { stat: 'sense', difficulty: 9 }, seqRng([die(3), die(2)]));
  assert.deepEqual(r.dice, [3, 2]);
  assert.equal(r.total, 9);
  assert.equal(r.outcome, 'success');
});

test('난이도 경계: 성공 / 부분 성공 / 실패', () => {
  assert.equal(classify(3, 4, 10, 10), 'success');
  assert.equal(classify(3, 4, 9, 10), 'partial');
  assert.equal(classify(3, 4, 8, 10), 'partial');
  assert.equal(classify(3, 4, 7, 10), 'fail');
});

test('6·6은 난이도와 상관없이 대성공, 1·1은 대실패', () => {
  assert.equal(classify(6, 6, 13, 99), 'critical');
  assert.equal(classify(1, 1, 50, 3), 'fumble');
});

test('운이 높으면 실패가 부분 성공으로 구제될 수 있다 (대실패는 제외)', () => {
  const s = mk({ will: 1, luck: 10 });
  // 주사위 2,2 → 합계 5 vs 12: 실패 → 운 판정 0.1 < 0.4 → 부분 성공
  const r = resolveCheck(s, { stat: 'will', difficulty: 12 }, seqRng([die(2), die(2), 0.1]));
  assert.equal(r.outcome, 'partial');
  assert.equal(r.luckRescued, true);
  const f = resolveCheck(s, { stat: 'will', difficulty: 12 }, seqRng([die(1), die(1), 0.0]));
  assert.equal(f.outcome, 'fumble');
  assert.equal(luckRescueChance(20), 0.4);
});

test('특성 태그 보정과 동료 도움 보정이 더해진다', () => {
  const s = mk({ sense: 3 }, { traits: ['sharp_eye'] });
  s.relations.lien = { met: true, affinity: 6 };
  const r = resolveCheck(s, { stat: 'sense', difficulty: 10, tags: ['search'], assist: 'lien' }, seqRng([die(2), die(2)]));
  // 2+2+3 + 특성1 + 도움2(호감 5 이상) = 10
  assert.equal(r.total, 10);
  assert.equal(r.mods.length, 2);
  assert.equal(r.outcome, 'success');
});

test('만나지 않은 동료는 도움을 주지 않는다', () => {
  const s = mk({ sense: 3 });
  const r = resolveCheck(s, { stat: 'sense', difficulty: 10, assist: 'lien' }, seqRng([die(2), die(2)]));
  assert.equal(r.mods.length, 0);
});

test('확률 계산: 능력치 0, 난이도 7이면 성공 21/36', () => {
  const s = mk({ body: 0 });
  const c = checkChances(s, { stat: 'body', difficulty: 7 });
  assert.equal(Math.round(c.success * 36), 21);
  assert.ok(c.partialOrBetter > c.success);
});

test('확률 계산이 실제 판정 결과와 일치한다 (36가지 조합 전수 비교)', () => {
  const s = mk({ intellect: 4 });
  const check = { stat: 'intellect', difficulty: 11 };
  let success = 0;
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
    const r = resolveCheck(s, check, seqRng([die(a), die(b), 0.99]));
    if (r.outcome === 'success' || r.outcome === 'critical') success++;
  }
  assert.equal(success / 36, checkChances(s, check).success);
});

test('능력치 비례 난이도', () => {
  const s = mk({ body: 5 });
  assert.equal(difficultyOf(s, { stat: 'body', scale: 8 }), 13);
});
