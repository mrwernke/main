import test from 'node:test';
import assert from 'node:assert/strict';
import { examples, polynomialText, checkAnswer, checkInteger, checkRoot } from './model.mjs';

test('seven examples include the reference problems and requested non-monic divisors', () => {
  assert.equal(examples.length, 7);
  assert.deepEqual(examples[0].dividend, [4, 1, -11, 6]);
  assert.deepEqual(examples[0].divisor, [1, -1]);
  assert.deepEqual(examples[0].results, [4, 5, -6, 0]);
  assert.deepEqual(examples[1].dividend, [1, 1, -7, 0, 3]);
  assert.deepEqual(examples[1].divisor, [1, 2]);
  assert.deepEqual(examples[1].results, [1, -1, -5, 10, -17]);
  assert.equal(examples[3].remainder, 0);
  assert.deepEqual(examples[4].dividend, [3, -5, 0, -1, 2]);
  assert.deepEqual(examples[4].divisor, [1, -2]);
  assert.deepEqual(examples[4].results, [3, 1, 2, 3, 8]);
  assert.deepEqual(examples[5].dividend, [4, 4, -5, 1]);
  assert.deepEqual(examples[5].divisor, [2, -1]);
  assert.deepEqual(examples[5].products, [2, 3, -1]);
  assert.deepEqual(examples[5].quotient, [2, 3, -1]);
  assert.equal(examples[5].remainder, 0);
  assert.deepEqual(examples[6].divisor, [3, 2]);
  assert.deepEqual(examples[6].products, [-2, -4, 2, -6]);
  assert.deepEqual(examples[6].quotient, [1, 2, -1, 3]);
  assert.equal(examples[6].remainder, -4);
  for (const example of examples.slice(5)) {
    assert.ok(example.products.every(Number.isInteger));
    assert.ok(example.results.every(Number.isInteger));
  }
  assert.ok(examples.some(example => example.remainder === 0));
  assert.ok(examples.some(example => example.remainder !== 0));
});

test('each synthetic division column and final answer reconstructs the dividend', () => {
  for (const example of examples) {
    assert.equal(example.results[0], example.dividend[0]);
    for (let index = 1; index < example.dividend.length; index++) {
      assert.equal(example.products[index - 1], example.root * example.results[index - 1]);
      assert.equal(example.results[index], example.dividend[index] + example.products[index - 1]);
    }
    const reconstructed = Array(example.dividend.length).fill(0);
    example.quotient.forEach((coefficient, index) => {
      reconstructed[index] += coefficient * example.divisor[0];
      reconstructed[index + 1] += coefficient * example.divisor[1];
    });
    reconstructed[reconstructed.length - 1] += example.remainder;
    assert.deepEqual(reconstructed, example.dividend);
  }
});

test('answer checking handles zeros, signs, and polynomial quotient', () => {
  assert.equal(checkInteger('−2', -2), true);
  assert.equal(checkInteger('', 0), false);
  assert.equal(checkInteger('2x', 2), false);
  assert.equal(checkInteger('0', 0), true);
  assert.equal(checkRoot('1/2', examples[5].root), true);
  assert.equal(checkRoot('0.5', examples[5].root), true);
  assert.equal(checkRoot('−2/3', examples[6].root), true);
  assert.equal(checkRoot('-4/6', examples[6].root), true);
  assert.equal(checkRoot('2/3', examples[6].root), false);
  assert.equal(checkRoot('2/0', examples[5].root), false);
  assert.equal(checkRoot('', examples[5].root), false);
  assert.equal(polynomialText(examples[1].quotient), 'x³ − x² − 5x + 10');
  assert.equal(checkAnswer('x^3-x^2-5x+10', examples[1].quotient), true);
  assert.equal(checkAnswer('x^3-x^2+5x+10', examples[1].quotient), false);
  assert.equal(checkAnswer('x^3+2x^2-x+3', examples[6].quotient), true);
  assert.equal(checkAnswer('3x^3+6x^2-3x+9', examples[6].quotient), false);
});
