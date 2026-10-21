// 저장/불러오기, 저장 데이터 검증과 버전 변환.
// storage는 localStorage와 같은 인터페이스(getItem/setItem/removeItem)를 가진 객체다.
// 테스트에서는 가짜 storage를 넘길 수 있다.
import { SAVE_VERSION } from './gameState.js';
import { STAT_IDS } from '../data/stats.js';

export const KEYS = {
  run: 'gc.save',
  corrupt: 'gc.save.corrupt',
  settings: 'gc.settings',
};

export const DEFAULT_SETTINGS = {
  fontScale: 1,      // 0.9 / 1 / 1.15 / 1.3
  animSpeed: 1,      // 1 = 보통, 0.5 = 빠르게, 0.01 = 연출 끄기
};

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // 사파리 개인 정보 보호 모드 등에서 접근 자체가 막히는 경우
  }
}

// 버전별 변환 함수. migrations[n]은 버전 n 데이터를 n+1로 바꾼다.
const migrations = {
  // v1 → v2: 사건 진행용 필드와 주인공 외형 추가
  1: (d) => {
    d.player.look ??= 'a';
    d.player.origin ??= null;
    d.player.traits ??= [];
    Object.assign(d.progress, {
      yearStep: d.progress.yearStep ?? 0,
      lastEventId: d.progress.lastEventId ?? null,
      queue: d.progress.queue ?? [],
      log: d.progress.log ?? [],
      completedEvents: d.progress.completedEvents ?? [],
      flags: d.progress.flags ?? {},
    });
    d.relations ??= {};
    d.orgs ??= {};
    d.saveVersion = 2;
    return d;
  },
};

export function migrate(data) {
  let d = data;
  let v = d.saveVersion;
  while (v < SAVE_VERSION) {
    const step = migrations[v];
    if (!step) throw new Error(`버전 ${v} 저장 데이터를 변환할 수 없습니다.`);
    d = step(d);
    v = d.saveVersion;
  }
  return d;
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// 구조 검증. 문제 목록을 돌려준다(빈 배열이면 정상).
export function validateSave(d) {
  const errors = [];
  if (!isObj(d)) return ['저장 데이터가 객체가 아닙니다.'];
  if (!Number.isInteger(d.saveVersion)) errors.push('saveVersion 없음');
  else if (d.saveVersion > SAVE_VERSION) errors.push('더 새로운 버전의 게임에서 만든 저장 데이터입니다.');
  if (!isObj(d.meta)) errors.push('meta 없음');
  if (!isObj(d.player)) errors.push('player 없음');
  else {
    if (typeof d.player.name !== 'string') errors.push('player.name 오류');
    if (!isObj(d.player.stats)) errors.push('player.stats 없음');
    else for (const id of STAT_IDS) {
      if (!Number.isFinite(d.player.stats[id])) errors.push(`능력치 ${id} 오류`);
    }
  }
  if (!isObj(d.progress)) errors.push('progress 없음');
  else {
    if (!Number.isInteger(d.progress.year)) errors.push('progress.year 오류');
    if (!Array.isArray(d.progress.choices)) errors.push('progress.choices 오류');
    if (d.saveVersion >= 2) {
      if (!Array.isArray(d.progress.queue)) errors.push('progress.queue 오류');
      if (!Array.isArray(d.progress.completedEvents)) errors.push('progress.completedEvents 오류');
      if (!isObj(d.progress.flags)) errors.push('progress.flags 오류');
      if (!isObj(d.relations)) errors.push('relations 오류');
    }
  }
  if (!isObj(d.resources)) errors.push('resources 없음');
  return errors;
}

export function saveGame(state, storage = defaultStorage()) {
  if (!storage) return { ok: false, error: '이 브라우저에서는 저장 공간을 사용할 수 없습니다.' };
  try {
    const payload = { ...state, meta: { ...state.meta, savedAt: Date.now() } };
    storage.setItem(KEYS.run, JSON.stringify(payload));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: '저장에 실패했습니다. 저장 공간이 부족할 수 있습니다.' };
  }
}

// 결과: { status: 'empty' } | { status: 'ok', state } | { status: 'corrupt', error }
export function loadGame(storage = defaultStorage()) {
  if (!storage) return { status: 'empty' };
  let raw;
  try {
    raw = storage.getItem(KEYS.run);
  } catch {
    return { status: 'empty' };
  }
  if (raw == null) return { status: 'empty' };
  return parseSave(raw);
}

export function parseSave(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { status: 'corrupt', error: '저장 데이터를 읽을 수 없습니다(형식 오류).' };
  }
  let errors = validateSave(data);
  if (errors.length) return { status: 'corrupt', error: errors.join(', ') };
  try {
    data = migrate(data);
  } catch (e) {
    return { status: 'corrupt', error: e.message };
  }
  errors = validateSave(data);
  if (errors.length) return { status: 'corrupt', error: errors.join(', ') };
  return { status: 'ok', state: data };
}

export function hasSave(storage = defaultStorage()) {
  return loadGame(storage).status === 'ok';
}

// 손상된 저장 데이터는 바로 지우지 않고 별도 키에 보관한 뒤 제거한다.
export function quarantineCorruptSave(storage = defaultStorage()) {
  if (!storage) return;
  try {
    const raw = storage.getItem(KEYS.run);
    if (raw != null) storage.setItem(KEYS.corrupt, raw);
    storage.removeItem(KEYS.run);
  } catch { /* 무시 */ }
}

export function deleteSave(storage = defaultStorage()) {
  if (!storage) return;
  try { storage.removeItem(KEYS.run); } catch { /* 무시 */ }
}

export function loadSettings(storage = defaultStorage()) {
  try {
    const raw = storage?.getItem(KEYS.settings);
    const parsed = raw ? JSON.parse(raw) : {};
    const s = { ...DEFAULT_SETTINGS, ...(isObj(parsed) ? parsed : {}) };
    if (!Number.isFinite(s.fontScale)) s.fontScale = DEFAULT_SETTINGS.fontScale;
    if (!Number.isFinite(s.animSpeed)) s.animSpeed = DEFAULT_SETTINGS.animSpeed;
    return s;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings, storage = defaultStorage()) {
  try {
    storage?.setItem(KEYS.settings, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
