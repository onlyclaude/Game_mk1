// 도움말: 게임 진행과 판정 규칙
import { h, openModal } from '../ui.js';
import { STATS } from '../../data/stats.js';
import { PARTIAL_MARGIN, LUCK_RESCUE_PER_POINT, LUCK_RESCUE_MAX } from '../checkSystem.js';
import { YEAR_STEPS } from '../eventSystem.js';

export function openHelp() {
  return openModal({
    title: '도움말',
    body: h('div', { class: 'help' },
      h('h3', {}, '진행'),
      h('p', {}, `거점에서 "다음 사건으로"를 누르면 사건이 일어납니다. 한 해에 사건 ${YEAR_STEPS}개를 겪으면 다음 해로 넘어갑니다. 선택은 이후 사건, 인물과의 관계, 조직의 평판에 영향을 줍니다.`),
      h('h3', {}, '능력치'),
      h('ul', {}, STATS.map((s) => h('li', {}, h('strong', {}, s.name), ` — ${s.desc}`))),
      h('h3', {}, '판정 규칙'),
      h('p', {}, '주사위 2개(각 1~6)를 굴려 나온 수에 능력치와 보정을 더해 난이도와 비교합니다.'),
      h('table', { class: 'help-table' },
        h('tbody', {},
          h('tr', {}, h('th', {}, '대성공'), h('td', {}, '주사위가 6과 6. 항상 성공하고 보너스 크레딧을 받습니다.')),
          h('tr', {}, h('th', {}, '성공'), h('td', {}, '합계가 난이도 이상')),
          h('tr', {}, h('th', {}, '부분 성공'), h('td', {}, `합계가 난이도보다 ${PARTIAL_MARGIN} 이하로 모자람. 절반의 성과를 얻습니다.`)),
          h('tr', {}, h('th', {}, '실패'), h('td', {}, '그보다 낮음')),
          h('tr', {}, h('th', {}, '대실패'), h('td', {}, '주사위가 1과 1. 항상 실패합니다.')),
        ),
      ),
      h('p', {}, `운: 일반 실패가 나오면 운 1점당 ${Math.round(LUCK_RESCUE_PER_POINT * 100)}%(최대 ${Math.round(LUCK_RESCUE_MAX * 100)}%) 확률로 부분 성공으로 바뀝니다. 대실패는 바뀌지 않습니다.`),
      h('p', {}, '보정: 관련 특성(예: 예리한 눈 → 수색 판정 +1)과 함께하는 동료의 도움(+1, 호감이 높으면 +2)이 더해집니다.'),
      h('p', {}, '선택지에는 판정 능력치, 난이도, 성공 확률이 표시됩니다. 조건이 맞지 않는 선택지는 이유와 함께 잠겨 있습니다.'),
      h('p', { class: 'text-dim' }, '훈련처럼 성장하는 판정은 능력치가 높을수록 난이도도 올라갑니다.'),
    ),
  });
}
