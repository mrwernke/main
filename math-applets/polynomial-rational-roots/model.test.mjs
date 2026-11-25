import test from 'node:test';
import assert from 'node:assert/strict';
import { examples, fractionText, factoredText, checkList, candidateFromInput, hasRemainingRationalRoot, syntheticTrial, successfulFactorization, advanceKnownFactors, checkSolutions } from './model.mjs';
import { continuedTrial, checkAlgebraic, isZero } from './algebraic.mjs';
import { simplifyFraction, parseRationalNumber } from '../quadratic-convert/model.mjs';
import { checkStep } from '../polynomial-factoring/model.mjs';

function rootsWithMultiplicity(example) {
  return example.factors.flatMap(factor => factor.length === 2
    ? [fractionText(simplifyFraction(-factor[1], factor[0]))]
    : example.solutions.filter(solution => solution.includes('i') || solution.includes('sqrt')));
}

function permutations(values) {
  if (!values.length) return [[]];
  return values.flatMap((value, index) =>
    permutations(values.filter((_, i) => i !== index)).map(rest => [value, ...rest]));
}

test('examples cover the requested categories, degrees, leading coefficients and repeated roots', () => {
  assert.equal(examples.length, 22);
  const rational = examples.slice(0, 7);
  const irrational = examples.slice(7, 12);
  const complex = examples.slice(12, 20);
  assert.deepEqual(rational.map(example => [example.dividend.length - 1, example.dividend[0]]),
    [[3, 1], [3, 1], [3, 1], [4, 1], [4, 1], [3, 3], [4, 2]]);
  assert.ok(rational.every(example => example.solutions.every(solution => !solution.includes('sqrt') && !solution.includes('i'))));
  assert.deepEqual(irrational.map(example => example.dividend.length - 1), [3, 3, 3, 4, 4]);
  assert.ok(irrational.every(example => example.dividend[0] === 1 && example.solutions.filter(s => s.includes('sqrt')).length === 2));
  assert.deepEqual(complex.map(example => example.dividend.length - 1), [3, 3, 3, 3, 3, 4, 4, 4]);
  assert.ok(complex.every(example => example.solutions.filter(s => s.includes('i')).length === 2));
  assert.ok(complex.some(example => example.solutions.some(s => s.includes('sqrt') && s.includes('i'))));
  for (const example of examples) {
    const distinct = [...new Set(rootsWithMultiplicity(example))];
    assert.equal(example.solutions.length, distinct.length);
    assert.deepEqual(checkSolutions(distinct, example.solutions, example.basis), distinct.map(() => true));
  }
  for (const index of [1, 4, 11]) {
    const example = examples[index];
    assert.equal(rootsWithMultiplicity(example).length, example.dividend.length - 1);
    assert.equal(new Set(rootsWithMultiplicity(example)).size, example.dividend.length - 2);
  }
});

test('example 17 solves the difference of cubes with non-real complex roots', () => {
  const example = examples[16];
  assert.deepEqual(example.dividend, [1, 0, 0, -8]);
  assert.equal(successfulFactorization(example, candidateFromInput('2', example)).factored, '(x − 2)(x² + 2x + 4)');
  assert.deepEqual(checkSolutions(['2', '-1+sqrt(3)i', '-1-sqrt(3)i'], example.solutions, example.basis), [true, true, true]);
  assert.deepEqual(checkSolutions(['2', '-1+1/2sqrt(12)i', '-1-sqrt(3)i'], example.solutions, example.basis), [true, true, true]);
  assert.notDeepEqual(checkSolutions(['2', 'sqrt(3)i', '-sqrt(3)i'], example.solutions, example.basis), [true, true, true]);
  assert.deepEqual([example.realCount, example.complexCount], [1, 2]);
});

test('examples 21 and 22 have the requested irrational and complex solutions', () => {
  for (const [index, dividend, root, factored, solutions, counts] of [
    [20, [1, -2, -7, 2], '-2', '(x + 2)(x² − 4x + 1)', ['-2', '2+sqrt(3)', '2-sqrt(3)'], [3, 0]],
    [21, [1, -5, 11, -15], '3', '(x − 3)(x² − 2x + 5)', ['3', '1+2i', '1-2i'], [1, 2]],
  ]) {
    const example = examples[index];
    assert.deepEqual(example.dividend, dividend);
    assert.equal(successfulFactorization(example, candidateFromInput(root, example)).factored, factored);
    assert.deepEqual(checkSolutions(solutions, example.solutions, example.basis), [true, true, true]);
    assert.deepEqual([example.realCount, example.complexCount], counts);
  }
  const real = examples[20];
  assert.deepEqual(checkSolutions(['-2', '2+1/2sqrt(12)', '2-sqrt(3)'], real.solutions, real.basis), [true, true, true]);
  assert.notDeepEqual(checkSolutions(['-2', 'sqrt(3)', '-sqrt(3)'], real.solutions, real.basis), [true, true, true]);
  const complex = examples[21];
  assert.notDeepEqual(checkSolutions(['3', '2i', '-2i'], complex.solutions, complex.basis), [true, true, true]);
});

test('candidate lists put integers before fractions while accepting equivalent inputs', () => {
  const example = examples[5];
  assert.deepEqual(example.candidates.map(fractionText), ['1', '2', '1/3', '2/3']);
  assert.equal(checkList('1, 2', example.constantFactors), true);
  assert.equal(checkList('1, 3', example.leadingFactors), true);
  assert.equal(checkList('1, 2, 1/3, 2/3, 2/6', example.candidates, true), true);
  assert.equal(checkList('1, 2, 1/3', example.candidates, true), false);
  assert.equal(checkList('1, 2, -1/3, 2/3', example.candidates, true), false);
  assert.deepEqual(candidateFromInput('-2/6', example), { numerator: -1, denominator: 3 });
  assert.equal(candidateFromInput('1/4', example), null);
  assert.equal(candidateFromInput('sqrt(7)', example), null);
  assert.equal(candidateFromInput('2i', example), null);
});

test('factored forms identify repeated factors and their distinct real roots', () => {
  for (const [index, root, expected, repeated] of [
    [1, '-1', '(x + 1)(x − 2)²', '2'],
    [4, '-2', '(x + 2)(x − 2)²(x + 3)', '2'],
    [11, '1', '(x − 1)²(x² − 7)', '1'],
  ]) {
    const example = examples[index];
    assert.equal(successfulFactorization(example, candidateFromInput(root, example)).factored, expected);
    assert.deepEqual(example.repeatedRoots, [[repeated, 2]]);
  }
  assert.equal(factoredText([[1, -2], [1, 1], [1, -2]]), '(x − 2)²(x + 1)');
  assert.deepEqual(examples[0].repeatedRoots, []);
});

test('continuation detects remaining rational roots, including repeated and fractional roots', () => {
  for (const example of examples) {
    const rationalRoots = rootsWithMultiplicity(example).filter(root => parseRationalNumber(root));
    for (const roots of permutations(rationalRoots)) {
      let dividend = example.dividend.map(String);
      for (const root of roots) {
        assert.equal(hasRemainingRationalRoot(example, dividend), true, `${root} remains in ${dividend}`);
        const trial = continuedTrial(dividend, root, example.basis);
        assert.ok(isZero(trial.remainder));
        dividend = trial.results.slice(0, -1);
      }
      assert.equal(hasRemainingRationalRoot(example, dividend), false, `no rational roots should remain in ${dividend}`);
    }
  }
});

test('each rational candidate has an exact trial and every valid first root has a factorization', () => {
  for (const example of examples) {
    let successes = 0;
    for (const candidate of example.candidates) {
      for (const sign of [-1, 1]) {
        const root = { ...candidate, numerator: sign * candidate.numerator };
        const trial = syntheticTrial(example, root);
        const factorization = successfulFactorization(example, root);
        assert.equal(Boolean(factorization), trial.remainder.numerator === 0);
        if (factorization) {
          successes++;
          assert.deepEqual(trial.results.slice(0, -1).map(value => parseRationalNumber(value).value / root.denominator),
            factorization.quotient);
          assert.deepEqual(checkStep(factorization.factorEquations, [...factorization.distinctFactors].reverse()),
            factorization.distinctFactors.map(() => true));
        }
      }
    }
    assert.ok(successes > 0);
  }
});

test('continued factorizations preserve repeated and non-monic factors and the remaining quotient', () => {
  for (const example of examples) {
    const rationalRoots = rootsWithMultiplicity(example).filter(root => parseRationalNumber(root));
    for (const roots of permutations(rationalRoots)) {
      let state = { divided: [], remaining: example.factors };
      let dividend = example.dividend.map(String);
      let denominator = 1;
      for (const text of roots) {
        const root = candidateFromInput(text, example);
        const trial = continuedTrial(dividend, text, example.basis);
        state = advanceKnownFactors(state.divided, state.remaining, root);
        assert.ok(state, `missing factor for ${text}`);
        denominator *= root.denominator;
        const quotient = trial.results.slice(0, -1).map(value => parseRationalNumber(value).value / denominator);
        assert.deepEqual(quotient, state.quotient || [1]);
        assert.equal(state.written.length, state.divided.length + (state.quotient ? 1 : 0));
        dividend = trial.results.slice(0, -1);
      }
    }
  }
  const example = examples[1];
  const first = advanceKnownFactors([], example.factors, candidateFromInput('2', example));
  assert.equal(advanceKnownFactors(first.divided, first.remaining, candidateFromInput('4', example)), null);
  assert.equal(first.divided.length, 1);
});

test('synthetic division through every root in any order leaves the leading coefficient', () => {
  for (const example of examples) {
    for (const roots of permutations(rootsWithMultiplicity(example))) {
      let dividend = example.dividend.map(String);
      for (const root of roots) {
        const trial = continuedTrial(dividend, root, example.basis);
        assert.ok(trial, `could not divide by ${root}`);
        assert.ok(isZero(trial.remainder), `${root} is not a root of ${dividend}`);
        dividend = trial.results.slice(0, -1);
      }
      assert.deepEqual(dividend, [String(example.dividend[0])]);
    }
  }
});

test('continued work checks exact radical and complex expressions', () => {
  assert.ok(checkAlgebraic('sqrt(12)i', '2sqrt(3)i', -3));
  assert.ok(checkAlgebraic('2*√(3)*i', '2sqrt(3)i', -3));
  assert.ok(checkAlgebraic('1-sqrt(12)i', '1-2sqrt(3)i', -3));
  assert.ok(checkAlgebraic('0.5', '1/2', -3));
  assert.equal(checkAlgebraic('1+2sqrt(3)i', '1-2sqrt(3)i', -3), false);
  assert.equal(checkAlgebraic('2sqrt(2)i', '2sqrt(3)i', -3), false);
  assert.equal(checkAlgebraic('1**2', '12', -3), false);
  const large = 9007199254740991n;
  const trial = continuedTrial(['1', '0', '9'], String(large), -1);
  assert.equal(trial.results.at(-1), String(large * large + 9n));
  const example = examples[14];
  assert.deepEqual(checkSolutions(['1', 'sqrt(12)i', '-2sqrt(3)i'], example.solutions, example.basis), [true, true, true]);
  assert.notDeepEqual(checkSolutions(['1', '2sqrt(3)i', 'sqrt(12)i'], example.solutions, example.basis), [true, true, true]);
});
