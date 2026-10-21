// 사건 엔진. 화면과 무관한 순수 로직 — 상태 객체를 받아 수정한다.
// 사건 데이터 형식은 data/events.js 상단 주석 참고.
import { STATS, STAT_MIN, STAT_MAX } from '../data/stats.js';
import { CHARACTERS, ORGS } from '../data/characters.js';
import { resolveCheck, outcomeKey } from './checkSystem.js';

export const YEAR_STEPS = 4;   // 한 해에 겪는 사건 수
const LOG_MAX = 40;

const STAT_NAME = Object.fromEntries(STATS.map((s) => [s.id, s.name]));
const RES_NAME = { credits: '크레딧', supplies: '보급품' };

// ===== 조건 =====
// cond: { year:[min,max], flags:[], notFlags:[], met:[], stat:{id:n}, credits:n, supplies:n, relation:{id:n}, org:{id:n} }
// 결과: { ok, reasons: ['지성 5 이상'] }
export function checkCondition(cond, state) {
  const reasons = [];
  if (!cond) return { ok: true, reasons };
  const p = state.progress;
  if (cond.year) {
    const [min, max = Infinity] = cond.year;
    if (p.year < min || p.year > max) reasons.push(`${min}년차 이후`);
  }
  for (const f of cond.flags || []) if (!p.flags[f]) reasons.push('특정 사건 경험 필요');
  for (const f of cond.notFlags || []) if (p.flags[f]) reasons.push('이미 다른 길을 선택함');
  for (const id of cond.met || []) {
    if (!state.relations[id]?.met) reasons.push(`${CHARACTERS[id]?.name ?? id}와(과) 만난 적 있음`);
  }
  for (const [id, n] of Object.entries(cond.stat || {})) {
    if ((state.player.stats[id] ?? 0) < n) reasons.push(`${STAT_NAME[id]} ${n} 이상`);
  }
  if (cond.credits && state.resources.credits < cond.credits) reasons.push(`크레딧 ${cond.credits} 필요`);
  if (cond.supplies && state.resources.supplies < cond.supplies) reasons.push(`보급품 ${cond.supplies} 필요`);
  for (const [id, n] of Object.entries(cond.relation || {})) {
    if ((state.relations[id]?.affinity ?? 0) < n) reasons.push(`${CHARACTERS[id]?.name ?? id} 호감 ${n} 이상`);
  }
  for (const [id, n] of Object.entries(cond.org || {})) {
    if ((state.orgs[id] ?? 0) < n) reasons.push(`${ORGS[id]?.name ?? id} 평판 ${n} 이상`);
  }
  if (cond.origin && !cond.origin.includes(state.player.origin)) reasons.push('특정 출신 전용');
  return { ok: reasons.length === 0, reasons };
}

// ===== 사건 고르기 =====
function isEligible(ev, state) {
  const p = state.progress;
  if (!ev.repeatable && p.completedEvents.includes(ev.id)) return false;
  if (ev.year) {
    const [min, max = Infinity] = ev.year;
    if (p.year < min || p.year > max) return false;
  }
  return checkCondition(ev.condition, state).ok;
}

export function findEvent(events, id) {
  return events.find((e) => e.id === id) || null;
}

// 우선순위: 후속 사건 대기열 → 메인 사건(priority 높은 순) → 일반 사건(가중치 무작위) → 일상 사건
export function pickNextEvent(state, events, rng = Math.random) {
  const p = state.progress;
  while (p.queue.length) {
    const ev = findEvent(events, p.queue[0]);
    if (ev && isEligible(ev, state)) return ev;
    p.queue.shift(); // 조건이 맞지 않게 된 후속 사건은 버린다
  }
  const pool = events.filter((e) => !e.filler && !e.followUp && isEligible(e, state));
  const main = pool.filter((e) => e.priority > 0).sort((a, b) => b.priority - a.priority);
  if (main.length) return main[0];
  if (pool.length) return weightedPick(pool, rng);
  const fillers = events.filter((e) => e.filler && isEligible(e, state) && e.id !== p.lastEventId);
  if (fillers.length) return weightedPick(fillers, rng);
  return events.find((e) => e.filler) || null;
}

function weightedPick(list, rng) {
  const total = list.reduce((a, e) => a + (e.weight ?? 1), 0);
  let r = rng() * total;
  for (const e of list) {
    r -= e.weight ?? 1;
    if (r < 0) return e;
  }
  return list[list.length - 1];
}

export function beginEvent(state, ev) {
  state.progress.currentEventId = ev.id;
  if (state.progress.queue[0] === ev.id) state.progress.queue.shift();
}

// ===== 선택지 =====
export function choiceStatus(state, choice) {
  return checkCondition(choice.condition, state);
}

// 결과: { check|null, outcome, result: {text}, changes: [{text, kind}], yearAdvanced }
export function resolveChoice(state, ev, choiceId, rng = Math.random) {
  const choice = ev.choices.find((c) => c.id === choiceId);
  if (!choice) throw new Error(`선택지 없음: ${ev.id}/${choiceId}`);
  if (state.progress.currentEventId !== ev.id) throw new Error('진행 중인 사건이 아닙니다.');
  const status = choiceStatus(state, choice);
  if (!status.ok) throw new Error('선택 조건을 만족하지 않습니다: ' + status.reasons.join(', '));

  let check = null;
  let outcome = 'none';
  let result;
  if (choice.check) {
    check = resolveCheck(state, choice.check, rng);
    outcome = check.outcome;
    const key = outcomeKey(outcome);
    result = choice.outcomes[key] ?? (key === 'partial' ? choice.outcomes.fail : null);
    if (outcome === 'critical' && choice.outcomes.critical) result = choice.outcomes.critical;
  } else {
    result = choice.result;
  }
  if (!result) throw new Error(`결과 데이터 없음: ${ev.id}/${choiceId}/${outcome}`);

  const changes = [];
  // 사건에 등장한 인물과 만남
  for (const cid of ev.characters || []) {
    if (!state.relations[cid]?.met) {
      state.relations[cid] = { met: true, affinity: state.relations[cid]?.affinity ?? 0 };
      changes.push({ text: `${CHARACTERS[cid].name}와(과) 알게 되었다`, kind: 'info' });
    }
  }
  if (outcome === 'critical') changes.push(...applyEffects(state, { resources: { credits: 5 } }, '대성공 보너스 '));
  changes.push(...applyEffects(state, result.effects));

  const p = state.progress;
  p.choices.push({ eventId: ev.id, choiceId, outcome, year: p.year, major: !!ev.major });
  if (!p.completedEvents.includes(ev.id)) p.completedEvents.push(ev.id);
  p.currentEventId = null;
  p.lastEventId = ev.id;
  pushLog(state, `${p.year}년차 · ${ev.title}: ${choice.text}${check ? ` (${outcome === 'none' ? '' : outcomeLabel(outcome)})` : ''}`);

  p.step += 1;
  p.yearStep += 1;
  let yearAdvanced = false;
  if (p.yearStep >= YEAR_STEPS) {
    p.year += 1;
    p.yearStep = 0;
    yearAdvanced = true;
    pushLog(state, `${p.year}년차가 시작되었다.`);
  }
  return { check, outcome, result, changes, yearAdvanced };
}

const LABELS = { critical: '대성공', success: '성공', partial: '부분 성공', fail: '실패', fumble: '대실패' };
function outcomeLabel(o) { return LABELS[o] ?? o; }

export function pushLog(state, text) {
  state.progress.log.push(text);
  if (state.progress.log.length > LOG_MAX) state.progress.log.splice(0, state.progress.log.length - LOG_MAX);
}

// ===== 효과 적용 =====
// effects: { stats, resources, flags, relations, orgs, queue, log }
export function applyEffects(state, effects, prefix = '') {
  const changes = [];
  if (!effects) return changes;
  const sign = (n) => (n > 0 ? `+${n}` : `${n}`);
  for (const [id, n] of Object.entries(effects.stats || {})) {
    const before = state.player.stats[id];
    state.player.stats[id] = clamp(before + n, STAT_MIN, STAT_MAX);
    const d = state.player.stats[id] - before;
    if (d) changes.push({ text: `${prefix}${STAT_NAME[id]} ${sign(d)}`, kind: d > 0 ? 'up' : 'down' });
  }
  for (const [id, n] of Object.entries(effects.resources || {})) {
    const before = state.resources[id] ?? 0;
    state.resources[id] = Math.max(0, before + n);
    const d = state.resources[id] - before;
    if (d) changes.push({ text: `${prefix}${RES_NAME[id] ?? id} ${sign(d)}`, kind: d > 0 ? 'up' : 'down' });
  }
  for (const [id, n] of Object.entries(effects.relations || {})) {
    const r = state.relations[id] || (state.relations[id] = { met: true, affinity: 0 });
    r.met = true;
    r.affinity = clamp(r.affinity + n, -10, 10);
    changes.push({ text: `${CHARACTERS[id]?.name ?? id} 호감 ${sign(n)}`, kind: n > 0 ? 'up' : 'down' });
  }
  for (const [id, n] of Object.entries(effects.orgs || {})) {
    state.orgs[id] = clamp((state.orgs[id] ?? 0) + n, -10, 10);
    changes.push({ text: `${ORGS[id]?.name ?? id} 평판 ${sign(n)}`, kind: n > 0 ? 'up' : 'down' });
  }
  for (const [f, v] of Object.entries(effects.flags || {})) state.progress.flags[f] = v;
  for (const q of [].concat(effects.queue || [])) {
    if (!state.progress.queue.includes(q)) state.progress.queue.push(q);
  }
  if (effects.note) changes.push({ text: effects.note, kind: 'info' });
  return changes;
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
