import test from 'node:test';
import assert from 'node:assert/strict';
import {
  families, evaluate, xIntercepts, yIntercept, rangeSymbol, extremumType, parseInteger,
} from './model.mjs';

const everyExample = () => Object.entries(families)
  .flatMap(([family, bank]) => bank.map(fn => ({ family, fn })));

test('each family has five examples', () => {
  assert.equal(families.absolute.length, 5);
  assert.equal(families.quadratic.length, 5);
});

test('every example keeps its key points at integers inside the ±10 window', () => {
  for (const { family, fn } of everyExample()) {
    assert.ok(Number.isInteger(fn.h) && Math.abs(fn.h) <= 10, 'vertex x in window');
    assert.ok(Number.isInteger(fn.k) && Math.abs(fn.k) <= 10, 'vertex y in window');
    const yInt = yIntercept(family, fn);
    assert.ok(Number.isInteger(yInt) && Math.abs(yInt) <= 10, 'integer y-intercept in window');
    for (const x of xIntercepts(family, fn)) {
      assert.ok(Number.isInteger(x) && Math.abs(x) <= 10, 'integer x-intercept in window');
      assert.equal(evaluate(family, fn, x), 0);
    }
  }
});

test('each family has exactly one vertex-on-axis example and one with no x-intercepts', () => {
  for (const [family, bank] of Object.entries(families)) {
    const counts = bank.map(fn => xIntercepts(family, fn).length);
    assert.equal(counts.filter(count => count === 1).length, 1, `${family} has one single-intercept example`);
    assert.equal(counts.filter(count => count === 0).length, 1, `${family} has one no-intercept example`);
    assert.equal(counts.filter(count => count === 2).length, 3, `${family} has three two-intercept examples`);
  }
});

test('range symbol and extremum type follow the opening direction', () => {
  for (const { fn } of everyExample()) {
    assert.equal(rangeSymbol(fn), fn.a > 0 ? '\u2265' : '\u2264');
    assert.equal(extremumType(fn), fn.a > 0 ? 'minimum' : 'maximum');
  }
});

test('vertex is the extreme value of the function', () => {
  for (const { family, fn } of everyExample()) {
    for (const x of [-10, -3, 0, 4, 10]) {
      const y = evaluate(family, fn, x);
      if (fn.a > 0) assert.ok(y >= fn.k);
      else assert.ok(y <= fn.k);
    }
    assert.equal(evaluate(family, fn, fn.h), fn.k);
  }
});

test('parseInteger accepts signed integers and rejects everything else', () => {
  assert.equal(parseInteger(' 7 '), 7);
  assert.equal(parseInteger('-12'), -12);
  assert.equal(parseInteger('\u22123'), -3);
  assert.equal(parseInteger(''), null);
  assert.equal(parseInteger('1.5'), null);
  assert.equal(parseInteger('none'), null);
});
