import test from 'node:test';
import assert from 'node:assert/strict';
import { examples, fractionText, checkList, candidateFromInput, syntheticTrial, successfulFactorization, checkSolutions } from './model.mjs';
import { checkStep } from '../polynomial-factoring/model.mjs';
import { parseRationalNumber } from '../quadratic-convert/model.mjs';

function evaluateScaled(coefficients, numerator, denominator) {
  let total = 0;
  for (let i = 0; i < coefficients.length; i++) {
    total = total * numerator + coefficients[i] * denominator ** i;
  }
  return total;
}

test('eight cubics and quartics progress from monic to non-monic', () => {
  assert.equal(examples.length, 8);
  assert.deepEqual(examples.map(item => item.dividend.length - 1), [3, 3, 3, 4, 3, 3, 4, 4]);
  assert.ok(examples.slice(0, 4).every(item => item.dividend[0] === 1));
  assert.ok(examples.slice(4).every(item => item.dividend[0] > 1));
  for (const example of examples) {
    assert.ok(example.solutions.some(solution => solution.includes('i') || solution.includes('sqrt')) || example === examples[0]);
    assert.equal(example.realCount + example.complexCount, example.dividend.length - 1);
    assert.deepEqual(checkSolutions([...example.solutions].reverse(), example.solutions), example.solutions.map(() => true));
    for (const solution of example.solutions) {
      const imaginary = solution.endsWith('i');
      const radical = solution.includes('sqrt');
      const real = imaginary ? 0 : radical ? (solution.startsWith('-') ? -1 : 1) * Math.sqrt(7)
        : parseRationalNumber(solution).value;
      const imaginaryPart = imaginary ? Number(solution.slice(0, -1)) : 0;
      let a = 0;
      let b = 0;
      for (const coefficient of example.dividend) {
        [a, b] = [a * real - b * imaginaryPart + coefficient, a * imaginaryPart + b * real];
      }
      assert.ok(Math.abs(a) < 1e-8 && Math.abs(b) < 1e-8, `${solution} must solve ${example.dividend}`);
    }
  }
});

test('factor and candidate lists check all distinct values, including equivalent fractions', () => {
  const example = examples[4];
  assert.equal(checkList('4, 2, 1', example.constantFactors), true);
  assert.equal(checkList('1, 2', example.leadingFactors), true);
  assert.equal(checkList('1, 2, 4, 1/2, 2/2', example.candidates, true), true);
  assert.equal(checkList('1, 2, 4', example.candidates, true), false);
  assert.equal(checkList('1, 2, 4, 1/2, 3', example.candidates, true), false);
  assert.equal(checkList('1, 2, -4', example.constantFactors), false);
  assert.equal(checkList('1, 2, 4,', example.constantFactors), false);
  assert.deepEqual(candidateFromInput('-2/4', example), { numerator: -1, denominator: 2 });
  assert.equal(candidateFromInput('1/3', example), null);
});

test('every positive and negative candidate produces an exact trial and all valid roots can be used', () => {
  for (const example of examples) {
    let successes = 0;
    for (const candidate of example.candidates) {
      for (const sign of [-1, 1]) {
        const root = { ...candidate, numerator: sign * candidate.numerator };
        const trial = syntheticTrial(example, root);
        const expected = evaluateScaled(example.dividend, root.numerator, root.denominator);
        assert.equal(trial.remainder.numerator * root.denominator ** (example.dividend.length - 1),
          expected * trial.remainder.denominator);
        const factorization = successfulFactorization(example, root);
        assert.equal(Boolean(factorization), trial.remainder.numerator === 0);
        if (factorization) {
          successes++;
          assert.deepEqual(trial.results.slice(0, -1).map(value => parseRationalNumber(value).value / root.denominator),
            factorization.quotient);
          assert.deepEqual(checkStep(factorization.factorEquations, [...factorization.factorTexts].reverse()),
            factorization.factorTexts.map(() => true));
        }
      }
    }
    assert.ok(successes > 0);
  }
});

test('fractional trials remain exact and solution checks reject duplicates', () => {
  const trial = syntheticTrial(examples[5], candidateFromInput('1/3', examples[5]));
  assert.ok(trial.products.some(value => value.includes('/')));
  assert.equal(fractionText(trial.remainder), '-62/3');
  assert.deepEqual(checkSolutions(['-4/6', '-sqrt(7)', '√7'], examples[5].solutions), [true, true, true]);
  assert.notDeepEqual(checkSolutions(['-2/3', 'sqrt(7)', 'sqrt(7)'], examples[5].solutions), [true, true, true]);
});
