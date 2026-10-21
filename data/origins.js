// 캐릭터 생성 데이터: 출신과 초기 특성
// stats: 능력치 보정, orgs: 조직 평판, resources: 시작 재화, flags: 사건 조건에 쓰이는 표식
// tagBonus: 특정 태그가 붙은 판정에 추가 보정

export const ORIGINS = [
  {
    id: 'bureau',
    name: '관리국 기숙학교',
    desc: '경계 관리국이 운영하는 기숙학교에서 규율과 기록법을 배웠다. 관리국 사람들은 당신을 같은 편으로 여긴다.',
    stats: { intellect: 1, will: 1 },
    orgs: { bureau: 2 },
    flags: { origin_bureau: true },
  },
  {
    id: 'underdeck',
    name: '하층 구역',
    desc: '버려진 하층 구역의 좁은 골목에서 자랐다. 몸으로 부딪치고 말로 버티는 법을 안다.',
    stats: { body: 1, social: 1 },
    orgs: { union: 2 },
    flags: { origin_underdeck: true },
  },
  {
    id: 'cloister',
    name: '수도회 보호원',
    desc: '잿빛 수도회의 보호원에서 자랐다. 안개 속 목소리에 익숙하고, 작은 변화도 놓치지 않는다.',
    stats: { will: 1, sense: 1 },
    orgs: { cloister: 2 },
    flags: { origin_cloister: true },
  },
  {
    id: 'courier',
    name: '떠돌이 운반꾼',
    desc: '봉쇄선 사이로 물건을 나르며 살았다. 길눈이 밝고, 이상하게 운이 따른다.',
    stats: { sense: 1, luck: 1 },
    resources: { supplies: 2 },
    flags: { origin_courier: true },
  },
];

export const TRAIT_PICK = 2;
export const FREE_POINTS = 2;

export const TRAITS = [
  { id: 'sharp_eye', name: '예리한 눈', desc: '감각 +1. 수색 판정 +1', stats: { sense: 1 }, tagBonus: { search: 1 } },
  { id: 'bookworm', name: '책벌레', desc: '지성 +1. 해독 판정 +1', stats: { intellect: 1 }, tagBonus: { decode: 1 } },
  { id: 'sturdy', name: '단단한 몸', desc: '신체 +1. 추격·격투 판정 +1', stats: { body: 1 }, tagBonus: { physical: 1 } },
  { id: 'steady', name: '흔들림 없는 마음', desc: '의지 +1', stats: { will: 1 } },
  { id: 'charming', name: '넉살 좋은', desc: '사교 +1. 협상 판정 +1', stats: { social: 1 }, tagBonus: { trade: 1 } },
  { id: 'lucky', name: '행운아', desc: '운 +2', stats: { luck: 2 } },
  { id: 'fog_touched', name: '안개 체질', desc: '안개와 관련된 판정 +2', tagBonus: { fog: 2 } },
  { id: 'thrifty', name: '빈틈없는 장부', desc: '시작 크레딧 +30', resources: { credits: 30 } },
];
