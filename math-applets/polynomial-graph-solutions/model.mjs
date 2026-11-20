import { graphLimit } from '../absolute-value-features/graph.js';
import { createPolynomialProblem } from '../polynomial-features/model.mjs?v=20261120p5';

function shiftedExample(seed, offset, reflect = false) {
  const { degree, evaluate, extrema, leftEnd, rightEnd } = createPolynomialProblem(seed);
  const direction = reflect ? -1 : 1;
  return {
    degree,
    evaluate: x => evaluate(direction * x) + offset,
    turningXs: [...extrema.global, ...extrema.local].map(({ x }) => direction * x),
    leftEnd: reflect ? rightEnd : leftEnd,
    rightEnd: reflect ? leftEnd : rightEnd,
  };
}

const degreeSevenSeed = {
  roots: [-6, -4, -2, 0, 6],
  complexPair: { real: 4, imaginary: 1 },
  end: 1,
  boundary: 6,
};
const examples = [
  {
    degree: 3,
    evaluate: x => 1.4 * ((x / 2) ** 3 - 1.5 * x + 3),
    turningXs: [-2, 2],
    leftEnd: -1,
    rightEnd: 1,
  },
  shiftedExample({ roots: [-5, -2, 2, 4], end: 1, boundary: 5 }, 3.5),
  shiftedExample({ roots: [-5, -2, 1, 4], multiplicities: { '-2': 2 }, end: -1, boundary: 5 }, -0.7),
  shiftedExample({ roots: [-5, -4, -2, 2, 4, 5], end: -1, boundary: 6 }, -2),
  shiftedExample(degreeSevenSeed, 0.5),
  shiftedExample(degreeSevenSeed, -2.5, true),
];

function findCrossing(evaluate, left, right) {
  const leftSign = Math.sign(evaluate(left));
  for (let step = 0; step < 48; step++) {
    const mid = (left + right) / 2;
    const sign = Math.sign(evaluate(mid));
    if (sign === 0) return mid;
    if (sign === leftSign) left = mid;
    else right = mid;
  }
  return (left + right) / 2;
}

export const problems = examples.map(example => {
  const { evaluate, turningXs, degree } = example;
  const turns = turningXs.toSorted((a, b) => a - b);
  const bounds = [-graphLimit, ...turns, graphLimit];
  const roots = [];
  // The curve is monotone between consecutive turns. A sign change gives one simple real zero.
  for (let i = 1; i < bounds.length; i++) {
    const [left, right] = [bounds[i - 1], bounds[i]];
    if (evaluate(left) * evaluate(right) < 0) {
      roots.push(findCrossing(evaluate, left, right));
    }
  }
  return { ...example, turningXs: turns, roots, nonrealZeros: degree - roots.length };
});
