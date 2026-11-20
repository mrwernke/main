import { createPolynomialProblem } from '../polynomial-features/model.mjs?v=20261120p2';

const examples = [
  { numerator: -1, denominator: 1, factors: [[-1, 1], [2, 1], [4, 1]] },
  { numerator: 1, denominator: 2, factors: [[0, 1], [3, 2], [-2, 1]] },
  { numerator: -2, denominator: 3, factors: [[-3, 1], [-1, 1], [1, 1], [2, 1]] },
  { numerator: 1, denominator: 8, factors: [[-2, 1], [2, 2]] },
  { numerator: 1, denominator: 2, factors: [[-2, 1], [2, 1]] },
  { numerator: -1, denominator: 2, factors: [[-2, 3], [1, 1]] },
  { numerator: -1, denominator: 8, factors: [[-2, 1], [-1, 2], [2, 3]] },
  { numerator: 1, denominator: 16, factors: [[-2, 1], [0, 2], [3, 3]] },
  { numerator: -1, denominator: 12, factors: [[-2, 2], [0, 3], [2, 1], [3, 1]] },
  { numerator: 1, denominator: 12, factors: [[-3, 1], [-1, 2], [2, 3]] },
];

export const problems = examples.map(({ numerator, denominator, factors }) => {
  const roots = factors.map(([root]) => root).sort((a, b) => a - b);
  const problem = createPolynomialProblem({
    roots,
    multiplicities: Object.fromEntries(factors),
    end: Math.sign(numerator),
    leadingMagnitude: Math.abs(numerator) / denominator,
  });
  const { extrema, evaluate } = problem;
  const interiorTurns = [...extrema.global, ...extrema.local]
    .filter(({ x }) => !roots.includes(x))
    .sort((a, b) => a.x - b.x);
  const counts = {
    double: factors.filter(([, power]) => power === 2).length,
    triple: factors.filter(([, power]) => power === 3).length,
  };
  return { ...problem, numerator, denominator, factors, interiorTurns, counts, yIntercept: evaluate(0) || 0 };
});
