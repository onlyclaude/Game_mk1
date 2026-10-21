// 게임 상태(진행 중인 한 번의 플레이)의 생성과 보관.
// 화면 코드와 분리되어 있어 Node 테스트에서도 그대로 사용할 수 있다.
import { STAT_IDS, BASE_STAT } from '../data/stats.js';

export const GAME_VERSION = '0.2.0';
export const SAVE_VERSION = 2;

export function createNewState({ name = '이름 없는 탐사자', origin = null, traits = [], stats = null } = {}) {
  const now = Date.now();
  const baseStats = Object.fromEntries(STAT_IDS.map((id) => [id, BASE_STAT]));
  return {
    saveVersion: SAVE_VERSION,
    meta: { createdAt: now, updatedAt: now, runId: `run-${now.toString(36)}` },
    player: {
      name,
      origin,
      traits: [...traits],
      look: 'a',
      stats: { ...baseStats, ...(stats || {}) },
    },
    progress: {
      year: 1,
      yearStep: 0,          // 올해 겪은 사건 수
      step: 0,              // 전체 사건 수
      flags: {},
      choices: [],          // 주요 선택 기록 { eventId, choiceId, year }
      completedEvents: [],
      currentEventId: null,
      lastEventId: null,
      queue: [],            // 후속 사건 대기열
      log: [],              // 최근 기록
    },
    resources: { credits: 30, supplies: 3 },
    party: { roster: [], active: [] },
    inventory: [],
    quests: {},
    relations: {},
    orgs: {},
    claimedRewards: {},     // 보상 중복 지급 방지용 키 모음
  };
}

// --- 간단한 상태 저장소 ---
let current = null;
const listeners = new Set();

export function getState() {
  return current;
}

export function setState(next) {
  current = next;
  notify();
}

// fn은 상태를 직접 수정한다. 수정 후 구독자(자동 저장 등)에게 알린다.
export function updateState(fn) {
  if (!current) return;
  fn(current);
  current.meta.updatedAt = Date.now();
  notify();
}

export function clearState() {
  current = null;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  for (const l of listeners) l(current);
}
