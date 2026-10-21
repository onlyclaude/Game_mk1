// 거점 화면: 현재 상태 확인과 다음 행동 선택
import { h, showScreen, toast, confirmDialog } from '../ui.js';
import { getState } from '../gameState.js';
import { STATS } from '../../data/stats.js';
import * as game from '../game.js';
import { openSettings } from './settingsModal.js';

export function render() {
  const s = getState();
  if (!s) {
    // 상태 없이 들어온 경우(예외 상황) 타이틀로 되돌린다.
    queueMicrotask(() => showScreen('title'));
    return h('section', { class: 'screen' });
  }

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

  return h('section', { class: 'screen' },
    h('header', { class: 'topbar' },
      h('div', { class: 'topbar-title' }, s.player.name),
      h('span', { class: 'chip', title: '진행 연차' }, `${s.progress.year}년차`),
      h('span', { class: 'chip', title: '크레딧' }, `◈ ${s.resources.credits}`),
      h('span', { class: 'chip', title: '보급품' }, `▣ ${s.resources.supplies}`),
    ),
    h('div', { class: 'screen-body' },
      h('div', { class: 'hub-grid' },
        h('div', {},
          h('div', { class: 'panel' },
            h('h2', { class: 'panel-title' }, '경계 관리국 임시 숙소'),
            h('p', {}, '창밖으로 회색 안개가 천천히 흘러간다. 등록을 마친 탐사자에게 첫 의뢰가 내려오기까지는 아직 시간이 있다.'),
            h('button', { class: 'btn btn--primary btn--block', 'data-action': 'next-event', disabled: true }, '다음 사건으로 (2단계에서 구현)'),
          ),
        ),
        h('div', {},
          h('div', { class: 'panel' },
            h('h2', { class: 'panel-title' }, '능력치'),
            h('ul', { class: 'stat-list' },
              STATS.map((st) => h('li', {}, h('span', {}, st.name), h('span', { class: 'stat-val' }, s.player.stats[st.id]))),
            ),
          ),
          h('div', { class: 'panel' },
            h('h2', { class: 'panel-title' }, '메뉴'),
            h('div', { class: 'btn-row' },
              h('button', { class: 'btn', 'data-action': 'save', onClick: onSave }, '저장'),
              h('button', { class: 'btn', 'data-action': 'settings', onClick: openSettings }, '설정'),
              h('button', { class: 'btn', 'data-action': 'to-title', onClick: onTitle }, '타이틀로'),
            ),
          ),
        ),
      ),
    ),
  );
}
