import test from 'node:test';
import assert from 'node:assert/strict';
import { problems, evaluate, displayValue, localExtrema, minimumDegree, checkList, checkPoints, formatList } from './model.mjs';

test('contextual examples have correct intercepts and unique absolute extrema', () => {
  assert.equal(problems.length, 9);
  for (const p of problems) {
    const turns = [...p.localMax, ...p.localMin];
    const candidates = [0, ...turns, p.xMax];
    assert.equal(displayValue(p, evaluate(p, 0)), p.yIntercept);
    assert.notEqual(p.yIntercept, 0, `${p.title}: y-intercept must differ from the x-intercepts`);
    assert.ok(p.xIntercepts.every(x => x > 0), `${p.title}: no x-intercept at time zero`);
    for (const x of p.xIntercepts) assert.ok(Math.abs(evaluate(p, x)) < 1e-8);
    const boundaries = [0, ...turns, p.xMax].sort((a, b) => a - b);
    for (let i = 0; i < boundaries.length - 1; i++) {
      const [left, right] = boundaries.slice(i, i + 2);
      const crosses = evaluate(p, left) * evaluate(p, right) < 0;
      assert.equal(p.xIntercepts.filter(x => x > left && x < right).length, crosses ? 1 : 0, `${p.title}: roots between ${left} and ${right}`);
      const direction = Math.sign(evaluate(p, right) - evaluate(p, left));
      for (let j = 0; j < 40; j++) {
        const x1 = left + (right - left) * j / 40;
        const x2 = left + (right - left) * (j + 1) / 40;
        assert.ok(direction * (evaluate(p, x2) - evaluate(p, x1)) > 0, `${p.title}: unexpected turn between ${x1} and ${x2}`);
      }
    }
    for (const x of boundaries) {
      assert.equal(p.xIntercepts.includes(x), Math.abs(evaluate(p, x)) < 1e-8, `${p.title}: root at ${x}`);
    }
    for (const x of p.localMax) {
      assert.ok(evaluate(p, x) > evaluate(p, x - 0.01));
      assert.ok(evaluate(p, x) > evaluate(p, x + 0.01));
    }
    for (const x of p.localMin) {
      assert.ok(evaluate(p, x) < evaluate(p, x - 0.01));
      assert.ok(evaluate(p, x) < evaluate(p, x + 0.01));
    }
    const change = evaluate(p, p.directionTime + 0.01) - evaluate(p, p.directionTime - 0.01);
    assert.equal(change > 0 ? 'increasing' : 'decreasing', p.trend);
    const values = candidates.map(x => evaluate(p, x));
    assert.equal(displayValue(p, Math.max(...values)), p.globalMax.value);
    assert.equal(displayValue(p, Math.min(...values)), p.globalMin.value);
    for (const [kind, extreme] of [['maximum', p.globalMax], ['minimum', p.globalMin]]) {
      assert.equal(extreme.times.length, 1, `${p.title}: unique absolute ${kind}`);
      const actual = candidates.filter(x => displayValue(p, evaluate(p, x)) === extreme.value).sort((a, b) => a - b);
      assert.deepEqual(actual, extreme.times, `${p.title}: ${kind} times`);
    }
    for (let i = 0; i <= 1000; i++) {
      const y = evaluate(p, p.xMax * i / 1000);
      assert.ok(y >= Math.min(...values) - 1e-8 && y <= Math.max(...values) + 1e-8);
      assert.ok(y >= p.yMin - 1e-8 && y <= p.yMax + 1e-8);
    }
  }
});

test('higher-degree examples include meaningful negative outputs', () => {
  assert.ok(problems.some(p => minimumDegree(p) === 5 && p.globalMin.value < 0));
  assert.ok(problems.some(p => p.degree === 6 && p.globalMin.value < 0));
});

test('local extrema include qualifying endpoints but exclude global extrema', () => {
  const expected = [
    { maxima: [1], minima: [0] },
    { maxima: [8], minima: [4] },
    { maxima: [3, 18], minima: [6, 16] },
    { maxima: [10, 25], minima: [5] },
    { maxima: [2], minima: [0, 8] },
    { maxima: [4], minima: [8] },
    { maxima: [0, 3.03830816], minima: [1, 11] },
    { maxima: [0.5, 2.997048386999, 7.485534462711], minima: [1.455254279025, 5.158409497049, 9.292642263104] },
    { maxima: [17.122072913434, 57.015306573931, 113.884870930094, 150], minima: [6.247125389053, 35.590382152323, 84.988277343058] },
  ];
  problems.forEach((problem, index) => {
    assert.deepEqual(localExtrema(problem), expected[index], problem.title);
  });
  assert.equal(evaluate(problems[0], localExtrema(problems[0]).minima[0]), 25);
});

test('revised graphs show the requested turns and endpoints', () => {
  const market = problems[2];
  assert.equal(displayValue(market, evaluate(market, 6)), 400);
  assert.ok(evaluate(market, 3) - evaluate(market, 6) >= 100);
  assert.equal(displayValue(market, evaluate(market, 18)), 500);
  const sound = problems[4];
  assert.ok(Math.abs(evaluate(sound, 0) - 16) < 1);
  assert.equal(displayValue(sound, evaluate(sound, sound.localMax[0])), 32);
  assert.equal(sound.localMax.length + sound.localMin.length, 3);
  assert.equal(minimumDegree(sound), 4);
  assert.equal(displayValue(problems[6], evaluate(problems[6], 11)), 500);
});

test('reservoir graph becomes steeper toward its endpoint', () => {
  const p = problems[6];
  const earlierSlope = (evaluate(p, 10.8) - evaluate(p, 10.6)) / 0.2;
  const finalSlope = (evaluate(p, 11) - evaluate(p, 10.8)) / 0.2;
  assert.ok(finalSlope < 1.1 * earlierSlope && earlierSlope < 0);
});

test('examples 3, 6, and 7 have multiple intercepts and include double roots', () => {
  for (const index of [2, 5, 6]) assert.ok(problems[index].xIntercepts.length > 1);
  for (const [index, root] of [[2, 16], [5, 8], [6, 1]]) {
    const p = problems[index];
    assert.ok(p.xIntercepts.includes(root));
    assert.equal(evaluate(p, root), 0);
    assert.ok(evaluate(p, root - 0.01) * evaluate(p, root + 0.01) > 0, `${p.title}: root ${root} touches the axis`);
  }
});

test('new examples have the requested root multiplicities and minimum degrees', () => {
  const [business, run] = problems.slice(-2);
  for (const [problem, root, multiplicity] of [[business, 0.5, 2], [business, 11, 3], [run, 140, 2]]) {
    const h = 0.0001;
    const ratio = evaluate(problem, root + 2 * h) / evaluate(problem, root + h);
    assert.ok(problem.xIntercepts.includes(root));
    assert.ok(Math.abs(ratio - 2 ** multiplicity) < 0.02, `${problem.title}: multiplicity ${multiplicity} at ${root}`);
  }
  assert.equal(business.localMax.length + business.localMin.length, 6);
  assert.equal(minimumDegree(business), 7);
  assert.equal(run.localMax.length + run.localMin.length, 7);
  assert.equal(minimumDegree(run), 8);
  assert.ok(Math.abs(evaluate(run, 150) - 1) < 1e-10);
  assert.ok(evaluate(run, 139) > 0 && evaluate(run, 141) > 0);
  assert.ok(evaluate(business, business.localMin.at(-1)) <= -40);
  assert.ok(evaluate(business, 10.5) < 0 && evaluate(business, 11.5) > 0);
  for (let x = 0; x <= run.xMax; x += 0.1) assert.ok(evaluate(run, x) >= 0);
});

test('turns and assumed ends support each stated minimum degree and leading sign', () => {
  for (const p of problems) {
    const turns = p.localMax.length + p.localMin.length;
    const degree = minimumDegree(p);
    assert.ok(degree >= turns + 1 && degree <= p.degree);
    assert.equal(degree % 2, p.leftEnd === p.rightEnd ? 0 : 1);
    assert.equal(p.rightEnd, p.leading);
    assert.equal(p.leftEnd, p.degree % 2 ? -p.leading : p.leading);
    assert.equal(Math.sign(evaluate(p, 100000 * p.xScale)), p.rightEnd);
    assert.equal(Math.sign(evaluate(p, -100000 * p.xScale)), p.leftEnd);
  }
});

test('individual entries accept either order but reject missing, invalid, and duplicate entries', () => {
  assert.equal(checkList(['15', '5'], [5, 15]), true);
  assert.equal(checkList(['5', '5'], [5, 15]), false);
  assert.equal(checkList(['5', ''], [5, 15]), false);
  assert.equal(checkList(['5', '15', '20'], [5, 15]), false);
  assert.equal(checkList(['five', '15'], [5, 15]), false);
  assert.equal(checkList(['5, 15'], [5, 15]), false);
  assert.equal(checkList(['0'], [0]), true);
  assert.equal(checkList([], []), true);
});

test('ordered pairs accept any point order but reject swapped coordinates and duplicates', () => {
  const expected = [[3, 506.5], [10, 511.2]];
  assert.equal(checkPoints([['10', '511.2'], ['3', '506.5']], expected), true);
  assert.equal(checkPoints([['506.5', '3'], ['10', '511.2']], expected), false);
  assert.equal(checkPoints([['3', '506.5'], ['3', '506.5']], expected), false);
  assert.equal(checkPoints([['3', ''], ['10', '511.2']], expected), false);
  assert.equal(checkPoints([['3', '506.5']], expected), false);
  assert.equal(checkPoints([], []), true);
});

test('displayed lists use and for multiple values', () => {
  assert.equal(formatList([]), 'none');
  assert.equal(formatList([5]), '5');
  assert.equal(formatList([0, 15]), '0 and 15');
  assert.equal(formatList([1, 2, 3]), '1, 2, and 3');
});
