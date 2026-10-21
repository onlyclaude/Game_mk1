// 임시 그래픽. 실제 이미지가 생기면 assets/ 경로를 넘겨 <img>로 교체된다.
// 사용처는 portrait()/emblem()만 호출하므로 이미지 교체 시 이 파일만 고치면 된다.
import { h } from './ui.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg(markup, cls, label) {
  const wrap = document.createElement('div');
  wrap.innerHTML = `<svg xmlns="${SVG_NS}" viewBox="0 0 100 100" role="img" aria-label="${escapeXml(label)}">${markup}</svg>`;
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

// def: { name, image?, hue? }
export function portrait(def, cls = 'portrait') {
  if (def.image) return h('img', { class: cls, src: def.image, alt: def.name });
  const hue = def.hue ?? 210;
  const initial = (def.name || '?').slice(0, 1);
  return svg(`
    <rect width="100" height="100" rx="12" fill="hsl(${hue} 18% 18%)"/>
    <circle cx="50" cy="40" r="18" fill="hsl(${hue} 30% 45%)"/>
    <path d="M18 96 C22 66 78 66 82 96 Z" fill="hsl(${hue} 30% 35%)"/>
    <text x="50" y="47" text-anchor="middle" font-size="18" font-weight="700" fill="#f0ede6">${escapeXml(initial)}</text>`,
  cls, def.name || '초상화');
}

function escapeXml(s) {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
}
