export const problems = [
  { kind: 'standard', a: 1, b: 1, c: -6 },
  { kind: 'standard', a: 2, b: 3, c: -2 },
  { kind: 'standard', a: 3, b: -2, c: -1 },
  { kind: 'standard', a: 1, b: 4, c: 1 },
  { kind: 'standard', a: 1, b: -2, c: 5 },
  { kind: 'standard', a: 2, b: 4, c: 5 },
  { kind: 'standard', a: 4, b: 4, c: 1 },
  { kind: 'standard', a: 1, b: 1, c: -1 },
  { kind: 'move', left: [2, 5, 6], right: [0, 3, 10], a: 2, b: 2, c: -4 },
  { kind: 'move', left: [3, 4, 1], right: [1, -2, 3], a: 2, b: 6, c: -2 },
  { kind: 'move', left: [2, 6, 3], right: [1, 2, 0], a: 1, b: 4, c: 3 },
  { kind: 'move', left: [3, 6, 10], right: [2, 2, 2], a: 1, b: 4, c: 8 },
];

export function discriminant(problem) {
  return problem.b * problem.b - 4 * problem.a * problem.c;
}

function rational(value) {
  if (!Number.isFinite(value)) return String(value);
  if (Math.abs(value) < 1e-10) return '0';
  for (let denominator = 1; denominator <= 10000; denominator += 1) {
    const numerator = Math.round(value * denominator);
    if (Math.abs(numerator / denominator - value) < 1e-9) {
      const divisor = gcd(Math.abs(numerator), denominator);
      const top = numerator / divisor;
      const bottom = denominator / divisor;
      return bottom === 1 ? String(top) : `${top}/${bottom}`;
    }
  }
  return String(Number(value.toPrecision(8)));
}

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

function term(coefficient, variable) {
  if (coefficient === 0) return '';
  const sign = coefficient < 0 ? '−' : '+';
  const magnitude = Math.abs(coefficient);
  const coefficientText = variable && magnitude === 1 ? '' : rational(magnitude);
  return { sign, body: `${coefficientText}${variable}` };
}

export function polynomialText(coefficients) {
  const variables = ['x²', 'x', ''];
  const terms = coefficients.map((coefficient, index) => term(coefficient, variables[index])).filter(Boolean);
  if (!terms.length) return '0';
  return terms.map((entry, index) => {
    if (index === 0) return `${entry.sign === '−' ? '−' : ''}${entry.body}`;
    return ` ${entry.sign} ${entry.body}`;
  }).join('');
}

export function equationText(problem) {
  if (problem.kind === 'move') return `${polynomialText(problem.left)} = ${polynomialText(problem.right)}`;
  return `${polynomialText([problem.a, problem.b, problem.c])} = 0`;
}

export function formatRational(value) {
  return rational(value);
}

export function simplifiedRadical(problem) {
  const value = discriminant(problem);
  const absolute = Math.abs(value);
  if (absolute === 0) return { coefficient: 0, radicand: 1, imaginary: false, hasRadical: false, kind: 'integer' };
  let coefficient = 1;
  let radicand = absolute;
  for (let factor = Math.floor(Math.sqrt(absolute)); factor >= 2; factor -= 1) {
    const square = factor * factor;
    if (absolute % square === 0) {
      coefficient = factor;
      radicand = absolute / square;
      break;
    }
  }
  const hasRadical = radicand !== 1;
  const imaginary = value < 0;
  const kind = hasRadical
    ? `${coefficient === 1 ? 'radical' : 'coefficient-radical'}${imaginary ? '-i' : ''}`
    : imaginary ? 'integer-i' : 'integer';
  return { coefficient: hasRadical ? coefficient : Math.sqrt(absolute), radicand, imaginary, hasRadical, kind };
}

export function solutionData(problem) {
  const d = discriminant(problem);
  const root = simplifiedRadical(problem);
  const denominator = 2 * problem.a;
  return {
    discriminant: d,
    negativeB: -problem.b,
    denominator,
    radical: root,
    base: -problem.b / denominator,
    offset: root.coefficient / denominator,
    realSolutions: d > 0 && !root.hasRadical
      ? [-problem.b / denominator + root.coefficient / denominator, -problem.b / denominator - root.coefficient / denominator]
      : d === 0 ? [-problem.b / denominator] : null,
  };
}
