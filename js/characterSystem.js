// 주인공 생성과 인물 관계. DOM과 무관한 순수 로직.
import { ORIGINS, TRAITS, TRAIT_PICK, FREE_POINTS } from '../data/origins.js';
import { STAT_IDS, STAT_MAX } from '../data/stats.js';
import { PLAYER_LOOKS, CHARACTERS } from '../data/characters.js';

// 생성 선택값 검증. 결과: 문제 목록(빈 배열이면 정상)
// opts: { name, originId, traits: [id, id], alloc: { statId: n }, lookId }
export function validateCreation(opts) {
  const errors = [];
  if (!ORIGINS.some((o) => o.id === opts.originId)) errors.push('출신을 선택하세요.');
  const traits = opts.traits || [];
  if (traits.length !== TRAIT_PICK || new Set(traits).size !== TRAIT_PICK) errors.push(`특성을 ${TRAIT_PICK}개 선택하세요.`);
  if (traits.some((t) => !TRAITS.some((x) => x.id === t))) errors.push('알 수 없는 특성입니다.');
  const alloc = opts.alloc || {};
  let spent = 0;
  for (const [k, v] of Object.entries(alloc)) {
    if (!STAT_IDS.includes(k) || !Number.isInteger(v) || v < 0) errors.push('잘못된 능력치 배분입니다.');
    spent += v;
  }
  if (spent > FREE_POINTS) errors.push(`추가 포인트는 ${FREE_POINTS}점까지입니다.`);
  return errors;
}

// 출신·특성·배분을 적용한 최종 능력치 미리보기
export function previewStats(baseStats, opts) {
  const s = { ...baseStats };
  const origin = ORIGINS.find((o) => o.id === opts.originId);
  const add = (src) => { for (const [k, v] of Object.entries(src || {})) s[k] = Math.min(STAT_MAX, s[k] + v); };
  add(origin?.stats);
  for (const t of opts.traits || []) add(TRAITS.find((x) => x.id === t)?.stats);
  add(opts.alloc);
  return s;
}

// createNewState()로 만든 상태에 생성 선택을 적용한다.
export function applyCreation(state, opts) {
  const errors = validateCreation(opts);
  if (errors.length) throw new Error(errors.join(' '));
  const origin = ORIGINS.find((o) => o.id === opts.originId);
  const p = state.player;
  p.origin = origin.id;
  p.traits = [...opts.traits];
  p.look = (PLAYER_LOOKS.find((l) => l.id === opts.lookId) || PLAYER_LOOKS[0]).id;
  p.stats = previewStats(p.stats, opts);
  const addRes = (src) => { for (const [k, v] of Object.entries(src || {})) state.resources[k] = (state.resources[k] ?? 0) + v; };
  addRes(origin.resources);
  for (const t of opts.traits) addRes(TRAITS.find((x) => x.id === t)?.resources);
  for (const [k, v] of Object.entries(origin.orgs || {})) state.orgs[k] = (state.orgs[k] ?? 0) + v;
  Object.assign(state.progress.flags, origin.flags || {});
  return state;
}

export function playerPortraitDef(state) {
  const look = PLAYER_LOOKS.find((l) => l.id === state.player.look) || PLAYER_LOOKS[0];
  return { name: state.player.name, look: look.look };
}

// 만난 인물 목록 [{ def, affinity }]
export function knownCharacters(state) {
  return Object.entries(state.relations)
    .filter(([, r]) => r.met)
    .map(([id, r]) => ({ def: CHARACTERS[id], affinity: r.affinity }))
    .filter((x) => x.def);
}

export function affinityLabel(n) {
  if (n >= 8) return '깊은 신뢰';
  if (n >= 5) return '친밀';
  if (n >= 2) return '호의';
  if (n >= -1) return '보통';
  if (n >= -4) return '서먹함';
  return '불신';
}
