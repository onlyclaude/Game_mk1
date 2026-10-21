// 시작 화면
import { h, showScreen, confirmDialog, toast } from '../ui.js';
import { emblem } from '../art.js';
import { GAME_VERSION } from '../gameState.js';
import * as game from '../game.js';
import { openSettings } from './settingsModal.js';
import { openHelp } from './helpModal.js';

export function render() {
  const status = game.getSaveStatus();
  const hasSave = status.status === 'ok';

  const onNew = async () => {
    if (hasSave) {
      const ok = await confirmDialog('새 게임을 시작하면 현재 진행 중인 저장 데이터를 덮어씁니다. 계속할까요?',
        { title: '새 게임', okLabel: '새로 시작', danger: true });
      if (!ok) return;
    }
    showScreen('newGame');
  };

  const onContinue = () => {
    const r = game.continueGame();
    if (r.status === 'ok') {
      toast('저장된 기록을 불러왔습니다.', 'success');
      showScreen('hub');
    } else {
      toast('불러올 저장 데이터가 없습니다.', 'error');
      showScreen('title');
    }
  };

  const onCleanCorrupt = async () => {
    const ok = await confirmDialog(
      '손상된 저장 데이터를 정리합니다. 원본은 복구용으로 따로 보관됩니다. 계속할까요?',
      { title: '저장 데이터 오류', okLabel: '정리' });
    if (!ok) return;
    game.cleanCorruptSave();
    toast('손상된 저장 데이터를 정리했습니다.', 'success');
    showScreen('title');
  };


  return h('section', { class: 'screen title-screen' },
    emblem(),
    h('h1', { class: 'title-logo' }, '회색의 연대기'),
    h('p', { class: 'title-sub' }, 'CHRONICLE OF GREY'),
    status.status === 'corrupt' ? h('div', { class: 'panel', style: { marginBottom: '16px', maxWidth: '360px' } },
      h('p', { style: { margin: '0 0 8px' } }, '저장 데이터를 읽을 수 없습니다.'),
      h('p', { class: 'text-dim', style: { margin: '0 0 12px', fontSize: '0.85rem' } }, status.error),
      h('button', { class: 'btn btn--danger btn--block', 'data-action': 'clean-corrupt', onClick: onCleanCorrupt }, '손상된 데이터 정리'),
    ) : null,
    h('nav', { class: 'title-menu btn-col' },
      h('button', { class: 'btn btn--primary btn--block', 'data-action': 'new-game', onClick: onNew }, '새 게임'),
      h('button', { class: 'btn btn--block', 'data-action': 'continue', disabled: !hasSave, onClick: onContinue },
        hasSave ? `이어하기 — ${status.state.player.name}, ${status.state.progress.year}년차` : '이어하기'),
      h('button', { class: 'btn btn--block', 'data-action': 'archive', disabled: true }, '기록실 (준비 중)'),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', style: { flex: 1 }, 'data-action': 'settings', onClick: openSettings }, '설정'),
        h('button', { class: 'btn', style: { flex: 1 }, 'data-action': 'help', onClick: openHelp }, '도움말'),
      ),
    ),
    h('p', { class: 'title-foot' }, `v${GAME_VERSION}`),
  );
}
