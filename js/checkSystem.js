// 능력치 판정. DOM과 무관한 순수 함수 — tests/checkSystem.test.js에서 검증한다.
//
// 규칙
//  - 주사위 2개(2d6) + 능력치 + 보정 = 합계
//  - 합계 ≥ 난이도          → 성공
//  - 합계 ≥ 난이도 - 2      → 부분 성공
//  - 그 외                  → 실패
//  - 주사위 6·6             → 대성공 (항상 성공)
//  - 주사위 1·1             → 대실패 (항상 실패, 운으로도 구제 불가)
//  - 일반 실패일 때 운 × 4% (최대 40%) 확률로 부분 성공으로 구제
import { TRAITS } from '../data/origins.js';
import { CHARACTERS } from '../data/characters.js';

export const PARTIAL_MARGIN = 2;
export const LUCK_RESCUE_PER_POINT = 0.04;
export const LUCK_RESCUE_MAX = 0.4;

export const OUTCOME_LABEL = {
  critical: '대성공',
  success: '성공',
  partial: '부분 성공',
  fail: '실패',
  fumble: '대실패',
};

export const rollDie = (rng = Math.random) => 1 + Math.floor(rng() * 6);

export function luckRescueChance(luck) {
  return Math.min(LUCK_RESCUE_MAX, Math.max(0, luck) * LUCK_RESCUE_PER_POINT);
}

// 주사위 값이 정해졌을 때 운 구제 전 결과
export function classify(d1, d2, total, difficulty) {
  if (d1 === 6 && d2 === 6) return 'critical';
  if (d1 === 1 && d2 === 1) return 'fumble';
  if (total >= difficulty) return 'success';
  if (total >= difficulty - PARTIAL_MARGIN) return 'partial';
  return 'fail';
}

// 보정 목록: [{ label, value }]
export function getModifiers(state, check) {
  const mods = [];
  const tags = check.tags || [];
  for (const tid of state.player.traits || []) {
    const t = TRAITS.find((x) => x.id === tid);
    if (!t?.tagBonus) continue;
    for (const tag of tags) {
      if (t.tagBonus[tag]) mods.push({ label: `특성: ${t.name}`, value: t.tagBonus[tag] });
    }
  }
  if (check.assist) {
    const rel = state.relations?.[check.assist];
    if (rel?.met) {
      const bonus = 1 + (rel.affinity >= 5 ? 1 : 0);
      mods.push({ label: `도움: ${CHARACTERS[check.assist]?.name ?? check.assist}`, value: bonus });
    }
  }
  if (check.bonus) mods.push({ label: '상황 보정', value: check.bonus });
  return mods;
}

// 난이도: 고정값(difficulty) 또는 능력치에 비례(scale: 능력치 + scale). 훈련처럼 성장할수록 어려워지는 판정에 쓴다.
export function difficultyOf(state, check) {
  return check.difficulty ?? (state.player.stats[check.stat] ?? 0) + (check.scale ?? 0);
}

// check: { stat, difficulty | scale, tags?, assist?, bonus? }
// 결과: { dice, statValue, mods, total, difficulty, outcome, luckRescued }
export function resolveCheck(state, check, rng = Math.random) {
  const statValue = state.player.stats[check.stat] ?? 0;
  const mods = getModifiers(state, check);
  const modSum = mods.reduce((a, m) => a + m.value, 0);
  const dice = [rollDie(rng), rollDie(rng)];
  const total = dice[0] + dice[1] + statValue + modSum;
  const difficulty = difficultyOf(state, check);
  let outcome = classify(dice[0], dice[1], total, difficulty);
  let luckRescued = false;
  if (outcome === 'fail' && rng() < luckRescueChance(state.player.stats.luck ?? 0)) {
    outcome = 'partial';
    luckRescued = true;
  }
  return { stat: check.stat, dice, statValue, mods, total, difficulty, outcome, luckRescued };
}

// 화면 표시용 확률 (36가지 주사위 조합을 모두 계산)
// 결과: { success, partialOrBetter } (0~1)
export function checkChances(state, check) {
  const statValue = state.player.stats[check.stat] ?? 0;
  const modSum = getModifiers(state, check).reduce((a, m) => a + m.value, 0);
  const rescue = luckRescueChance(state.player.stats.luck ?? 0);
  const difficulty = difficultyOf(state, check);
  let success = 0;
  let partial = 0;
  for (let a = 1; a <= 6; a++) {
    for (let b = 1; b <= 6; b++) {
      const o = classify(a, b, a + b + statValue + modSum, difficulty);
      if (o === 'critical' || o === 'success') success++;
      else if (o === 'partial') partial++;
      else if (o === 'fail') partial += rescue;
    }
  }
  return { success: success / 36, partialOrBetter: (success + partial) / 36 };
}

// 결과 키를 사건 데이터의 outcomes 키로 바꾼다 (대성공 → success 등)
export function outcomeKey(outcome) {
  if (outcome === 'critical') return 'success';
  if (outcome === 'fumble') return 'fail';
  return outcome;
}
