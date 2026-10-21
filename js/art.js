// 임시 그래픽. 실제 이미지가 생기면 데이터의 image 필드에 assets/ 경로를 넣으면 <img>로 교체된다.
// 사용처는 portrait()/emblem()/sceneStyle()만 호출하므로 그림 교체 시 이 파일과 데이터만 고치면 된다.
import { h } from './ui.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
let uid = 0;

function svg(markup, cls, label, viewBox = '0 0 100 100') {
  const wrap = document.createElement('div');
  wrap.innerHTML = `<svg xmlns="${SVG_NS}" viewBox="${viewBox}" role="img" aria-label="${escapeXml(label)}">${markup}</svg>`;
  const el = wrap.firstElementChild;
  if (cls) el.setAttribute('class', cls);
  return el;
}

export function emblem(cls = 'title-emblem') {
  return svg(`
    <defs><linearGradient id="eg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#d9a441"/><stop offset="1" stop-color="#6e6b65"/></linearGradient></defs>
    <circle cx="50" cy="50" r="44" fill="none" stroke="url(#eg)" stroke-width="3"/>
    <circle cx="50" cy="50" r="30" fill="none" stroke="#5fb3a8" stroke-width="1.5" stroke-dasharray="4 5"/>
    <path d="M50 14 L58 50 L50 86 L42 50 Z" fill="url(#eg)" opacity="0.85"/>
    <path d="M14 50 L50 44 L86 50 L50 56 Z" fill="#a19d94" opacity="0.5"/>`, cls, '회색의 연대기 문장');
}

// ===== 애니풍 초상화 생성기 =====
// def: { name, image?, look: { hair, hairStyle, eyes, skin, outfit, outfitColor, accent, accessory, expression, bg } }
// hairStyle: bob | long | ponytail | short | twin | wavy
// outfit: uniform | coat | robe | jacket
// accessory: none | glasses | hairpin | ribbon | earring | scar
// expression: smile | neutral | smirk | serious | gentle
const DEFAULT_LOOK = {
  hair: '#5b5f6e', hairStyle: 'short', eyes: '#6b8fd6', skin: '#f6dccb',
  outfit: 'coat', outfitColor: '#3a4255', accent: '#d9a441', accessory: 'none',
  expression: 'neutral', bg: '#2a3040',
};

export function portrait(def, cls = 'portrait') {
  if (def.image) return h('img', { class: cls, src: def.image, alt: def.name, draggable: 'false' });
  const L = { ...DEFAULT_LOOK, ...(def.look || {}) };
  const id = `p${++uid}`;
  const hairDark = shade(L.hair, -0.28);
  const hairLight = shade(L.hair, 0.35);
  const skinShadow = shade(L.skin, -0.12);
  const lineCol = shade(L.hair, -0.6);

  const defs = `
    <defs>
      <radialGradient id="${id}bg" cx="50%" cy="38%" r="75%">
        <stop offset="0" stop-color="${shade(L.bg, 0.35)}"/><stop offset="1" stop-color="${shade(L.bg, -0.35)}"/>
      </radialGradient>
      <linearGradient id="${id}hair" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${hairLight}"/><stop offset="0.45" stop-color="${L.hair}"/><stop offset="1" stop-color="${hairDark}"/>
      </linearGradient>
      <linearGradient id="${id}iris" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${shade(L.eyes, -0.55)}"/><stop offset="0.55" stop-color="${L.eyes}"/><stop offset="1" stop-color="${shade(L.eyes, 0.55)}"/>
      </linearGradient>
      <linearGradient id="${id}cloth" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${shade(L.outfitColor, 0.15)}"/><stop offset="1" stop-color="${shade(L.outfitColor, -0.3)}"/>
      </linearGradient>
    </defs>`;

  const parts = [
    defs,
    `<rect width="200" height="240" fill="url(#${id}bg)"/>`,
    `<circle cx="100" cy="105" r="78" fill="${shade(L.bg, 0.5)}" opacity="0.25"/>`,
    backHair(L.hairStyle, id),
    body(L, id),
    // 목
    `<path d="M88 150 L88 186 Q100 194 112 186 L112 150 Z" fill="${skinShadow}"/>`,
    // 얼굴
    `<path d="M57 98 C56 132 74 160 100 172 C126 160 144 132 143 98 C143 62 57 62 57 98 Z" fill="${L.skin}"/>`,
    // 귀
    `<path d="M58 108 C50 104 50 122 60 128 Z" fill="${skinShadow}"/><path d="M142 108 C150 104 150 122 140 128 Z" fill="${skinShadow}"/>`,
    // 볼 홍조
    `<ellipse cx="73" cy="138" rx="9" ry="4.5" fill="#f08a8a" opacity="0.28"/><ellipse cx="127" cy="138" rx="9" ry="4.5" fill="#f08a8a" opacity="0.28"/>`,
    eyes(L, id, lineCol),
    brows(L.expression, lineCol),
    `<path d="M100 134 L98.5 139 L101 139.5" fill="none" stroke="${skinShadow}" stroke-width="1.4" stroke-linecap="round"/>`,
    mouth(L.expression),
    `<path d="M60 96 Q100 82 140 96 L141 106 Q100 92 59 106 Z" fill="${skinShadow}" opacity="0.55"/>`,
    frontHair(L.hairStyle, id, hairDark),
    // 머리카락 광택(천사 고리)
    `<path d="M70 66 Q100 52 130 66" fill="none" stroke="${hairLight}" stroke-width="4" stroke-linecap="round" opacity="0.55"/>`,
    accessory(L, lineCol),
  ];
  return svg(parts.join(''), cls, def.name || '초상화', '0 0 200 240');
}

function backHair(style, id) {
  const f = `fill="url(#${id}hair)"`;
  switch (style) {
    case 'long':
      return `<path d="M50 100 C38 40 162 40 150 100 C156 150 166 200 172 240 L28 240 C34 200 44 150 50 100 Z" ${f}/>`;
    case 'wavy':
      return `<path d="M50 100 C38 40 162 40 150 100 C160 130 150 150 162 175 C172 200 158 215 168 240 L32 240 C42 215 28 200 38 175 C50 150 40 130 50 100 Z" ${f}/>`;
    case 'bob':
      return `<path d="M50 100 C40 40 160 40 150 100 C152 130 156 160 148 172 L52 172 C44 160 48 130 50 100 Z" ${f}/>`;
    case 'ponytail':
      return `<path d="M52 100 C42 42 158 42 148 100 C150 125 146 140 140 150 L60 150 C54 140 50 125 52 100 Z" ${f}/>
        <path d="M138 58 C178 50 186 110 170 160 C166 190 176 212 186 226 C160 214 150 188 152 160 C156 120 158 90 138 72 Z" ${f}/>
        <circle cx="140" cy="62" r="6" fill="#d9a441"/>`;
    case 'twin':
      return `<path d="M52 100 C42 42 158 42 148 100 C150 125 146 140 140 150 L60 150 C54 140 50 125 52 100 Z" ${f}/>
        <path d="M58 70 C24 74 18 140 30 190 C34 210 28 226 22 236 C46 224 52 200 50 176 C48 140 50 100 62 80 Z" ${f}/>
        <path d="M142 70 C176 74 182 140 170 190 C166 210 172 226 178 236 C154 224 148 200 150 176 C152 140 150 100 138 80 Z" ${f}/>`;
    case 'short':
    default:
      return `<path d="M54 104 C40 44 160 44 146 104 C148 120 144 132 138 140 L62 140 C56 132 52 120 54 104 Z" ${f}/>`;
  }
}

function frontHair(style, id, dark) {
  const f = `fill="url(#${id}hair)"`;
  // 공통 앞머리(뾰족한 결) + 스타일별 옆머리
  const bangs = style === 'short'
    ? `<path d="M54 102 C50 56 80 40 104 42 C132 42 152 62 146 102 L140 86 L134 100 L126 80 L116 98 L108 76 L98 96 L88 78 L80 98 L72 82 L64 100 L60 88 Z" ${f}/>`
    : `<path d="M54 104 C50 58 78 42 100 42 C124 42 152 58 146 104 L139 90 L133 106 L124 84 L114 102 L106 80 L98 100 L88 82 L80 102 L72 86 L64 104 L60 92 Z" ${f}/>`;
  const strands = `<path d="M100 46 C92 60 88 72 88 82" fill="none" stroke="${dark}" stroke-width="1.5" opacity="0.6"/>
    <path d="M112 48 C116 60 118 72 116 86" fill="none" stroke="${dark}" stroke-width="1.5" opacity="0.6"/>`;
  let side = '';
  if (style !== 'short') {
    side = `<path d="M56 92 C50 120 52 150 58 172 C62 150 64 124 66 100 Z" ${f}/>
      <path d="M144 92 C150 120 148 150 142 172 C138 150 136 124 134 100 Z" ${f}/>`;
  } else {
    side = `<path d="M56 96 C52 112 54 126 60 134 C60 120 62 108 64 100 Z" ${f}/>
      <path d="M144 96 C148 112 146 126 140 134 C140 120 138 108 136 100 Z" ${f}/>`;
  }
  return side + bangs + strands;
}

function eyes(L, id, line) {
  const one = (cx, flip) => {
    const s = flip ? -1 : 1;
    const outer = cx + 13 * s;
    const inner = cx - 11 * s;
    const narrowed = L.expression === 'serious' || L.expression === 'smirk';
    const topY = narrowed ? 113 : 110;
    const gentle = L.expression === 'gentle';
    if (gentle) {
      // 눈웃음
      return `<path d="M${inner} 122 Q${cx} 110 ${outer} 121" fill="none" stroke="${line}" stroke-width="3" stroke-linecap="round"/>`;
    }
    return `
      <path d="M${inner} 121 Q${inner} ${topY - 2} ${cx} ${topY - 2} Q${outer} ${topY - 2} ${outer} 119 Q${outer - 2 * s} 133 ${cx} 134 Q${inner} 133 ${inner} 121 Z" fill="#fdfcfa"/>
      <ellipse cx="${cx + 1 * s}" cy="123" rx="8.6" ry="11" fill="url(#${id}iris)"/>
      <ellipse cx="${cx + 1 * s}" cy="124" rx="4.2" ry="5.8" fill="${shade(L.eyes, -0.7)}"/>
      <circle cx="${cx - 2.5 * s}" cy="117.5" r="3" fill="#fff"/>
      <circle cx="${cx + 4 * s}" cy="129" r="1.4" fill="#fff" opacity="0.9"/>
      <path d="M${inner - 1 * s} 121 Q${inner} ${topY - 4} ${cx} ${topY - 4} Q${outer + 1 * s} ${topY - 4} ${outer + 3 * s} ${topY + 4}" fill="none" stroke="${line}" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M${outer} ${topY + 2} L${outer + 4 * s} ${topY}" stroke="${line}" stroke-width="2" stroke-linecap="round"/>
      <path d="M${inner + 2 * s} 133 Q${cx} 136 ${outer - 2 * s} 131" fill="none" stroke="${line}" stroke-width="1" opacity="0.45"/>`;
  };
  return one(80, true) + one(120, false);
}

function brows(expr, line) {
  const y = expr === 'serious' ? 101 : expr === 'gentle' ? 99 : 98;
  const tilt = expr === 'serious' ? 3 : expr === 'smirk' ? 1 : -1;
  return `<path d="M70 ${y + tilt} Q78 ${y - 3} 88 ${y + 1}" fill="none" stroke="${line}" stroke-width="2" stroke-linecap="round"/>
    <path d="M112 ${y + 1} Q122 ${y - 3} 130 ${y + (expr === 'smirk' ? -2 : tilt)}" fill="none" stroke="${line}" stroke-width="2" stroke-linecap="round"/>`;
}

function mouth(expr) {
  const c = '#b8575a';
  switch (expr) {
    case 'smile': return `<path d="M91 149 Q100 158 109 149 Q100 153 91 149 Z" fill="${c}" stroke="${c}" stroke-width="1.2" stroke-linejoin="round"/>`;
    case 'gentle': return `<path d="M93 150 Q100 155 107 150" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`;
    case 'smirk': return `<path d="M93 151 Q102 153 109 147" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`;
    case 'serious': return `<path d="M94 152 L106 151" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`;
    default: return `<path d="M95 151 Q100 153 105 151" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`;
  }
}

function body(L, id) {
  const cloth = `fill="url(#${id}cloth)"`;
  const shoulders = `<path d="M22 240 C26 204 56 188 88 182 L112 182 C144 188 174 204 178 240 Z" ${cloth}/>`;
  switch (L.outfit) {
    case 'uniform':
      return shoulders + `
        <path d="M88 182 L100 206 L112 182 L104 182 L100 192 L96 182 Z" fill="#f2efe8"/>
        <path d="M76 186 L100 214 L90 240 L70 240 Z" fill="${shade(L.outfitColor, 0.25)}" opacity="0.6"/>
        <path d="M124 186 L100 214 L110 240 L130 240 Z" fill="${shade(L.outfitColor, 0.25)}" opacity="0.6"/>
        <path d="M100 200 L95 214 L100 232 L105 214 Z" fill="${L.accent}"/>`;
    case 'robe':
      return `<path d="M30 240 C30 196 60 172 100 170 C140 172 170 196 170 240 Z" ${cloth}/>
        <path d="M60 196 C70 184 86 180 100 182 C114 180 130 184 140 196 L100 214 Z" fill="${shade(L.outfitColor, 0.3)}"/>
        <path d="M100 204 L108 218 L100 232 L92 218 Z" fill="none" stroke="${L.accent}" stroke-width="2.5"/><circle cx="100" cy="218" r="2.5" fill="${L.accent}"/>`;
    case 'jacket':
      return shoulders + `
        <path d="M84 184 L100 240 L116 184 Z" fill="#2b2b30"/>
        <path d="M84 184 L72 240 L92 240 Z M116 184 L128 240 L108 240 Z" fill="${shade(L.outfitColor, -0.15)}"/>
        <path d="M60 200 L70 196" stroke="${L.accent}" stroke-width="4" stroke-linecap="round"/>`;
    case 'coat':
    default:
      return shoulders + `
        <path d="M80 176 L88 200 L100 186 L112 200 L120 176 L112 182 L100 178 L88 182 Z" fill="${shade(L.outfitColor, 0.2)}"/>
        <path d="M100 186 L100 240" stroke="${shade(L.outfitColor, -0.4)}" stroke-width="2"/>
        <circle cx="106" cy="210" r="2.4" fill="${L.accent}"/><circle cx="106" cy="226" r="2.4" fill="${L.accent}"/>`;
  }
}

function accessory(L, line) {
  switch (L.accessory) {
    case 'glasses':
      return `<g fill="none" stroke="${shade(L.accent, -0.2)}" stroke-width="1.8">
        <rect x="64" y="111" width="30" height="22" rx="6"/><rect x="106" y="111" width="30" height="22" rx="6"/>
        <path d="M94 120 Q100 116 106 120"/></g>`;
    case 'hairpin':
      return `<g transform="rotate(-25 128 74)"><rect x="118" y="70" width="22" height="5" rx="2.5" fill="${L.accent}"/>
        <rect x="120" y="78" width="18" height="4" rx="2" fill="${shade(L.accent, 0.3)}"/></g>`;
    case 'ribbon':
      return `<g fill="${L.accent}"><path d="M132 58 L150 46 L148 70 Z"/><path d="M132 58 L120 42 L116 64 Z"/><circle cx="132" cy="58" r="5" fill="${shade(L.accent, -0.2)}"/></g>`;
    case 'earring':
      return `<circle cx="58" cy="132" r="2.6" fill="${L.accent}"/><path d="M58 134 L58 142" stroke="${L.accent}" stroke-width="1.5"/>`;
    case 'scar':
      return `<path d="M124 100 L132 116 M126 106 L131 104 M128 110 L133 108" stroke="${shade(L.skin, -0.3)}" stroke-width="1.6" stroke-linecap="round"/>`;
    default: return '';
  }
}

// 장면 배경: 이미지가 있으면 이미지, 없으면 그라디언트
export function sceneStyle(scene) {
  if (!scene) return {};
  if (scene.image) return { backgroundImage: `linear-gradient(rgba(10,12,16,.35), rgba(10,12,16,.85)), url(${scene.image})` };
  return { backgroundImage: scene.gradient };
}

// '#rrggbb' 색을 amt(-1~1)만큼 밝게/어둡게
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  r = Math.round((t - r) * p + r);
  g = Math.round((t - g) * p + g);
  b = Math.round((t - b) * p + b);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
}
