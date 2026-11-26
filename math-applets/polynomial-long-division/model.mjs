import { matchesPolynomial } from '../polynomial-utils.mjs?v=20261123a';

const superscript = ['', '', '²', '³', '⁴', '⁵'];

export function termText(coefficient, power, first = true) {
  const magnitude = Math.abs(coefficient);
  const body = (power && magnitude === 1 ? '' : String(magnitude))
    + (power ? `x${superscript[power]}` : '');
  return (coefficient < 0 ? first ? '−' : ' − ' : first ? '' : ' + ') + body;
}

export function polynomialText(coefficients) {
  const terms = coefficients.flatMap((coefficient, index) =>
    coefficient ? [{ coefficient, power: coefficients.length - index - 1 }] : []);
  return terms.map(({ coefficient, power }, index) => termText(coefficient, power, index === 0)).join('') || '0';
}

export function createExample(dividend, divisor) {
  const degree = dividend.length - 1;
  const divisorDegree = divisor.length - 1;
  const quotient = Array(dividend.length).fill(0);
  const working = [...dividend];
  const rounds = [];
  for (let offset = 0; offset <= degree - divisorDegree; offset++) {
    const power = degree - divisorDegree - offset;
    const coefficient = working[offset] / divisor[0];
    const term = Array(dividend.length).fill(0);
    term[dividend.length - 1 - power] = coefficient;
    quotient[dividend.length - 1 - power] = coefficient;
    const product = Array(dividend.length).fill(0);
    divisor.forEach((value, index) => {
      product[offset + index] = value * coefficient;
      working[offset + index] -= product[offset + index];
    });
    const end = Math.min(offset + divisorDegree + 1, degree);
    const result = working.map((value, index) => index > offset && index <= end ? value : 0);
    const bringsDown = offset + divisorDegree < degree;
    const subtraction = working.map((value, index) =>
      index > offset && index <= offset + divisorDegree ? value : 0);
    const broughtDown = working.map((value, index) =>
      bringsDown && index === offset + divisorDegree + 1 ? value : 0);
    rounds.push({
      numerator: termText(coefficient * divisor[0], degree - offset),
      denominator: termText(divisor[0], divisorDegree),
      term,
      product,
      subtraction,
      broughtDown,
      result,
      productStart: offset,
      productEnd: offset + divisorDegree,
      bringsDown,
    });
  }
  return { dividend, divisor, quotient, remainder: working, rounds };
}

export const examples = [
  createExample([1, 1, -2, 12], [1, 3]),
  createExample([1, 1, -5, 3], [1, -2]),
  createExample([4, -4, 5, 11], [2, 1]),
  createExample([3, 4, -7, 11, -1], [3, -2]),
  createExample([1, 2, -1, 6, -12], [1, 0, 3]),
  createExample([6, 4, -1, 7, 2], [2, 0, 1]),
];

export function checkAnswer(value, expected) {
  return matchesPolynomial(value, expected);
}
