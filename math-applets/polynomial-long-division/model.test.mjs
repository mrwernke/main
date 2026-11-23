import test from 'node:test';
import assert from 'node:assert/strict';
import { examples, polynomialText, checkAnswer } from './model.mjs';

test('six examples use the requested divisors, degrees, and remainders', () => {
  assert.deepEqual(examples.map(example => example.divisor), [[1, 3], [1, -2], [2, 1], [3, -2], [1, 0, 3], [2, 0, 1]]);
  assert.deepEqual(examples.map(example => example.dividend.length - 1), [3, 3, 3, 4, 4, 4]);
  assert.deepEqual(examples.map(example => polynomialText(example.remainder)), ['0', '5', '7', '5', '0', '5x + 4']);
  assert.equal(examples[5].dividend[0], 6);
  assert.equal(polynomialText(examples[5].quotient), '3x² + 2x − 2');
});

test('each division round follows divide, multiply, subtract, and bring down', () => {
  for (const example of examples) {
    const working = [...example.dividend];
    const quotient = Array(example.dividend.length).fill(0);
    example.rounds.forEach((round, offset) => {
      const degree = example.dividend.length - example.divisor.length - offset;
      const coefficient = working[offset] / example.divisor[0];
      assert.equal(round.term[round.term.length - 1 - degree], coefficient);
      quotient[quotient.length - 1 - degree] = coefficient;
      const product = Array(working.length).fill(0);
      example.divisor.forEach((value, index) => {
        product[offset + index] = coefficient * value;
        working[offset + index] -= product[offset + index];
      });
      assert.deepEqual(round.product, product);
      const end = Math.min(offset + example.divisor.length, working.length - 1);
      assert.deepEqual(round.result, working.map((value, index) => index > offset && index <= end ? value : 0));
      assert.equal(round.bringsDown, offset + example.divisor.length < working.length);
      assert.deepEqual(round.subtraction, working.map((value, index) =>
        index > offset && index < offset + example.divisor.length ? value : 0));
      assert.deepEqual(round.broughtDown, working.map((value, index) =>
        round.bringsDown && index === offset + example.divisor.length ? value : 0));
      assert.deepEqual(round.result, round.subtraction.map((value, index) => value + round.broughtDown[index]));
    });
    assert.deepEqual(example.quotient, quotient);
    assert.deepEqual(example.remainder, working);
    assert.ok(working.slice(0, working.length - example.divisor.length + 1).every(value => value === 0));
    const reconstructed = [...example.remainder];
    example.quotient.forEach((value, quotientIndex) => {
      example.divisor.forEach((factor, divisorIndex) => {
        const index = quotientIndex + divisorIndex - example.divisor.length + 1;
        if (index >= 0 && index < reconstructed.length) reconstructed[index] += value * factor;
      });
    });
    assert.deepEqual(reconstructed, example.dividend);
  }
});

test('the first division prompt and subtraction steps have the requested form', () => {
  const [first, second, third] = examples[0].rounds;
  assert.equal(first.numerator, 'x³');
  assert.equal(first.denominator, 'x');
  assert.equal(polynomialText(first.term), 'x²');
  assert.equal(polynomialText(first.product), 'x³ + 3x²');
  assert.equal(polynomialText(first.subtraction), '−2x²');
  assert.equal(polynomialText(first.broughtDown), '−2x');
  assert.equal(polynomialText(first.result), '−2x² − 2x');
  assert.equal(polynomialText(second.term), '−2x');
  assert.equal(polynomialText(second.result), '4x + 12');
  assert.equal(polynomialText(third.result), '0');
});

test('checking accepts equivalent polynomial input and rejects wrong or malformed work', () => {
  const first = examples[0].rounds[0];
  assert.equal(checkAnswer('x^2', first.term), true);
  assert.equal(checkAnswer('3x² + x³', first.product), true);
  assert.equal(checkAnswer('-2x-2x^2', first.result), true);
  assert.equal(checkAnswer('x^3-3x^2', first.product), false);
  assert.equal(checkAnswer('x^2', first.product), false);
  assert.equal(checkAnswer('x^3+3x^2--1', first.product), false);
  assert.equal(checkAnswer('', first.term), false);
  const quadraticDivisor = examples[4].rounds[2];
  assert.equal(checkAnswer('-4x^2-12', quadraticDivisor.product), true);
  assert.equal(checkAnswer('0', quadraticDivisor.result), true);
  assert.equal(checkAnswer('-4x^2+12', quadraticDivisor.product), false);
  const quadraticFirst = examples[4].rounds[0];
  assert.equal(checkAnswer('2x^3-4x^2', quadraticFirst.subtraction), true);
  assert.equal(checkAnswer('6x', quadraticFirst.broughtDown), true);
  assert.equal(checkAnswer('2x^3-4x^2+6x', quadraticFirst.subtraction), false);
  const sixthFirst = examples[5].rounds[0];
  assert.equal(checkAnswer('4x^3-4x^2', sixthFirst.subtraction), true);
  assert.equal(checkAnswer('4x^3', sixthFirst.subtraction), false);
});
