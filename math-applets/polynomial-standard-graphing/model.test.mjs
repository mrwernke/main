import test from 'node:test';
import assert from 'node:assert/strict';
import { problems, evaluate, graphLimitFor, nextTableValues, syntheticSubstitution, tailExtent } from './model.mjs';

function bisect(coefficients, left, right) {
  let leftValue = evaluate(coefficients, left);
  for (let i = 0; i < 50; i++) {
    const middle = (left + right) / 2;
    const value = evaluate(coefficients, middle);
    if (value === 0) return middle;
    if (Math.sign(value) === Math.sign(leftValue)) {
      left = middle;
      leftValue = value;
    } else right = middle;
  }
  return (left + right) / 2;
}

function turningPoints(coefficients) {
  const degree = coefficients.length - 1;
  const derivative = coefficients.slice(0, -1).map((value, index) => value * (degree - index));
  const turns = [];
  let previousX = -2.5;
  let previousValue = evaluate(derivative, previousX);
  for (let i = -2499; i <= 2500; i++) {
    const x = i / 1000;
    const value = evaluate(derivative, x);
    if (value === 0) continue;
    if (Math.sign(value) !== Math.sign(previousValue)) turns.push(bisect(derivative, previousX, x));
    previousX = x;
    previousValue = value;
  }
  return turns;
}

test('examples cover requested solution types and show all maximum possible turns', () => {
  const categories = new Set();
  for (const problem of problems) {
    const turns = turningPoints(problem.dividend);
    assert.equal(turns.length, problem.degree - 1, `${problem.dividend}: turning points`);
    const doubleRoots = turns.filter(x => Math.abs(evaluate(problem.dividend, x)) < 1e-8);
    const boundaries = [-2.5, ...turns, 2.5];
    const roots = [...doubleRoots];
    for (let i = 0; i < boundaries.length - 1; i++) {
      const left = boundaries[i];
      const right = boundaries[i + 1];
      const leftValue = evaluate(problem.dividend, left);
      const rightValue = evaluate(problem.dividend, right);
      if (Math.abs(leftValue) > 1e-8 && Math.abs(rightValue) > 1e-8 && leftValue * rightValue < 0) {
        roots.push(bisect(problem.dividend, left, right));
      }
    }
    assert.equal(roots.length, problem.realCount, `${problem.dividend}: real roots`);
    assert.equal(doubleRoots.length, problem.doubleRoots, `${problem.dividend}: double roots`);
    assert.equal(problem.degree - roots.length - doubleRoots.length, problem.complexCount);
    const limit = graphLimitFor(problem.dividend);
    const left = tailExtent(problem.dividend, -1, -1, limit);
    const right = tailExtent(problem.dividend, 1, 1, limit);
    for (const x of [...roots, ...turns]) {
      assert.ok(x >= left && x <= right, `${problem.dividend}: feature ${x} is clipped`);
      assert.ok(Math.abs(evaluate(problem.dividend, x)) <= limit);
    }
    categories.add(`${problem.realCount},${problem.complexCount},${problem.doubleRoots}`);
  }
  for (const category of ['3,0,0', '1,2,0', '2,0,1', '4,0,0', '3,0,1', '2,2,0', '0,4,0']) {
    assert.ok(categories.has(category), `Missing solution category ${category}`);
  }
  assert.ok(problems.some(problem => problem.leading > 0));
  assert.ok(problems.some(problem => problem.leading < 0));
});

test('synthetic substitution agrees with direct evaluation for every example and table value', () => {
  for (const problem of problems) {
    for (let x = -4; x <= 4; x++) {
      const trial = syntheticSubstitution(problem.dividend, x);
      assert.equal(trial.remainder, evaluate(problem.dividend, x));
      assert.ok(Math.abs(trial.remainder) <= graphLimitFor(problem.dividend, Math.max(1, Math.abs(x))));
    }
  }
});

test('table starts at zero and grows outward one integer on either side', () => {
  assert.deepEqual(nextTableValues([]), [0]);
  assert.deepEqual(nextTableValues([0]), [-1, 1]);
  assert.deepEqual(nextTableValues([0, 1, 2]), [-1, 3]);
  assert.deepEqual(nextTableValues([0, -1, -2, -3, 1, 2, 3]), [-4, 4]);
  assert.deepEqual(nextTableValues([0, -1, -2, -3, -4, 1, 2, 3, 4]), []);
});

test('graph scale grows to include the evaluated interval', () => {
  for (const problem of problems) {
    let previous = 0;
    for (let extent = 1; extent <= 4; extent++) {
      const limit = graphLimitFor(problem.dividend, extent);
      assert.ok(limit >= previous);
      for (let i = -extent * 100; i <= extent * 100; i++) {
        assert.ok(Math.abs(evaluate(problem.dividend, i / 100)) <= limit);
      }
      previous = limit;
    }
  }
});

test('end behavior follows degree parity and leading coefficient', () => {
  for (const problem of problems) {
    assert.equal(problem.rightEnd, Math.sign(problem.leading));
    assert.equal(problem.leftEnd, problem.degree % 2 ? -problem.rightEnd : problem.rightEnd);
    assert.equal(problem.yIntercept, evaluate(problem.dividend, 0));
  }
});

test('tail endpoints stop at the graph edge or the first vertical boundary', () => {
  for (const problem of problems) {
    for (const direction of [-1, 1]) {
      const limit = graphLimitFor(problem.dividend);
      const endpoint = tailExtent(problem.dividend, direction, direction, limit);
      assert.ok(direction * endpoint >= 1 && direction * endpoint <= 4);
      assert.ok(Math.abs(evaluate(problem.dividend, endpoint)) <= limit + 1e-8);
      if (Math.abs(endpoint) < 3.999) {
        assert.ok(Math.abs(Math.abs(evaluate(problem.dividend, endpoint)) - limit) < 1e-7);
      }
    }
  }
});
