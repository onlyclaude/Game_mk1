// 새 게임: 주인공 만들기 (이름, 외형, 출신, 특성, 추가 능력치)
import { h, showScreen, toast } from '../ui.js';
import { portrait } from '../art.js';
import * as game from '../game.js';
import { ORIGINS, TRAITS, TRAIT_PICK, FREE_POINTS } from '../../data/origins.js';
import { PLAYER_LOOKS } from '../../data/characters.js';
import { STATS, BASE_STAT, STAT_MAX } from '../../data/stats.js';
import { validateCreation, previewStats } from '../characterSystem.js';

export const NAME_MAX = 12;
const BASE = Object.fromEntries(STATS.map((s) => [s.id, BASE_STAT]));

export function render() {
  const sel = { name: '', lookId: PLAYER_LOOKS[0].id, originId: null, traits: [], alloc: {} };

  const input = h('input', {
    class: 'input', id: 'player-name', type: 'text', maxlength: String(NAME_MAX),
    placeholder: '이름 없는 탐사자', autocomplete: 'off', enterkeyhint: 'done',
  });
  input.addEventListener('input', () => { sel.name = input.value; });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });

  const lookRow = h('div', { class: 'look-row' });
  const originList = h('div', { class: 'card-grid' });
  const traitList = h('div', { class: 'trait-grid' });
  const statBox = h('div', {});
  const startBtn = h('button', { class: 'btn btn--primary btn--block', 'data-action': 'start', onClick: onStart }, '기록 시작');
  const startNote = h('p', { class: 'text-dim center-note' });

  function refresh() {
    // 외형
    lookRow.replaceChildren(...PLAYER_LOOKS.map((l) => h('button', {
      class: 'look-card', 'aria-pressed': String(sel.lookId === l.id), 'data-look': l.id, 'aria-label': `외형: ${l.label}`,
      onClick: () => { sel.lookId = l.id; refresh(); },
    }, portrait({ name: l.label, look: l.look }, 'portrait portrait--md'), h('span', {}, l.label))));

    // 출신
    originList.replaceChildren(...ORIGINS.map((o) => h('button', {
      class: 'select-card', 'aria-pressed': String(sel.originId === o.id), 'data-origin': o.id,
      onClick: () => { sel.originId = o.id; refresh(); },
    },
    h('strong', {}, o.name),
    h('span', { class: 'select-card__bonus' }, bonusText(o)),
    h('span', { class: 'select-card__desc' }, o.desc))));

    // 특성
    traitList.replaceChildren(...TRAITS.map((t) => {
      const on = sel.traits.includes(t.id);
      return h('button', {
        class: 'trait-chip', 'aria-pressed': String(on), 'data-trait': t.id,
        disabled: !on && sel.traits.length >= TRAIT_PICK,
        onClick: () => {
          sel.traits = on ? sel.traits.filter((x) => x !== t.id) : [...sel.traits, t.id];
          refresh();
        },
      }, h('strong', {}, t.name), h('span', {}, t.desc));
    }));

    // 능력치 미리보기 + 추가 포인트
    const spent = Object.values(sel.alloc).reduce((a, b) => a + b, 0);
    const left = FREE_POINTS - spent;
    const withoutAlloc = previewStats(BASE, { ...sel, alloc: {} });
    const finalStats = previewStats(BASE, sel);
    statBox.replaceChildren(
      h('p', { class: 'text-dim', style: { marginTop: 0 } }, `남은 추가 포인트: `, h('strong', { class: 'accent' }, String(left))),
      h('ul', { class: 'stat-edit' }, STATS.map((st) => {
        const a = sel.alloc[st.id] || 0;
        return h('li', {},
          h('div', { class: 'stat-edit__name' }, h('strong', {}, st.name), h('span', { class: 'text-faint' }, st.desc)),
          h('div', { class: 'stepper' },
            h('button', { class: 'btn stepper__btn', 'aria-label': `${st.name} 내리기`, 'data-dec': st.id, disabled: a <= 0,
              onClick: () => { sel.alloc[st.id] = a - 1; refresh(); } }, '−'),
            h('span', { class: 'stepper__val' + (finalStats[st.id] > withoutAlloc[st.id] ? ' is-up' : '') }, String(finalStats[st.id])),
            h('button', { class: 'btn stepper__btn', 'aria-label': `${st.name} 올리기`, 'data-inc': st.id,
              disabled: left <= 0 || finalStats[st.id] >= STAT_MAX,
              onClick: () => { sel.alloc[st.id] = a + 1; refresh(); } }, '+'),
          ));
      })),
    );

    const errors = validateCreation(sel);
    startBtn.disabled = errors.length > 0;
    startNote.textContent = errors.length ? errors.join(' ') : (left > 0 ? `추가 포인트 ${left}점이 남아 있습니다. 그대로 시작해도 됩니다.` : '준비가 끝났습니다.');
  }

  function onStart() {
    const name = input.value.trim().slice(0, NAME_MAX) || '이름 없는 탐사자';
    const r = game.startNewGame({ ...sel, name });
    if (!r.ok) toast(r.error, 'error');
    showScreen('hub');
  }

  refresh();

  return h('section', { class: 'screen' },
    h('header', { class: 'topbar' },
      h('button', { class: 'btn btn--ghost', 'data-action': 'back', onClick: () => showScreen('title') }, '← 뒤로'),
      h('div', { class: 'topbar-title' }, '탐사자 등록'),
    ),
    h('div', { class: 'screen-body' },
      h('div', { class: 'center-col center-col--wide' },
        h('div', { class: 'panel' },
          h('h2', { class: 'panel-title' }, '1. 이름과 모습'),
          h('p', { class: 'text-dim' }, '회색 안개가 구역들을 갈라놓은 지 여러 해. 경계 관리국의 등록 창구가 당신의 이름을 묻는다.'),
          h('div', { class: 'field' }, h('label', { for: 'player-name' }, `이름 (최대 ${NAME_MAX}자)`), input),
          lookRow,
        ),
        h('div', { class: 'panel' }, h('h2', { class: 'panel-title' }, '2. 출신'), originList),
        h('div', { class: 'panel' }, h('h2', { class: 'panel-title' }, `3. 특성 (${TRAIT_PICK}개 선택)`), traitList),
        h('div', { class: 'panel' }, h('h2', { class: 'panel-title' }, '4. 능력치'), statBox),
        h('div', { class: 'panel' }, startNote, startBtn),
      ),
    ),
  );
}

function bonusText(o) {
  const name = Object.fromEntries(STATS.map((s) => [s.id, s.name]));
  const parts = Object.entries(o.stats || {}).map(([k, v]) => `${name[k]} +${v}`);
  if (o.resources?.supplies) parts.push(`보급품 +${o.resources.supplies}`);
  return parts.join(' · ');
}
