// Functions of the form y = a·g(x − h) + k where g is |x| (absolute) or x² (quadratic).
// Every example has an integer vertex, integer intercepts, and all key points inside ±10.
export const families = {
  absolute: [
    { a: 1, h: 2, k: -3 },
    { a: -2, h: -1, k: 4 },
    { a: 1, h: -3, k: 0 },
    { a: 1, h: 1, k: 2 },
    { a: -1, h: 4, k: 3 },
  ],
  quadratic: [
    { a: 1, h: 1, k: -4 },
    { a: -1, h: -2, k: 9 },
    { a: 1, h: 3, k: 0 },
    { a: 1, h: -1, k: 2 },
    { a: 2, h: -1, k: -8 },
  ],
};

export const evaluate = (family, fn, x) =>
  family === 'absolute' ? fn.a * Math.abs(x - fn.h) + fn.k : fn.a * (x - fn.h) ** 2 + fn.k;

export function xIntercepts(family, fn) {
  const target = -fn.k / fn.a;
  if (target < 0) return [];
  if (target === 0) return [fn.h];
  const offset = family === 'absolute' ? target : Math.sqrt(target);
  return [fn.h - offset, fn.h + offset];
}

export const yIntercept = (family, fn) => evaluate(family, fn, 0);
export const rangeSymbol = fn => fn.a > 0 ? '\u2265' : '\u2264';
export const extremumType = fn => fn.a > 0 ? 'minimum' : 'maximum';

export function parseInteger(text) {
  const cleaned = String(text ?? '').trim().replace(/\u2212/g, '-');
  return /^[+-]?\d+$/.test(cleaned) ? Number(cleaned) : null;
}
