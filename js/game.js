// 게임 흐름 제어: 새 게임, 이어하기, 저장, 설정. 화면 모듈은 이 파일의 함수만 호출한다.
import { createNewState, getState, setState, clearState, subscribe } from './gameState.js';
import * as save from './saveSystem.js';
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

export function startNewGame(opts) {
  setState(createNewState(opts));
  autosaveEnabled = true;
  return save.saveGame(getState());
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
