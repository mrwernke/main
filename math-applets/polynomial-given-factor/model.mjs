import { createExample, polynomialText } from '../polynomial-synthetic-division/model.mjs?v=20261123n';
import { factorPractice, groupingPractice, quadraticFormPracticeProblem, checkStep } from '../polynomial-factoring/model.mjs?v=20261123h';
import { parsePolynomial } from '../quadratic-systems/model.mjs';

function multiplyByDivisor(quotient, divisor) {
  const result = Array(quotient.length + 1).fill(0);
  quotient.forEach((value, index) => {
    result[index] += value * divisor[0];
    result[index + 1] += value * divisor[1];
  });
  return result;
}

function makeExample({ quotient, root, given, kind, practice, solutions, square, squareSteps }) {
  const divisor = [1, -root];
  const division = createExample(multiplyByDivisor(quotient, divisor), divisor);
  const divisorText = polynomialText(divisor);
  const furtherFactors = kind === 'quadratic' ? practice.steps[2].answers
    : kind === 'grouping' || kind === 'quadratic-form' ? practice.zeroFactors : [polynomialText(quotient)];
  const zeroFactors = [divisorText, ...furtherFactors];
  const factorEquations = {
    polynomialAnswers: zeroFactors.map(factor => parsePolynomial(factor.replaceAll('²', '^2').replaceAll('−', '-'))),
    unordered: true,
    zeroFactors: true,
  };
  const rootStep = { answers: solutions, roots: true, unordered: true };
  const squareRootHelp = squareSteps || (kind === 'square-root'
    ? [{ factor: polynomialText(quotient), value: square, solutions: solutions.slice(1) }]
    : []);
  const factored = zeroFactors.map(factor => `(${factor})`).join('');
  const complex = solutions.filter(solution => solution.includes('i')).length;
  return {
    ...division, given, kind, practice, solutions, square, squareSteps: squareRootHelp, zeroFactors, factorEquations, rootStep, factored,
    realCount: solutions.length - complex,
    complexCount: complex,
  };
}

export const examples = [
  makeExample({ quotient: [1, -4, -12], root: 1, given: 'factor', kind: 'quadratic', practice: factorPractice[3], solutions: ['1', '6', '-2'] }),
  makeExample({ quotient: [1, 3, -18], root: -1, given: 'root', kind: 'quadratic', practice: factorPractice[4], solutions: ['-1', '-6', '3'] }),
  makeExample({ quotient: [1, 0, 1], root: 5, given: 'zero', kind: 'square-root', square: -1, solutions: ['5', '-i', 'i'] }),
  makeExample({ quotient: [1, 0, -16], root: 2, given: 'x-intercept', kind: 'quadratic', practice: factorPractice[6], solutions: ['2', '-4', '4'] }),
  makeExample({ quotient: [1, 2, -9, -18], root: 1, given: 'factor', kind: 'grouping', practice: groupingPractice[4], solutions: ['1', '3', '-3', '-2'] }),
  makeExample({ quotient: [1, 0, 4], root: 3, given: 'zero', kind: 'square-root', square: -4, solutions: ['3', '2i', '-2i'] }),
  makeExample({ quotient: [1, 4, -25, -100], root: 2, given: 'x-intercept', kind: 'grouping', practice: groupingPractice[6], solutions: ['2', '5', '-5', '-4'] }),
  makeExample({ quotient: [1, 0, 9], root: -3, given: 'root', kind: 'square-root', square: -9, solutions: ['-3', '3i', '-3i'] }),
  makeExample({
    quotient: [1, 0, 7, 0, -144], root: -2, given: 'factor', kind: 'quadratic-form',
    practice: quadraticFormPracticeProblem([1, -9], [1, 16], [0]),
    squareSteps: [{ factor: 'x² + 16', value: -16, solutions: ['4i', '-4i'] }], solutions: ['-2', '3', '-3', '4i', '-4i'],
  }),
  makeExample({
    quotient: [1, 0, 13, 0, 36], root: -4, given: 'root', kind: 'quadratic-form',
    practice: quadraticFormPracticeProblem([1, 4], [1, 9]),
    squareSteps: [
      { factor: 'x² + 4', value: -4, solutions: ['2i', '-2i'] },
      { factor: 'x² + 9', value: -9, solutions: ['3i', '-3i'] },
    ],
    solutions: ['-4', '2i', '-2i', '3i', '-3i'],
  }),
];

export function givenText(example) {
  if (example.given === 'factor') return `A factor is (${polynomialText(example.divisor)}).`;
  if (example.given === 'x-intercept') return `An x-intercept is (${example.root}, 0).`;
  return `A ${example.given} is ${String(example.root).replace('-', '−')}.`;
}

export { checkStep };
