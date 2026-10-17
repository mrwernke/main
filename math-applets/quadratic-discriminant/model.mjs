export const problems = [
  // Guided practice: two positive, two zero, and two negative discriminants, mixed together.
  { kind: 'guided', a: 1, b: 2, c: -1 },
  { kind: 'guided', a: 1, b: -6, c: 9 },
  { kind: 'guided', a: 3, b: 4, c: 8 },
  { kind: 'guided', a: 1, b: -5, c: 6 },
  { kind: 'guided', a: 2, b: 2, c: 3 },
  { kind: 'guided', a: 2, b: 4, c: 2 },

  // Independent practice: two of each answer type, mixed together.
  { kind: 'independent', a: 1, b: 4, c: 1 },
  { kind: 'independent', a: 2, b: -4, c: 5 },
  { kind: 'independent', a: 1, b: 8, c: 16 },
  { kind: 'independent', a: 4, b: -2, c: 4 },
  { kind: 'independent', a: 1, b: 5, c: 6 },
  { kind: 'independent', a: 1, b: -2, c: -2 },
];

function signedTerm(value, variable = '') {
  if (!value) return '';
  const magnitude = Math.abs(value);
  const coefficient = variable && magnitude === 1 ? '' : String(magnitude);
  return `${value < 0 ? ' − ' : ' + '}${coefficient}${variable}`;
}

export function functionText({ a, b, c }) {
  const leading = a === 1 ? 'x²' : a === -1 ? '−x²' : `${a}x²`;
  return `f(x) = ${leading}${signedTerm(b, 'x')}${signedTerm(c)}`;
}

export function discriminant({ a, b, c }) {
  return b ** 2 - 4 * a * c;
}

export function isPerfectSquare(value) {
  if (!Number.isInteger(value) || value < 0) return false;
  return Number.isInteger(Math.sqrt(value));
}

export function solutionInfo(problem) {
  const value = discriminant(problem);
  if (value > 0) {
    return {
      value,
      count: 2,
      type: isPerfectSquare(value) ? 'real rational' : 'real irrational',
      intercepts: 2,
    };
  }
  if (value === 0) return { value, count: 1, type: 'real rational', intercepts: 1 };
  return { value, count: 2, type: 'complex', intercepts: 0 };
}
