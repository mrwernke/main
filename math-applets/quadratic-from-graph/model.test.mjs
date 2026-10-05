import test from 'node:test';
import assert from 'node:assert/strict';
import { exercises, markedPoints, aValueMovement, factorProduct, expansion, parseLinearTerm, signedConstant } from './model.mjs';
import { evaluate, roots, graphBounds, coefficients } from '../quadratic-graphing/model.mjs';

test('all eight graphs mark vertex, neighboring points, and every intercept within bounds', () => {
  assert.equal(exercises.length, 8);
  for (const item of exercises) {
    const points = markedPoints(item);
    assert.equal(new Set(points.map(point => `${point.x},${point.y}`)).size, points.length);
    const roles = points.flatMap(point => point.roles);
    for (const role of ['Vertex', 'One unit left', 'One unit right', 'y-intercept']) {
      assert.equal(roles.filter(value => value === role).length, 1);
    }
    assert.equal(roles.filter(value => value === 'x-intercept').length, 2);
    const bounds = graphBounds(item, points);
    for (const point of points) {
      assert.equal(point.y, evaluate(item, point.x) || 0);
      assert.ok(Number.isInteger(point.x) && Number.isInteger(point.y));
      assert.ok(point.x > bounds.xMin && point.x < bounds.xMax);
      assert.ok(point.y > bounds.yMin && point.y < bounds.yMax);
    }
    const vertex = points.find(point => point.roles.includes('Vertex'));
    assert.equal(vertex.x, item.h);
    assert.equal(vertex.y, item.k);
    const right = points.find(point => point.roles.includes('One unit right'));
    assert.equal(right.y - vertex.y, item.a);
  }
});

test('a-value arrows move vertically by signed a then right one unit onto the curve', () => {
  exercises.forEach(item => {
    const { start, corner, end, verticalLabel, horizontalLabel } = aValueMovement(item);
    assert.deepEqual(start, { x: item.h, y: item.k });
    assert.equal(corner.x, start.x);
    assert.equal(corner.y - start.y, item.a);
    assert.equal(end.x - corner.x, 1);
    assert.equal(end.y, corner.y);
    assert.equal(end.y, evaluate(item, end.x));
    assert.ok(verticalLabel.endsWith(item.a > 0 ? 'up' : 'down'));
    assert.equal(horizontalLabel, '1 unit right');
  });
});

test('box factor display uses subtraction, addition, and zero in either student order', () => {
  assert.equal(factorProduct(2, -3), '(x − 2)(x + 3)');
  assert.equal(factorProduct(-3, 2), '(x + 3)(x − 2)');
  assert.equal(factorProduct(0, -6), '(x)(x + 6)');
  assert.equal(factorProduct(-1, -3), '(x + 1)(x + 3)');
});

test('overlapping roots, neighboring points, and y-intercepts retain every role', () => {
  const unitRoot = markedPoints(exercises[2]);
  assert.ok(unitRoot.some(point => point.roles.includes('One unit left') && point.roles.includes('x-intercept')));
  const zeroRoot = markedPoints(exercises[3]);
  assert.ok(zeroRoot.some(point => point.x === 0 && point.roles.includes('x-intercept') && point.roles.includes('y-intercept')));
  const zeroVertex = markedPoints(exercises[5]);
  assert.ok(zeroVertex.some(point => point.roles.includes('Vertex') && point.roles.includes('y-intercept')));
});

test('box products and distributed coefficients match all graphs in either factor order', () => {
  for (const item of exercises) {
    const pair = roots(item);
    for (const [r1, r2] of [pair, [...pair].reverse()]) {
      const result = expansion(r1, r2, item.a), expected = coefficients(item);
      assert.equal(result.topRight || 0, -r1 || 0);
      assert.equal(result.bottomLeft || 0, -r2 || 0);
      assert.equal(result.bottomRight || 0, r1 * r2 || 0);
      assert.equal(result.topRight + result.bottomLeft || 0, result.linear || 0);
      assert.equal(result.a, expected.a);
      assert.equal(result.b || 0, expected.b || 0);
      assert.equal(result.c || 0, expected.c || 0);
      for (let x = -8; x <= 8; x++) {
        assert.equal(item.a * (x * x + result.linear * x + result.constant) || 0, evaluate(item, x) || 0);
      }
    }
  }
  const example = expansion(2, -3, 2);
  assert.deepEqual(example, { topRight: -2, bottomLeft: 3, bottomRight: -6, linear: 1, constant: -6, a: 2, b: 2, c: -12 });
});

test('linear product parser handles signs, x, zero, and rejects malformed expressions', () => {
  for (const [text, value] of [['-2x', -2], ['3x', 3], ['x', 1], ['+x', 1], ['-x', -1], [' − 2 x ', -2], ['0', 0], ['0x', 0]]) {
    assert.equal(parseLinearTerm(text), value);
  }
  for (const text of ['', ' ', '-2', '2x²', '2*x', 'x+1', 'NaN', 'Infinity', '1/2x', 'abc']) {
    assert.ok(Number.isNaN(parseLinearTerm(text)), text);
  }
  assert.equal(signedConstant(-2), '−2');
  assert.equal(signedConstant(3), '+3');
  assert.equal(signedConstant(0), '+0');
});
