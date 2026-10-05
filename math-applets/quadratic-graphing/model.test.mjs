import test from 'node:test';
import assert from 'node:assert/strict';
import {
  practice, standardPractice, factoredPractice, vertexPractice, practiceForForm, evaluate, coefficients, roots, parseNumber, equationText,
  tablePoints, factoredPoints, graphBounds, parabolaGeometry,
} from './model.mjs';

test('standard form preserves its first six options and appends two', () => {
  assert.deepEqual(standardPractice.map(item => coefficients(item)), [
    { a: 1, b: -4, c: 1 },
    { a: 2, b: 4, c: -6 },
    { a: 1, b: -0, c: -4 },
    { a: -1, b: -4, c: 0 },
    { a: -2, b: 12, c: -13 },
    { a: 3, b: -6, c: -2 },
    { a: 1, b: 4, c: -1 },
    { a: -1, b: 2, c: 2 },
  ]);
  assert.deepEqual(standardPractice.slice(1, 4), practice.slice(1, 4));
  assert.deepEqual(standardPractice.map(item => equationText(item, 'standard')), [
    'f(x) = x² − 4x + 1',
    'f(x) = 2x² + 4x − 6',
    'f(x) = x² − 4',
    'f(x) = −x² − 4x',
    'f(x) = −2x² + 12x − 13',
    'f(x) = 3x² − 6x − 2',
    'f(x) = x² + 4x − 1',
    'f(x) = −x² + 2x + 2',
  ]);
  assert.equal(practiceForForm('standard'), standardPractice);
  assert.equal(practiceForForm('factored'), factoredPractice);
  assert.equal(practiceForForm('vertex'), vertexPractice);
  for (const item of standardPractice) {
    assert.ok(Math.abs(item.h) <= 4);
    const { a, b, c } = coefficients(item);
    for (let x = -8; x <= 8; x++) assert.equal(evaluate(item, x), a * x * x + b * x + c);
    const points = tablePoints(item);
    points.forEach(point => {
      assert.ok(Number.isInteger(point.x) && Number.isInteger(point.y));
      assert.ok(Math.abs(point.x) <= 8 && Math.abs(point.y) <= 24);
    });
    const bounds = graphBounds(item, points);
    assert.ok(bounds.yMax - bounds.yMin <= 24);
  }
});

test('factored form preserves its first six equations and appends two', () => {
  assert.deepEqual(factoredPractice.map(item => equationText(item, 'factored')), [
    'f(x) = (x − 1)(x − 5)',
    'f(x) = 2(x − 3)(x + 1)',
    'f(x) = −(x − 2)(x − 4)',
    'f(x) = x(x + 6)',
    'f(x) = −3(x + 1)(x + 3)',
    'f(x) = 3(x + 2)(x − 2)',
    'f(x) = −2x(x − 4)',
    'f(x) = 2(x + 4)x',
  ]);
  assert.deepEqual(factoredPractice.map(item => coefficients(item)), [
    { a: 1, b: -6, c: 5 }, { a: 2, b: -4, c: -6 },
    { a: -1, b: 6, c: -8 }, { a: 1, b: 6, c: 0 },
    { a: -3, b: -12, c: -9 }, { a: 3, b: -0, c: -12 },
    { a: -2, b: 8, c: 0 }, { a: 2, b: 8, c: 0 },
  ]);
  for (const item of factoredPractice) {
    const [r1, r2] = roots(item);
    assert.ok(Number.isInteger(r1) && Number.isInteger(r2));
    assert.equal((r1 + r2) / 2, item.h);
    assert.ok(Math.abs(item.h) <= 4);
    for (let x = -8; x <= 8; x++) {
      assert.equal(item.a * (x - r1) * (x - r2) || 0, evaluate(item, x) || 0);
    }
    const points = factoredPoints(item);
    assert.equal(new Set(points.map(point => point.x)).size, points.length);
    points.forEach(point => {
      assert.ok(Number.isInteger(point.x) && Number.isInteger(point.y));
      assert.equal(point.y, evaluate(item, point.x) || 0);
    });
    const bounds = graphBounds(item, points);
    assert.ok(bounds.yMax - bounds.yMin <= 24);
  }
});

test('factored roots one unit from the vertex require only three points', () => {
  assert.deepEqual(factoredPractice.map(item => factoredPoints(item).length), [5, 5, 3, 5, 3, 5, 5, 5]);
  for (const index of [2, 4]) {
    const item = factoredPractice[index];
    assert.deepEqual(factoredPoints(item), [
      { x: item.h, y: item.k },
      { x: item.r1, y: 0 },
      { x: item.r2, y: 0 },
    ]);
  }
});

test('vertex form swaps only options 3 and 5 and appends three irrational-root examples', () => {
  assert.deepEqual(vertexPractice.slice(0, 5), [
    practice[0], practice[1], practice[4], practice[3], practice[2],
  ]);
  assert.deepEqual(vertexPractice.map(item => equationText(item, 'vertex')), [
    'f(x) = (x − 2)² − 4',
    'f(x) = 2(x + 1)² − 8',
    'f(x) = −2(x − 3)² + 8',
    'f(x) = −(x + 2)² + 4',
    'f(x) = x² − 4',
    'f(x) = (x + 1)² − 3',
    'f(x) = −(x − 2)² + 5',
    'f(x) = 2(x − 1)² − 6',
  ]);
  vertexPractice.slice(5).forEach(item => {
    const radicand = -item.k / item.a;
    assert.ok(Number.isInteger(radicand) && radicand > 0);
    assert.ok(!Number.isInteger(Math.sqrt(radicand)));
    roots(item).forEach(root => {
      assert.ok(Number.isFinite(root) && !Number.isInteger(root));
      assert.ok(Math.abs(evaluate(item, root)) < 1e-9);
    });
  });
});

test('all sections have eight unique, integer-friendly plotting exercises', () => {
  for (const form of ['standard', 'factored', 'vertex']) {
    const bank = practiceForForm(form);
    assert.equal(bank.length, 8);
    assert.equal(new Set(bank.map(item => equationText(item, form))).size, 8);
    bank.forEach(item => {
      assert.ok(Math.abs(item.h) <= 4);
      assert.ok(Number.isInteger(evaluate(item, 0)));
      const points = form === 'factored' ? factoredPoints(item) : tablePoints(item);
      points.forEach(point => {
        assert.ok(Number.isInteger(point.x) && Number.isInteger(point.y));
        assert.ok(Math.abs(point.x) <= 8 && Math.abs(point.y) <= 24);
      });
      const bounds = graphBounds(item, points);
      assert.ok(bounds.yMax - bounds.yMin <= 24);
    });
  }
});

test('five integer-friendly functions meet the requested scale and symmetry limits', () => {
  assert.equal(practice.length, 5);
  assert.ok(practice.some(item => item.a > 0));
  assert.ok(practice.some(item => item.a < 0));
  assert.ok(practice.some(item => item.h === 0));
  assert.equal(new Set(practice.map(item => JSON.stringify(item))).size, 5);
  for (const item of practice) {
    assert.ok(Math.abs(item.h) <= 4);
    assert.ok(Object.values(coefficients(item)).every(Number.isInteger));
    assert.ok(Number.isInteger(evaluate(item, 0)));
    assert.ok(Math.abs(evaluate(item, 0)) <= 20);
    const intercepts = roots(item);
    assert.ok(intercepts.every(Number.isInteger));
    assert.equal((intercepts[0] + intercepts[1]) / 2, item.h);
    intercepts.forEach(x => assert.equal(evaluate(item, x), 0));
    const points = factoredPoints(item);
    assert.equal(new Set(points.map(point => point.x)).size, 5);
    assert.deepEqual([...points].sort((p, q) => p.x - q.x), tablePoints(item));
    points.forEach(point => {
      assert.ok(Number.isInteger(point.x) && Number.isInteger(point.y));
      assert.equal(point.y, evaluate(item, point.x));
      assert.ok(Math.abs(point.x) <= 8 && Math.abs(point.y) <= 16);
    });
    const bounds = graphBounds(item, points);
    assert.ok(bounds.yMax - bounds.yMin <= 24);
  }
});

test('standard coefficients evaluate to the same function as vertex and factored forms', () => {
  for (const item of practice) {
    const { a, b, c } = coefficients(item);
    const [r1, r2] = roots(item);
    assert.equal(-b / (2 * a) || 0, item.h);
    for (let x = -8; x <= 8; x++) {
      assert.equal(a * x * x + b * x + c, evaluate(item, x));
      assert.equal(a * (x - r1) * (x - r2) || 0, evaluate(item, x) || 0);
    }
  }
});

test('equations handle negative signs, zero shifts, and a = ±1 cleanly', () => {
  assert.equal(equationText(practice[0], 'standard'), 'f(x) = x² − 4x');
  assert.equal(equationText(practice[0], 'factored'), 'f(x) = x(x − 4)');
  assert.equal(equationText(practice[0], 'vertex'), 'f(x) = (x − 2)² − 4');
  assert.equal(equationText(practice[2], 'standard'), 'f(x) = x² − 4');
  assert.equal(equationText(practice[3], 'vertex'), 'f(x) = −(x + 2)² + 4');
  assert.equal(equationText(practice[4], 'factored'), 'f(x) = −2(x − 1)(x − 5)');
});

test('numeric answers reject empty or malformed input instead of interpreting it as zero', () => {
  for (const text of ['', ' ', 'x', 'Infinity', '1/0', '2+3', '0x10', '1,2']) {
    assert.ok(Number.isNaN(parseNumber(text)), text);
  }
  assert.equal(parseNumber('0'), 0);
  assert.equal(parseNumber(' −2 '), -2);
  assert.equal(parseNumber('+3'), 3);
  assert.equal(parseNumber('2.0'), 2);
  assert.equal(parseNumber('.5'), 0.5);
});

test('equal-scale bounds contain the axes and every allowed table point', () => {
  for (const item of [...vertexPractice, ...standardPractice, ...factoredPractice]) {
    const xs = [];
    for (let x = -8; x <= 8; x++) {
      if (Math.abs(evaluate(item, x)) <= 24) xs.push(x);
    }
    const points = tablePoints(item, xs);
    const bounds = graphBounds(item, points);
    assert.equal(bounds.xMax - bounds.xMin, bounds.yMax - bounds.yMin);
    assert.ok(bounds.xMin < 0 && bounds.xMax > 0);
    assert.ok(bounds.yMin < 0 && bounds.yMax > 0);
    points.forEach(({ x, y }) => {
      assert.ok(x > bounds.xMin && x < bounds.xMax);
      assert.ok(y > bounds.yMin && y < bounds.yMax);
    });
  }
});

test('Bezier curve is the exact parabola, with two endpoints on the grid boundary', () => {
  for (const item of [...vertexPractice, ...standardPractice, ...factoredPractice]) {
    for (const points of [factoredPoints(item), tablePoints(item), tablePoints(item, [item.h - 3, item.h - 1, item.h, item.h + 1, item.h + 2])]) {
      const bounds = graphBounds(item, points);
      const { start, control, end } = parabolaGeometry(item, bounds);
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const x = (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t * t * end.x;
        const y = (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t * t * end.y;
        assert.ok(Math.abs(y - evaluate(item, x)) < 1e-9);
        assert.ok(x >= bounds.xMin - 1e-9 && x <= bounds.xMax + 1e-9);
        assert.ok(y >= bounds.yMin - 1e-9 && y <= bounds.yMax + 1e-9);
      }
      for (const point of [start, end]) {
        assert.ok([Math.abs(point.x - bounds.xMin), Math.abs(point.x - bounds.xMax),
          Math.abs(point.y - bounds.yMin), Math.abs(point.y - bounds.yMax)].some(distance => distance < 1e-9));
      }
    }
  }
});
