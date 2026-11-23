import { polynomialText, checkAnswer } from '../polynomial-long-division/model.mjs?v=20261123g';
import { parseInteger } from '../quadratic-systems/model.mjs';
import { parseRationalNumber, simplifyFraction } from '../quadratic-convert/model.mjs';

export function createExample(dividend, divisor) {
  const root = -divisor[1] / divisor[0];
  const fraction = simplifyFraction(-divisor[1], divisor[0]);
  const rootText = fraction.denominator === 1 ? String(fraction.numerator)
    : `${fraction.numerator}/${fraction.denominator}`;
  const results = [dividend[0]];
  const products = [];
  for (let index = 1; index < dividend.length; index++) {
    products.push(results[index - 1] * -divisor[1] / divisor[0]);
    results.push(dividend[index] + products[index - 1]);
  }
  return {
    dividend,
    root,
    rootText,
    divisor,
    products,
    results,
    quotient: results.slice(0, -1).map(value => value / divisor[0]),
    remainder: results[results.length - 1],
  };
}

export const examples = [
  createExample([4, 1, -11, 6], [1, -1]),
  createExample([1, 1, -7, 0, 3], [1, 2]),
  createExample([2, -3, 0, 7], [1, -2]),
  createExample([1, -2, -5, 6], [1, 2]),
  createExample([3, -5, 0, -1, 2], [1, -2]),
  createExample([4, 4, -5, 1], [2, -1]),
  createExample([3, 8, 1, 7, 2], [3, 2]),
];

export { polynomialText, checkAnswer };

export function checkInteger(value, expected) {
  return parseInteger(value) === expected;
}

export function checkRoot(value, expected) {
  const parsed = parseRationalNumber(value);
  return parsed !== null && parsed.value === expected;
}
