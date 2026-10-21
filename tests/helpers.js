// 테스트용 가짜 localStorage
export function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  };
}

// 정해진 값을 차례로 돌려주는 가짜 난수. 주사위 d는 (d - 0.5) / 6 으로 넣는다.
export function seqRng(values) {
  let i = 0;
  return () => values[i++ % values.length];
}
export const die = (d) => (d - 0.5) / 6;

// 재현 가능한 의사 난수
export function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}
