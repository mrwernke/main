import test from 'node:test';
import assert from 'node:assert/strict';
import { examples, gradeLong, gradeSynthetic, normalizeName, validName } from './model.mjs';
import { polynomialText } from '../polynomial-long-division/model.mjs';

test('complete correct work earns one on every division example', () => {
  for (const example of examples.P9) {
    const answers = {
      rounds: example.rounds.map(round => ({
        term: polynomialText(round.term), product: polynomialText(round.product),
        subtraction: polynomialText(round.subtraction), broughtDown: polynomialText(round.broughtDown),
      })),
      quotient: polynomialText(example.quotient), remainder: polynomialText(example.remainder),
    };
    assert.equal(gradeLong(example, answers).score, 1);
  }
  for (const example of examples.P10) {
    const answers = {
      coefficients: example.dividend.map(String), root: example.rootText,
      products: example.products.map(String), results: example.results.map(String),
      quotient: polynomialText(example.quotient), remainder: String(example.remainder),
    };
    assert.equal(gradeSynthetic(example, answers).score, 1);
  }
});

test('long division awards follow-through after an incorrect product', () => {
  const answers = {
    rounds: [
      { term: 'x^2', product: 'x^3+4x^2', subtraction: '-3x^2', broughtDown: '-2x' },
      { term: '-3x', product: '-3x^2-9x', subtraction: '7x', broughtDown: '12' },
      { term: '7', product: '7x+21', subtraction: '-9' },
    ],
    quotient: 'x^2-3x+7', remainder: '-9',
  };
  const result = gradeLong(examples.P9[0], answers);
  assert.equal(result.processCorrect, result.processTotal - 1);
  assert.equal(result.finalCorrect, 2);
});

test('synthetic division awards follow-through and accepts recovery to correct work', () => {
  const answers = {
    coefficients: ['4', '1', '-11', '6'], root: '1',
    products: ['2', '3', '-8'], results: ['4', '3', '-8', '-2'],
    quotient: '4x^2+3x-8', remainder: '-2',
  };
  const result = gradeSynthetic(examples.P10[0], answers);
  assert.equal(result.processCorrect, result.processTotal - 1);
  assert.equal(result.finalCorrect, 2);
  answers.products[1] = '5';
  answers.results[2] = '-6';
  answers.products[2] = '-6';
  answers.results[3] = '0';
  answers.quotient = '4x^2+5x-6';
  answers.remainder = '0';
  assert.equal(gradeSynthetic(examples.P10[0], answers).finalCorrect, 2);
});

test('blank or malformed work does not earn follow-through credit', () => {
  const long = { rounds: [{}, {}, {}], quotient: '', remainder: '' };
  assert.equal(gradeLong(examples.P9[0], long).score, 0);
  const synthetic = { coefficients: [], products: [], results: [], root: '', quotient: '', remainder: '' };
  assert.equal(gradeSynthetic(examples.P10[0], synthetic).score, 0);
  synthetic.root = '1/0';
  synthetic.remainder = '0/0';
  assert.equal(gradeSynthetic(examples.P10[0], synthetic).score, 0);
});

test('names are capitalized and permit common name punctuation', () => {
  assert.equal(normalizeName("  aNA  o'BRIEN-smith "), "Ana O'Brien-Smith");
  assert.ok(validName(normalizeName('élise')));
  assert.equal(validName('=formula'), false);
  assert.equal(validName(''), false);
});
