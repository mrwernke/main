import test from 'node:test';
import assert from 'node:assert/strict';
import {
  guidedProblems, challengeProblems, equationText, isolatedValue, afterConstant,
  solutions, stepChoices, absChoices, parseInteger, branchText,
} from './model.mjs';

test('every problem isolates to a positive integer and has two distinct integer solutions', () => {
  for (const problem of [...guidedProblems, ...challengeProblems]) {
    const value = isolatedValue(problem);
    assert.ok(Number.isInteger(afterConstant(problem)), 'constant step stays an integer');
    assert.ok(Number.isInteger(value) && value > 0, 'isolated absolute value is a positive integer');
    const [first, second] = solutions(problem);
    assert.ok(Number.isInteger(first) && Number.isInteger(second), 'solutions are integers');
    assert.notEqual(first, second);
    for (const x of [first, second]) {
      assert.equal(problem.a * Math.abs(problem.b * x + problem.c) + problem.d, problem.e);
    }
  }
});

test('only the third problem in each set uses a b-value other than 1', () => {
  for (const set of [guidedProblems, challengeProblems]) {
    assert.equal(set.length, 3);
    assert.deepEqual(set.map(problem => problem.b !== 1), [false, false, true]);
  }
});

test('the lesson example renders and solves as 3|x − 2| + 4 = 19', () => {
  const example = guidedProblems[0];
  assert.equal(equationText(example), '3|x \u2212 2| + 4 = 19');
  assert.equal(isolatedValue(example), 5);
  assert.deepEqual(solutions(example), [7, -3]);
  assert.equal(branchText(example, 1), 'x \u2212 2 = +5');
  assert.equal(branchText(example, -1), 'x \u2212 2 = \u22125');
});

test('step choices match the five lesson options in order', () => {
  const labels = stepChoices(guidedProblems[0]).map(choice => choice.label);
  assert.deepEqual(labels, [
    'Distribute the 3',
    'Divide by 3',
    'Add 2',
    'Subtract 4',
    'Make x \u2212 2 become x + 2',
  ]);
});

test('constant step adapts to the sign of d', () => {
  const labels = stepChoices(guidedProblems[1]).map(choice => choice.label);
  assert.ok(labels.includes('Add 3'));
  assert.ok(labels.includes('Subtract 5'));
});

test('absolute value choices offer four strategies with the two-equation option correct', () => {
  const choices = absChoices(guidedProblems[0]);
  assert.equal(choices.length, 4);
  assert.deepEqual(choices.map(choice => choice.id), ['ignore', 'flip-inside', 'negate-other', 'two-equations']);
  assert.equal(choices[3].label, 'Write two equations equal to +5 and \u22125');
});

test('parseInteger accepts signed integers and rejects everything else', () => {
  assert.equal(parseInteger(' 7 '), 7);
  assert.equal(parseInteger('-12'), -12);
  assert.equal(parseInteger('\u22123'), -3);
  assert.equal(parseInteger('+4'), 4);
  assert.equal(parseInteger(''), null);
  assert.equal(parseInteger('3.5'), null);
  assert.equal(parseInteger('two'), null);
  assert.equal(parseInteger(null), null);
});
