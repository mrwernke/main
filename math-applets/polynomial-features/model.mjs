const examples = [
  { roots: [-5, -2, 2, 4], end: 1, boundary: 5 },
  { roots: [-5, -2, 1, 4], multiplicities: { '-2': 2 }, end: -1, boundary: 5 },
  { roots: [-5, -4, -2, 2, 4, 5], end: -1, boundary: 6 },
  { roots: [-6, -4, -2, 0, 6], complexPair: { real: 4, imaginary: 1 }, end: 1, boundary: 6 },
  { roots: [-5, -2, 1, 5], end: -1, boundary: 4 },
  { roots: [-5, -2, 1, 4], multiplicities: { '-2': 2 }, end: 1, boundary: 6 },
  { roots: [-6, -4, 1, 5], multiplicities: { 1: 3 }, end: 1, boundary: 5 },
  { roots: [-5, -3, 1, 5], multiplicities: { '-3': 2, 5: 3 }, end: -1, boundary: 7 },
];

function turningPoint(logDerivative, low, high, positiveAtLeft) {
  for (let step = 0; step < 48; step++) {
    const x = (low + high) / 2;
    const slope = logDerivative(x);
    if (slope === 0) return x;
    if ((slope > 0) === positiveAtLeft) low = x;
    else high = x;
  }
  return (low + high) / 2;
}

export function createPolynomialProblem({ roots, multiplicities = {}, complexPair, end, boundary, leadingMagnitude }) {
  const factors = roots.flatMap(root => Array(multiplicities[root] ?? 1).fill(root));
  const degree = factors.length + (complexPair ? 2 : 0);
  const quadraticFactor = x => complexPair
    ? (x - complexPair.real) ** 2 + complexPair.imaginary ** 2
    : 1;
  const base = x => factors.reduce((value, root) => value * (x - root), end) * quadraticFactor(x);
  const logDerivative = x => {
    const realTerms = factors.reduce((sum, root) => sum + 1 / (x - root), 0);
    return complexPair ? realTerms + 2 * (x - complexPair.real) / quadraticFactor(x) : realTerms;
  };
  // The quadratic factor adds two changes of slope in one interval. Split at the
  // extrema of its contribution to f′/f to bracket all three turns there.
  const splitPoints = complexPair
    ? [complexPair.real - complexPair.imaginary, complexPair.real + complexPair.imaginary]
    : [];
  const turns = roots.slice(1).flatMap((right, index) => {
    const left = roots[index];
    const bounds = [left, ...splitPoints.filter(x => x > left && x < right), right];
    return bounds.slice(1).flatMap((high, i) => {
      const low = bounds[i];
      // At real zeros f′/f approaches +∞ from the right and −∞ from the left.
      const positiveAtLeft = low === left || logDerivative(low) > 0;
      const positiveAtRight = high !== right && logDerivative(high) > 0;
      if (positiveAtLeft === positiveAtRight) return [];
      const x = turningPoint(logDerivative, low, high, positiveAtLeft);
      const y = base(x);
      return [{ x, y, kind: positiveAtLeft === (y > 0) ? 'Max' : 'Min' }];
    });
  });
  roots.forEach((x, index) => {
    if (multiplicities[x] !== 2) return;
    const right = roots[index + 1] ?? x + 2;
    const kind = base((x + right) / 2) > 0 ? 'Min' : 'Max';
    turns.push({ x, y: 0, kind });
  });
  const heights = turns.map(({ y }) => y);
  const odd = degree % 2 === 1;
  const extreme = end > 0 ? Math.min(...heights) : Math.max(...heights);
  const scale = leadingMagnitude ?? boundary / (odd ? Math.max(...heights.map(Math.abs)) : Math.abs(extreme));
  const range = odd ? null : {
    symbol: end > 0 ? '≥' : '≤',
    boundary: leadingMagnitude === undefined ? -end * boundary : extreme * scale,
  };
  const extrema = { global: [], local: [] };
  for (const { x, y, kind } of turns) {
    const height = y * scale;
    const scope = range && Math.abs(height - range.boundary) < 1e-9 ? 'global' : 'local';
    extrema[scope].push({ x, y: height, kind });
  }

  return {
    roots,
    multiplicities,
    degree,
    evaluate: x => base(x) * scale,
    extrema,
    range,
    leftEnd: odd ? -end : end,
    rightEnd: end,
  };
}

export const problems = examples.map(createPolynomialProblem);
