import test from 'node:test';
import assert from 'node:assert/strict';
import { exercises, nonMonicExercises, parseInteger, parseFactor, parseCompleteFactor, linearTerm, expressionText, factoredText, assess } from './model.mjs';

test('complete factors require x and accept signed integer constants and whitespace', () => {
  for (const [text, expected] of [['x+3', 3], ['x-7', -7], [' x − 4 ', -4], ['x', 0], ['x+0', 0], ['x - 0', 0]]) {
    assert.equal(parseFactor(text), expected);
  }
  for (const text of ['', '3', '(x+3)', '2x+3', 'x+1.5', 'x+-3', 'x+3x', 'x+9007199254740992']) {
    assert.ok(Number.isNaN(parseFactor(text)));
  }
  assert.equal(assess(exercises[0], parseFactor('x+2'), parseFactor('x-7')).complete, true);
});

test('every example is distinct and factors with small integers in either order', () => {
  assert.equal(exercises.length, 20);
  assert.equal(new Set(exercises.map(expressionText)).size, exercises.length);
  assert.deepEqual(exercises[0], { b: -5, c: -14 });
  for (const item of exercises) {
    const first = Array.from({ length: 21 }, (_, i) => i - 10)
      .find(value => value * (item.b - value) === item.c);
    assert.notEqual(first, undefined);
    const second = item.b - first;
    assert.ok(Math.abs(first) <= 12 && Math.abs(second) <= 12);
    assert.ok(Math.abs(item.c) <= 100);
    assert.equal(assess(item, first, second).complete, true);
    assert.equal(assess(item, second, first).complete, true);
  }
});

test('product and sum are checked independently', () => {
  const item = exercises[0];
  assert.deepEqual(assess(item, -7, 2), {
    ready: true, product: -14, sum: -5,
    leading: 1, topRight: -7, bottomLeft: 2, leadingCorrect: true,
    productCorrect: true, sumCorrect: true, complete: true,
  });

  assert.equal(assess(item, 7, -2).productCorrect, true);
  assert.equal(assess(item, 7, -2).sumCorrect, false);
  assert.equal(assess(item, -6, 1).productCorrect, false);
  assert.equal(assess(item, -6, 1).sumCorrect, true);
  assert.equal(assess(item, 3, 4).complete, false);
});

test('non-monic bank covers every a from 2 to 9 with two factorable examples each', () => {
  assert.equal(nonMonicExercises.length, 16);
  assert.equal(new Set(nonMonicExercises.map(expressionText)).size, 16);
  for (let a = 2; a <= 9; a++) assert.equal(nonMonicExercises.filter(item => item.a === a).length, 2);
  for (const item of nonMonicExercises) {
    let solution;
    for (let topA = 1; topA <= item.a; topA++) {
      if (item.a % topA) continue;
      const sideA = item.a / topA;
      for (let first = -12; first <= 12; first++) {
        for (let second = -12; second <= 12; second++) {
          if (assess(item, first, second, topA, sideA).complete) solution = [first, second, topA, sideA];
        }
      }
    }
    assert.ok(solution, expressionText(item));
    const [first, second, topA, sideA] = solution;
    assert.equal(assess(item, second, first, sideA, topA).complete, true);
  }
});

test('non-monic checks use cross products and require the correct leading coefficient', () => {
  const item = { a: 6, b: -7, c: -20 };
  const result = assess(item, -5, 4, 2, 3);
  assert.equal(result.topRight, -15);
  assert.equal(result.bottomLeft, 8);
  assert.equal(result.sum, -7);
  assert.equal(result.complete, true);
  const wrongLeading = assess({ a: 9, b: 0, c: -49 }, -7, 7, 1, 1);
  assert.equal(wrongLeading.productCorrect, true);
  assert.equal(wrongLeading.sumCorrect, true);
  assert.equal(wrongLeading.leadingCorrect, false);
  assert.equal(wrongLeading.complete, false);
  assert.equal(assess(item, -5, 4, 0, 3).ready, false);
  assert.equal(assess(item, -5, 4, -2, -3).ready, false);
  assert.equal(assess(item, NaN, NaN, 2, 3).leadingCorrect, true);
  assert.equal(assess(item, NaN, NaN, 2, 3).complete, false);
  assert.equal(assess(item, NaN, NaN, 1, 3).leadingCorrect, false);
});

test('complete factors support positive x-coefficients without evaluating expressions', () => {
  assert.deepEqual(parseCompleteFactor('2x+3'), { coefficient: 2, constant: 3 });
  assert.deepEqual(parseCompleteFactor(' 3x − 7 '), { coefficient: 3, constant: -7 });
  assert.deepEqual(parseCompleteFactor('6x'), { coefficient: 6, constant: 0 });
  for (const text of ['0x+3', '-2x+3', '2.5x+3', '2x+3x', '2*x+3', 'x+1/2']) {
    assert.equal(parseCompleteFactor(text), null);
  }
  assert.equal(expressionText({ a: 6, b: -7, c: -20 }), '6x² − 7x − 20');
  assert.equal(factoredText(-5, 4, 2, 3), '(2x − 5)(3x + 4)');
});

test('mixed difference-of-squares examples use opposite constants and cancel the x-terms', () => {
  assert.deepEqual(exercises.filter(item => item.b === 0).map(item => item.c), [-16, -9, -25, -36, -49, -100]);
  for (const item of exercises.filter(item => item.b === 0)) {
    const root = Math.sqrt(-item.c);
    assert.equal(Number.isInteger(root), true);
    assert.equal(assess(item, root, -root).complete, true);
    assert.equal(assess(item, parseFactor(`x-${root}`), parseFactor(`x+${root}`)).complete, true);
    assert.equal(linearTerm(root - root), '0x');
  }
});

test('practice includes two zero constants and constants reaching positive and negative 100', () => {
  assert.deepEqual(exercises.filter(item => item.c === 0), [{ b: 5, c: 0 }, { b: -6, c: 0 }]);
  assert.equal(assess({ b: -6, c: 0 }, 0, -6).complete, true);
  assert.equal(Math.max(...exercises.map(item => item.c)), 100);
  assert.equal(Math.min(...exercises.map(item => item.c)), -100);
  assert.deepEqual(exercises.filter(item => Math.abs(item.c) >= 50 && Math.abs(item.c) <= 70),
    [{ b: 15, c: 56 }, { b: -7, c: -60 }, { b: -16, c: 63 }]);
});

test('blank, malformed, fractional, and unsafe values cannot complete a check', () => {
  for (const value of ['', ' ', '2x', '1/2', '1.5', 'Infinity', '9007199254740992']) {
    assert.ok(Number.isNaN(parseInteger(value)));
    assert.equal(assess(exercises[0], parseInteger(value), 2).ready, false);
  }
  assert.equal(parseInteger('−7'), -7);
  assert.equal(parseInteger('+2'), 2);
  assert.equal(parseInteger('0'), 0);
  assert.equal(assess(exercises[0], Number.MAX_SAFE_INTEGER, 2).ready, false);
});

test('zero, repeated factors, signs, and unit coefficients display clearly', () => {
  assert.equal(expressionText(exercises[0]), 'x² − 5x − 14');
  assert.equal(expressionText({ b: 0, c: -16 }), 'x² − 16');
  assert.equal(expressionText({ b: 1, c: 0 }), 'x² + x');
  assert.equal(factoredText(-7, 2), '(x − 7)(x + 2)');
  assert.equal(factoredText(0, 5), '(x)(x + 5)');
  assert.equal(linearTerm(-1), '−x');
  assert.equal(linearTerm(1), 'x');
  assert.equal(linearTerm(0), '0x');
  assert.equal(assess({ b: 6, c: 9 }, 3, 3).complete, true);
  assert.equal(assess({ b: 5, c: 0 }, 0, 5).complete, true);
});
