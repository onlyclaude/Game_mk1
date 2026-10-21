import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNewState, SAVE_VERSION } from '../js/gameState.js';
import * as save from '../js/saveSystem.js';
import { memoryStorage } from './helpers.js';

test('새 게임 상태는 검증을 통과한다', () => {
  const s = createNewState({ name: '테스트' });
  assert.deepEqual(save.validateSave(s), []);
  assert.equal(s.player.name, '테스트');
  assert.equal(s.saveVersion, SAVE_VERSION);
});

test('저장 후 불러오면 같은 데이터가 나온다', () => {
  const st = memoryStorage();
  const s = createNewState({ name: '하린' });
  s.resources.credits = 77;
  assert.equal(save.saveGame(s, st).ok, true);
  const r = save.loadGame(st);
  assert.equal(r.status, 'ok');
  assert.equal(r.state.player.name, '하린');
  assert.equal(r.state.resources.credits, 77);
});

test('저장 데이터가 없으면 empty', () => {
  assert.equal(save.loadGame(memoryStorage()).status, 'empty');
});

test('JSON이 깨진 저장 데이터는 corrupt로 처리하고 예외를 던지지 않는다', () => {
  const st = memoryStorage({ [save.KEYS.run]: '{not json' });
  const r = save.loadGame(st);
  assert.equal(r.status, 'corrupt');
  assert.equal(save.hasSave(st), false);
});

test('필드가 빠진 저장 데이터는 corrupt', () => {
  const s = createNewState();
  delete s.player.stats.luck;
  const st = memoryStorage({ [save.KEYS.run]: JSON.stringify(s) });
  assert.equal(save.loadGame(st).status, 'corrupt');
});

test('미래 버전 저장 데이터는 corrupt', () => {
  const s = createNewState();
  s.saveVersion = SAVE_VERSION + 1;
  assert.equal(save.parseSave(JSON.stringify(s)).status, 'corrupt');
});

test('손상 데이터 정리 시 원본은 별도 키에 보관된다', () => {
  const st = memoryStorage({ [save.KEYS.run]: 'garbage' });
  save.quarantineCorruptSave(st);
  assert.equal(st.getItem(save.KEYS.run), null);
  assert.equal(st.getItem(save.KEYS.corrupt), 'garbage');
});

test('저장 공간을 쓸 수 없으면 실패를 돌려준다', () => {
  const broken = { getItem() { throw new Error('x'); }, setItem() { throw new Error('quota'); }, removeItem() {} };
  assert.equal(save.saveGame(createNewState(), broken).ok, false);
  assert.equal(save.loadGame(broken).status, 'empty');
  assert.equal(save.saveGame(createNewState(), null).ok, false);
});

test('설정: 잘못된 값은 기본값으로 대체', () => {
  const st = memoryStorage({ [save.KEYS.settings]: '{"fontScale":"big","animSpeed":0.5}' });
  const s = save.loadSettings(st);
  assert.equal(s.fontScale, save.DEFAULT_SETTINGS.fontScale);
  assert.equal(s.animSpeed, 0.5);
  assert.deepEqual(save.loadSettings(memoryStorage({ [save.KEYS.settings]: 'oops' })), save.DEFAULT_SETTINGS);
});
