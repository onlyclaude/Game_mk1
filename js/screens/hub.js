// 거점 화면: 현재 상태 확인과 다음 행동 선택
import { h, showScreen, toast, confirmDialog, openModal } from '../ui.js';
import { portrait } from '../art.js';
import { getState } from '../gameState.js';
import { STATS } from '../../data/stats.js';
import { ORIGINS, TRAITS } from '../../data/origins.js';
import { ORGS } from '../../data/characters.js';
import { YEAR_STEPS } from '../eventSystem.js';
import { playerPortraitDef, knownCharacters, affinityLabel } from '../characterSystem.js';
import * as game from '../game.js';
import { openSettings } from './settingsModal.js';
import { openHelp } from './helpModal.js';

export function render() {
  const s = getState();
  if (!s) {
    queueMicrotask(() => showScreen('title'));
    return h('section', { class: 'screen' });
  }
  const origin = ORIGINS.find((o) => o.id === s.player.origin);
  const traits = s.player.traits.map((id) => TRAITS.find((t) => t.id === id)?.name).filter(Boolean);
  const inEvent = !!s.progress.currentEventId;
  const people = knownCharacters(s);

  const onNext = () => {
    const ev = game.nextEvent();
    if (!ev) { toast('지금은 일어날 사건이 없습니다.', 'error'); return; }
    showScreen('event');
  };
  const onSave = () => {
    const r = game.manualSave();
    toast(r.ok ? '저장했습니다.' : r.error, r.ok ? 'success' : 'error');
  };
  const onTitle = async () => {
    const ok = await confirmDialog('타이틀 화면으로 돌아갑니다. 진행 상황은 자동으로 저장됩니다.', { okLabel: '돌아가기' });
    if (!ok) return;
    game.leaveToTitle();
    showScreen('title');
  };

  const yearDots = h('div', { class: 'year-dots', 'aria-label': `올해 사건 ${s.progress.yearStep}/${YEAR_STEPS}` },
    Array.from({ length: YEAR_STEPS }, (_, i) => h('span', { class: 'year-dot' + (i < s.progress.yearStep ? ' is-done' : '') })));

  return h('section', { class: 'screen' },
    h('header', { class: 'topbar' },
      h('div', { class: 'topbar-title' }, s.player.name),
      h('span', { class: 'chip', title: '진행 연차' }, `${s.progress.year}년차`),
      h('span', { class: 'chip', title: '크레딧' }, `◈ ${s.resources.credits}`),
      h('span', { class: 'chip', title: '보급품' }, `▣ ${s.resources.supplies}`),
    ),
    h('div', { class: 'screen-body' },
      h('div', { class: 'hub-grid' },
        h('div', { class: 'hub-col' },
          h('div', { class: 'panel hub-hero' },
            portrait(playerPortraitDef(s), 'portrait portrait--hero'),
            h('div', { class: 'hub-hero__info' },
              h('h2', { class: 'panel-title' }, '경계 관리국 임시 숙소'),
              h('p', { class: 'text-dim', style: { margin: '0 0 4px' } }, `${origin?.name ?? '출신 미상'} · ${traits.join(', ') || '특성 없음'}`),
              h('div', { class: 'year-row' }, h('span', {}, `${s.progress.year}년차`), yearDots),
            ),
          ),
          h('div', { class: 'panel' },
            h('p', { style: { marginTop: 0 } }, inEvent ? '아직 끝나지 않은 일이 있다.' : '창밖으로 회색 안개가 천천히 흘러간다. 오늘은 어떤 일이 기다리고 있을까.'),
            h('button', { class: 'btn btn--primary btn--block btn--big', 'data-action': 'next-event', onClick: onNext },
              inEvent ? '진행 중인 사건 계속' : '다음 사건으로'),
          ),
          h('div', { class: 'panel' },
            h('h2', { class: 'panel-title' }, '최근 기록'),
            s.progress.log.length
              ? h('ol', { class: 'log-list' }, s.progress.log.slice(-6).reverse().map((t) => h('li', {}, t)))
              : h('p', { class: 'text-dim' }, '아직 기록이 없다.'),
          ),
        ),
        h('div', { class: 'hub-col' },
          h('div', { class: 'panel' },
            h('h2', { class: 'panel-title' }, '능력치'),
            h('ul', { class: 'stat-list' },
              STATS.map((st) => h('li', {}, h('span', {}, st.name), h('span', { class: 'stat-val', 'data-stat': st.id }, s.player.stats[st.id]))),
            ),
          ),
          h('div', { class: 'panel' },
            h('h2', { class: 'panel-title' }, '인물'),
            people.length
              ? h('div', { class: 'people' }, people.map(({ def, affinity }) => h('button', {
                class: 'person', 'data-person': def.id, onClick: () => openPerson(def, affinity),
              }, portrait(def, 'portrait portrait--sm'), h('span', { class: 'person__name' }, def.name), h('span', { class: 'person__aff' }, affinityLabel(affinity)))))
              : h('p', { class: 'text-dim' }, '아직 아는 사람이 없다.'),
          ),
          h('div', { class: 'panel' },
            h('h2', { class: 'panel-title' }, '조직 평판'),
            h('ul', { class: 'stat-list' }, Object.values(ORGS).map((o) => h('li', {}, h('span', {}, o.name), h('span', { class: 'stat-val' }, s.orgs[o.id] ?? 0)))),
          ),
          h('div', { class: 'panel' },
            h('h2', { class: 'panel-title' }, '메뉴'),
            h('div', { class: 'btn-row' },
              h('button', { class: 'btn', 'data-action': 'save', onClick: onSave }, '저장'),
              h('button', { class: 'btn', 'data-action': 'help', onClick: openHelp }, '도움말'),
              h('button', { class: 'btn', 'data-action': 'settings', onClick: openSettings }, '설정'),
              h('button', { class: 'btn', 'data-action': 'to-title', onClick: onTitle }, '타이틀로'),
            ),
          ),
        ),
      ),
    ),
  );
}

function openPerson(def, affinity) {
  return openModal({
    title: def.name,
    body: h('div', { class: 'person-detail' },
      portrait(def, 'portrait portrait--lg'),
      h('div', {},
        h('p', { class: 'accent', style: { margin: '0 0 8px' } }, def.title),
        h('p', {}, h('strong', {}, '성격 '), def.personality),
        h('p', {}, h('strong', {}, '배경 '), def.background),
        h('p', { class: 'text-dim' }, `관계: ${affinityLabel(affinity)} (${affinity >= 0 ? '+' : ''}${affinity})`),
      ),
    ),
    actions: [{ label: '닫기', value: true, kind: 'primary' }],
  });
}
