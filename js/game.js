// 게임 흐름 제어: 새 게임, 이어하기, 저장, 설정. 화면 모듈은 이 파일의 함수만 호출한다.
import { createNewState, getState, setState, clearState, subscribe, updateState } from './gameState.js';
import * as save from './saveSystem.js';
import { applyCreation } from './characterSystem.js';
import { pickNextEvent, beginEvent, findEvent, resolveChoice } from './eventSystem.js';
import { EVENTS } from '../data/events.js';
import { applySettings, toast } from './ui.js';

let settings = save.loadSettings();
let autosaveTimer = null;
let autosaveEnabled = false;
const AUTOSAVE_DELAY_MS = 400;

export function init() {
  applySettings(settings);
  subscribe((state) => {
    if (!autosaveEnabled || !state) return;
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      const r = save.saveGame(state);
      if (!r.ok) toast(r.error, 'error');
    }, AUTOSAVE_DELAY_MS);
  });
}

// opts: { name, originId, traits, alloc, lookId }
export function startNewGame(opts) {
  const state = applyCreation(createNewState({ name: opts.name }), opts);
  setState(state);
  autosaveEnabled = true;
  return save.saveGame(getState());
}

// ===== 사건 진행 =====
export function getCurrentEvent() {
  const id = getState()?.progress.currentEventId;
  return id ? findEvent(EVENTS, id) : null;
}

// 진행 중인 사건이 있으면 그것을, 없으면 새 사건을 골라 시작한다.
export function nextEvent() {
  const cur = getCurrentEvent();
  if (cur) return cur;
  let ev = null;
  updateState((s) => {
    ev = pickNextEvent(s, EVENTS);
    if (ev) beginEvent(s, ev);
  });
  flushSave();
  return ev;
}

// 선택지 결정. 결과는 eventSystem.resolveChoice 참고
export function choose(choiceId) {
  const ev = getCurrentEvent();
  if (!ev) throw new Error('진행 중인 사건이 없습니다.');
  let result;
  updateState((s) => { result = resolveChoice(s, ev, choiceId); });
  // 결과는 바로 저장해서 새로고침으로 판정을 되돌릴 수 없게 한다.
  flushSave();
  return result;
}

function flushSave() {
  clearTimeout(autosaveTimer);
  const r = save.saveGame(getState());
  if (!r.ok) toast(r.error, 'error');
}

// 결과: loadGame과 같은 형태
export function continueGame() {
  const r = save.loadGame();
  if (r.status === 'ok') {
    setState(r.state);
    autosaveEnabled = true;
  }
  return r;
}

export function manualSave() {
  const state = getState();
  if (!state) return { ok: false, error: '저장할 게임이 없습니다.' };
  clearTimeout(autosaveTimer);
  return save.saveGame(state);
}

export function leaveToTitle() {
  // 나가기 전에 대기 중인 자동 저장을 즉시 처리한다.
  if (autosaveTimer && getState()) {
    clearTimeout(autosaveTimer);
    save.saveGame(getState());
  }
  autosaveEnabled = false;
  clearState();
}

export function getSaveStatus() {
  return save.loadGame();
}

export function cleanCorruptSave() {
  save.quarantineCorruptSave();
}

export function resetSaveData() {
  autosaveEnabled = false;
  clearTimeout(autosaveTimer);
  save.deleteSave();
  clearState();
}

export function getSettings() {
  return { ...settings };
}

export function updateSettings(patch) {
  settings = { ...settings, ...patch };
  applySettings(settings);
  save.saveSettings(settings);
}
