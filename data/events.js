// 사건 데이터
// {
//   id, title, scene(배경 id), characters: [등장 인물 id], text,
//   year: [최소, 최대]   — 발생 가능한 연차
//   priority             — 0보다 크면 메인 사건(조건이 맞으면 무작위보다 먼저, 높은 순)
//   weight               — 일반 사건의 무작위 가중치(기본 1)
//   major                — 주요 선택으로 기록(기록실·엔딩에 반영)
//   followUp             — 후속 사건: 다른 사건의 effects.queue로만 발생
//   filler, repeatable   — 반복 가능한 일상 사건
//   condition            — 사건 발생 조건 (eventSystem.checkCondition 참고)
//   choices: [{
//     id, text, hint?, condition?,
//     check?: { stat, difficulty | scale, tags?, assist?(인물 id), bonus? },
//     outcomes?: { success, partial, fail, critical? }  — 판정이 있을 때
//     result?: { text, effects }                         — 판정이 없을 때
//   }]
// }
// effects: { stats, resources, flags, relations, orgs, queue, note }

export const EVENTS = [
  // ───────────── 1년차 메인 ─────────────
  {
    id: 'y1_patrol',
    title: '첫 의뢰: 봉쇄선 점검',
    scene: 'border',
    characters: ['berta', 'lien'],
    year: [1, 1], priority: 100, major: true,
    text: '베르타 담당관이 얇은 서류철을 건넨다. "신입은 측량사와 함께 7번 봉쇄선을 돈다. 이상이 있으면 보고하고, 없으면 없다고 보고해."\n\n옆에 선 은발의 측량사가 작게 고개를 숙인다. "리엔이에요. 잘 부탁드립니다." 봉쇄선 너머의 회색 안개가 평소보다 짙게 일렁인다.',
    choices: [
      {
        id: 'observe', text: '안개의 흔들림을 직접 관찰한다',
        check: { stat: 'sense', difficulty: 11, tags: ['search', 'fog'] },
        outcomes: {
          success: { text: '경계 기둥 사이에서 안개가 일정한 박자로 부풀었다 가라앉는 것을 발견했다. 마치 숨을 쉬는 것처럼. 리엔이 처음으로 놀란 얼굴로 당신을 본다. "…그거, 저만 보이는 줄 알았어요."', effects: { relations: { lien: 2 }, orgs: { bureau: 1 }, flags: { saw_fog_pulse: true } } },
          partial: { text: '무언가 규칙적인 움직임이 있다는 느낌은 들었지만 확신할 수는 없었다. 리엔이 당신의 메모를 조용히 들여다본다.', effects: { relations: { lien: 1 } } },
          fail: { text: '너무 가까이 다가간 탓에 안개를 들이마셨다. 머리가 핑 돌아 가져온 약을 써야 했다.', effects: { resources: { supplies: -1 } } },
        },
      },
      {
        id: 'assist', text: '리엔의 측정을 돕는다',
        check: { stat: 'intellect', difficulty: 10, tags: ['decode'] },
        outcomes: {
          success: { text: '측정 장비의 오차를 바로잡자 리엔의 기록이 깔끔하게 맞아떨어졌다. 보고서를 받은 베르타가 짧게 고개를 끄덕인다.', effects: { relations: { lien: 2 }, orgs: { bureau: 1 }, resources: { credits: 10 } } },
          partial: { text: '숫자 몇 개를 맞게 읽어 주었다. 리엔이 "고마워요"라고 작게 말한다.', effects: { relations: { lien: 1 } } },
          fail: { text: '눈금을 잘못 읽어 리엔이 처음부터 다시 측정해야 했다. 그녀는 아무 말도 하지 않았지만, 조금 지쳐 보였다.', effects: { note: '리엔과의 첫 인상이 애매하게 남았다' } },
        },
      },
      {
        id: 'routine', text: '규정대로 순찰만 하고 돌아온다',
        result: { text: '아무 일도 일어나지 않았다. 적어도 서류상으로는. 순찰 수당이 지급되었다.', effects: { resources: { credits: 10 }, orgs: { bureau: 1 } } },
      },
      {
        id: 'protocol', text: '기숙학교에서 배운 점검 절차를 그대로 적용한다', hint: '관리국 기숙학교 출신',
        condition: { origin: ['bureau'] },
        result: { text: '교본대로의 꼼꼼한 점검이 경계 기둥 하나의 미세한 균열을 찾아냈다. 리엔이 감탄한 듯 당신의 체크리스트를 베껴 적는다.', effects: { relations: { lien: 1 }, orgs: { bureau: 2 }, flags: { saw_fog_pulse: true } } },
      },
    ],
  },
  {
    id: 'drain_request',
    title: '폐쇄된 배수 구역의 조사 요청',
    scene: 'drain',
    characters: ['berta'],
    year: [1, 2], priority: 80, major: true,
    text: '하층과 중층을 잇던 7번 배수 구역. 장막이 내려앉은 뒤 폐쇄된 그곳에서 밤마다 불빛이 보인다는 신고가 들어왔다.\n\n"공식 조사단을 꾸릴 여력은 없어." 베르타가 지도를 펼친다. "누군가 먼저 들어가서 무엇이 있는지만 보고 와 주면 돼. 거절해도 기록에 남기진 않겠다."',
    choices: [
      {
        id: 'alone', text: '혼자 조사한다',
        check: { stat: 'sense', difficulty: 12, tags: ['search'] },
        outcomes: {
          success: { text: '불빛은 오래된 비상등이었다. 그 아래, 방수포에 싸인 관리 일지 한 권이 놓여 있었다. 누군가 일부러 숨겨 둔 것처럼.', effects: { flags: { found_drain_log: true }, resources: { credits: 15 }, queue: 'drain_log' } },
          partial: { text: '불빛의 정체는 누군가의 야영 흔적이었다. 아직 따뜻한 재가 남아 있었지만, 그 이상은 찾지 못했다.', effects: { flags: { drain_camp_seen: true }, resources: { credits: 5 } } },
          fail: { text: '무너진 통로에서 발을 헛디뎠다. 간신히 빠져나왔지만 보급품을 잃고 빈손으로 돌아왔다.', effects: { resources: { supplies: -1 }, orgs: { bureau: -1 }, flags: { drain_failed: true } } },
        },
      },
      {
        id: 'with_lien', text: '리엔과 함께 조사한다', hint: '리엔이 지도를 읽어 준다',
        condition: { met: ['lien'] },
        check: { stat: 'intellect', difficulty: 11, tags: ['search'], assist: 'lien' },
        outcomes: {
          success: { text: '리엔이 옛 배관도를 기억해 낸 덕분에 막다른 길을 피해 깊은 곳까지 들어갔다. 비상등 아래에서 방수포에 싸인 관리 일지를 찾았다. "이건… 장막 직후의 날짜예요."', effects: { flags: { found_drain_log: true }, relations: { lien: 2 }, queue: 'drain_log' } },
          partial: { text: '둘이서 야영 흔적까지는 찾아냈다. 돌아오는 길, 리엔이 "다음엔 더 깊이 가 봐요"라고 말했다.', effects: { flags: { drain_camp_seen: true }, relations: { lien: 1 } } },
          fail: { text: '물이 차오르는 통로에서 길을 잃었다. 리엔의 판단으로 일찍 철수했지만 보급품을 잃었다.', effects: { resources: { supplies: -1 }, relations: { lien: 1 } } },
        },
      },
      {
        id: 'refuse', text: '조사를 거절한다',
        result: { text: '자원은 지켰다. 베르타는 아무 말 없이 지도를 접었다. 그날 밤, 배수 구역의 불빛은 꺼져 있었다고 한다.', effects: { orgs: { bureau: -1 }, flags: { drain_refused: true }, note: '이야기의 일부를 놓쳤다' } },
      },
    ],
  },
  {
    id: 'drain_log',
    title: '젖은 관리 일지',
    scene: 'archive',
    characters: [],
    followUp: true, major: true,
    text: '배수 구역에서 가져온 일지는 절반이 물에 번져 있다. 마지막 장에는 서두른 필체로 한 문장이 반복되어 있다.\n\n"장막은 바깥에서 내려온 것이 아니다."',
    choices: [
      {
        id: 'decode', text: '번진 글씨를 해독한다',
        check: { stat: 'intellect', difficulty: 12, tags: ['decode'] },
        outcomes: {
          success: { text: '밤새 대조한 끝에 일지의 핵심을 읽어 냈다. 장막이 내려앉기 직전, 구역마다 같은 시각에 "측정 실험"이 있었다는 기록이다.', effects: { flags: { truth_fragment_1: true }, stats: { intellect: 1 } } },
          partial: { text: '"실험", "일곱 개의 탑" 같은 단어만 겨우 읽어 냈다. 무언가 큰 그림의 조각인 것은 분명하다.', effects: { flags: { log_partial: true } } },
          fail: { text: '종이를 말리다 마지막 장이 찢어졌다. 남은 것은 알아볼 수 없는 얼룩뿐이다.', effects: { flags: { log_ruined: true } } },
        },
      },
      {
        id: 'submit', text: '관리국에 그대로 제출한다',
        result: { text: '베르타는 일지를 받아 들고 오래 침묵했다. "이건 내가 맡지." 보상금이 지급되었고, 일지는 다시 볼 수 없었다.', effects: { orgs: { bureau: 2 }, resources: { credits: 20 }, flags: { log_submitted: true } } },
      },
      {
        id: 'sell', text: '정보상 미로에게 넘긴다', hint: '미로를 알고 있어야 한다',
        condition: { met: ['miro'] },
        result: { text: '미로는 일지를 훑어보더니 휘파람을 불었다. "이건 값을 꽤 쳐 줘야겠는데." 그의 웃음이 어딘가 진지했다.', effects: { resources: { credits: 40 }, relations: { miro: 2 }, flags: { sold_log: true } } },
      },
    ],
  },

  // ───────────── 2~3년차 메인 ─────────────
  {
    id: 'bureau_offer',
    title: '관리국의 제안',
    scene: 'bureau',
    characters: ['berta'],
    year: [2, 2], priority: 90, major: true,
    text: '한 해를 버틴 신입 탐사자는 드물다. 베르타가 정식 요원 계약서를 책상 위에 올려놓는다.\n\n"안정된 수당과 장비 지원. 대신 관리국의 명령을 따라야 해. 독립 탐사자로 남는 것도 네 자유다."',
    choices: [
      {
        id: 'sign', text: '계약서에 서명한다',
        result: { text: '베르타가 서류에 도장을 찍는다. "환영한다, 요원." 그 목소리에는 조금의 안도가 섞여 있었다.', effects: { flags: { bureau_agent: true }, orgs: { bureau: 3, union: -1 }, resources: { credits: 30 } } },
      },
      {
        id: 'independent', text: '독립 탐사자로 남는다',
        result: { text: '"그래, 그런 녀석도 하나쯤은 있어야지." 베르타는 계약서를 서랍에 넣었다. 하층과 수도회 쪽에서 당신을 보는 눈이 조금 달라졌다.', effects: { flags: { independent: true }, orgs: { union: 1, cloister: 1 } } },
      },
      {
        id: 'negotiate', text: '조건을 협상한다',
        check: { stat: 'social', difficulty: 13, tags: ['trade'] },
        outcomes: {
          success: { text: '현장 재량권과 더 높은 수당을 얻어 냈다. 베르타가 쓴웃음을 짓는다. "너 같은 신입은 처음이다."', effects: { flags: { bureau_agent: true, free_hand: true }, orgs: { bureau: 2 }, resources: { credits: 40 } } },
          partial: { text: '수당은 조금 올랐지만 재량권은 얻지 못했다. 그래도 나쁘지 않은 계약이다.', effects: { flags: { bureau_agent: true }, orgs: { bureau: 1 }, resources: { credits: 30 } } },
          fail: { text: '요구가 지나쳤다. 베르타가 계약서를 거둬 간다. "독립 탐사자로 지내 보면 생각이 바뀔지도 모르지."', effects: { flags: { independent: true }, orgs: { bureau: -1 } } },
        },
      },
    ],
  },
  {
    id: 'rift_tremor',
    title: '장막의 균열',
    scene: 'rift',
    characters: ['berta'],
    year: [3, 3], priority: 90, major: true,
    text: '새벽, 모든 봉쇄선에서 안개가 동시에 물러났다가 되돌아왔다. 그 짧은 순간, 7번 봉쇄선 너머에 사람 하나가 지나갈 만한 틈이 열렸다가 닫히기를 반복하고 있다.\n\n경보가 울리고, 거리는 혼란에 빠졌다.',
    choices: [
      {
        id: 'enter', text: '정보상에게 들은 경로로 균열 안에 들어간다', hint: '미로의 정보 필요',
        condition: { flags: ['knows_rift_route'] },
        result: { text: '틈 안쪽은 고요했다. 멈춘 시계탑, 사람 없는 거리, 그리고 벽에 새겨진 일곱 개의 탑 문양. 돌아왔을 때 당신의 시계는 세 시간이 늦어 있었다.', effects: { flags: { entered_rift: true, truth_fragment_3: true }, stats: { will: 1 } } },
      },
      {
        id: 'hold', text: '관리국과 함께 봉쇄선을 지킨다',
        result: { text: '밤새 경계 기둥을 지켰다. 안개는 결국 제자리로 돌아갔다. 베르타가 당신의 어깨를 한 번 두드리고 지나갔다.', effects: { orgs: { bureau: 2 }, flags: { held_the_line: true } } },
      },
      {
        id: 'evacuate', text: '하층 주민들의 대피를 돕는다',
        check: { stat: 'social', difficulty: 11 },
        outcomes: {
          success: { text: '당신의 목소리에 사람들이 질서를 되찾았다. 다친 사람 없이 모두가 대피소에 도착했다.', effects: { orgs: { union: 2, cloister: 1 }, flags: { evacuated: true } } },
          partial: { text: '대부분은 무사히 대피시켰지만 혼란 속에 몇몇은 놓치고 말았다.', effects: { orgs: { union: 1 } } },
          fail: { text: '공포에 질린 군중은 당신의 말을 듣지 않았다. 할 수 있는 일이 많지 않았다.', effects: { note: '무력감이 오래 남았다' } },
        },
      },
      {
        id: 'observe', text: '균열이 열리고 닫히는 규칙을 관찰한다',
        check: { stat: 'sense', difficulty: 13, tags: ['fog', 'search'] },
        outcomes: {
          success: { text: '균열은 안개의 "숨"과 같은 박자로 열린다. 장막은 살아 있는 무언가에 가깝다. 당신은 그 박자를 정확히 기록해 두었다.', effects: { flags: { observed_rift: true, truth_fragment_3: true } } },
          partial: { text: '균열이 일정한 주기로 열린다는 것까지는 알아냈다.', effects: { flags: { observed_rift: true } } },
          fail: { text: '틈에서 흘러나온 안개에 시야를 잃었다. 정신을 차렸을 땐 균열이 닫혀 있었다.', effects: { resources: { supplies: -1 } } },
        },
      },
    ],
  },

  // ───────────── 인물 사건 ─────────────
  {
    id: 'market_kaya',
    title: '하층 시장의 소매치기',
    scene: 'market',
    characters: ['kaya'],
    year: [1, 3], weight: 3,
    text: '하층 시장의 인파 속에서 지갑이 사라졌다. 소년 하나가 골목으로 달아나려는 순간, 붉은 머리의 용병이 먼저 그 뒷덜미를 낚아챘다.\n\n"이거 네 거지?" 그녀가 지갑을 흔든다. "카야야. 수고비는 열 크레딧."',
    choices: [
      {
        id: 'pay', text: '수고비를 낸다',
        condition: { credits: 10 },
        result: { text: '"시원시원해서 좋네." 카야가 동전을 튕겨 받으며 웃는다. "하층에서 곤란해지면 불러. 싸게 해 줄게."', effects: { resources: { credits: -10 }, relations: { kaya: 2 }, orgs: { union: 1 } } },
      },
      {
        id: 'haggle', text: '수고비를 흥정한다',
        check: { stat: 'social', difficulty: 11, tags: ['trade'] },
        outcomes: {
          success: { text: '말싸움 끝에 카야가 먼저 웃음을 터뜨렸다. "됐어, 공짜로 해 줄게. 너 재밌다."', effects: { relations: { kaya: 3 } } },
          partial: { text: '반값으로 합의했다. 카야가 어깨를 으쓱한다. "장사 수완은 있네."', effects: { resources: { credits: -5 }, relations: { kaya: 1 } } },
          fail: { text: '"쩨쩨하긴." 카야는 결국 열 크레딧을 받아 갔다.', effects: { resources: { credits: -10 } } },
        },
      },
      {
        id: 'ask_boy', text: '소년이 왜 훔쳤는지 묻는다',
        check: { stat: 'social', difficulty: 10 },
        outcomes: {
          success: { text: '소년은 자치회 배급이 몇 주째 끊겼다고 털어놓았다. 카야의 표정이 굳는다. "…그 얘기, 나도 알아봐야겠네."', effects: { relations: { kaya: 1 }, orgs: { union: 2 }, flags: { union_ration_issue: true } } },
          partial: { text: '소년은 배가 고팠다고만 말하고 입을 다물었다.', effects: { orgs: { union: 1 } } },
          fail: { text: '소년은 카야의 손을 뿌리치고 달아났다. 지갑은 돌아왔지만 뒷맛이 씁쓸하다.', effects: {} },
        },
      },
      {
        id: 'alley_rule', text: '하층 골목의 규칙대로 처리한다', hint: '하층 구역 출신',
        condition: { origin: ['underdeck'] },
        result: { text: '소년에게 골목의 규칙을 짧게 일러 주고 보냈다. 카야가 눈을 동그랗게 뜬다. "너, 여기 출신이구나?"', effects: { relations: { kaya: 2 }, orgs: { union: 1 } } },
      },
    ],
  },
  {
    id: 'fog_bells',
    title: '안개 속 종소리',
    scene: 'cloister',
    characters: ['noel'],
    year: [1, 3], weight: 3,
    text: '밤이 깊자 봉쇄선 쪽에서 종소리가 들린다. 그곳에는 종이 없다.\n\n소리를 따라가자 금발의 견습 수녀가 홀로 안개 앞에 무릎을 꿇고 있었다. "들리시나요? 오늘은… 유난히 많이 불러요."',
    choices: [
      {
        id: 'listen', text: '종소리에 귀를 기울인다',
        check: { stat: 'will', difficulty: 12, tags: ['fog'] },
        outcomes: {
          success: { text: '종소리 사이로 누군가 당신의 이름을 부른다. 당신은 대답하지 않고 끝까지 버텼다. 수녀가 놀란 눈으로 당신을 본다. "노엘이라고 해요. 당신… 강하네요."', effects: { flags: { heard_voice: true }, stats: { will: 1 }, relations: { noel: 2 } } },
          partial: { text: '목소리가 머릿속을 긁고 지나갔다. 비틀거리는 당신을 수녀가 붙잡아 준다. "무리하지 마세요. 저는 노엘이에요."', effects: { relations: { noel: 1 } } },
          fail: { text: '정신을 차렸을 때는 수도회의 침상이었다. 노엘이라는 수녀가 밤새 곁을 지켰다고 한다.', effects: { resources: { supplies: -1 }, relations: { noel: 1 }, flags: { noel_saved_you: true } } },
        },
      },
      {
        id: 'talk', text: '수녀에게 말을 건다',
        check: { stat: 'social', difficulty: 10 },
        outcomes: {
          success: { text: '노엘은 안개 속 목소리를 "길 잃은 기억"이라고 불렀다. 함께 기도를 마친 뒤, 그녀가 수줍게 웃었다.', effects: { relations: { noel: 2 }, orgs: { cloister: 1 } } },
          partial: { text: '노엘은 친절했지만 많은 것을 말해 주지는 않았다.', effects: { relations: { noel: 1 } } },
          fail: { text: '말을 걸자 노엘이 깜짝 놀라 기도서를 떨어뜨렸다. 어색한 침묵이 흘렀다.', effects: {} },
        },
      },
      {
        id: 'leave', text: '조용히 자리를 피한다',
        result: { text: '종소리는 새벽까지 이어졌다. 다음 날 아침, 수도회 앞에 새로운 촛불이 하나 늘어 있었다.', effects: { note: '아무 일도 일어나지 않았다' } },
      },
    ],
  },
  {
    id: 'info_broker',
    title: '정보상 미로',
    scene: 'street',
    characters: ['miro'],
    year: [1, 3], weight: 2,
    text: '찻집 구석에서 보라색 머리의 남자가 손짓한다. "요즘 소문의 신입이군. 미로라고 해."\n\n그가 찻잔을 돌리며 말한다. "장막 너머로 가는 \'틈\'에 관한 정보가 있어. 살래?"',
    choices: [
      {
        id: 'buy', text: '30 크레딧에 산다',
        condition: { credits: 30 },
        result: { text: '미로가 접힌 쪽지를 건넨다. 봉쇄선의 어느 지점과 시각이 적혀 있다. "언젠가 쓸 일이 있을 거야."', effects: { resources: { credits: -30 }, relations: { miro: 1 }, flags: { knows_rift_route: true } } },
      },
      {
        id: 'bargain', text: '값을 깎아 본다',
        check: { stat: 'social', difficulty: 12, tags: ['trade'] },
        outcomes: {
          success: { text: '"졌다, 졌어." 미로가 웃으며 단돈 10 크레딧에 쪽지를 넘긴다. "단골 할인이야. 앞으로 단골 해 줄 거지?"', effects: { resources: { credits: -10 }, relations: { miro: 2 }, flags: { knows_rift_route: true } } },
          partial: { text: '20 크레딧에 합의했다. 미로는 만족스러운 얼굴이다.', effects: { resources: { credits: -20 }, flags: { knows_rift_route: true } } },
          fail: { text: '"정보의 값을 모르는 사람과는 거래 안 해." 미로가 자리에서 일어선다.', effects: { relations: { miro: -1 } } },
        },
      },
      {
        id: 'trade_log', text: '배수 구역 일지 이야기를 꺼낸다', hint: '관리 일지 발견 필요',
        condition: { flags: ['found_drain_log'] },
        result: { text: '미로의 눈빛이 달라진다. "그 이야기라면 내가 값을 치르지." 그는 정보 쪽지와 함께 크레딧까지 내밀었다.', effects: { resources: { credits: 15 }, relations: { miro: 2 }, flags: { knows_rift_route: true } } },
      },
      {
        id: 'decline', text: '거절한다',
        result: { text: '"마음이 바뀌면 언제든." 미로는 찻값까지 당신 앞으로 달아 두고 사라졌다.', effects: { resources: { credits: -2 } } },
      },
    ],
  },
  {
    id: 'noel_ritual',
    title: '정화 의식',
    scene: 'cloister',
    characters: ['noel'],
    year: [2, 3], weight: 3,
    condition: { met: ['noel'] },
    text: '노엘이 조심스럽게 부탁한다. "오늘 밤 처음으로 혼자 정화 의식을 맡게 됐어요. 곁에 있어 주실 수 있나요?"\n\n의식이 시작되자 안개가 천천히 사람의 형상을 이루기 시작했다.',
    choices: [
      {
        id: 'guard', text: '노엘의 곁을 지킨다',
        check: { stat: 'will', difficulty: 12, tags: ['fog'] },
        outcomes: {
          success: { text: '흔들리는 노엘의 손을 붙잡고 끝까지 버텼다. 형상은 고개를 숙이듯 흩어졌다. "고마워요. 혼자였다면… 못 했을 거예요."', effects: { relations: { noel: 3 }, orgs: { cloister: 2 }, flags: { ritual_success: true } } },
          partial: { text: '의식은 끝났지만 둘 다 녹초가 되었다. 노엘이 지친 얼굴로 웃는다.', effects: { relations: { noel: 1 }, orgs: { cloister: 1 } } },
          fail: { text: '형상이 비명을 지르며 흩어졌다. 의식은 실패했지만, 노엘은 당신이 끝까지 남아 준 것에 고마워했다.', effects: { relations: { noel: 1 }, resources: { supplies: -1 }, flags: { ritual_failed: true } } },
        },
      },
      {
        id: 'record', text: '의식을 관찰하고 기록한다',
        check: { stat: 'sense', difficulty: 11, tags: ['search'] },
        outcomes: {
          success: { text: '형상이 흩어질 때 안개가 노엘 쪽으로 미세하게 빨려 들어가는 것을 보았다. 의식은 안개를 달래는 것이 아니라… 받아들이는 것일지도 모른다.', effects: { flags: { truth_fragment_2: true } } },
          partial: { text: '무언가 이상한 흐름이 있었지만 정확히 기록하지는 못했다.', effects: {} },
          fail: { text: '기록하는 모습을 다른 수도자에게 들켰다. 차가운 시선이 쏟아진다.', effects: { orgs: { cloister: -1 } } },
        },
      },
      {
        id: 'decline', text: '정중히 거절한다',
        result: { text: '"…그렇죠. 무리한 부탁이었어요." 노엘은 웃었지만, 그 웃음은 조금 쓸쓸했다.', effects: { relations: { noel: -1 } } },
      },
    ],
  },
  {
    id: 'kaya_debt',
    title: '카야의 빚',
    scene: 'market',
    characters: ['kaya'],
    year: [2, 3], weight: 3,
    condition: { met: ['kaya'] },
    text: '시장 뒷골목에서 카야가 덩치 큰 남자 셋에게 둘러싸여 있다. "다음 달에 갚는다고 했잖아." 카야의 목소리는 평소처럼 가볍지만, 손은 허리의 칼자루에 가 있다.',
    choices: [
      {
        id: 'pay', text: '빚을 대신 갚아 준다 (50 크레딧)',
        condition: { credits: 50 },
        result: { text: '남자들이 돈을 세고 사라졌다. 카야가 한참 동안 말이 없다가 입을 연다. "…이건 꼭 갚을게. 돈 말고도."', effects: { resources: { credits: -50 }, relations: { kaya: 4 }, flags: { paid_kaya_debt: true } } },
      },
      {
        id: 'fight', text: '카야와 함께 맞선다', hint: '카야가 함께 싸운다',
        check: { stat: 'body', difficulty: 12, tags: ['physical'], assist: 'kaya' },
        outcomes: {
          success: { text: '짧고 거친 싸움이었다. 남자들이 달아나자 카야가 피 묻은 입술로 웃는다. "너, 생각보다 쓸 만하네!"', effects: { relations: { kaya: 3 }, orgs: { union: 1 }, flags: { fought_for_kaya: true } } },
          partial: { text: '남자들을 쫓아냈지만 둘 다 꽤 다쳤다. 카야가 붕대를 감아 주며 투덜거린다.', effects: { relations: { kaya: 2 }, resources: { supplies: -1 }, flags: { fought_for_kaya: true } } },
          fail: { text: '수적으로 밀렸다. 자치회 경비가 도착하지 않았다면 큰일 날 뻔했다.', effects: { relations: { kaya: 1 }, resources: { supplies: -2 } } },
        },
      },
      {
        id: 'talk', text: '말로 시간을 번다',
        check: { stat: 'social', difficulty: 12, tags: ['trade'] },
        outcomes: {
          success: { text: '관리국 이름을 슬쩍 흘리자 남자들이 한발 물러섰다. 상환 기한이 한 달 미뤄졌다.', effects: { relations: { kaya: 2 }, flags: { kaya_debt_delayed: true } } },
          partial: { text: '일주일을 벌었다. 카야가 "그 정도면 충분해"라며 어깨를 두드린다.', effects: { relations: { kaya: 1 } } },
          fail: { text: '말이 통하지 않았다. 결국 가진 돈 일부를 내주고서야 자리를 벗어났다.', effects: { resources: { credits: -10 } } },
        },
      },
      {
        id: 'ignore', text: '못 본 척 지나간다',
        result: { text: '등 뒤로 카야의 시선이 느껴졌다. 그 뒤로 시장에서 그녀를 보기 어려워졌다.', effects: { relations: { kaya: -3 }, flags: { ignored_kaya: true } } },
      },
    ],
  },
  {
    id: 'broken_meter',
    title: '고장 난 측정기',
    scene: 'bureau',
    characters: ['lien'],
    year: [1, 3], weight: 2,
    condition: { met: ['lien'] },
    text: '리엔이 책상 앞에서 측정기를 붙들고 한숨을 쉬고 있다. "바늘이 계속 튀어요. 이게 없으면 내일 순찰을 못 나가요."',
    choices: [
      {
        id: 'fix', text: '분해해서 고쳐 본다',
        check: { stat: 'intellect', difficulty: 11, tags: ['decode'] },
        outcomes: {
          success: { text: '헐거운 접점을 찾아 바로잡았다. 바늘이 얌전히 0을 가리킨다. 리엔이 측정기를 안고 작게 웃는다. "역시 부탁하길 잘했어요."', effects: { relations: { lien: 2 }, flags: { meter_fixed: true } } },
          partial: { text: '임시로나마 작동하게 만들었다. "내일 하루는 버티겠네요."', effects: { relations: { lien: 1 } } },
          fail: { text: '부품 하나를 부러뜨렸다. 새 부품값은 당신이 냈다.', effects: { resources: { credits: -10 } } },
        },
      },
      {
        id: 'chat', text: '수리 대신 리엔의 이야기를 들어 준다',
        check: { stat: 'social', difficulty: 9 },
        outcomes: {
          success: { text: '리엔이 처음으로 고향 이야기를 꺼냈다. 장막 너머, 3번 구역. "언젠가 측정값이 그곳까지 닿았으면 해요."', effects: { relations: { lien: 2 }, flags: { lien_hometown: true } } },
          partial: { text: '리엔은 조금 웃었고, 측정기는 여전히 고장 나 있었다.', effects: { relations: { lien: 1 } } },
          fail: { text: '대화가 자꾸 끊겼다. 리엔은 다시 측정기에 집중했다.', effects: {} },
        },
      },
      {
        id: 'luck', text: '옆을 툭 쳐 본다',
        check: { stat: 'luck', difficulty: 11 },
        outcomes: {
          success: { text: '탁. 바늘이 제자리로 돌아왔다. 리엔이 믿을 수 없다는 얼굴로 당신을 본다.', effects: { relations: { lien: 1 } } },
          partial: { text: '바늘이 잠깐 멈췄다가 다시 튀기 시작했다.', effects: {} },
          fail: { text: '뚜껑이 떨어져 나갔다. 리엔의 눈빛이 차가워졌다.', effects: { relations: { lien: -1 }, resources: { credits: -5 } } },
        },
      },
    ],
  },
  {
    id: 'lost_child',
    title: '길 잃은 아이',
    scene: 'street',
    characters: [],
    year: [1, 3], weight: 2,
    text: '봉쇄선 근처에서 아이 하나가 울고 있다. 안개 경보가 울린 사이 가족과 떨어졌다고 한다. 곧 날이 저문다.',
    choices: [
      {
        id: 'search', text: '함께 가족을 찾는다',
        check: { stat: 'sense', difficulty: 10, tags: ['search'] },
        outcomes: {
          success: { text: '아이가 기억하는 간판 하나를 단서로 가족을 찾아냈다. 아이의 어머니가 몇 번이고 고개를 숙였다.', effects: { orgs: { union: 2 }, resources: { credits: 5 } } },
          partial: { text: '한참을 헤맨 끝에 자치회 경비에게 아이를 맡겼다. 늦게라도 가족을 찾았다는 소식이 들려왔다.', effects: { orgs: { union: 1 } } },
          fail: { text: '해가 진 뒤에야 관리국 보호소에 아이를 데려다주었다. 몸도 마음도 지쳤다.', effects: { resources: { supplies: -1 } } },
        },
      },
      {
        id: 'shelter', text: '관리국 보호소에 맡긴다',
        result: { text: '규정대로 처리했다. 보호소 직원이 서류에 당신의 이름을 적었다.', effects: { orgs: { bureau: 1 } } },
      },
      {
        id: 'share', text: '보급품을 나눠 주고 함께 기다린다',
        condition: { supplies: 1 },
        result: { text: '아이와 마른 빵을 나눠 먹으며 기다렸다. 어둠이 내리기 직전, 아이의 아버지가 달려왔다. 이상하게도 그날 이후 일이 잘 풀렸다.', effects: { resources: { supplies: -1 }, orgs: { union: 1 }, stats: { luck: 1 } } },
      },
    ],
  },

  // ───────────── 반복 일상 사건 ─────────────
  {
    id: 'daily_room',
    title: '숙소에서의 하루',
    scene: 'room',
    characters: [],
    filler: true, repeatable: true,
    text: '특별한 의뢰가 없는 날이다. 창밖의 안개는 오늘도 느리게 흐른다. 하루를 어떻게 보낼까?',
    choices: [
      {
        id: 'train', text: '체력 단련',
        check: { stat: 'body', scale: 8 },
        outcomes: {
          success: { text: '땀을 흘린 만큼 몸이 가벼워졌다.', effects: { stats: { body: 1 } } },
          partial: { text: '조금 익숙해진 것 같다. 아직 눈에 띄는 변화는 없다.', effects: {} },
          fail: { text: '무리하다 근육이 뭉쳤다. 오늘은 쉬는 게 좋겠다.', effects: {} },
        },
      },
      {
        id: 'study', text: '관리국 자료 열람',
        check: { stat: 'intellect', scale: 8 },
        outcomes: {
          success: { text: '오래된 보고서에서 유용한 분석법을 익혔다.', effects: { stats: { intellect: 1 } } },
          partial: { text: '흥미로운 기록이 많았지만 머리에 남은 건 별로 없다.', effects: {} },
          fail: { text: '책상에 엎드려 잠들었다.', effects: {} },
        },
      },
      {
        id: 'work', text: '단기 일거리를 받는다',
        result: { text: '하루 종일 짐을 날랐다. 몸은 고되지만 주머니가 두둑해졌다.', effects: { resources: { credits: 15 } } },
      },
      {
        id: 'rest', text: '푹 쉰다',
        result: { text: '오랜만에 깊이 잠들었다. 정비한 보급품을 가방에 챙겨 넣는다.', effects: { resources: { supplies: 1 } } },
      },
    ],
  },
  {
    id: 'daily_street',
    title: '거리의 오후',
    scene: 'street',
    characters: [],
    filler: true, repeatable: true,
    text: '중층 거리에 오후의 회색 햇살이 내려앉는다. 사람들은 안개를 등지고 오늘을 산다.',
    choices: [
      {
        id: 'watch', text: '사람들을 관찰한다',
        check: { stat: 'sense', scale: 8 },
        outcomes: {
          success: { text: '사소한 몸짓에서 많은 것을 읽어 내는 법을 익혔다.', effects: { stats: { sense: 1 } } },
          partial: { text: '흥미로운 사람들을 많이 보았다.', effects: {} },
          fail: { text: '멍하니 하루가 지나갔다.', effects: {} },
        },
      },
      {
        id: 'mingle', text: '찻집에서 사람들과 어울린다',
        check: { stat: 'social', scale: 8 },
        outcomes: {
          success: { text: '처음 보는 사람들과 금세 친해졌다. 말이 조금 더 자연스러워졌다.', effects: { stats: { social: 1 } } },
          partial: { text: '즐거운 대화였다.', effects: {} },
          fail: { text: '농담이 빗나갔다. 어색하게 찻값을 계산하고 나왔다.', effects: { resources: { credits: -2 } } },
        },
      },
      {
        id: 'meditate', text: '수도회 정원에서 명상한다',
        check: { stat: 'will', scale: 8 },
        outcomes: {
          success: { text: '안개의 속삭임이 한결 멀게 느껴진다.', effects: { stats: { will: 1 } } },
          partial: { text: '마음이 조금 차분해졌다.', effects: {} },
          fail: { text: '잡념만 가득했다.', effects: {} },
        },
      },
      {
        id: 'errand', text: '자치회 심부름을 돕는다',
        result: { text: '하층으로 물자를 나르는 일을 도왔다. 적은 수고비와 고맙다는 인사를 받았다.', effects: { resources: { credits: 8 }, orgs: { union: 1 } } },
      },
    ],
  },
];
