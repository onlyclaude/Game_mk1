// 능력치 정의. 판정 규칙은 js/checkSystem.js(2단계)에서 사용한다.
export const STATS = [
  { id: 'body',      name: '신체', desc: '힘, 체력, 민첩함이 필요한 판정' },
  { id: 'intellect', name: '지성', desc: '분석과 추론' },
  { id: 'sense',     name: '감각', desc: '관찰과 탐지' },
  { id: 'will',      name: '의지', desc: '정신적 압박에 대한 저항' },
  { id: 'social',    name: '사교', desc: '설득과 관계 형성' },
  { id: 'luck',      name: '운',   desc: '일부 무작위 사건에 영향을 주는 보조 능력' },
];

export const STAT_IDS = STATS.map((s) => s.id);
export const STAT_MIN = 1;
export const STAT_MAX = 10;
export const BASE_STAT = 3;
