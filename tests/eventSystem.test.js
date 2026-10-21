import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNewState } from '../js/gameState.js';
import { applyCreation, validateCreation } from '../js/characterSystem.js';
import { checkCondition, pickNextEvent, beginEvent, resolveChoice, applyEffects, choiceStatus, YEAR_STEPS } from '../js/eventSystem.js';
import { EVENTS } from '../data/events.js';
import { CHARACTERS } from '../data/characters.js';
import { SCENES } from '../data/scenes.js';
import { STAT_IDS } from '../data/stats.js';
import { seqRng, die, seededRng } from './helpers.js';

const newGame = (over = {}) => applyCreation(createNewState({ name: '테스트' }),
  { originId: 'bureau', traits: ['sharp_eye', 'lucky'], alloc: { sense: 1 }, lookId: 'a', ...over });

test('캐릭터 생성: 출신·특성·추가 포인트가 능력치에 반영된다', () => {
  const s = newGame();
  assert.equal(s.player.stats.intellect, 4); // 기본 3 + 출신 1
  assert.equal(s.player.stats.will, 4);
  assert.equal(s.player.stats.sense, 5);     // 3 + 특성 1 + 추가 1
  assert.equal(s.player.stats.luck, 5);      // 3 + 행운아 2
  assert.equal(s.orgs.bureau, 2);
  assert.equal(s.progress.flags.origin_bureau, true);
});

test('캐릭터 생성 검증', () => {
  assert.ok(validateCreation({ originId: 'x', traits: [] }).length >= 2);
  assert.ok(validateCreation({ originId: 'bureau', traits: ['lucky', 'lucky'] }).length > 0);
  assert.ok(validateCreation({ originId: 'bureau', traits: ['lucky', 'steady'], alloc: { body: 3 } }).length > 0);
  assert.deepEqual(validateCreation({ originId: 'bureau', traits: ['lucky', 'steady'], alloc: { body: 2 } }), []);
});

test('첫 사건은 1년차 메인 사건', () => {
  const s = newGame();
  assert.equal(pickNextEvent(s, EVENTS).id, 'y1_patrol');
});

test('선택 → 판정 → 효과 적용 → 사건 완료 기록', () => {
  const s = newGame();
  const ev = pickNextEvent(s, EVENTS);
  beginEvent(s, ev);
  const r = resolveChoice(s, ev, 'observe', seqRng([die(6), die(5)]));
  assert.equal(r.outcome, 'success');
  assert.equal(s.relations.lien.met, true);
  assert.equal(s.relations.lien.affinity, 2);
  assert.equal(s.progress.flags.saw_fog_pulse, true);
  assert.ok(s.progress.completedEvents.includes('y1_patrol'));
  assert.equal(s.progress.currentEventId, null);
  assert.equal(s.progress.choices.at(-1).major, true);
  // 같은 사건은 다시 나오지 않는다
  assert.notEqual(pickNextEvent(s, EVENTS).id, 'y1_patrol');
});

test('실패 결과도 정상 적용된다', () => {
  const s = newGame();
  const ev = pickNextEvent(s, EVENTS);
  beginEvent(s, ev);
  s.player.stats.sense = 1;
  const before = s.resources.supplies;
  // 1+2 + 감각1 + 특성1 = 5 vs 9 → 실패, 운 구제 실패(0.99)
  const r = resolveChoice(s, ev, 'observe', seqRng([die(1), die(2), 0.99]));
  assert.equal(r.outcome, 'fail');
  assert.equal(s.resources.supplies, before - 1);
});

test('조건이 맞지 않는 선택지는 거부된다', () => {
  const s = newGame({ originId: 'courier' });
  const ev = pickNextEvent(s, EVENTS);
  beginEvent(s, ev);
  const protocol = ev.choices.find((c) => c.id === 'protocol');
  assert.equal(choiceStatus(s, protocol).ok, false);
  assert.throws(() => resolveChoice(s, ev, 'protocol'));
  assert.equal(s.progress.currentEventId, ev.id); // 상태가 바뀌지 않음
});

test('진행 중이 아닌 사건의 선택은 거부된다 (중복 선택 방지)', () => {
  const s = newGame();
  const ev = pickNextEvent(s, EVENTS);
  beginEvent(s, ev);
  resolveChoice(s, ev, 'routine');
  const credits = s.resources.credits;
  assert.throws(() => resolveChoice(s, ev, 'routine'));
  assert.equal(s.resources.credits, credits);
});

test('후속 사건은 대기열을 통해 바로 다음에 발생한다', () => {
  const s = newGame();
  s.progress.completedEvents.push('y1_patrol');
  const ev = pickNextEvent(s, EVENTS);
  assert.equal(ev.id, 'drain_request');
  beginEvent(s, ev);
  resolveChoice(s, ev, 'alone', seqRng([die(6), die(6)]));
  assert.equal(pickNextEvent(s, EVENTS).id, 'drain_log');
});

test(`사건 ${YEAR_STEPS}개마다 연차가 오른다`, () => {
  const s = newGame();
  const rng = seededRng(3);
  for (let i = 0; i < YEAR_STEPS; i++) {
    const ev = pickNextEvent(s, EVENTS, rng);
    beginEvent(s, ev);
    const c = ev.choices.find((x) => choiceStatus(s, x).ok);
    const r = resolveChoice(s, ev, c.id, rng);
    assert.equal(r.yearAdvanced, i === YEAR_STEPS - 1);
  }
  assert.equal(s.progress.year, 2);
  assert.equal(s.progress.yearStep, 0);
});

test('효과: 능력치와 재화는 범위를 벗어나지 않는다', () => {
  const s = newGame();
  applyEffects(s, { stats: { body: 50 }, resources: { credits: -9999 } });
  assert.equal(s.player.stats.body, 10);
  assert.equal(s.resources.credits, 0);
});

test('조건 검사 이유 문구', () => {
  const s = newGame();
  const r = checkCondition({ stat: { body: 9 }, credits: 999, met: ['kaya'] }, s);
  assert.equal(r.ok, false);
  assert.equal(r.reasons.length, 3);
});

test('사건 데이터 무결성', () => {
  const ids = new Set();
  for (const ev of EVENTS) {
    assert.ok(!ids.has(ev.id), `중복 id ${ev.id}`);
    ids.add(ev.id);
    assert.ok(SCENES[ev.scene], `${ev.id}: 없는 장면 ${ev.scene}`);
    for (const c of ev.characters || []) assert.ok(CHARACTERS[c], `${ev.id}: 없는 인물 ${c}`);
    assert.ok(ev.choices.length >= 2 && ev.choices.length <= 4, `${ev.id}: 선택지 수`);
    // 조건 없는 선택지가 최소 하나 있어야 진행이 막히지 않는다
    assert.ok(ev.choices.some((c) => !c.condition), `${ev.id}: 항상 고를 수 있는 선택지 없음`);
    for (const c of ev.choices) {
      const where = `${ev.id}/${c.id}`;
      if (c.check) {
        assert.ok(STAT_IDS.includes(c.check.stat), `${where}: 능력치`);
        assert.ok(c.check.difficulty != null || c.check.scale != null, `${where}: 난이도`);
        assert.ok(c.outcomes?.success && c.outcomes?.fail, `${where}: 성공/실패 결과`);
        if (c.check.assist) assert.ok(CHARACTERS[c.check.assist], `${where}: 도움 인물`);
      } else {
        assert.ok(c.result?.text, `${where}: 결과`);
      }
      for (const o of [c.result, ...Object.values(c.outcomes || {})].filter(Boolean)) {
        for (const q of [].concat(o.effects?.queue || [])) assert.ok(EVENTS.some((e) => e.id === q), `${where}: 없는 후속 사건 ${q}`);
        for (const k of Object.keys(o.effects?.relations || {})) assert.ok(CHARACTERS[k], `${where}: 관계 인물 ${k}`);
      }
    }
  }
});

test('긴 플레이 시뮬레이션: 60개 사건 동안 진행이 막히지 않는다 (출신 4종 × 시드 5개)', () => {
  for (const originId of ['bureau', 'underdeck', 'cloister', 'courier']) {
    for (let seed = 1; seed <= 5; seed++) {
      const rng = seededRng(seed * 97 + originId.length);
      const s = newGame({ originId, alloc: {} });
      for (let i = 0; i < 60; i++) {
        const ev = pickNextEvent(s, EVENTS, rng);
        assert.ok(ev, `사건 없음 (${originId}, seed ${seed}, step ${i})`);
        beginEvent(s, ev);
        const avail = ev.choices.filter((c) => choiceStatus(s, c).ok);
        assert.ok(avail.length > 0, `${ev.id}: 고를 수 있는 선택지 없음`);
        const c = avail[Math.floor(rng() * avail.length)];
        resolveChoice(s, ev, c.id, rng);
        for (const v of Object.values(s.player.stats)) assert.ok(v >= 1 && v <= 10);
        assert.ok(s.resources.credits >= 0 && s.resources.supplies >= 0);
      }
      assert.equal(s.progress.year, 1 + Math.floor(60 / YEAR_STEPS));
    }
  }
});
