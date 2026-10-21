// 공통 UI 도구: DOM 생성, 화면 전환, 중복 터치 방지, 토스트, 모달, 설정 적용.

// h('div', { class: 'panel', onClick: fn }, '텍스트', childEl)
// 문자열 자식은 textContent로 들어가므로 플레이어 이름 등을 안전하게 표시할 수 있다.
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') {
      const type = k.slice(2).toLowerCase();
      el.addEventListener(type, type === 'click' ? guard(v) : v);
    } else if (k === 'html') el.innerHTML = v; // 게임 데이터(신뢰된 문자열)에만 사용
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

// ===== 중복 터치 방지 =====
// 하나의 행동이 처리되는 동안(비동기 포함)과 직후 짧은 시간 동안 다른 클릭을 무시한다.
let busy = false;
const COOLDOWN_MS = 250;

export function guard(fn) {
  return async function guarded(ev) {
    if (busy) {
      ev?.preventDefault?.();
      ev?.stopPropagation?.();
      return;
    }
    busy = true;
    document.body.classList.add('is-busy');
    try {
      await fn.call(this, ev);
    } catch (err) {
      console.error(err);
      toast('오류가 발생했습니다: ' + (err?.message || err), 'error');
    } finally {
      setTimeout(() => {
        busy = false;
        document.body.classList.remove('is-busy');
      }, COOLDOWN_MS);
    }
  };
}

// 모달 안의 버튼처럼 바깥 행동이 진행 중인 상태에서도 눌려야 하는 경우를 위해
// guard 잠금을 잠시 풀어 준다.
function releaseGuard() {
  busy = false;
  document.body.classList.remove('is-busy');
}

// ===== 화면 전환 =====
const screens = new Map();
let currentScreen = null;
let currentName = null;

// mod: { render(params) => HTMLElement, onLeave?() }
export function registerScreen(name, mod) {
  screens.set(name, mod);
}

export function showScreen(name, params = {}) {
  const mod = screens.get(name);
  if (!mod) throw new Error(`알 수 없는 화면: ${name}`);
  currentScreen?.onLeave?.();
  const root = document.getElementById('screen-root');
  const el = mod.render(params);
  el.dataset.screen = name;
  root.replaceChildren(el);
  currentScreen = mod;
  currentName = name;
}

export function getCurrentScreenName() {
  return currentName;
}

// ===== 토스트 =====
export function toast(message, type = 'info', ms = 2400) {
  const layer = document.getElementById('toast-layer');
  if (!layer) return;
  const el = h('div', { class: `toast toast--${type}`, role: 'status' }, message);
  layer.append(el);
  setTimeout(() => el.remove(), ms);
}

// ===== 모달 =====
// actions: [{ label, value, kind: 'primary'|'danger'|undefined }]
// 결과: 누른 버튼의 value (바깥을 누르면 null)
export function openModal({ title, body, actions = [{ label: '확인', value: true, kind: 'primary' }], dismissible = true }) {
  const layer = document.getElementById('modal-layer');
  releaseGuard();
  return new Promise((resolve) => {
    const close = (value) => {
      layer.hidden = true;
      layer.replaceChildren();
      layer.onclick = null;
      resolve(value);
    };
    // body는 문자열, 요소, 또는 close를 받아 요소를 만드는 함수
    const bodyEl = typeof body === 'string' ? h('p', {}, body)
      : typeof body === 'function' ? body(close) : body;
    const modal = h('div', { class: 'panel modal', role: 'dialog', 'aria-modal': 'true' },
      title ? h('h2', { class: 'panel-title' }, title) : null,
      bodyEl,
      h('div', { class: 'btn-row' },
        actions.map((a) => h('button', {
          class: `btn ${a.kind ? 'btn--' + a.kind : ''}`,
          'data-value': String(a.value),
          onClick: () => close(a.value),
        }, a.label)),
      ),
    );
    layer.replaceChildren(modal);
    layer.hidden = false;
    layer.onclick = (ev) => { if (dismissible && ev.target === layer) close(null); };
  });
}

export async function confirmDialog(message, { title = '확인', okLabel = '확인', danger = false } = {}) {
  const v = await openModal({
    title,
    body: message,
    actions: [
      { label: '취소', value: false },
      { label: okLabel, value: true, kind: danger ? 'danger' : 'primary' },
    ],
  });
  return v === true;
}

// ===== 설정 적용 =====
export function applySettings(settings) {
  const root = document.documentElement;
  root.style.setProperty('--font-scale', String(settings.fontScale));
  root.style.setProperty('--anim-speed', String(settings.animSpeed));
}
