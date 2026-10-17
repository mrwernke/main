export const problems = [
  { a: 1, b: 4, c: 3, category: 'integer-a1' },
  { a: 1, b: -6, c: 8, category: 'integer-a1' },
  { a: 1, b: 7, c: 12, category: 'integer-a1' },
  { a: 1, b: -8, c: 15, category: 'integer-a1' },
  { a: 2, b: 4, c: -6, category: 'integer-a-more' },
  { a: 3, b: -9, c: 6, category: 'integer-a-more' },
  { a: 2, b: -10, c: 12, category: 'integer-a-more' },
  { a: 4, b: -28, c: 40, category: 'integer-a-more' },
  { a: 4, b: -8, c: 3, category: 'fractional-a-more' },
  { a: 4, b: 4, c: -3, category: 'fractional-a-more' },
  { a: 9, b: 18, c: 8, category: 'fractional-a-more' },
  { a: 16, b: 16, c: 3, category: 'fractional-a-more' },
  { a: 1, b: 6, c: 2, category: 'irrational-a1' },
  { a: 1, b: -4, c: -6, category: 'irrational-a1' },
  { a: 1, b: 2, c: -11, category: 'irrational-a1' },
  { a: 1, b: 8, c: -2, category: 'irrational-a1' },
  { a: 2, b: 4, c: -4, category: 'irrational-a-more' },
  { a: 2, b: -8, c: -4, category: 'irrational-a-more' },
  { a: 3, b: 6, c: -33, category: 'irrational-a-more' },
  { a: 2, b: -4, c: -34, category: 'irrational-a-more' },
  { a: 1, b: 6, c: 18, category: 'complex' },
  { a: 1, b: -4, c: 29, category: 'complex' },
  { a: 1, b: 2, c: 7, category: 'complex' },
  { a: 2, b: 4, c: 28, category: 'complex' },
  { a: 2, b: -8, c: 32, category: 'complex' },
  { a: 3, b: 6, c: 99, category: 'complex' },
  { a: 1, b: 6, c: 9, category: 'integer-a1' },
];

export function formatNumber(value) {
  if (!Number.isFinite(value)) return '';
  const rounded = Number(value.toFixed(8));
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

function signedTerm(value, variable = '') {
  const magnitude = Math.abs(value);
  const coefficient = variable && magnitude === 1 ? '' : formatNumber(magnitude);
  return `${value < 0 ? ' − ' : ' + '}${coefficient}${variable}`;
}

export function expressionText({ a, b, c }, includeConstant = true) {
  const leading = `${a === 1 ? '' : formatNumber(a)}x²`;
  const middle = b ? signedTerm(b, 'x') : '';
  const constant = includeConstant && c ? signedTerm(c) : '';
  return `${leading}${middle}${constant}`;
}

export function equationText(problem) {
  return `${expressionText(problem)} = 0`;
}

export function squareData({ a, b, c }) {
  const insideB = b / a;
  const half = b / (2 * a);
  const corner = half ** 2;
  const completedRight = -c + a * corner;
  const dividedRight = completedRight / a;
  const squareRoot = Math.sqrt(dividedRight);
  return {
    insideB,
    half,
    corner,
    movedRight: -c,
    completedRight,
    dividedRight,
    squareRoot,
    solutions: [-half + squareRoot, -half - squareRoot],
  };
}
