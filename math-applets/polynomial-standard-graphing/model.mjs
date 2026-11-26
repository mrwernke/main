import { createExample } from '../polynomial-synthetic-division/model.mjs?v=20261123n';

const examples = [
  { dividend: [1, 0, -3, 0], realCount: 3, complexCount: 0, doubleRoots: 0 },
  { dividend: [-1, 0, 3, -3], realCount: 1, complexCount: 2, doubleRoots: 0 },
  { dividend: [1, 0, -3, 2], realCount: 2, complexCount: 0, doubleRoots: 1 },
  { dividend: [-1, 0, 3, -2], realCount: 2, complexCount: 0, doubleRoots: 1 },
  { dividend: [1, 0, -5, 0, 4], realCount: 4, complexCount: 0, doubleRoots: 0 },
  { dividend: [1, 1, -3, -1, 2], realCount: 3, complexCount: 0, doubleRoots: 1 },
  { dividend: [-1, -1, 3, 1, -2], realCount: 3, complexCount: 0, doubleRoots: 1 },
  { dividend: [1, 0, -5, 0, -1], realCount: 2, complexCount: 2, doubleRoots: 0 },
  { dividend: [-1, 0, 4, 0, -8], realCount: 0, complexCount: 4, doubleRoots: 0 },
  { dividend: [-1, 0, 3, 0], realCount: 3, complexCount: 0, doubleRoots: 0 },
];

export function evaluate(coefficients, x) {
  return coefficients.reduce((value, coefficient) => value * x + coefficient, 0);
}

export function nextTableValues(values) {
  if (!values.length) return [0];
  const left = Math.min(...values);
  const right = Math.max(...values);
  return [left > -4 ? left - 1 : null, right < 4 ? right + 1 : null]
    .filter(value => value !== null);
}

export function syntheticSubstitution(coefficients, x) {
  return createExample(coefficients, [1, -x]);
}

export function graphLimitFor(coefficients, extent = 2.5) {
  let max = 0;
  for (let i = -extent * 100; i <= extent * 100; i++) {
    max = Math.max(max, Math.abs(evaluate(coefficients, i / 100)));
  }
  return Math.max(10, Math.ceil(max / 10) * 10);
}

export function tailExtent(coefficients, start, direction, limit) {
  const boundary = 4 * direction;
  let inside = start;
  for (let i = 1; i <= 150; i++) {
    const next = start + (boundary - start) * i / 150;
    if (Math.abs(evaluate(coefficients, next)) > limit) {
      let outside = next;
      for (let j = 0; j < 40; j++) {
        const mid = (inside + outside) / 2;
        if (Math.abs(evaluate(coefficients, mid)) <= limit) inside = mid;
        else outside = mid;
      }
      return inside;
    }
    inside = next;
  }
  return boundary;
}

export const problems = examples.map(example => {
  const { dividend } = example;
  const degree = dividend.length - 1;
  const rightEnd = Math.sign(dividend[0]);
  return {
    ...example, degree, leading: dividend[0], yIntercept: dividend.at(-1), rightEnd,
    leftEnd: degree % 2 ? -rightEnd : rightEnd,
  };
});
