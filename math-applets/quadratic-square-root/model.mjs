export const problems = [
  // Five examples with two integer solutions.
  { a: 1, h: 3, k: 4, right: 13 },
  { a: -2, h: -3, k: 2, right: -6 },
  { a: 3, h: 4, k: -2, right: 25 },
  { a: -4, h: 2, k: 8, right: -28 },
  { a: 5, h: -4, k: -45, right: 0 },

  // Three answers with an unsimplified real radical.
  { a: 1, h: 4, k: -3, right: 4 },
  { a: 2, h: -4, k: 5, right: 25 },
  { a: -3, h: 3, k: 1, right: -44 },

  // Simplified real radicals, with a repeated-root example mixed into the set.
  { a: 1 / 2, h: 3, k: -5, right: 1 },
  { a: 2, h: 4, k: 3, right: 3 },
  { a: -2, h: -3, k: 4, right: -36 },
  { a: 3, h: 5, k: -2, right: 82 },

  // Unsimplified imaginary radicals, with another repeated-root example mixed in.
  { a: 1, h: 2, k: 6, right: 0 },
  { a: -1 / 3, h: -2, k: -5, right: -5 },
  { a: 2, h: -3, k: 7, right: -13 },
  { a: -3, h: 4, k: 2, right: 47 },

  // Two simplified complex answers and one simplified real radical answer.
  { a: 1 / 2, h: 3, k: 4, right: -2 },
  { a: -3 / 2, h: -4, k: 2, right: 32 },
  { a: 3, h: -5, k: -1, right: 95 },

  // The final one-real-solution example remains at the end.
  { a: 4, h: 1 / 2, k: 7, right: 7 },
];

export function formatNumber(value) {
  if (!Number.isFinite(value)) return '';
  const rounded = Number(value.toFixed(8));
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

function gcd(first, second) {
  let a = Math.abs(first);
  let b = Math.abs(second);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function formatValue(value) {
  for (let denominator = 1; denominator <= 1000; denominator += 1) {
    const numerator = Math.round(value * denominator);
    if (Math.abs(value - numerator / denominator) < 1e-10) {
      const divisor = gcd(numerator, denominator);
      const reducedNumerator = numerator / divisor;
      const reducedDenominator = denominator / divisor;
      return reducedDenominator === 1
        ? String(reducedNumerator)
        : `${reducedNumerator}/${reducedDenominator}`;
    }
  }
  return formatNumber(value);
}

export function binomialText(h) {
  if (h > 0) return `x − ${formatValue(h)}`;
  if (h < 0) return `x + ${formatValue(Math.abs(h))}`;
  return 'x';
}

export function squareTermText({ a, h }) {
  const coefficient = a === 1 ? '' : a === -1 ? '−' : formatValue(a);
  return `${coefficient}(${binomialText(h)})²`;
}

export function equationLeftText(problem) {
  const kTerm = problem.k < 0
    ? ` − ${formatValue(Math.abs(problem.k))}`
    : ` + ${formatValue(problem.k)}`;
  return `${squareTermText(problem)}${kTerm}`;
}

export function equationText(problem) {
  return `${equationLeftText(problem)} = ${formatValue(problem.right)}`;
}

export function solveData({ a, h, k, right }) {
  const movedRight = right - k;
  const dividedRight = movedRight / a;
  const squareRoot = Math.sqrt(dividedRight);
  return {
    movedRight,
    dividedRight,
    squareRoot,
    solutions: [h + squareRoot, h - squareRoot],
  };
}
