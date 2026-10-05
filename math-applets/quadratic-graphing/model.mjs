export const practice = [
  { a: 1, h: 2, k: -4 },
  { a: 2, h: -1, k: -8 },
  { a: 1, h: 0, k: -4 },
  { a: -1, h: -2, k: 4 },
  { a: -2, h: 3, k: 8 },
];

export const standardPractice = [
  { a: 1, h: 2, k: -3 },
  ...practice.slice(1, 4),
  { a: -2, h: 3, k: 5 },
  { a: 3, h: 1, k: -5 },
  { a: 1, h: -2, k: -5 },
  { a: -1, h: 1, k: 3 },
];

export const factoredPractice = [
  { a: 1, h: 3, k: -4, r1: 1, r2: 5 },
  { a: 2, h: 1, k: -8, r1: 3, r2: -1 },
  { a: -1, h: 3, k: 1, r1: 2, r2: 4 },
  { a: 1, h: -3, k: -9, r1: 0, r2: -6 },
  { a: -3, h: -2, k: 3, r1: -1, r2: -3 },
  { a: 3, h: 0, k: -12, r1: -2, r2: 2 },
  { a: -2, h: 2, k: 8, r1: 0, r2: 4 },
  { a: 2, h: -2, k: -8, r1: -4, r2: 0 },
];

export const vertexPractice = [
  practice[0], practice[1], practice[4], practice[3], practice[2],
  { a: 1, h: -1, k: -3 },
  { a: -1, h: 2, k: 5 },
  { a: 2, h: 1, k: -6 },
];

export function practiceForForm(form) {
  if (form === 'standard') return standardPractice;
  if (form === 'factored') return factoredPractice;
  return vertexPractice;
}

export function evaluate(item, x) {
  return item.a * (x - item.h) ** 2 + item.k;
}

export function coefficients(item) {
  return { a: item.a, b: -2 * item.a * item.h, c: evaluate(item, 0) };
}

export function roots(item) {
  if (item.r1 !== undefined && item.r2 !== undefined) return [item.r1, item.r2];
  const distance = Math.sqrt(-item.k / item.a);
  return [item.h - distance, item.h + distance];
}

export function parseNumber(value) {
  const text = String(value).trim().replaceAll('−', '-');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return NaN;
  return Number(text);
}

const coefficient = a => a === 1 ? '' : a === -1 ? '−' : String(a).replace('-', '−');
const shift = h => h === 0 ? 'x' : h > 0 ? `x − ${h}` : `x + ${-h}`;
const constant = k => k === 0 ? '' : k > 0 ? ` + ${k}` : ` − ${-k}`;

export function equationText(item, form) {
  if (form === 'vertex') {
    const inside = item.h === 0 ? 'x²' : `(${shift(item.h)})²`;
    return `f(x) = ${coefficient(item.a)}${inside}${constant(item.k)}`;
  }
  if (form === 'factored') {
    const [r1, r2] = roots(item);
    const factor = r => r === 0 ? 'x' : `(${shift(r)})`;
    return `f(x) = ${coefficient(item.a)}${factor(r1)}${factor(r2)}`;
  }
  const { a, b, c } = coefficients(item);
  const middle = b === 0 ? '' : ` ${b > 0 ? '+' : '−'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`;
  return `f(x) = ${coefficient(a)}x²${middle}${constant(c)}`;
}

export function tablePoints(item, xs = [-2, -1, 0, 1, 2].map(d => item.h + d)) {
  return xs.map(x => ({ x, y: evaluate(item, x) }));
}

export function factoredPoints(item) {
  const [r1, r2] = roots(item);
  const points = [
    { x: item.h, y: item.k },
    { x: r1, y: 0 },
    { x: r2, y: 0 },
  ];
  if (Math.abs(r1 - item.h) === 1 && Math.abs(r2 - item.h) === 1) return points;
  return [
    ...points,
    { x: item.h - 1, y: item.k + item.a },
    { x: item.h + 1, y: item.k + item.a },
  ];
}

export function graphBounds(item, points) {
  const xs = [0, item.h - 3, item.h + 3, ...points.map(point => point.x)];
  const ys = [0, item.k, ...points.map(point => point.y)];
  const xLow = Math.min(...xs) - 2, xHigh = Math.max(...xs) + 2;
  const yLow = Math.min(...ys) - 3, yHigh = Math.max(...ys) + 3;
  const span = Math.max(16, xHigh - xLow, yHigh - yLow);
  const xMin = Math.floor((xLow + xHigh - span) / 2);
  const yMin = Math.floor((yLow + yHigh - span) / 2);
  return { xMin, xMax: xMin + span, yMin, yMax: yMin + span };
}

export function parabolaGeometry(item, bounds) {
  const boundary = item.a > 0 ? bounds.yMax : bounds.yMin;
  const distance = Math.sqrt((boundary - item.k) / item.a);
  const left = Math.max(bounds.xMin, item.h - distance);
  const right = Math.min(bounds.xMax, item.h + distance);
  const middle = (left + right) / 2;
  // A quadratic Bezier represents the parabola exactly, including its end tangents.
  return {
    start: { x: left, y: evaluate(item, left) },
    control: {
      x: middle,
      y: evaluate(item, left) + item.a * (left - item.h) * (right - left),
    },
    end: { x: right, y: evaluate(item, right) },
  };
}
