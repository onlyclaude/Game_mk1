// 사건 화면: 장면과 인물, 본문, 선택지 → 판정 연출 → 결과
import { h, showScreen, toast } from '../ui.js';
import { portrait, sceneStyle } from '../art.js';
import { getState } from '../gameState.js';
import * as game from '../game.js';
import { choiceStatus } from '../eventSystem.js';
import { checkChances, difficultyOf, getModifiers, OUTCOME_LABEL } from '../checkSystem.js';
import { CHARACTERS } from '../../data/characters.js';
import { SCENES } from '../../data/scenes.js';
import { STATS } from '../../data/stats.js';
import { openHelp } from './helpModal.js';

const STAT_NAME = Object.fromEntries(STATS.map((s) => [s.id, s.name]));
const pct = (x) => `${Math.round(x * 100)}%`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function render() {
  const ev = game.getCurrentEvent();
  const state = getState();
  if (!ev || !state) {
    queueMicrotask(() => showScreen('hub'));
    return h('section', { class: 'screen' });
  }
  const scene = SCENES[ev.scene];
  const body = h('div', { class: 'event-body' });

  const screen = h('section', { class: 'screen event-screen' },
    h('header', { class: 'topbar' },
      h('span', { class: 'chip' }, `${state.progress.year}년차`),
      h('div', { class: 'topbar-title' }, ev.title),
      h('button', { class: 'btn btn--ghost', 'data-action': 'help', 'aria-label': '판정 도움말', onClick: openHelp }, '? 규칙'),
    ),
    h('div', { class: 'event-layout' },
      h('div', { class: 'scene', style: sceneStyle(scene) },
        h('div', { class: 'scene-label' }, scene?.name ?? ''),
        h('div', { class: `scene-cast scene-cast--${(ev.characters || []).length}` },
          (ev.characters || []).map((id) => h('figure', { class: 'cast' },
            portrait(CHARACTERS[id], 'portrait portrait--cast'),
            h('figcaption', {}, CHARACTERS[id].name),
          )),
        ),
      ),
      h('div', { class: 'event-panel' },
        h('h2', { class: 'event-title' }, ev.title),
        h('div', { class: 'event-text' }, ev.text.split('\n\n').map((p) => h('p', {}, p))),
        body,
      ),
    ),
  );

  showChoices();
  return screen;

  function showChoices() {
    body.replaceChildren(h('div', { class: 'choice-list' }, ev.choices.map((c, i) => choiceButton(c, i))));
  }

  function choiceButton(c, i) {
    const st = choiceStatus(state, c);
    const info = [];
    if (c.check) {
      const ch = checkChances(state, c.check);
      const mods = getModifiers(state, c.check);
      info.push(h('span', { class: 'choice__check' },
        `${STAT_NAME[c.check.stat]} 판정 · 난이도 ${difficultyOf(state, c.check)} · 성공 ${pct(ch.success)} · 부분 성공 이상 ${pct(ch.partialOrBetter)}`));
      if (mods.length) info.push(h('span', { class: 'choice__mods' }, mods.map((m) => `${m.label} +${m.value}`).join(' · ')));
    }
    if (c.hint) info.push(h('span', { class: 'choice__hint' }, c.hint));
    if (!st.ok) info.push(h('span', { class: 'choice__locked' }, `조건: ${st.reasons.join(', ')}`));
    return h('button', {
      class: 'choice', 'data-choice': c.id, disabled: !st.ok,
      onClick: () => onChoose(c),
    },
    h('span', { class: 'choice__key' }, String.fromCharCode(65 + i)),
    h('span', { class: 'choice__main' }, h('span', { class: 'choice__text' }, c.text), ...info));
  }

  async function onChoose(c) {
    const res = game.choose(c.id);
    // 선택 후에는 다른 선택지를 누를 수 없게 즉시 교체
    body.replaceChildren(h('p', { class: 'picked' }, `▶ ${c.text}`));
    if (res.check) await rollAnimation(res.check);
    showResult(c, res);
  }

  async function rollAnimation(check) {
    const speed = game.getSettings().animSpeed;
    const d1 = h('div', { class: 'die' }, '?');
    const d2 = h('div', { class: 'die' }, '?');
    const box = h('div', { class: 'dice-box', 'aria-label': '주사위 굴리는 중' }, d1, d2);
    body.append(box);
    if (speed > 0.05) {
      const end = Date.now() + 700 * speed;
      while (Date.now() < end) {
        d1.textContent = 1 + Math.floor(Math.random() * 6);
        d2.textContent = 1 + Math.floor(Math.random() * 6);
        await wait(60);
      }
    }
    d1.textContent = check.dice[0];
    d2.textContent = check.dice[1];
    box.classList.add('is-settled');
    if (speed > 0.05) await wait(350 * speed);
    box.remove();
  }

  function showResult(c, res) {
    const parts = [];
    if (res.check) {
      const k = res.check;
      const formula = [`주사위 ${k.dice[0]}+${k.dice[1]}`, `${STAT_NAME[k.stat]} ${k.statValue}`, ...k.mods.map((m) => `${m.label} ${m.value >= 0 ? '+' : ''}${m.value}`)];
      parts.push(h('div', { class: `result-banner result-banner--${res.outcome}`, 'data-outcome': res.outcome },
        h('div', { class: 'result-banner__dice' }, h('span', { class: 'die is-settled' }, k.dice[0]), h('span', { class: 'die is-settled' }, k.dice[1])),
        h('div', {},
          h('strong', { class: 'result-banner__label' }, OUTCOME_LABEL[res.outcome]),
          h('div', { class: 'result-banner__calc' }, `${formula.join(' + ')} = ${k.total}  (난이도 ${k.difficulty})`),
          k.luckRescued ? h('div', { class: 'result-banner__calc' }, '운이 따라 실패를 면했다!') : null,
        ),
      ));
    }
    parts.push(h('div', { class: 'event-text result-text' }, res.result.text.split('\n\n').map((p) => h('p', {}, p))));
    if (res.changes.length) {
      parts.push(h('ul', { class: 'change-list' }, res.changes.map((ch) => h('li', { class: `change change--${ch.kind}` }, ch.text))));
    }
    parts.push(h('button', {
      class: 'btn btn--primary btn--block', 'data-action': 'continue-event',
      onClick: () => {
        if (res.yearAdvanced) toast(`${getState().progress.year}년차가 시작되었습니다.`, 'success', 3000);
        showScreen('hub');
      },
    }, '계속'));
    body.replaceChildren(h('p', { class: 'picked' }, `▶ ${c.text}`), ...parts);
    body.closest('.event-panel')?.scrollTo?.({ top: 0 });
  }
}
