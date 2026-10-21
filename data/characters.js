// 인물 데이터. companion: true인 인물은 3단계에서 전투 정보(역할, 스킬 등)가 추가된다.
// 실제 일러스트가 생기면 image: 'assets/portraits/lien.png' 처럼 넣으면 자동으로 교체된다.
export const CHARACTERS = {
  lien: {
    id: 'lien',
    name: '리엔',
    title: '경계 관리국 신입 측량사',
    org: 'bureau',
    companion: true,
    personality: '차분하고 꼼꼼하다. 감정을 잘 드러내지 않지만 한번 믿은 사람은 끝까지 믿는다.',
    background: '안개 경계선의 미세한 흔들림을 수치로 기록하는 측량사. 장막이 처음 내려앉던 날 고향 구역과 함께 가족의 소식이 끊겼다.',
    look: { hair: '#c9d2e3', hairStyle: 'bob', eyes: '#2fb3a3', skin: '#f8e3d6', outfit: 'uniform', outfitColor: '#33405c', accent: '#5fb3a8', accessory: 'hairpin', expression: 'neutral', bg: '#25384a' },
  },
  kaya: {
    id: 'kaya',
    name: '카야',
    title: '하층 구역의 떠돌이 용병',
    org: 'union',
    companion: true,
    personality: '활달하고 직설적이다. 셈이 빠르고 의리를 중요하게 여긴다.',
    background: '하층 자치회의 경비 일을 맡으며 자랐다. 갚아야 할 빚이 있다는 소문이 있지만 본인은 웃어넘긴다.',
    look: { hair: '#d4553f', hairStyle: 'ponytail', eyes: '#e3a032', skin: '#f3d2bd', outfit: 'jacket', outfitColor: '#4a3a34', accent: '#e3a032', accessory: 'scar', expression: 'smirk', bg: '#4a2a26' },
  },
  noel: {
    id: 'noel',
    name: '노엘',
    title: '잿빛 수도회의 견습 수녀',
    org: 'cloister',
    companion: true,
    personality: '온화하고 다정하지만, 옳다고 믿는 일 앞에서는 물러서지 않는다.',
    background: '안개 속에서 들리는 목소리를 달래는 의식을 배우는 견습 수녀. 사실 그 목소리를 누구보다 또렷하게 듣는다.',
    look: { hair: '#f0d48a', hairStyle: 'long', eyes: '#9a7ad8', skin: '#fbe7dc', outfit: 'robe', outfitColor: '#d8d4cc', accent: '#9a7ad8', accessory: 'ribbon', expression: 'gentle', bg: '#3a3450' },
  },
  berta: {
    id: 'berta',
    name: '베르타',
    title: '경계 관리국 담당관',
    org: 'bureau',
    personality: '엄격하지만 공정하다. 서류보다 사람을 먼저 본다.',
    background: '장막 초창기부터 탐사자들을 관리해 온 베테랑. 돌아오지 못한 탐사자들의 이름을 모두 기억한다.',
    look: { hair: '#2e2f3a', hairStyle: 'wavy', eyes: '#7a8aa8', skin: '#f1d6c4', outfit: 'coat', outfitColor: '#2c3446', accent: '#d9a441', accessory: 'glasses', expression: 'serious', bg: '#2a2f3c' },
  },
  miro: {
    id: 'miro',
    name: '미로',
    title: '정보상',
    org: null,
    personality: '능글맞고 계산적이다. 거짓말은 하지 않지만 모든 진실을 말하지도 않는다.',
    background: '구역 사이를 오가는 소문을 사고파는 정보상. 어떻게 봉쇄선을 넘나드는지는 아무도 모른다.',
    look: { hair: '#3b3352', hairStyle: 'short', eyes: '#d65a8a', skin: '#f4dccd', outfit: 'coat', outfitColor: '#2a2438', accent: '#d65a8a', accessory: 'earring', expression: 'smirk', bg: '#2e2440' },
  },
};

export const ORGS = {
  bureau: { id: 'bureau', name: '경계 관리국', desc: '장막 경계선을 감시하고 탐사자를 관리하는 공공 기관.' },
  cloister: { id: 'cloister', name: '잿빛 수도회', desc: '안개를 재앙이 아닌 시험으로 여기는 종교 단체.' },
  union: { id: 'union', name: '하층 자치회', desc: '버려진 하층 구역 주민들이 스스로 꾸린 공동체.' },
};

// 주인공 외형 선택지
export const PLAYER_LOOKS = [
  { id: 'a', label: '단정한', look: { hair: '#3a3f55', hairStyle: 'short', eyes: '#5b8fd6', outfit: 'coat', outfitColor: '#3b3f4f', accent: '#d9a441', expression: 'neutral', bg: '#2a3040' } },
  { id: 'b', label: '밝은', look: { hair: '#8a5a3c', hairStyle: 'twin', eyes: '#3fa86b', outfit: 'jacket', outfitColor: '#3c5a52', accent: '#7bbf6a', accessory: 'ribbon', expression: 'smile', bg: '#2a4038' } },
  { id: 'c', label: '조용한', look: { hair: '#1f2230', hairStyle: 'long', eyes: '#c0504a', outfit: 'uniform', outfitColor: '#2a2a36', accent: '#c0504a', accessory: 'earring', expression: 'serious', bg: '#382a30' } },
  { id: 'd', label: '자유로운', look: { hair: '#e8e2d4', hairStyle: 'wavy', eyes: '#d9a441', outfit: 'robe', outfitColor: '#5a4a6a', accent: '#d9a441', accessory: 'none', expression: 'gentle', bg: '#3a3048' } },
];
