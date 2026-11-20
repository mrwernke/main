import { createPolynomialProblem } from '../polynomial-features/model.mjs?v=20261120p2';
import { parseNumber } from '../quadratic-graphing/model.mjs';

const configurations = [
  { a: 2, roots: [-2, 1, 3], pointX: 0, yLimit: 32 },
  { a: -2, roots: [-3, 1, 2], pointX: 0, yLimit: 32 },
  { a: 1, roots: [-2, -1, 2], pointX: 0, yLimit: 16 },
  { a: -1, roots: [-3, -1 / 2, 2], pointX: 1, yLimit: 16, xGridStep: 1 / 2 },
  { a: 1 / 2, roots: [-3, 1, 4], pointX: -1, yLimit: 16 },
  { a: 2, roots: [-2, 1 / 2, 3], pointX: 0, yLimit: 32, xGridStep: 1 / 2 },
  { a: 2, roots: [-2, 1], multiplicities: { 1: 2 }, pointX: -1, yLimit: 16 },
  { a: 1, roots: [-1, 2], multiplicities: { '-1': 2 }, pointX: 0, yLimit: 16 },
  { a: -1, roots: [0, 3], multiplicities: { 0: 2 }, pointX: 2, yLimit: 16 },
  { a: 3, roots: [-1], multiplicities: { '-1': 3 }, pointX: 0, yLimit: 16 },
];

export function createCubicExample({ a, roots, multiplicities, pointX, yLimit = 32, xGridStep = 1 }) {
  const model = createPolynomialProblem({ roots, multiplicities, end: Math.sign(a), leadingMagnitude: Math.abs(a) });
  return {
    ...model,
    a,
    labeledPoint: { x: pointX, y: model.evaluate(pointX) },
    bounds: {
      xMin: roots[0] - 2,
      xMax: roots.at(-1) + 2,
      xStep: 1, xGridStep, yLimit, yStep: 4, yGridStep: 2,
    },
  };
}

export const examples = configurations.map(createCubicExample);

export function parseValue(value) {
  const text = value.trim().replaceAll('−', '-').replaceAll('⁄', '/');
  if (/^[+-]?½$/.test(text)) return text.startsWith('-') ? -0.5 : 0.5;
  const fraction = /^([+-]?\d+)\s*\/\s*([+-]?\d+)$/.exec(text);
  if (fraction) return Number(fraction[2]) === 0 ? NaN : Number(fraction[1]) / Number(fraction[2]);
  return parseNumber(text);
}

export function parseFactor(value) {
  const text = value.trim().replaceAll('−', '-').replace(/\s/g, '');
  const power = /^\((.+)\)(?:\^([1-9]\d*)|([²³]))$/.exec(text);
  const unwrapped = text.startsWith('(') && text.endsWith(')') ? text.slice(1, -1) : text;
  const factor = power?.[1] ?? unwrapped;
  const multiplicity = power ? Number(power[2] ?? (power[3] === '²' ? 2 : 3)) : 1;
  const match = /^(\d*)x([+-].+)?$/i.exec(factor);
  if (!match) return null;
  const linear = Number(match[1] || 1);
  const constant = parseValue(match[2] ?? '0');
  if (!Number.isFinite(constant) || !Number.isSafeInteger(linear) || linear <= 0
    || !Number.isSafeInteger(multiplicity)) return null;
  return { linear, constant, root: -constant / linear, multiplicity };
}

export function outsideCoefficient(example, factors) {
  return example.a / factors.reduce((product, factor) => product * factor.linear ** factor.multiplicity, 1);
}

export function expandRepeatedFactors(factors) {
  return factors.flatMap(factor => Array(factor.multiplicity).fill({ ...factor, multiplicity: 1 }));
}

function terms(coefficients) {
  return coefficients.map((coefficient, index) => ({
    coefficient, power: coefficients.length - index - 1,
  }));
}

function distribute(left, right) {
  const products = left.flatMap(first => right.map(second => ({
    coefficient: first.coefficient * second.coefficient,
    power: first.power + second.power,
  })));
  const degree = products[0].power;
  const combined = Array(degree + 1).fill(0);
  for (const { coefficient, power } of products) combined[degree - power] += coefficient;
  return { left, right, products, combined };
}

export function expandCubic(factors, coefficient) {
  const [first, second, third] = expandRepeatedFactors(factors);
  const factorTerms = ({ linear, constant }) => terms([linear, constant]);
  const pairDistribution = distribute(factorTerms(second), factorTerms(third));
  const cubicDistribution = distribute(factorTerms(first), terms(pairDistribution.combined));
  return {
    pairDistribution,
    cubicDistribution,
    standard: cubicDistribution.combined.map(value => coefficient * value),
  };
}

export function validPoint(example, x, y) {
  const { bounds } = example;
  if (!Number.isFinite(x) || !Number.isFinite(y) || y === 0
    || x < bounds.xMin || x > bounds.xMax || Math.abs(y) > bounds.yLimit) return false;
  const expected = example.evaluate(x);
  return expected !== 0 && Math.abs(y - expected) < 1e-9;
}
