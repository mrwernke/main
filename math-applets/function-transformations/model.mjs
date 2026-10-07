// Transformed functions y = a·g(x − h) + k of a parent function:
// generic f(x), absolute value |x|, or quadratic x².
const MINUS = '\u2212';

export const families = {
  generic: [
    { a: 2, h: 3, k: 1 },
    { a: -1, h: -4, k: -2 },
    { a: -3, h: 2, k: -5 },
    { a: 1, h: -1, k: 6 },
    { a: 4, h: 0, k: 3 },
    { a: 1, h: 5, k: 0 },
    { a: -2, h: 0, k: 0 },
    { a: 5, h: -6, k: -4 },
  ],
  absolute: [
    { a: 3, h: -2, k: -4 },
    { a: -1, h: 5, k: 3 },
    { a: -2, h: -1, k: -6 },
    { a: 1, h: 7, k: 2 },
    { a: 2, h: 0, k: -5 },
    { a: -4, h: 3, k: 0 },
    { a: -3, h: 0, k: 0 },
    { a: 1, h: -8, k: 1 },
  ],
  quadratic: [
    { a: 4, h: 1, k: 5 },
    { a: -1, h: -3, k: -2 },
    { a: -5, h: 6, k: 7 },
    { a: 1, h: -8, k: -3 },
    { a: 3, h: 0, k: 4 },
    { a: -2, h: 2, k: 0 },
    { a: 2, h: 0, k: 0 },
    { a: -1, h: 4, k: 6 },
  ],
};

export const parentName = family =>
  family === 'absolute' ? '|x|' : family === 'quadratic' ? 'x\u00b2' : 'f(x)';

const coefficientText = a => a === 1 ? '' : a === -1 ? MINUS : a < 0 ? `${MINUS}${Math.abs(a)}` : String(a);
const innerText = h => h === 0 ? 'x' : `x ${h > 0 ? MINUS : '+'} ${Math.abs(h)}`;
const tailText = k => k === 0 ? '' : ` ${k > 0 ? '+' : MINUS} ${Math.abs(k)}`;

export function equationText(family, fn) {
  const a = coefficientText(fn.a), inner = innerText(fn.h), tail = tailText(fn.k);
  if (family === 'absolute') return `f(x) = ${a}|${inner}|${tail}`;
  if (family === 'quadratic') {
    const body = fn.h === 0 ? 'x\u00b2' : `(${inner})\u00b2`;
    return `f(x) = ${a}${body}${tail}`;
  }
  return `g(x) = ${a}f(${inner})${tail}`;
}

export const transformations = fn => ({
  reflectH: false,
  reflectV: fn.a < 0,
  dilateH: false,
  dilateV: Math.abs(fn.a) !== 1,
  shiftH: fn.h !== 0,
  shiftV: fn.k !== 0,
});

export const dilationFactor = fn => Math.abs(fn.a);
export const horizontalShift = fn => ({ direction: fn.h > 0 ? 'right' : 'left', amount: Math.abs(fn.h) });
export const verticalShift = fn => ({ direction: fn.k > 0 ? 'up' : 'down', amount: Math.abs(fn.k) });

export function parseInteger(text) {
  const cleaned = String(text ?? '').trim().replace(/\u2212/g, '-');
  return /^[+-]?\d+$/.test(cleaned) ? Number(cleaned) : null;
}
