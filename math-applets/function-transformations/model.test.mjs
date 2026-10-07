import test from 'node:test';
import assert from 'node:assert/strict';
import {
  families, parentName, equationText, transformations,
  dilationFactor, horizontalShift, verticalShift, parseInteger,
} from './model.mjs';

test('each family has eight examples that each keep at least one transformation', () => {
  for (const bank of Object.values(families)) {
    assert.equal(bank.length, 8);
    for (const fn of bank) {
      const flags = transformations(fn);
      assert.ok(Object.values(flags).some(Boolean), 'every example has at least one transformation');
    }
  }
});

test('each family covers the required special cases', () => {
  for (const bank of Object.values(families)) {
    assert.ok(bank.some(fn => fn.h === 0 && fn.k !== 0), 'one example with h = 0');
    assert.ok(bank.some(fn => fn.k === 0 && fn.h !== 0), 'one example with k = 0');
    assert.ok(bank.some(fn => fn.h === 0 && fn.k === 0), 'one example with both = 0');
    assert.ok(bank.some(fn => fn.a === 1), 'one example with a = 1');
    assert.ok(bank.some(fn => fn.a === -1), 'one example with a = -1');
  }
});

test('each family mixes positive and negative values and reflection/dilation variety', () => {
  for (const bank of Object.values(families)) {
    assert.ok(bank.some(fn => fn.a < 0) && bank.some(fn => fn.a > 0), 'both signs of a');
    assert.ok(bank.some(fn => fn.h < 0) && bank.some(fn => fn.h > 0), 'both signs of h');
    assert.ok(bank.some(fn => fn.k < 0) && bank.some(fn => fn.k > 0), 'both signs of k');
    assert.ok(bank.some(fn => Math.abs(fn.a) !== 1) && bank.some(fn => Math.abs(fn.a) === 1), 'with and without dilation');
  }
});

test('parent names match each family', () => {
  assert.equal(parentName('generic'), 'f(x)');
  assert.equal(parentName('absolute'), '|x|');
  assert.equal(parentName('quadratic'), 'x\u00b2');
});

test('equations render with proper signs, coefficients, and zero shifts', () => {
  assert.equal(equationText('generic', families.generic[0]), 'g(x) = 2f(x \u2212 3) + 1');
  assert.equal(equationText('generic', families.generic[1]), 'g(x) = \u2212f(x + 4) \u2212 2');
  assert.equal(equationText('generic', families.generic[3]), 'g(x) = f(x + 1) + 6');
  assert.equal(equationText('generic', families.generic[4]), 'g(x) = 4f(x) + 3');
  assert.equal(equationText('generic', families.generic[5]), 'g(x) = f(x \u2212 5)');
  assert.equal(equationText('generic', families.generic[6]), 'g(x) = \u22122f(x)');
  assert.equal(equationText('absolute', families.absolute[0]), 'f(x) = 3|x + 2| \u2212 4');
  assert.equal(equationText('absolute', families.absolute[1]), 'f(x) = \u2212|x \u2212 5| + 3');
  assert.equal(equationText('absolute', families.absolute[4]), 'f(x) = 2|x| \u2212 5');
  assert.equal(equationText('absolute', families.absolute[6]), 'f(x) = \u22123|x|');
  assert.equal(equationText('quadratic', families.quadratic[0]), 'f(x) = 4(x \u2212 1)\u00b2 + 5');
  assert.equal(equationText('quadratic', families.quadratic[2]), 'f(x) = \u22125(x \u2212 6)\u00b2 + 7');
  assert.equal(equationText('quadratic', families.quadratic[4]), 'f(x) = 3x\u00b2 + 4');
  assert.equal(equationText('quadratic', families.quadratic[6]), 'f(x) = 2x\u00b2');
});

test('transformation flags follow a, h, and k', () => {
  const fn = { a: -3, h: 2, k: -5 };
  assert.deepEqual(transformations(fn), {
    reflectH: false, reflectV: true, dilateH: false, dilateV: true, shiftH: true, shiftV: true,
  });
  const plain = { a: 1, h: -1, k: 6 };
  assert.deepEqual(transformations(plain), {
    reflectH: false, reflectV: false, dilateH: false, dilateV: false, shiftH: true, shiftV: true,
  });
});

test('dilation and shift helpers report positive amounts with directions', () => {
  const fn = { a: -3, h: 2, k: -5 };
  assert.equal(dilationFactor(fn), 3);
  assert.deepEqual(horizontalShift(fn), { direction: 'right', amount: 2 });
  assert.deepEqual(verticalShift(fn), { direction: 'down', amount: 5 });
  const other = { a: 2, h: -4, k: 1 };
  assert.deepEqual(horizontalShift(other), { direction: 'left', amount: 4 });
  assert.deepEqual(verticalShift(other), { direction: 'up', amount: 1 });
});

test('parseInteger accepts signed integers and rejects everything else', () => {
  assert.equal(parseInteger(' 7 '), 7);
  assert.equal(parseInteger('-12'), -12);
  assert.equal(parseInteger('\u22123'), -3);
  assert.equal(parseInteger(''), null);
  assert.equal(parseInteger('1.5'), null);
  assert.equal(parseInteger('left'), null);
});
