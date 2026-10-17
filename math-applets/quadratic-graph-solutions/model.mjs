export const problems = [
  // Guided examples: two integer roots, one irrational-root pair, mixed with other types.
  { kind: 'guided', a: 1, h: 0, k: -4 },
  { kind: 'guided', a: -4, h: 0.5, k: 0 },
  { kind: 'guided', a: -4, h: 0.5, k: -2 },
  { kind: 'guided', a: 1, h: 1, k: -2 },
  { kind: 'guided', a: 2, h: -2, k: 0 },
  { kind: 'guided', a: 1, h: -1, k: 2 },
  { kind: 'guided', a: -1, h: 1, k: 4 },

  // Independent examples: a mixed set with only a solution-type choice.
  { kind: 'independent', a: 2, h: -1, k: -2 },
  { kind: 'independent', a: -4, h: 1.5, k: -1 },
  { kind: 'independent', a: 4, h: 0.5, k: 0 },
  { kind: 'independent', a: -1, h: 2, k: 3 },
  { kind: 'independent', a: -1, h: -2, k: 0 },
  { kind: 'independent', a: 2, h: 2, k: 1 },
];

export function standardCoefficients({ a, h, k }) {
  return { a, b: -2 * a * h, c: a * h ** 2 + k };
}

function signedTerm(value, variable = '') {
  if (value === 0) return '';
  const magnitude = Math.abs(value);
  const coefficient = variable && magnitude === 1 ? '' : String(magnitude);
  return `${value < 0 ? ' − ' : ' + '}${coefficient}${variable}`;
}

export function functionText(problem) {
  const { a, b, c } = standardCoefficients(problem);
  const leading = a === 1 ? 'x²' : a === -1 ? '−x²' : `${a}x²`;
  return `f(x) = ${leading}${signedTerm(b, 'x')}${signedTerm(c)}`;
}

export function answerCounts(problem) {
  const { a, b, c } = standardCoefficients(problem);
  const d = b ** 2 - 4 * a * c;
  if (d > 0) return { intercepts: 2, real: 2, complex: 0, result: '2 real' };
  if (d === 0) return { intercepts: 1, real: 1, complex: 0, result: '1 real' };
  return { intercepts: 0, real: 0, complex: 2, result: '2 complex' };
}
