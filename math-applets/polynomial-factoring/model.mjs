import { parsePolynomial, samePolynomial } from '../quadratic-systems/model.mjs';
import { parseFactor } from '../quadratic-factoring/model.mjs';
import { matchesPolynomial } from '../polynomial-utils.mjs?v=20261123a';

const superscript = ['', '', '²', '³', '⁴', '⁵', '⁶'];

function polynomial(coefficients, variable = 'x') {
  return coefficients.flatMap((coefficient, index) => {
    if (!coefficient) return [];
    const power = coefficients.length - index - 1;
    const magnitude = Math.abs(coefficient);
    const text = (power && magnitude === 1 ? '' : magnitude)
      + (power ? variable + superscript[power] : '');
    return [{ negative: coefficient < 0, text }];
  }).map(({ negative, text }, index) =>
    (index ? negative ? ' − ' : ' + ' : negative ? '−' : '') + text).join('') || '0';
}

function chooseMethod(answer, hint) {
  return { title: 'Which method should you use first?', options: ['GCF', 'Grouping', 'Quadratic Form'], answers: [answer], hint };
}

function quadraticFactorStep(outside, quotient, factors, after = '') {
  const factored = factors[0] === factors[1]
    ? `${outside}(${polynomial([1, factors[0]])})²${after}`
    : `${outside}${factors.map(value => `(${polynomial([1, value])})`).join('')}${after}`;
  return {
    factored,
    step: {
      title: 'Factor the quadratic inside the parentheses.',
      note: 'Find two numbers whose product is the constant and whose sum is the x-coefficient. Keep the other factor outside and enter each complete factor, such as x-1.',
      equation: `${outside}(□)(□)${after}`,
      answers: factors.map(value => polynomial([1, value])),
      unordered: true,
      completeFactors: true,
      box: { b: quotient[1], c: quotient[2] },
      result: factored,
      hint: 'Enter each complete factor, such as x-1. The constants must multiply to the constant and add to the coefficient of x.',
    },
  };
}

function practiceProblem(coefficients, outside, quotient, factors) {
  const expression = polynomial(coefficients);
  const factoredGcf = `${outside}(${polynomial(quotient)})`;
  const steps = [
    {
      title: 'Identify the greatest common factor.',
      note: outside.startsWith('−') ? 'Include the negative sign so the leading term inside the parentheses is positive.' : '',
      equation: 'GCF = □',
      answers: [outside],
      result: `GCF = ${outside}`,
      hint: 'Find the greatest number and the largest power of x that divide every term.',
    },
    {
      title: 'Divide each term by the GCF and fill in the factored expression.',
      note: 'Enter the entire expression inside the parentheses, including its signs.',
      division: { coefficients, outside },
      equation: '□(□)',
      answers: [outside, polynomial(quotient)],
      polynomialAnswer: { index: 1, coefficients: quotient.length === 2 ? [0, ...quotient] : quotient },
      result: factoredGcf,
      hint: 'Divide each term by the GCF and enter the complete expression with its signs.',
    },
  ];
  let factored = factoredGcf;
  if (factors) {
    const further = quadraticFactorStep(outside, quotient, factors);
    further.step.note = `The GCF is only the first level of factoring. ${further.step.note}`;
    factored = further.factored;
    steps.push(further.step);
  }
  const zeroFactors = [outside, ...(factors ? factors.map(value => polynomial([1, value])) : [polynomial(quotient)])];
  return { equation: expression, factored, zeroFactors: [...new Set(zeroFactors)], steps };
}

export const factorPractice = [
  practiceProblem([3, 9, 0], '3x', [1, 3]),
  practiceProblem([6, -14, 0, 0], '2x²', [3, -7]),
  practiceProblem([1, -5, 2, 0], 'x', [1, -5, 2]),
  practiceProblem([1, -4, -12, 0], 'x', [1, -4, -12], [-6, 2]),
  practiceProblem([5, 15, -90, 0], '5x', [1, 3, -18], [6, -3]),
  practiceProblem([-3, 12, -9, 0], '−3x', [1, -4, 3], [-1, -3]),
  practiceProblem([2, 0, -32, 0], '2x', [1, 0, -16], [-4, 4]),
  practiceProblem([1, -7, 10, 0, 0], 'x²', [1, -7, 10], [-5, -2]),
  practiceProblem([1, -8, 16, 0], 'x', [1, -8, 16], [-4, -4]),
  practiceProblem([-3, 0, 3, 0, 0, 0], '−3x³', [1, 0, -1], [-1, 1]),
];

function groupingPracticeProblem(shift, constant, factors) {
  const firstGroup = polynomial([1, shift, 0, 0]);
  const secondGroup = polynomial([constant, constant * shift]);
  const binomial = polynomial([1, shift]);
  const quadratic = polynomial([1, 0, constant]);
  const groupGcf = String(constant).replace('-', '−');
  const connector = constant < 0 ? ` − ${-constant}` : ` + ${constant}`;
  const binomialCoefficients = [0, 1, shift];
  const quadraticCoefficients = [1, 0, constant];
  const groupingResult = `x²(${binomial})${connector}(${binomial})`;
  const initialFactored = `(${quadratic})(${binomial})`;
  const steps = [
    { title: 'Group the first two terms and the last two terms.', action: 'group', answers: [] },
    {
      title: 'Identify the GCF of each group.',
      note: 'For the green group, include the negative sign when needed so both groups leave the same expression.',
      fields: ['Red group GCF', 'Green group GCF'],
      groupFields: true,
      answers: ['x²', groupGcf],
      hint: 'Find the GCF of each pair. The green GCF may be negative so the expressions inside match.',
    },
    {
      title: 'Divide each group by its GCF and enter the remaining expressions.',
      note: 'Enter the entire expression inside each pair of parentheses.',
      groupedDivision: { firstGroup, secondGroup, groupGcf },
      equation: `x²(□)${connector}(□)`,
      answers: [binomial, binomial],
      polynomialAnswers: [binomialCoefficients, binomialCoefficients],
      inputLabels: ['Red group expression', 'Green group expression'],
      result: groupingResult,
      hint: 'Divide each grouped expression by its GCF. Both parentheses should match.',
    },
    {
      title: 'Factor out the matching expression.',
      note: 'Enter the quadratic factor first and the shared linear factor second. Use ^2 for x².',
      equation: '(□)(□)',
      answers: [quadratic, binomial],
      polynomialAnswers: [quadraticCoefficients, binomialCoefficients],
      inputLabels: ['Factor 1', 'Factor 2'],
      result: initialFactored,
      hint: 'Put the two GCFs together in the first factor and the shared expression in the second.',
    },
  ];
  let factored = initialFactored;
  const furtherFactors = factors ? [...factors].reverse() : null;
  if (factors) {
    const further = quadraticFactorStep('', quadraticCoefficients, furtherFactors, `(${binomial})`);
    factored = further.factored;
    steps.push(further.step);
  }
  return {
    equation: polynomial([1, shift, constant, constant * shift]),
    groups: [firstGroup, secondGroup],
    factored,
    zeroFactors: [...new Set([...(furtherFactors ? furtherFactors.map(value => polynomial([1, value])) : [quadratic]), binomial])],
    steps,
  };
}

export const groupingPractice = [
  groupingPracticeProblem(3, 7),
  groupingPracticeProblem(-2, 5),
  groupingPracticeProblem(4, 9),
  groupingPracticeProblem(-3, 4),
  groupingPracticeProblem(2, -9, [-3, 3]),
  groupingPracticeProblem(-3, -4, [-2, 2]),
  groupingPracticeProblem(4, -25, [-5, 5]),
  groupingPracticeProblem(-5, -1, [-1, 1]),
];

export function quadraticFormPracticeProblem(first, second, furtherFactors = []) {
  const [firstCoefficient, firstConstant] = first;
  const [secondCoefficient, secondConstant] = second;
  const a = firstCoefficient * secondCoefficient;
  const b = firstCoefficient * secondConstant + secondCoefficient * firstConstant;
  const c = firstConstant * secondConstant;
  const expressions = [first, second].map(([coefficient, constant]) => [coefficient, 0, constant]);
  const factorTexts = expressions.map(expression => `(${polynomial(expression)})`);
  const zeroFactors = expressions.map(expression => [polynomial(expression)]);
  const initialFactored = factorTexts.join('');
  const steps = [{
    title: 'Factor using quadratic form.',
    note: 'Treat x² as one quantity. Enter each complete quadratic factor, such as x^2+3. Use positive leading coefficients.',
    equation: '(□)(□)',
    answers: expressions.map(expression => polynomial(expression)),
    polynomialAnswers: expressions,
    unordered: true,
    inputLabels: ['Factor 1', 'Factor 2'],
    box: { a, b, c, power: 2 },
    result: initialFactored,
    hint: 'Use x² like a single variable. Enter two complete factors whose product gives the original expression.',
  }];
  let factored = initialFactored;
  for (const index of furtherFactors) {
    const root = Math.sqrt(-expressions[index][2]);
    const before = factorTexts.slice(0, index).join('');
    const after = factorTexts.slice(index + 1).join('');
    const further = quadraticFactorStep(before, expressions[index], [-root, root], after);
    further.step.title = `Factor ${polynomial(expressions[index])} further.`;
    factorTexts.splice(index, 1, `(x − ${root})(x + ${root})`);
    zeroFactors[index] = [polynomial([1, -root]), polynomial([1, root])];
    factored = further.factored;
    steps.push(further.step);
  }
  return {
    equation: polynomial([a, 0, b, 0, c]),
    factored,
    zeroFactors: [...new Set(zeroFactors.flat())],
    steps,
  };
}

export const quadraticFormPractice = [
  quadraticFormPracticeProblem([1, 1], [1, 2]),
  quadraticFormPracticeProblem([1, 2], [1, 5]),
  quadraticFormPracticeProblem([1, 3], [1, 4]),
  quadraticFormPracticeProblem([1, -4], [1, 3], [0]),
  quadraticFormPracticeProblem([1, -9], [1, -4], [0, 1]),
  quadraticFormPracticeProblem([2, 1], [1, 3]),
  quadraticFormPracticeProblem([3, 2], [1, 1]),
  quadraticFormPracticeProblem([5, 3], [1, 2]),
  quadraticFormPracticeProblem([7, 2], [1, -4], [1]),
  quadraticFormPracticeProblem([6, 5], [1, -9], [1]),
];

export function orderQuadraticFormPractice(problem, firstFactor) {
  const firstStep = problem.steps.find(step => step.box && step.box.power === 2);
  if (!firstStep || problem.steps.filter(step => step.completeFactors).length !== 2) return problem;
  const [first, second] = firstStep.polynomialAnswers;
  const parsed = parsePolynomial(normalize(firstFactor));
  if (!samePolynomial(parsed, second) || samePolynomial(parsed, first)) return problem;
  const reordered = quadraticFormPracticeProblem([second[0], second[2]], [first[0], first[2]], [0, 1]);
  if (problem.mixedSource) return mixedPracticeProblem(problem.mixedSource.gcf, reordered, 'Quadratic Form', problem.solutions);
  return problem.solutions ? solveProblem(reordered, problem.solutions, 'Quadratic Form', problem.mixed) : reordered;
}

function mixedPracticeProblem(gcf, remaining, nextMethod, solutions) {
  const outside = gcf.steps[0].answers[0];
  const nextChoice = {
    ...chooseMethod(nextMethod, 'Look at the expression remaining inside the parentheses.'),
    title: 'Which method should you use next?',
  };
  const followingSteps = remaining.steps.map(step => {
    if (!step.equation) return step;
    const grouped = Boolean(step.groupedDivision);
    return {
      ...step,
      equation: grouped ? `${outside}[${step.equation}]` : `${outside}${step.equation}`,
      result: grouped ? `${outside}[${step.result}]` : `${outside}${step.result}`,
    };
  });
  const practice = {
    equation: gcf.equation,
    factored: `${outside}${remaining.factored}`,
    zeroFactors: [...new Set([outside, ...remaining.zeroFactors])],
    groups: remaining.groups,
    remainingExpression: remaining.equation,
    mixedSource: { gcf },
    steps: [...gcf.steps, nextChoice, ...followingSteps],
  };
  return solveProblem(practice, solutions.map(String), 'GCF', true);
}

function solveProblem(practice, solutions, method, mixed = false) {
  const complex = solutions.some(solution => solution.includes('i'));
  const steps = practice.steps.map(step => {
    if (!step.division && !step.groupedDivision && !step.polynomialAnswers && !step.completeFactors) return step;
    return { ...step, equation: `${step.equation} = 0`, result: `${step.result} = 0` };
  });
  return {
    ...practice,
    equation: `${practice.equation} = 0`,
    solutions,
    method,
    mixed,
    steps: [
      ...(mixed ? [chooseMethod(method, 'Look for a GCF, groups with a shared factor, or a quadratic pattern in x².')] : []),
      ...steps,
      {
        title: 'Set each factor equal to zero.',
        note: 'Enter each nonconstant factor. The = 0 is provided; enter a repeated factor only once.',
        equation: practice.zeroFactors.map(() => '□ = 0').join(', '),
        answers: practice.zeroFactors,
        polynomialAnswers: practice.zeroFactors.map(factor => parsePolynomial(normalize(factor))),
        unordered: true,
        zeroFactors: true,
        result: practice.zeroFactors.map(factor => `${factor} = 0`).join(', '),
        hint: 'Use each factor from the factored form once, including any factor outside the parentheses.',
      },
      {
        title: 'Find all zeros.',
        note: complex
          ? 'Enter each distinct zero once. Use i for imaginary zeros.'
          : 'Enter each distinct zero once. Use sqrt( ) for square roots, such as sqrt(2)/2 or sqrt(1/2).',
        equation: `x = ${solutions.map(() => '□').join(', ')}`,
        answers: solutions,
        unordered: true,
        roots: true,
        result: `x = ${solutions.join(', ')}`,
        hint: complex
          ? 'Set each factor equal to zero. For x² = −n, use both imaginary square roots.'
          : 'Set each factor equal to zero. A repeated factor gives the same zero; for x² = n, use both square roots.',
      },
    ],
  };
}

const solve = (practice, solutions, method) => solveProblem(practice, solutions.map(String), method);
const nonMonicQuadraticForm = quadraticFormPracticeProblem([2, -1], [1, -9], [1]);

export const sections = [
  { title: 'GCF', examples: [
    solve(factorPractice[0], [0, -3], 'GCF'),
    solve(factorPractice[3], [0, 6, -2], 'GCF'),
    solve(factorPractice[5], [0, 1, 3], 'GCF'),
    solve(factorPractice[6], [0, -4, 4], 'GCF'),
    solve(factorPractice[8], [0, 4], 'GCF'),
  ] },
  { title: 'Grouping', examples: [
    solve(groupingPractice[4], [-2, -3, 3], 'Grouping'),
    solve(groupingPractice[5], [3, -2, 2], 'Grouping'),
    solve(groupingPracticeProblem(4, 25), [-4, '5i', '-5i'], 'Grouping'),
    solve(groupingPractice[7], [5, -1, 1], 'Grouping'),
    solve(groupingPracticeProblem(3, 4), [-3, '2i', '-2i'], 'Grouping'),
  ] },
  { title: 'Quadratic Form', examples: [
    solve(quadraticFormPracticeProblem([1, -4], [1, -1], [0, 1]), [-2, 2, -1, 1], 'Quadratic Form'),
    solve(quadraticFormPracticeProblem([1, -4], [1, -2], [0]), [-2, 2, '−√2', '√2'], 'Quadratic Form'),
    solve(quadraticFormPractice[4], [-3, 3, -2, 2], 'Quadratic Form'),
    solve(quadraticFormPracticeProblem([1, -4], [1, 9], [0]), [2, -2, '3i', '-3i'], 'Quadratic Form'),
    solve(nonMonicQuadraticForm, ['−√2/2', '√2/2', -3, 3], 'Quadratic Form'),
  ] },
  { title: 'Mixed Practice', examples: [
    mixedPracticeProblem(practiceProblem([1, 2, -9, -18, 0], 'x', [1, 2, -9, -18]),
      groupingPracticeProblem(2, -9, [-3, 3]), 'Grouping', [0, -2, -3, 3]),
    mixedPracticeProblem(practiceProblem([2, 10, -18, -90, 0], '2x', [1, 5, -9, -45]),
      groupingPracticeProblem(5, -9, [-3, 3]), 'Grouping', [0, -5, -3, 3]),
    mixedPracticeProblem(practiceProblem([1, 0, -5, 0, 4, 0], 'x', [1, 0, -5, 0, 4]),
      quadraticFormPracticeProblem([1, -4], [1, -1], [0, 1]), 'Quadratic Form', [0, -2, 2, -1, 1]),
    mixedPracticeProblem(practiceProblem([3, 0, -21, 0, 30, 0], '3x', [1, 0, -7, 0, 10]),
      quadraticFormPracticeProblem([1, -5], [1, -2]), 'Quadratic Form', [0, '−√5', '√5', '−√2', '√2']),
  ] },
];

function normalize(value) {
  return String(value).toLowerCase().trim().replaceAll('−', '-')
    .replace(/\s+/g, '').replace(/sqrt\((\d+)\)|√\((\d+)\)/g, (_, ascii, unicode) => '√' + (ascii ?? unicode))
    .replaceAll('²', '^2').replaceAll('³', '^3').replaceAll('⁴', '^4')
    .replaceAll('⁵', '^5').replaceAll('⁶', '^6').replace(/^\(([^()]+)\)$/, '$1');
}

function normalizeRoot(value) {
  const text = normalize(value).replace(/^\+/, '');
  const imaginary = /^(-?)(?:(\d+)i|i(\d*)?)$/.exec(text);
  if (imaginary) {
    const magnitude = imaginary[2] || imaginary[3] || '1';
    if (magnitude.length > 15) return `raw:${text}`;
    const coefficient = BigInt(magnitude);
    return `imaginary:${coefficient === 0n ? '' : imaginary[1]}${coefficient}`;
  }
  const dividedRoot = /^(-?)√(\d+)(?:\/(\d+))?$/.exec(text);
  const rootOfFraction = /^(-?)(?:sqrt|√)\((\d+)\/(\d+)\)$/.exec(text);
  const match = dividedRoot || rootOfFraction;
  if (!match || match[2].length > 15 || (match[3] && match[3].length > 15)) return `raw:${text}`;
  let numerator = BigInt(match[2]);
  let denominator = BigInt(match[3] || '1');
  if (denominator === 0n) return `raw:${text}`;
  if (dividedRoot) denominator *= denominator;
  let a = numerator;
  let b = denominator;
  while (b !== 0n) [a, b] = [b, a % b];
  numerator /= a;
  denominator /= a;
  return `radical:${numerator === 0n ? '' : match[1]}${numerator}/${denominator}`;
}

function sameZeroFactor(actual, expected) {
  if (!actual || !expected || !actual.every(Number.isFinite)) return false;
  const pivot = expected.findIndex(value => value !== 0);
  if (pivot < 0 || actual[pivot] === 0) return false;
  return actual.every((value, index) => {
    const left = value * expected[pivot];
    const right = expected[index] * actual[pivot];
    return Number.isFinite(left) && Number.isFinite(right) && left === right;
  });
}

export function checkStep(step, values) {
  if (step.polynomialAnswers) {
    const unused = new Set(step.polynomialAnswers.keys());
    return values.map((value, index) => {
      const parsed = parsePolynomial(normalize(value));
      const match = [...unused].find(i => (step.unordered || i === index)
        && (step.zeroFactors ? sameZeroFactor(parsed, step.polynomialAnswers[i]) : samePolynomial(parsed, step.polynomialAnswers[i])));
      if (match === undefined) return false;
      unused.delete(match);
      return true;
    });
  }
  const clean = step.completeFactors ? parseFactor : step.roots ? normalizeRoot : normalize;
  const expected = step.answers.map(clean);
  if (!step.unordered && !step.powers) return values.map((value, index) =>
    step.polynomialAnswer && index === step.polynomialAnswer.index
      ? matchesPolynomial(normalize(value), step.polynomialAnswer.coefficients)
      : clean(value) === expected[index]);
  const unused = new Set(expected.keys());
  return values.map((value, index) => {
    const match = [...unused].find(i => clean(value) === expected[i] && (!step.powers || step.powers[i] === step.powers[index]));
    if (match === undefined) return false;
    unused.delete(match);
    return true;
  });
}
