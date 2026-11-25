import { simplifyFraction, parseRationalNumber } from '../quadratic-convert/model.mjs';
import { polynomialText } from '../polynomial-synthetic-division/model.mjs?v=20261123n';
import { checkStep } from '../polynomial-factoring/model.mjs?v=20261123h';
import { parsePolynomial } from '../quadratic-systems/model.mjs';
import { checkAlgebraic, continuedTrial, isZero, radicalBasis } from './algebraic.mjs?v=20261125c';

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

export function factoredText(factors) {
  const counts = new Map();
  factors.map(polynomialText).forEach(factor => counts.set(factor, (counts.get(factor) || 0) + 1));
  return [...counts].map(([factor, count]) =>
    `(${factor})${count === 1 ? '' : count === 2 ? '²' : `^${count}`}`).join('');
}

function makeExample(factors, solutions) {
  const dividend = factors.reduce(multiply);
  const quadratic = factors.find(factor => factor.length === 3);
  const rootCounts = new Map();
  factors.filter(factor => factor.length === 2).forEach(([a, b]) => {
    const root = fractionText(simplifyFraction(-b, a));
    rootCounts.set(root, (rootCounts.get(root) || 0) + 1);
  });
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
  candidates.sort((a, b) => Number(a.denominator !== 1) - Number(b.denominator !== 1)
    || a.numerator / a.denominator - b.numerator / b.denominator);
  return {
    dividend, factors, solutions, constantFactors, leadingFactors, candidates,
    repeatedRoots: [...rootCounts].filter(([, count]) => count > 1),
    basis: quadratic ? radicalBasis(quadratic[1] ** 2 - 4 * quadratic[0] * quadratic[2]) : 0,
    realCount: solutions.filter(solution => !solution.includes('i')).length,
    complexCount: solutions.filter(solution => solution.includes('i')).length,
  };
}

export const examples = [
  makeExample([[1, -2], [1, -1], [1, 3]], ['2', '1', '-3']),
  makeExample([[1, -2], [1, -2], [1, 1]], ['2', '-1']),
  makeExample([[1, -3], [1, 2], [1, 4]], ['3', '-2', '-4']),
  makeExample([[1, -2], [1, 2], [1, -1], [1, 1]], ['2', '-2', '1', '-1']),
  makeExample([[1, -2], [1, -2], [1, 2], [1, 3]], ['2', '-2', '-3']),
  makeExample([[3, -1], [1, -2], [1, 1]], ['1/3', '2', '-1']),
  makeExample([[2, -1], [1, -1], [1, 1], [1, 2]], ['1/2', '1', '-1', '-2']),
  makeExample([[1, 1], [1, 0, -7]], ['-1', 'sqrt(7)', '-sqrt(7)']),
  makeExample([[1, -2], [1, 0, -2]], ['2', 'sqrt(2)', '-sqrt(2)']),
  makeExample([[1, 3], [1, 0, -3]], ['-3', 'sqrt(3)', '-sqrt(3)']),
  makeExample([[1, -2], [1, 1], [1, 0, -5]], ['2', '-1', 'sqrt(5)', '-sqrt(5)']),
  makeExample([[1, -1], [1, -1], [1, 0, -7]], ['1', 'sqrt(7)', '-sqrt(7)']),
  makeExample([[1, -2], [1, 0, 9]], ['2', '3i', '-3i']),
  makeExample([[1, 1], [1, 0, 4]], ['-1', '2i', '-2i']),
  makeExample([[1, -1], [1, 0, 12]], ['1', '2sqrt(3)i', '-2sqrt(3)i']),
  makeExample([[1, 3], [1, 0, 8]], ['-3', '2sqrt(2)i', '-2sqrt(2)i']),
  makeExample([[1, -2], [1, 2, 4]], ['2', '-1+sqrt(3)i', '-1-sqrt(3)i']),
  makeExample([[1, 2], [1, -1], [1, 0, 4]], ['-2', '1', '2i', '-2i']),
  makeExample([[1, -2], [1, -1], [1, 0, 12]], ['2', '1', '2sqrt(3)i', '-2sqrt(3)i']),
  makeExample([[1, 3], [1, -1], [1, 0, 8]], ['-3', '1', '2sqrt(2)i', '-2sqrt(2)i']),
  makeExample([[1, 2], [1, -4, 1]], ['-2', '2+sqrt(3)', '2-sqrt(3)']),
  makeExample([[1, -3], [1, -2, 5]], ['3', '1+2i', '1-2i']),
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

export function hasRemainingRationalRoot(example, dividend) {
  if (dividend.length < 2) return false;
  return example.candidates.some(candidate => [-1, 1].some(sign => {
    const root = { ...candidate, numerator: sign * candidate.numerator };
    const result = continuedTrial(dividend, fractionText(root), example.basis);
    if (!result) throw new Error('Unable to check the remaining rational roots.');
    return isZero(result.remainder);
  }));
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

function rootFactorIndex(factors, root) {
  return factors.findIndex(factor =>
    factor.length === 2 && -factor[1] * root.denominator === factor[0] * root.numerator);
}

export function advanceKnownFactors(divided, remaining, root) {
  const index = rootFactorIndex(remaining, root);
  if (index < 0) return null;
  const nextDivided = [...divided, remaining[index]];
  const nextRemaining = remaining.filter((factor, i) => i !== index);
  const quotient = nextRemaining.length ? nextRemaining.reduce(multiply) : null;
  return {
    divided: nextDivided,
    remaining: nextRemaining,
    quotient,
    written: quotient ? [...nextDivided, quotient] : nextDivided,
  };
}

export function successfulFactorization(example, root) {
  const index = rootFactorIndex(example.factors, root);
  if (index < 0) return null;
  const divisor = example.factors[index];
  const remaining = example.factors.filter((factor, i) => i !== index);
  const quotient = remaining.length === 1 ? remaining[0] : remaining.reduce(multiply);
  let grouped = remaining;
  let quadraticFactors = null;
  if (remaining.length === 3 && remaining.every(factor => factor.length === 2)) {
    const pairs = [];
    for (let i = 0; i < remaining.length; i++) {
      for (let j = i + 1; j < remaining.length; j++) {
        const quadratic = multiply(remaining[i], remaining[j]);
        if (quadratic[0] === 1) pairs.push({ i, j, quadratic });
      }
    }
    const pair = pairs.find(item => item.quadratic[1] === 0) || pairs[0];
    if (!pair) throw new Error('No monic quadratic factor is available for this quotient.');
    quadraticFactors = [remaining[pair.i], remaining[pair.j]];
    grouped = [remaining.find((factor, i) => i !== pair.i && i !== pair.j), pair.quadratic];
  }
  const factorTexts = [divisor, ...remaining].map(polynomialText);
  const distinctFactors = [...new Set(factorTexts)];
  return {
    divisor, remaining, quotient, grouped, quadraticFactors, factorTexts,
    factored: factoredText([divisor, ...remaining]),
    factorEquations: {
      polynomialAnswers: distinctFactors.map(factor => parsePolynomial(factor.replaceAll('²', '^2').replaceAll('−', '-'))),
      zeroFactors: true, unordered: true,
    },
    distinctFactors,
  };
}

export function checkSolutions(values, expected, basis = 0) {
  const unused = new Set(expected.keys());
  return values.map(value => {
    const parsed = parseRationalNumber(value);
    const match = [...unused].find(index => {
      const target = parseRationalNumber(expected[index]);
      return parsed && target ? parsed.value === target.value
        : checkAlgebraic(value, expected[index], basis)
          || checkStep({ answers: [expected[index]], roots: true }, [value])[0];
    });
    if (match === undefined) return false;
    unused.delete(match);
    return true;
  });
}
