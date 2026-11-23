import test from 'node:test';
import assert from 'node:assert/strict';
import { factorPractice, groupingPractice, quadraticFormPractice, orderQuadraticFormPractice, sections, checkStep } from './model.mjs';

test('GCF practice checks each requested example and stops before solving', () => {
  const expected = [
    ['3x² + 9x', '3x', [1, 3], 'x+3'],
    ['6x³ − 14x²', '2x²', [3, -7], '3x-7'],
    ['x³ − 5x² + 2x', 'x', [1, -5, 2], 'x^2-5x+2'],
    ['x³ − 4x² − 12x', 'x', [1, -4, -12], 'x^2-4x-12', ['x-6', 'x+2']],
    ['5x³ + 15x² − 90x', '5x', [1, 3, -18], 'x^2+3x-18', ['x+6', 'x-3']],
    ['−3x³ + 12x² − 9x', '−3x', [1, -4, 3], 'x^2-4x+3', ['x-1', 'x-3']],
    ['2x³ − 32x', '2x', [1, 0, -16], 'x^2-16', ['x-4', 'x+4']],
    ['x⁴ − 7x³ + 10x²', 'x²', [1, -7, 10], 'x^2-7x+10', ['x-5', 'x-2']],
    ['x³ − 8x² + 16x', 'x', [1, -8, 16], 'x^2-8x+16', ['x-4', 'x-4']],
    ['−3x⁵ + 3x³', '−3x³', [1, 0, -1], 'x^2-1', ['x-1', 'x+1']],
  ];
  assert.equal(factorPractice.length, expected.length);
  expected.forEach(([equation, outside, quotient, expression, factors], index) => {
    const problem = factorPractice[index];
    assert.equal(problem.equation, equation);
    assert.equal(problem.steps.length, factors ? 3 : 2);
    assert.deepEqual(checkStep(problem.steps[0], [outside]), [true]);
    assert.deepEqual(checkStep(problem.steps[1], [outside, expression]), [true, true]);
    assert.deepEqual(problem.steps[1].division.outside, outside);
    if (factors) {
      assert.deepEqual(checkStep(problem.steps[2], factors), [true, true]);
      assert.deepEqual(checkStep(problem.steps[2], [...factors].reverse()), [true, true]);
      if (factors[0] !== factors[1]) assert.notDeepEqual(checkStep(problem.steps[2], [factors[0], factors[0]]), [true, true]);
      assert.deepEqual(problem.steps[2].box, { b: quotient[1], c: quotient[2] });
    }
  });
});

test('new examples support repeated factors, a zero middle term, and a cubic GCF', () => {
  assert.deepEqual(checkStep(factorPractice[8].steps[2], ['x-4', 'x-4']), [true, true]);
  assert.deepEqual(checkStep(factorPractice[8].steps[2], ['x-4', '']), [true, false]);
  assert.equal(factorPractice[8].steps[2].result, 'x(x − 4)²');
  assert.equal(factorPractice[8].factored, 'x(x − 4)²');
  assert.equal(factorPractice[6].factored, '2x(x − 4)(x + 4)');
  assert.deepEqual(factorPractice[6].steps[2].box, { b: 0, c: -16 });
  assert.deepEqual(checkStep(factorPractice[9].steps[0], ['-3x^3']), [true]);
});

test('further factoring requires complete factors in either order', () => {
  const step = factorPractice[5].steps[2];
  assert.deepEqual(checkStep(step, ['x-1', 'x-3']), [true, true]);
  assert.deepEqual(checkStep(step, ['x − 3', '1x-1']), [true, true]);
  assert.notDeepEqual(checkStep(step, ['-1', '-3']), [true, true]);
  assert.notDeepEqual(checkStep(step, ['x-1', 'x-1']), [true, true]);
  assert.notDeepEqual(checkStep(step, ['', 'x-3']), [true, true]);
});

test('whole expressions accept equivalent terms and reject incorrect or malformed expressions', () => {
  const linear = factorPractice[1].steps[1];
  assert.deepEqual(checkStep(linear, ['2x^2', '3x - 7']), [true, true]);
  assert.deepEqual(checkStep(linear, ['2x^2', '-7+3x']), [true, true]);
  assert.deepEqual(checkStep(linear, ['2x^2', '3x+7']), [true, false]);
  assert.deepEqual(checkStep(linear, ['2x^2', '']), [true, false]);
  assert.deepEqual(checkStep(linear, ['2x^2', '3x--7']), [true, false]);
  const quadratic = factorPractice[2].steps[1];
  assert.deepEqual(checkStep(quadratic, ['x', '1x² − 5x + 2']), [true, true]);
  assert.deepEqual(checkStep(quadratic, ['x', 'x^2-5x-2']), [true, false]);
});

test('GCF inputs accept typed exponents and reject incorrect or blank factors', () => {
  const step = factorPractice[1].steps[0];
  assert.deepEqual(checkStep(step, ['2x^2']), [true]);
  assert.deepEqual(checkStep(step, ['2x']), [false]);
  assert.deepEqual(checkStep(step, ['']), [false]);
  assert.deepEqual(checkStep(factorPractice[5].steps[0], ['-3x']), [true]);
});

test('grouping practice guides four irreducible and four further-factorable examples', () => {
  const examples = [
    [3, 7, 'x³ + 3x² + 7x + 21'],
    [-2, 5, 'x³ − 2x² + 5x − 10'],
    [4, 9, 'x³ + 4x² + 9x + 36'],
    [-3, 4, 'x³ − 3x² + 4x − 12'],
    [2, -9, 'x³ + 2x² − 9x − 18'],
    [-3, -4, 'x³ − 3x² − 4x + 12'],
    [4, -25, 'x³ + 4x² − 25x − 100'],
    [-5, -1, 'x³ − 5x² − x + 5'],
  ];
  assert.equal(groupingPractice.length, examples.length);
  examples.forEach(([shift, constant, equation], index) => {
    const problem = groupingPractice[index];
    const binomial = `x${shift < 0 ? '' : '+'}${shift}`;
    const quadratic = `x^2${constant < 0 ? '' : '+'}${constant}`;
    assert.equal(problem.equation, equation);
    assert.equal(problem.steps.length, index < 4 ? 4 : 5);
    assert.deepEqual(checkStep(problem.steps[1], ['x^2', String(constant)]), [true, true]);
    assert.deepEqual(checkStep(problem.steps[2], [binomial, binomial]), [true, true]);
    assert.deepEqual(checkStep(problem.steps[3], [quadratic, binomial]), [true, true]);
    assert.deepEqual(checkStep(problem.steps[3], [binomial, quadratic]), [false, false]);
    assert.notDeepEqual(checkStep(problem.steps[3], [binomial, binomial]), [true, true]);
    const [quadraticText, binomialText] = problem.steps[3].answers;
    assert.equal(problem.steps[3].result, `(${quadraticText})(${binomialText})`);
    if (index >= 4) {
      const root = Math.sqrt(-constant);
      assert.equal(Number.isInteger(root), true);
      assert.deepEqual(checkStep(problem.steps[4], [`x-${root}`, `x+${root}`]), [true, true]);
      assert.deepEqual(problem.steps[4].box, { b: 0, c: constant });
      assert.equal(problem.steps[4].equation, `(□)(□)(${binomialText})`);
      assert.equal(problem.factored, `(x + ${root})(x − ${root})(${binomialText})`);
    } else {
      assert.ok(constant > 0);
    }
  });
});

test('grouping checks signed GCFs and complete polynomial factors', () => {
  const problem = groupingPractice[4];
  assert.deepEqual(checkStep(problem.steps[1], ['x^2', '9']), [true, false]);
  assert.deepEqual(checkStep(problem.steps[2], ['x+2', 'x-2']), [true, false]);
  assert.deepEqual(checkStep(problem.steps[3], ['x^2+9', 'x+2']), [false, true]);
  assert.deepEqual(checkStep(problem.steps[3], ['', 'x+2']), [false, true]);
  assert.deepEqual(checkStep(problem.steps[3], ['-9+x²', '1x + 2']), [true, true]);
});

test('grouping keeps the quadratic and its factors first in both solving sections', () => {
  const grouped = sections[1].examples[0];
  assert.equal(grouped.steps.find(step => step.title === 'Factor out the matching expression.').result, '(x² − 9)(x + 2) = 0');
  assert.equal(grouped.factored, '(x + 3)(x − 3)(x + 2)');
  const mixed = sections[3].examples[1];
  assert.equal(mixed.steps.find(step => step.title === 'Factor out the matching expression.').result, '2x(x² − 9)(x + 5) = 0');
  const further = mixed.steps.find(step => step.completeFactors);
  assert.equal(further.equation, '2x(□)(□)(x + 5) = 0');
  assert.equal(further.result, '2x(x + 3)(x − 3)(x + 5) = 0');
  assert.equal(mixed.factored, '2x(x + 3)(x − 3)(x + 5)');
  assert.deepEqual(mixed.steps.at(-2).answers, ['2x', 'x + 3', 'x − 3', 'x + 5']);
});

test('quadratic-form examples meet the requested leading coefficients and factoring levels', () => {
  const examples = [
    ['x⁴ + 3x² + 2', 1, 3, 2, ['x^2+1', 'x^2+2'], []],
    ['x⁴ + 7x² + 10', 1, 7, 10, ['x^2+2', 'x^2+5'], []],
    ['x⁴ + 7x² + 12', 1, 7, 12, ['x^2+3', 'x^2+4'], []],
    ['x⁴ − x² − 12', 1, -1, -12, ['x^2-4', 'x^2+3'], [2]],
    ['x⁴ − 13x² + 36', 1, -13, 36, ['x^2-9', 'x^2-4'], [3, 2]],
    ['2x⁴ + 7x² + 3', 2, 7, 3, ['2x^2+1', 'x^2+3'], []],
    ['3x⁴ + 5x² + 2', 3, 5, 2, ['3x^2+2', 'x^2+1'], []],
    ['5x⁴ + 13x² + 6', 5, 13, 6, ['5x^2+3', 'x^2+2'], []],
    ['7x⁴ − 26x² − 8', 7, -26, -8, ['7x^2+2', 'x^2-4'], [2]],
    ['6x⁴ − 49x² − 45', 6, -49, -45, ['6x^2+5', 'x^2-9'], [3]],
  ];
  assert.equal(quadraticFormPractice.length, examples.length);
  examples.forEach(([equation, a, b, c, factors, roots], index) => {
    const problem = quadraticFormPractice[index];
    assert.equal(problem.equation, equation);
    assert.equal(problem.steps.length, 1 + roots.length);
    assert.deepEqual(problem.steps[0].box, { a, b, c, power: 2 });
    assert.deepEqual(checkStep(problem.steps[0], factors), [true, true]);
    assert.deepEqual(checkStep(problem.steps[0], [...factors].reverse()), [true, true]);
    assert.notDeepEqual(checkStep(problem.steps[0], [factors[0], factors[0]]), [true, true]);
    roots.forEach((root, offset) => {
      const step = problem.steps[offset + 1];
      assert.deepEqual(step.box, { b: 0, c: -root * root });
      assert.deepEqual(checkStep(step, [`x-${root}`, `x+${root}`]), [true, true]);
    });
  });
  assert.equal(quadraticFormPractice[4].factored, '(x − 3)(x + 3)(x − 2)(x + 2)');
});

test('quadratic-form follow-up steps preserve the entered order of both factors', () => {
  const original = quadraticFormPractice[4];
  for (const [first, initial, equation, intermediate, final] of [
    ['x^2-9', '(x² − 9)(x² − 4)', '(□)(□)(x² − 4)', '(x − 3)(x + 3)(x² − 4)', '(x − 3)(x + 3)(x − 2)(x + 2)'],
    ['x^2-4', '(x² − 4)(x² − 9)', '(□)(□)(x² − 9)', '(x − 2)(x + 2)(x² − 9)', '(x − 2)(x + 2)(x − 3)(x + 3)'],
  ]) {
    const problem = orderQuadraticFormPractice(original, first);
    assert.equal(problem.steps[0].result, initial);
    assert.equal(problem.steps[1].equation, equation);
    assert.equal(problem.steps[1].result, intermediate);
    assert.equal(problem.steps[2].result, final);
    assert.equal(problem.factored, final);
  }
  assert.equal(quadraticFormPractice[3].steps[1].result, '(x − 2)(x + 2)(x² + 3)');
  assert.equal(quadraticFormPractice[9].steps[1].result, '(6x² + 5)(x − 3)(x + 3)');
});

test('quadratic-form factors reject wrong signs, missing x², and invalid input', () => {
  const step = quadraticFormPractice[9].steps[0];
  assert.deepEqual(checkStep(step, ['x² - 9', '6x^2+5']), [true, true]);
  assert.notDeepEqual(checkStep(step, ['6x^2+5', 'x^2+9']), [true, true]);
  assert.notDeepEqual(checkStep(step, ['6x+5', 'x^2-9']), [true, true]);
  assert.notDeepEqual(checkStep(step, ['', 'x^2-9']), [true, true]);
});

test('factor-and-solve checks all zeros in the guided examples', () => {
  const coefficients = [
    [[3, 9, 0], [1, -4, -12, 0], [-3, 12, -9, 0], [2, 0, -32, 0], [1, -8, 16, 0]],
    [[1, 2, -9, -18], [1, -3, -4, 12], [1, 4, 25, 100], [1, -5, -1, 5], [1, 3, 4, 12]],
    [[1, 0, -5, 0, 4], [1, 0, -6, 0, 8], [1, 0, -13, 0, 36], [1, 0, 5, 0, -36], [2, 0, -19, 0, 9]],
    [[1, 2, -9, -18, 0], [2, 10, -18, -90, 0], [1, 0, -5, 0, 4, 0], [3, 0, -21, 0, 30, 0]],
  ];
  const zeroCounts = [[2, 3, 3, 3, 2], [3, 3, 3, 3, 3], [4, 4, 4, 4, 4], [4, 4, 5, 5]];
  assert.deepEqual(sections.map(section => section.title), ['GCF', 'Grouping', 'Quadratic Form', 'Mixed Practice']);
  sections.forEach((section, sectionIndex) => {
    assert.equal(section.examples.length, sectionIndex === 3 ? 4 : 5);
    section.examples.forEach((problem, index) => {
      assert.match(problem.equation, / = 0$/);
      assert.equal(problem.steps.at(-2).title, 'Set each factor equal to zero.');
      assert.equal(problem.steps.at(-1).title, 'Find all zeros.');
      assert.ok(problem.steps.every(step => !step.fields || !step.fields.includes('Distinct real roots')));
      if (sectionIndex === 3) assert.equal(problem.steps[0].answers[0], problem.method);
      for (const step of problem.steps) {
        if (step.answers.length) assert.ok(checkStep(step, step.answers).every(Boolean), step.title);
      }
      const zeroStep = problem.steps.at(-1);
      assert.ok(checkStep(zeroStep, [...problem.solutions].reverse()).every(Boolean));
      assert.equal(problem.solutions.length, zeroCounts[sectionIndex][index]);
      assert.equal(new Set(problem.solutions).size, problem.solutions.length);
      for (const solution of problem.solutions) {
        const text = solution.replace('−', '-');
        const imaginary = text.includes('i');
        if (imaginary) assert.ok((sectionIndex === 2 && index === 3) || (sectionIndex === 1 && (index === 2 || index === 4)));
        const negative = text.startsWith('-');
        const [magnitudeText, denominator = '1'] = text.replace(/^-/, '').replace('i', '').split('/');
        const magnitude = magnitudeText.startsWith('√')
          ? Math.sqrt(Number(magnitudeText.slice(1))) : Number(magnitudeText || 1);
        const value = (negative ? -1 : 1) * magnitude / Number(denominator);
        const [xReal, xImag] = imaginary ? [0, value] : [value, 0];
        const [real, imag] = coefficients[sectionIndex][index].reduce(([r, i], coefficient) =>
          [r * xReal - i * xImag + coefficient, r * xImag + i * xReal], [0, 0]);
        assert.ok(Number.isFinite(value) && Math.abs(real) < 1e-8 && Math.abs(imag) < 1e-8, `${problem.equation}: ${solution}`);
      }
    });
  });
});

test('mixed practice combines GCF with the requested second method', () => {
  const examples = [
    ['x⁴ + 2x³ − 9x² − 18x = 0', 'x', 'x^3+2x^2-9x-18', 'Grouping', 'x(x + 3)(x − 3)(x + 2)'],
    ['2x⁴ + 10x³ − 18x² − 90x = 0', '2x', 'x^3+5x^2-9x-45', 'Grouping', '2x(x + 3)(x − 3)(x + 5)'],
    ['x⁵ − 5x³ + 4x = 0', 'x', 'x^4-5x^2+4', 'Quadratic Form', 'x(x − 2)(x + 2)(x − 1)(x + 1)'],
    ['3x⁵ − 21x³ + 30x = 0', '3x', 'x^4-7x^2+10', 'Quadratic Form', '3x(x² − 5)(x² − 2)'],
  ];
  sections[3].examples.forEach((problem, index) => {
    const [equation, outside, quotient, method, factored] = examples[index];
    assert.equal(problem.equation, equation);
    assert.deepEqual(checkStep(problem.steps[0], ['GCF']), [true]);
    assert.deepEqual(checkStep(problem.steps[1], [outside]), [true]);
    assert.deepEqual(checkStep(problem.steps[2], [outside, quotient]), [true, true]);
    assert.deepEqual(checkStep(problem.steps[3], [method]), [true]);
    assert.deepEqual(checkStep(problem.steps[3], [method === 'Grouping' ? 'Quadratic Form' : 'Grouping']), [false]);
    const remaining = quotient.replaceAll('^3', '³').replaceAll('^4', '⁴').replaceAll('^2', '²').replaceAll('+', ' + ').replaceAll('-', ' − ');
    assert.equal(problem.steps[2].result, `${outside}(${remaining}) = 0`);
    assert.equal(problem.remainingExpression, remaining);
    assert.equal(problem.factored, factored);
    if (method === 'Grouping') {
      assert.equal(problem.steps[4].action, 'group');
      assert.ok(problem.steps.find(step => step.groupedDivision).result.startsWith(`${outside}[`));
    } else {
      assert.ok(problem.steps.some(step => step.box && step.box.power === 2));
    }
  });
});

test('mixed GCF quotients accept equivalent cubic and quartic expressions but reject malformed or wrong terms', () => {
  const cubic = sections[3].examples[1].steps[2];
  assert.deepEqual(checkStep(cubic, ['2x', '-45-9x+5x²+x³']), [true, true]);
  assert.deepEqual(checkStep(cubic, ['2x', 'x^3+5x^2-9x+45']), [true, false]);
  assert.deepEqual(checkStep(cubic, ['2x', 'x^3+5x^2--9x-45']), [true, false]);
  const quartic = sections[3].examples[2].steps[2];
  assert.deepEqual(checkStep(quartic, ['x', '4-5x²+x⁴']), [true, true]);
  assert.deepEqual(checkStep(quartic, ['x', 'x^4-5x^2+4+x^5']), [true, false]);
  assert.deepEqual(checkStep(quartic, ['x', 'x^4-5x^2+4+1/0']), [true, false]);
});

test('quadratic-form solving example 4 checks real and complex zeros', () => {
  assert.equal(sections[2].examples[2].equation, 'x⁴ − 13x² + 36 = 0');
  const problem = sections[2].examples[3];
  assert.equal(problem.equation, 'x⁴ + 5x² − 36 = 0');
  assert.equal(problem.factored, '(x − 2)(x + 2)(x² + 9)');
  assert.deepEqual(problem.steps.at(-2).answers, ['x − 2', 'x + 2', 'x² + 9']);
  const zeros = problem.steps.at(-1);
  assert.deepEqual(checkStep(zeros, ['2', '-2', '3i', '-3i']), [true, true, true, true]);
  assert.deepEqual(checkStep(zeros, ['-i3', 'i3', '-2', '2']), [true, true, true, true]);
  assert.notDeepEqual(checkStep(zeros, ['2', '-2', '3i', '3i']), [true, true, true, true]);
  assert.notDeepEqual(checkStep(zeros, ['2', '-2', '3', '-3']), [true, true, true, true]);
});

test('grouping solving examples 3 and 5 guide students to integer imaginary zeros', () => {
  for (const [index, equation, constant, shift, zeros] of [
    [2, 'x³ + 4x² + 25x + 100 = 0', 25, 4, ['-4', '5i', '-5i']],
    [4, 'x³ + 3x² + 4x + 12 = 0', 4, 3, ['-3', '2i', '-2i']],
  ]) {
    const problem = sections[1].examples[index];
    assert.equal(problem.equation, equation);
    assert.equal(problem.factored, `(x² + ${constant})(x + ${shift})`);
    assert.deepEqual(checkStep(problem.steps[1], ['x^2', String(constant)]), [true, true]);
    assert.deepEqual(checkStep(problem.steps[2], [`x+${shift}`, `x+${shift}`]), [true, true]);
    assert.deepEqual(checkStep(problem.steps[3], [`x^2+${constant}`, `x+${shift}`]), [true, true]);
    assert.deepEqual(checkStep(problem.steps.at(-2), [`x^2+${constant}`, `x+${shift}`]), [true, true]);
    assert.deepEqual(checkStep(problem.steps.at(-1), zeros), [true, true, true]);
    assert.notDeepEqual(checkStep(problem.steps.at(-1), [zeros[0], zeros[1], zeros[1]]), [true, true, true]);
    assert.notDeepEqual(checkStep(problem.steps.at(-1), [zeros[0], String(Math.sqrt(constant)), String(-Math.sqrt(constant))]), [true, true, true]);
  }
});

test('setting factors equal to zero checks each distinct factor, including GCFs and quadratics', () => {
  const gcf = sections[0].examples[0].steps.at(-2);
  assert.deepEqual(gcf.answers, ['3x', 'x + 3']);
  assert.deepEqual(checkStep(gcf, ['x+3', 'x']), [true, true]);
  assert.notDeepEqual(checkStep(gcf, ['x+3', 'x+3']), [true, true]);
  assert.notDeepEqual(checkStep(gcf, ['', 'x+3']), [true, true]);
  const repeated = sections[0].examples[4].steps.at(-2);
  assert.deepEqual(repeated.answers, ['x', 'x − 4']);
  assert.deepEqual(checkStep(repeated, ['-2x', '2x-8']), [true, true]);
  assert.notDeepEqual(checkStep(repeated, ['x', 'x+4']), [true, true]);
  const grouping = sections[1].examples[4].steps.at(-2);
  assert.deepEqual(checkStep(grouping, ['x^2+4', 'x+3']), [true, true]);
  const quadratic = sections[2].examples[4].steps.at(-2);
  assert.deepEqual(quadratic.answers, ['2x² − 1', 'x − 3', 'x + 3']);
  assert.deepEqual(checkStep(quadratic, ['x+3', 'x^2-1/2', 'x-3']), [true, true, true]);
  assert.notDeepEqual(checkStep(quadratic, ['x+3', 'x^2+1/2', 'x-3']), [true, true, true]);
  const mixed = sections[3].examples[3].steps.at(-2);
  assert.deepEqual(checkStep(mixed, ['x', 'x^2-5', 'x^2-2']), [true, true, true]);
});

test('solving accepts radical notation and only one zero for repeated factors', () => {
  const zeros = sections[2].examples[1].steps.at(-1);
  assert.deepEqual(checkStep(zeros, ['sqrt(2)', '-2', '-sqrt(2)', '2']), [true, true, true, true]);
  assert.notDeepEqual(checkStep(zeros, ['-2', 'sqrt(2)', 'sqrt(2)', '2']), [true, true, true, true]);
  const repeated = sections[0].examples[4].steps.at(-1);
  assert.deepEqual(repeated.answers, ['0', '4']);
  assert.deepEqual(checkStep(repeated, ['4', '0']), [true, true]);
  const fractions = sections[2].examples[4].steps.at(-1);
  assert.deepEqual(checkStep(fractions, ['-sqrt(2)/2', 'sqrt(2)/2', '3', '-3']), [true, true, true, true]);
  assert.deepEqual(checkStep(fractions, ['-sqrt(1/2)', 'sqrt(1/2)', '3', '-3']), [true, true, true, true]);
  assert.deepEqual(checkStep(fractions, ['-√(2/4)', '√(1/2)', '3', '-3']), [true, true, true, true]);
  assert.notDeepEqual(checkStep(fractions, ['-sqrt(2)/2', 'i/2', '3', '-3']), [true, true, true, true]);
  assert.notDeepEqual(checkStep(fractions, ['-sqrt(1/0)', 'sqrt(1/2)', '3', '-3']), [true, true, true, true]);
  assert.notDeepEqual(checkStep(fractions, ['radical:-1/2', 'sqrt(1/2)', '3', '-3']), [true, true, true, true]);
  assert.notDeepEqual(checkStep(fractions, ['sqrt(1/2)', 'sqrt(1/2)', '3', '-3']), [true, true, true, true]);
  assert.deepEqual(checkStep(sections[3].examples[3].steps.at(-1), ['0', '-sqrt(5)', 'sqrt(5)', '-sqrt(2)', 'sqrt(2)']), [true, true, true, true, true]);
});

test('solving preserves quadratic-factor order and the GCF in mixed practice', () => {
  const normal = orderQuadraticFormPractice(sections[2].examples[2], 'x^2-4');
  assert.equal(normal.steps.find(step => step.box && step.box.power === 2).result, '(x² − 4)(x² − 9) = 0');
  const problem = sections[3].examples[2];
  const reordered = orderQuadraticFormPractice(problem, 'x^2-1');
  assert.equal(reordered.remainingExpression, 'x⁴ − 5x² + 4');
  assert.equal(reordered.steps.find(step => step.box && step.box.power === 2).result, 'x(x² − 1)(x² − 4) = 0');
  const further = reordered.steps.filter(step => step.completeFactors);
  assert.equal(further[0].result, 'x(x − 1)(x + 1)(x² − 4) = 0');
  assert.equal(further[1].result, 'x(x − 1)(x + 1)(x − 2)(x + 2) = 0');
  assert.deepEqual(reordered.steps.at(-2).answers, ['x', 'x − 1', 'x + 1', 'x − 2', 'x + 2']);
  assert.deepEqual(reordered.steps.at(-1).answers, problem.solutions);
  assert.equal(reordered.mixed, true);
});
