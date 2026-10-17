export const problems = [
  { a: 2, b: 8, c: 0 },
  { a: 1, b: 6, c: 2 },
  { a: 2, b: 0, c: -50 },
  { a: 2, b: 7, c: 3 },
  { a: 2, b: 3, c: 4 },
  { a: 4, b: 12, c: 9 },
  { a: 3, b: 0, c: 12 },
  { a: 3, b: -5, c: -2 },
  { a: 5, b: -15, c: 0 },
  { a: 1, b: -4, c: -1 },
  { a: 1, b: 5, c: 4 },
  { a: 3, b: 5, c: 1 },
];

export const methods = [
  { id: 'square-root', label: 'Square Root' },
  { id: 'factor', label: 'Factor' },
  { id: 'quadratic-formula', label: 'Quadratic Formula' },
  { id: 'complete-square', label: 'Complete the Square' },
  { id: 'graph', label: 'Graph' },
];

export function discriminant({ a, b, c }) {
  return b ** 2 - 4 * a * c;
}

export function isPerfectSquare(value) {
  return Number.isInteger(value) && value >= 0 && Number.isInteger(Math.sqrt(value));
}

export function acceptableMethods(problem) {
  const { a, b, c } = problem;
  const d = discriminant(problem);

  // Use the most direct method first when more than one rule could apply.
  if (b === 0) return ['square-root'];
  if (c === 0) return ['factor'];
  if (d > 0 && isPerfectSquare(d)) return a > 0 ? ['factor', 'quadratic-formula'] : ['factor'];
  if (isPerfectSquare(a) && isPerfectSquare(c)) return ['factor'];
  if (a === 1 && b % 2 === 0) return ['complete-square'];
  return ['quadratic-formula'];
}

export function functionText({ a, b, c }) {
  const leading = a === 1 ? 'x²' : `${a}x²`;
  const middle = b === 0 ? '' : `${b > 0 ? ' + ' : ' − '}${Math.abs(b) === 1 ? '' : Math.abs(b)}x`;
  const constant = c === 0 ? '' : `${c > 0 ? ' + ' : ' − '}${Math.abs(c)}`;
  return `f(x) = ${leading}${middle}${constant}`;
}

export function explanation(problem, method = null) {
  const { a, b, c } = problem;
  const d = discriminant(problem);

  if (b === 0) return 'Since b = 0, isolate the squared term and use square roots.';
  if (c === 0) return 'Since c = 0, factor out the greatest common factor, including x.';
  if (d > 0 && isPerfectSquare(d)) {
    if (method === 'quadratic-formula') {
      return 'Factoring is an option because the discriminant is a positive perfect square. The quadratic formula also works, so either method is acceptable.';
    }
    return a > 0
      ? 'The positive perfect-square discriminant makes factoring a good option. The quadratic formula also works, so either method is acceptable.'
      : 'The discriminant is a positive perfect square, so factoring is an efficient choice.';
  }
  if (isPerfectSquare(a) && isPerfectSquare(c)) {
    return 'Here a and c are perfect squares, and factoring is an efficient choice.';
  }
  if (a === 1 && b % 2 === 0) {
    return 'Since a = 1 and b is even, completing the square is an efficient choice.';
  }
  return 'All three coefficients are nonzero and the discriminant is not a perfect square, so the quadratic formula is a reliable choice.';
}

export function incorrectHint(problem, chosenMethod) {
  if (chosenMethod === 'graph') {
    return 'Graphing is not the most efficient method unless you have a graphing calculator or Desmos. Choose an algebraic method.';
  }
  return `Not quite. ${explanation(problem)}`;
}
