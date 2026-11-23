import test from 'node:test';
import assert from 'node:assert/strict';
import { examples, givenText, checkStep } from './model.mjs';
import { polynomialText, checkAnswer } from '../polynomial-synthetic-division/model.mjs';
import { parsePolynomial } from '../quadratic-systems/model.mjs';

function multiply(first, second) {
  const result = Array(first.length + second.length - 1).fill(0);
  first.forEach((value, i) => second.forEach((factor, j) => { result[i + j] += value * factor; }));
  return result;
}

test('ten examples cover the given information and factoring paths', () => {
  assert.equal(examples.length, 10);
  assert.deepEqual(examples.map(example => example.kind),
    ['quadratic', 'quadratic', 'square-root', 'quadratic', 'grouping', 'square-root', 'grouping', 'square-root', 'quadratic-form', 'quadratic-form']);
  assert.deepEqual(new Set(examples.map(example => example.given)), new Set(['factor', 'root', 'zero', 'x-intercept']));
  for (const example of examples) {
    assert.equal(example.remainder, 0);
    assert.ok(givenText(example).includes(example.given));
    assert.deepEqual(multiply(example.divisor, example.quotient), example.dividend);
    const expanded = example.factorEquations.polynomialAnswers.reduce(multiply);
    assert.deepEqual(expanded.slice(expanded.findIndex(value => value !== 0)), example.dividend);
    assert.equal(example.solutions.length, example.dividend.length - 1);
    assert.equal(example.realCount + example.complexCount, example.solutions.length);
    assert.deepEqual(checkStep(example.factorEquations, [...example.zeroFactors].reverse()), example.zeroFactors.map(() => true));
    assert.deepEqual(checkStep(example.rootStep, [...example.solutions].reverse()), example.solutions.map(() => true));
    for (const solution of example.solutions) {
      const imaginary = solution.endsWith('i');
      const real = imaginary ? 0 : Number(solution);
      const imaginaryPart = solution === '-i' ? -1 : imaginary ? Number(solution.slice(0, -1) || '1') : 0;
      let a = 0;
      let b = 0;
      for (const coefficient of example.dividend) {
        [a, b] = [a * real - b * imaginaryPart + coefficient, a * imaginaryPart + b * real];
      }
      assert.equal(Math.abs(a), 0, `${polynomialText(example.dividend)} at ${solution}`);
      assert.equal(Math.abs(b), 0, `${polynomialText(example.dividend)} at ${solution}`);
    }
  }
});

test('grouping and quadratic steps reuse P8 checks', () => {
  for (const example of examples.filter(item => item.kind === 'quadratic')) {
    const step = example.practice.steps[2];
    assert.deepEqual(checkStep(step, [...step.answers].reverse()), [true, true]);
    assert.notDeepEqual(checkStep(step, ['', step.answers[1]]), [true, true]);
  }
  for (const example of examples.filter(item => item.kind === 'grouping')) {
    assert.equal(example.practice.equation, polynomialText(example.quotient));
    for (const step of example.practice.steps.slice(1)) {
      assert.deepEqual(checkStep(step, step.answers), step.answers.map(() => true));
    }
    assert.equal(example.practice.steps[3].answers[0].startsWith('x²'), true);
  }
});

test('square-root examples require both complex solutions and reject incorrect quotient work', () => {
  for (const example of examples.filter(item => item.kind === 'square-root')) {
    assert.equal(example.realCount, 1);
    assert.equal(example.complexCount, 2);
    assert.equal(example.square, -example.quotient[2]);
    assert.deepEqual(checkStep(example.rootStep, example.solutions), [true, true, true]);
    assert.notDeepEqual(checkStep(example.rootStep, [example.solutions[0], example.solutions[1], example.solutions[1]]), [true, true, true]);
    assert.equal(checkAnswer(polynomialText(example.quotient), example.quotient), true);
    assert.equal(checkAnswer('x^2-4', example.quotient), false);
  }
});

test('example 3 has solutions 5 and ±i', () => {
  const example = examples[2];
  assert.deepEqual(example.dividend, [1, -5, 1, -5]);
  assert.deepEqual(checkStep(example.rootStep, ['+i', '5', '-i']), [true, true, true]);
  assert.deepEqual(checkStep(example.rootStep, ['1i', '-1i', '5']), [true, true, true]);
});

test('examples 6 and 7 use the swapped problems', () => {
  assert.deepEqual(examples[5].dividend, [1, -3, 4, -12]);
  assert.deepEqual(examples[6].dividend, [1, 2, -33, -50, 200]);
});

test('examples 9 and 10 factor their quartic quotients and have the requested roots', () => {
  const expected = [
    { dividend: [1, 2, 7, 14, -144, -288], roots: ['-2', '3', '-3', '4i', '-4i'], factors: ['x^2-9', 'x^2+16'], squares: [-16] },
    { dividend: [1, 4, 13, 52, 36, 144], roots: ['-4', '2i', '-2i', '3i', '-3i'], factors: ['x^2+4', 'x^2+9'], squares: [-4, -9] },
  ];
  expected.forEach((item, index) => {
    const example = examples[index + 8];
    assert.deepEqual(example.dividend, item.dividend);
    assert.ok(polynomialText(example.dividend).startsWith('x⁵'));
    assert.equal(checkAnswer(polynomialText(example.quotient), example.quotient), true);
    assert.deepEqual(checkStep(example.practice.steps[0], item.factors), [true, true]);
    assert.deepEqual(checkStep(example.practice.steps[0], [...item.factors].reverse()), [true, true]);
    assert.notDeepEqual(checkStep(example.practice.steps[0], [item.factors[0], item.factors[0]]), [true, true]);
    assert.deepEqual(example.squareSteps.map(step => step.value), item.squares);
    assert.deepEqual(checkStep(example.rootStep, item.roots), item.roots.map(() => true));
    assert.notDeepEqual(checkStep(example.rootStep, item.roots.map(() => item.roots[0])), item.roots.map(() => true));
    for (const step of example.practice.steps.slice(1)) {
      assert.deepEqual(checkStep(step, step.answers), step.answers.map(() => true));
    }
  });
});

test('square-root help identifies each quadratic and accepts both distinct roots', () => {
  for (const example of examples) {
    const quadraticFactors = example.zeroFactors.filter(factor => factor.includes('²'));
    assert.deepEqual(example.squareSteps.map(step => step.factor), quadraticFactors);
    for (const step of example.squareSteps) {
      const coefficients = parsePolynomial(step.factor.replaceAll('²', '^2').replaceAll('−', '-'));
      assert.deepEqual(coefficients, [1, 0, -step.value]);
      assert.equal(step.solutions.length, 2);
      assert.ok(step.solutions.every(solution => example.solutions.includes(solution)));
      const rootStep = { answers: step.solutions, roots: true, unordered: true };
      assert.deepEqual(checkStep(rootStep, [...step.solutions].reverse()), [true, true]);
      assert.notDeepEqual(checkStep(rootStep, [step.solutions[0], step.solutions[0]]), [true, true]);
    }
  }
});
