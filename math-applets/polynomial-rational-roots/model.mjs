import { simplifyFraction, parseRationalNumber } from '../quadratic-convert/model.mjs';
import { polynomialText } from '../polynomial-synthetic-division/model.mjs?v=20261123n';
import { checkStep } from '../polynomial-factoring/model.mjs?v=20261123h';
import { parsePolynomial } from '../quadratic-systems/model.mjs';

function multiply(first, second) {
  const result = Array(first.length + second.length - 1).fill(0);
  first.forEach((value, i) => second.forEach((factor, j) => { result[i + j] += value * factor; }));
  return result;
}

function divisors(value) {
  const result = [];
  for (let i = 1; i <= Math.abs(value); i++) {
    if (value % i === 0) result.push(i);
  }
  return result;
}

export function fractionText({ numerator, denominator }) {
  return denominator === 1 ? String(numerator) : `${numerator}/${denominator}`;
}

function makeExample(factors, solutions) {
  const dividend = factors.reduce(multiply);
  const constantFactors = divisors(dividend.at(-1));
  const leadingFactors = divisors(dividend[0]);
  const candidates = [];
  for (const p of constantFactors) {
    for (const q of leadingFactors) {
      const fraction = simplifyFraction(p, q);
      if (!candidates.some(item => item.numerator === fraction.numerator && item.denominator === fraction.denominator)) {
        candidates.push(fraction);
      }
    }
  }
  candidates.sort((a, b) => a.numerator / a.denominator - b.numerator / b.denominator);
  return {
    dividend, factors, solutions, constantFactors, leadingFactors, candidates,
    realCount: solutions.filter(solution => !solution.includes('i')).length,
    complexCount: solutions.filter(solution => solution.includes('i')).length,
  };
}

export const examples = [
  makeExample([[1, -2], [1, -1], [1, 3]], ['2', '1', '-3']),
  makeExample([[1, -2], [1, 0, 9]], ['2', '3i', '-3i']),
  makeExample([[1, 1], [1, 0, -7]], ['-1', 'sqrt(7)', '-sqrt(7)']),
  makeExample([[1, -1], [1, 2], [1, 0, 4]], ['1', '-2', '2i', '-2i']),
  makeExample([[2, -1], [1, 0, 4]], ['1/2', '2i', '-2i']),
  makeExample([[3, 2], [1, 0, -7]], ['-2/3', 'sqrt(7)', '-sqrt(7)']),
  makeExample([[2, -1], [1, -2], [1, 0, 9]], ['1/2', '2', '3i', '-3i']),
  makeExample([[3, 1], [1, 2], [1, 0, -7]], ['-1/3', '-2', 'sqrt(7)', '-sqrt(7)']),
];

export function checkList(text, expected, allowEquivalentDuplicates = false) {
  const entries = String(text).split(',').map(value => value.trim());
  if (entries.some(value => !value)) return false;
  const values = entries.map(value => parseRationalNumber(value));
  if (values.some(value => !value || value.value <= 0)) return false;
  const expectedValues = expected.map(value => typeof value === 'number' ? value : value.numerator / value.denominator);
  const actual = values.map(value => value.value);
  return actual.every(value => expectedValues.includes(value))
    && expectedValues.every(value => actual.includes(value))
    && (allowEquivalentDuplicates || new Set(actual).size === actual.length);
}

export function candidateFromInput(text, example) {
  const parsed = parseRationalNumber(text);
  if (!parsed || parsed.value === 0) return null;
  const match = example.candidates.find(candidate => candidate.numerator / candidate.denominator === Math.abs(parsed.value));
  if (!match) return null;
  return { numerator: Math.sign(parsed.value) * match.numerator, denominator: match.denominator };
}

function add(first, second) {
  return simplifyFraction(first.numerator * second.denominator + second.numerator * first.denominator,
    first.denominator * second.denominator);
}

function product(first, second) {
  return simplifyFraction(first.numerator * second.numerator, first.denominator * second.denominator);
}

export function syntheticTrial(example, root) {
  const results = [{ numerator: example.dividend[0], denominator: 1 }];
  const products = [];
  for (let i = 1; i < example.dividend.length; i++) {
    products.push(product(results[i - 1], root));
    results.push(add({ numerator: example.dividend[i], denominator: 1 }, products[i - 1]));
  }
  return {
    dividend: example.dividend,
    rootText: fractionText(root),
    products: products.map(fractionText),
    results: results.map(fractionText),
    remainder: results.at(-1),
  };
}

export function successfulFactorization(example, root) {
  const index = example.factors.findIndex(factor =>
    factor.length === 2 && -factor[1] * root.denominator === factor[0] * root.numerator);
  if (index < 0) return null;
  const divisor = example.factors[index];
  const remaining = example.factors.filter((factor, i) => i !== index);
  const quotient = remaining.length === 1 ? remaining[0] : remaining.reduce(multiply);
  const factorTexts = [divisor, ...remaining].map(polynomialText);
  return {
    divisor, remaining, quotient, factorTexts,
    factored: factorTexts.map(factor => `(${factor})`).join(''),
    factorEquations: {
      polynomialAnswers: factorTexts.map(factor => parsePolynomial(factor.replaceAll('²', '^2').replaceAll('−', '-'))),
      zeroFactors: true, unordered: true,
    },
  };
}

export function checkSolutions(values, expected) {
  const unused = new Set(expected.keys());
  return values.map(value => {
    const parsed = parseRationalNumber(value);
    const match = [...unused].find(index => {
      const target = parseRationalNumber(expected[index]);
      return parsed && target ? parsed.value === target.value
        : checkStep({ answers: [expected[index]], roots: true }, [value])[0];
    });
    if (match === undefined) return false;
    unused.delete(match);
    return true;
  });
}
