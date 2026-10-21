// 새 게임: 주인공 만들기 (1단계에서는 이름만. 출신과 특성 선택은 2단계에서 추가)
import { h, showScreen, toast } from '../ui.js';
import * as game from '../game.js';

export const NAME_MAX = 12;

export function render() {
  const input = h('input', {
    class: 'input', id: 'player-name', type: 'text', maxlength: String(NAME_MAX),
    placeholder: '이름 없는 탐사자', autocomplete: 'off', enterkeyhint: 'done',
  });

  const onStart = () => {
    const name = input.value.trim().slice(0, NAME_MAX) || '이름 없는 탐사자';
    const r = game.startNewGame({ name });
    if (!r.ok) toast(r.error, 'error');
    showScreen('hub');
  };

  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });

  return h('section', { class: 'screen' },
    h('header', { class: 'topbar' },
      h('button', { class: 'btn btn--ghost', 'data-action': 'back', 'aria-label': '뒤로', onClick: () => showScreen('title') }, '← 뒤로'),
      h('div', { class: 'topbar-title' }, '탐사자 등록'),
    ),
    h('div', { class: 'screen-body' },
      h('div', { class: 'center-col' },
        h('div', { class: 'panel' },
          h('h2', { class: 'panel-title' }, '기록 시작'),
          h('p', { class: 'text-dim' }, '회색 안개가 구역들을 갈라놓은 지 여러 해. 경계 관리국의 등록 창구가 당신의 이름을 묻는다.'),
          h('div', { class: 'field' },
            h('label', { for: 'player-name' }, `이름 (최대 ${NAME_MAX}자)`),
            input,
          ),
          h('button', { class: 'btn btn--primary btn--block', 'data-action': 'start', onClick: onStart }, '기록 시작'),
        ),
      ),
    ),
  );
}
