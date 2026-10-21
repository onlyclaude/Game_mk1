// 설정 창: 글자 크기, 연출 속도, 저장 데이터 초기화
import { h, openModal, confirmDialog, toast, showScreen } from '../ui.js';
import * as game from '../game.js';

const FONT_OPTIONS = [
  { label: '작게', value: 0.9 },
  { label: '보통', value: 1 },
  { label: '크게', value: 1.15 },
  { label: '아주 크게', value: 1.3 },
];
const SPEED_OPTIONS = [
  { label: '보통', value: 1 },
  { label: '빠르게', value: 0.5 },
  { label: '연출 끄기', value: 0.01 },
];

function segmented(options, current, onPick) {
  const wrap = h('div', { class: 'segmented', role: 'group' });
  const render = (cur) => {
    wrap.replaceChildren(...options.map((o) => h('button', {
      class: 'btn',
      'aria-pressed': String(o.value === cur),
      onClick: () => { onPick(o.value); render(o.value); },
    }, o.label)));
  };
  render(current);
  return wrap;
}

export async function openSettings() {
  const s = game.getSettings();
  const result = await openModal({
    title: '설정',
    body: (close) => h('div', {},
      h('div', { class: 'field' },
        h('label', {}, '글자 크기'),
        segmented(FONT_OPTIONS, s.fontScale, (v) => game.updateSettings({ fontScale: v })),
      ),
      h('div', { class: 'field' },
        h('label', {}, '연출 속도'),
        segmented(SPEED_OPTIONS, s.animSpeed, (v) => game.updateSettings({ animSpeed: v })),
      ),
      h('p', { class: 'text-dim' }, '바뀐 설정은 바로 적용되며 이 기기에 저장됩니다.'),
      h('hr', { style: { borderColor: 'var(--panel-edge)', margin: '16px 0' } }),
      h('div', { class: 'field' },
        h('label', {}, '저장 데이터'),
        h('button', { class: 'btn btn--danger', 'data-action': 'reset-save', onClick: () => close('reset') }, '진행 중인 저장 데이터 초기화'),
      ),
    ),
    actions: [{ label: '닫기', value: 'close', kind: 'primary' }],
  });

  if (result === 'reset') {
    const ok = await confirmDialog(
      '진행 중인 게임의 저장 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다. 계속할까요?',
      { title: '저장 데이터 초기화', okLabel: '삭제', danger: true },
    );
    if (ok) {
      game.resetSaveData();
      toast('저장 데이터를 삭제했습니다.', 'success');
      showScreen('title');
    }
  }
}
