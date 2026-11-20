import { svgElement } from '../absolute-value-features/graph.js?v=20261120p6g';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';
import { expandCubic, expandRepeatedFactors, outsideCoefficient, parseFactor, parseValue, validPoint } from './model.mjs?v=20261120p7';

export function mountPolynomialPractice({ examples, renderExample, source = 'graph' }) {
  const fromGraph = source === 'graph';
  const picker = document.querySelector('#example-picker');
  const questions = document.querySelector('#questions');
  const complete = document.querySelector('#complete');
  const completedFactored = document.querySelector('#completed-factored');
  const completedStandard = document.querySelector('#completed-standard');
  const retry = document.querySelector('#try-again');
  const next = document.querySelector('#next-example');
  let example = examples[0];
  let zeroCount;
  let factors;
  let point;

  const isHalfRoot = root => Math.abs(root) === 0.5;

  function field(label, { factor = false, integer = false } = {}) {
    const input = document.createElement('input');
    input.className = factor ? 'coord factor-field' : 'coord';
    input.inputMode = integer ? 'numeric' : factor || !Number.isInteger(example.a) || example.roots.some(isHalfRoot) ? 'text' : 'decimal';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', label);
    return input;
  }

  function span(...content) {
    const node = document.createElement('span');
    node.append(...content);
    return node;
  }

  function group(...content) {
    const node = span(...content);
    node.className = 'group';
    return node;
  }

  const minus = value => String(value).replace('-', '−');
  function coefficientText(value) {
    const magnitude = Math.abs(value);
    if (!Number.isInteger(magnitude)) {
      const denominator = [2, 3].find(divisor => Math.abs(magnitude * divisor - Math.round(magnitude * divisor)) < 1e-9);
      if (denominator) {
        const numerator = Math.round(magnitude * denominator);
        const fraction = numerator === 1 && denominator === 2 ? '½' : `${numerator}⁄${denominator}`;
        return `${value < 0 ? '−' : ''}${fraction}`;
      }
    }
    return minus(value);
  }
  const aValue = () => outsideCoefficient(example, factors);
  const leadingCoefficient = () => coefficientText(aValue());
  const powerTerms = ['', 'x', 'x²', 'x³'];
  const powerNames = ['Constant term', 'Coefficient of x', 'Coefficient of x squared', 'Coefficient of x cubed'];
  const exponentText = ['', '', '²', '³'];
  const exponentNames = ['', '', 'squared', 'cubed'];
  const factorPowers = () => example.roots.map(root => example.multiplicities[root] ?? 1).sort((a, b) => a - b);
  const highestPower = () => factorPowers().at(-1);
  const repeatedRootExample = () => highestPower() > 1;

  function signedConstant(constant) {
    return constant === 0 ? '' : ` ${constant < 0 ? '−' : '+'} ${coefficientText(Math.abs(constant))}`;
  }

  function factorText({ linear, constant, multiplicity }) {
    return `(${linear === 1 ? '' : linear}x${signedConstant(constant)})${exponentText[multiplicity]}`;
  }

  function substitutedFactor({ linear, constant, multiplicity }, index) {
    const multiplier = linear === 1 ? '' : `${linear} · `;
    return group(`(${multiplier}`, field(`Substituted x-value in factor ${index + 1}`),
      `${signedConstant(constant)})${exponentText[multiplicity]}`);
  }

  function coefficientFields(degree, monic = false) {
    const terms = monic ? [powerTerms[degree]] : [];
    for (let power = degree - Number(monic); power >= 0; power--) {
      terms.push(group(terms.length ? '+' : '', field(powerNames[power]), powerTerms[power]));
    }
    return terms;
  }

  function combinationFields({ combined }) {
    return coefficientFields(combined.length - 1, combined[0] === 1);
  }

  function combinationAnswers({ combined }) {
    return combined[0] === 1 ? combined.slice(1) : combined;
  }

  function termText({ coefficient, power }, first = false) {
    const magnitude = Math.abs(coefficient);
    const term = power && magnitude === 1 ? powerTerms[power] : `${coefficientText(magnitude)}${powerTerms[power]}`;
    if (first) return `${coefficient < 0 ? '−' : ''}${term}`;
    return `${coefficient < 0 ? ' − ' : ' + '}${term}`;
  }

  function polynomialText(coefficients) {
    const terms = coefficients.map((coefficient, index) => ({
      coefficient, power: coefficients.length - index - 1,
    })).filter(({ coefficient }) => coefficient !== 0);
    return terms.map((term, index) => termText(term, index === 0)).join('') || '0';
  }

  function productFields({ products, right }) {
    return products.map(({ power }, index) => {
      const term = group(index ? '+' : '', field(`Product ${index + 1}, ${powerNames[power]}`), powerTerms[power]);
      term.classList.add('foil-product', index < right.length ? 'foil-first' : 'foil-second');
      return term;
    });
  }

  function productText({ products }) {
    return products.map((term, index) => termText(term, index === 0)).join('');
  }

  function distributionDiagram(id, { left, right }) {
    const leftXs = [42, 101];
    const firstRightX = right.length === 2 ? 174 : 154;
    const offset = right[0].coefficient === 1 ? 0 : 12;
    const rightXs = right.map((_, index) => firstRightX + offset + index * 59);
    const rightClose = rightXs.at(-1) + 32;
    const leftText = left.map((term, index) => termText(term, index === 0).trim());
    const rightText = right.map((term, index) => termText(term, index === 0).trim());
    const svg = svgElement('svg', {
      viewBox: `0 0 ${rightClose + 10} 140`,
      role: 'img',
      'aria-label': `Red arrows distribute ${leftText[0]} to ${rightText.join(', ')}. Green arrows distribute ${leftText[1]} to the same terms.`,
      class: 'p6-distribution',
    });
    const defs = svgElement('defs', {});
    svg.append(defs);
    for (const [source, color] of ['foil-first', 'foil-second'].entries()) {
      const markerId = `${id}-arrow-${source}`;
      const marker = svgElement('marker', {
        id: markerId, markerWidth: 7, markerHeight: 7, refX: 7 / 3, refY: 3.5, orient: 'auto',
        markerUnits: 'userSpaceOnUse',
      });
      marker.append(svgElement('path', { d: 'M 0 0 L 7 3.5 L 0 7 Z', class: `foil-head ${color}` }));
      defs.append(marker);
      const start = leftXs[source];
      const y = source === 0 ? 53 : 83;
      rightXs.forEach((target, index) => {
        const end = target - 2;
        const bend = source === 0 ? 31 - index * 12 : 108 + index * 12;
        const approach = source === 0 ? y - 3 : y + 3;
        svg.append(svgElement('path', {
          d: `M ${start} ${y} C ${start} ${bend}, ${end} ${bend}, ${end} ${approach} L ${end} ${y}`,
          'marker-end': `url(#${markerId})`,
          class: `foil-arrow ${color}`,
        }));
      });
    }
    const labels = [
      [15, '('], ...leftXs.map((x, index) => [x, leftText[index]]), [128, ')'],
      [firstRightX - 16, '('], ...rightXs.map((x, index) => [x, rightText[index]]), [rightClose, ')'],
    ];
    labels.forEach(([x, label]) => {
      svg.append(svgElement('text', { x, y: 74, 'text-anchor': 'middle', class: 'foil-term' }, label));
    });
    return svg;
  }

  function fraction(numerator, denominator) {
    const node = span();
    node.className = 'fraction';
    const top = span(minus(numerator));
    top.className = 'numerator';
    const bottom = span(denominator);
    bottom.className = 'denominator';
    node.append(top, bottom);
    return node;
  }

  const expansion = () => expandCubic(factors, aValue());
  const factorProduct = () => factors.map(factorText).join('');
  const distributedFactors = () => expandRepeatedFactors(factors);
  const factoredFormText = () => `y = ${leadingCoefficient()}${factorProduct()}`;
  const standardFormText = () => `f(x) = ${polynomialText(expansion().standard)}`;
  const product = () => factors.reduce((value, { linear, constant, multiplicity }) =>
    value * (linear * point.x + constant) ** multiplicity, 1);
  const repeated = (count, build) => Array.from({ length: count }, (_, index) => build(index + 1));
  const rootsCorrect = values => values.map(value =>
    example.roots.includes(value) && values.indexOf(value) === values.lastIndexOf(value));
  function factorsCorrect(values) {
    const rootsMatch = rootsCorrect(values.map(factor => factor?.root));
    return values.map((factor, index) => rootsMatch[index]
      && factor.multiplicity === (example.multiplicities[factor.root] ?? 1)
      && (factor.linear === 1 || (factor.linear === 2 && isHalfRoot(factor.root))));
  }

  function readFactorSlot(value, index) {
    const factor = parseFactor(value);
    const multiplicity = factorPowers()[index];
    if (!factor || (factor.multiplicity !== 1 && factor.multiplicity !== multiplicity)) return null;
    return { ...factor, multiplicity };
  }

  function factorFields() {
    return factorPowers().map((power, index) => {
      const closing = span(')');
      if (power > 1) {
        const exponent = document.createElement('sup');
        exponent.textContent = power;
        closing.append(exponent);
      }
      const label = `Factor ${index + 1}${power > 1 ? `, ${exponentNames[power]}` : ''}`;
      return group('(', field(label, { factor: true }), closing);
    });
  }

  const steps = [
    {
      id: 'zero-count',
      title: 'How many distinct zeros are there?',
      build: () => [field('Number of zeros', { integer: true })],
      expected: () => [example.roots.length],
      remember: ([value]) => { zeroCount = value; },
      hint: fromGraph ? 'Count the places where the curve crosses or touches the x-axis.' : 'Count each distinct x-value in the problem statement once.',
    },
    {
      id: 'zeros',
      title: fromGraph ? 'What are the zeros?' : 'What are the roots?',
      build: () => ['x =', ...repeated(zeroCount, index => field(`Zero ${index}`))],
      check: rootsCorrect,
      hint: fromGraph ? 'Read each x-intercept and enter each zero once.' : 'Enter each root from the problem statement once.',
    },
    {
      id: 'factors',
      title: 'Write a factor for each zero.',
      note: () => {
        if (repeatedRootExample()) {
          const subject = example.roots.length === 1 ? 'The factor' : 'The last factor';
          return `Enter the expressions inside the parentheses. ${subject} is ${exponentNames[highestPower()]}.`;
        }
        const halfRoot = example.roots.find(isHalfRoot);
        if (halfRoot === undefined) return '';
        const sign = halfRoot < 0 ? '+' : '−';
        return `For the zero at ${coefficientText(halfRoot)}, either x ${sign} ½ or 2x ${sign} 1 works.`;
      },
      build: () => ['f(x) = a', ...factorFields()],
      read: readFactorSlot,
      check: factorsCorrect,
      remember: values => { factors = values; },
      result: () => `f(x) = a${factorProduct()}`,
      hint: () => repeatedRootExample()
        ? 'Use x − r for each zero. Match the factor to the exponent shown.'
        : 'Use x − r for a zero at x = r. Enter an expression such as x − 2 in each box.',
    },
    {
      id: 'point',
      title: fromGraph ? 'Choose another point to find a.' : 'Enter the given point to find a.',
      note: fromGraph ? 'Enter a point on the curve with a nonzero y-coordinate. You can use the labeled point.' : '',
      build: () => [group('(', field('Point x-coordinate'), ',', field('Point y-coordinate'), ')')],
      check: ([x, y]) => {
        const correct = fromGraph ? validPoint(example, x, y)
          : x === example.labeledPoint.x && y === example.labeledPoint.y;
        return [correct, correct];
      },
      remember: ([x, y]) => { point = { x, y }; },
      hint: fromGraph ? 'Check that the ordered pair is on the graph and its y-coordinate is nonzero.'
        : 'Use the ordered pair given in the problem statement.',
    },
    {
      id: 'substitution',
      title: 'Substitute the point into the equation.',
      build: () => [
        field('Substituted y-value'), '= a',
        ...factors.map(substitutedFactor),
      ],
      expected: () => [point.y, ...factors.map(() => point.x)],
      hint: 'Use the y-coordinate on the left and the same x-coordinate in each factor.',
    },
    {
      id: 'product',
      title: 'Multiply the numbers in the factors.',
      build: () => [`${minus(point.y)} = a ·`, field('Product of the substituted factors')],
      expected: () => [product()],
      hint: 'Evaluate each factor, including any power, and multiply the results. Leave a outside.',
    },
    {
      id: 'divide',
      title: 'Divide to find a.',
      build: () => ['a =', fraction(point.y, field('Number to divide by')), '=', field('Value of a')],
      expected: () => [product(), aValue()],
      hint: 'Divide both sides by the number multiplying a.',
    },
    {
      id: 'factored-form',
      title: 'Factored Form',
      build: () => ['y =', field('Leading coefficient a'), factorProduct()],
      expected: () => [aValue()],
      result: factoredFormText,
      hint: 'Replace a with the value you just found.',
    },
    {
      id: 'distribute-pair',
      title: 'Distribute the two factors on the right.',
      note: () => {
        const directions = 'Follow the red arrows left to right, then the green arrows left to right. Enter all four coefficients.';
        if (!repeatedRootExample()) return directions;
        const repeatedProduct = distributedFactors().map(factorText).join('');
        const copies = highestPower() === 2 ? 'twice' : 'three times';
        return `Write the ${exponentNames[highestPower()]} factor ${copies} to get f(x) = ${leadingCoefficient()}${repeatedProduct}. ${directions}`;
      },
      diagram: () => expansion().pairDistribution,
      build: () => [`f(x) = ${leadingCoefficient()}${factorText(distributedFactors()[0])}(`, ...productFields(expansion().pairDistribution), ')'],
      expected: () => expansion().pairDistribution.products.map(({ coefficient }) => coefficient),
      result: () => `f(x) = ${leadingCoefficient()}${factorText(distributedFactors()[0])}(${productText(expansion().pairDistribution)})`,
      hint: 'Follow each arrow to multiply its two terms. Keep the four products separate.',
    },
    {
      id: 'multiply-pair',
      title: 'Combine like terms in the quadratic.',
      note: 'Keep the leading coefficient and the first factor outside.',
      build: () => [`f(x) = ${leadingCoefficient()}${factorText(distributedFactors()[0])}(`, ...combinationFields(expansion().pairDistribution), ')'],
      expected: () => combinationAnswers(expansion().pairDistribution),
      result: () => `f(x) = ${leadingCoefficient()}${factorText(distributedFactors()[0])}(${polynomialText(expansion().pairDistribution.combined)})`,
      hint: 'Add the coefficients of the two x-terms. Keep the squared term and the constant.',
    },
    {
      id: 'distribute-cubic',
      title: 'Distribute the remaining factor across the quadratic.',
      note: 'Follow the red arrows left to right, then the green arrows left to right. Enter all six coefficients.',
      diagram: () => expansion().cubicDistribution,
      build: () => [`f(x) = ${leadingCoefficient()}(`, ...productFields(expansion().cubicDistribution), ')'],
      expected: () => expansion().cubicDistribution.products.map(({ coefficient }) => coefficient),
      result: () => `f(x) = ${leadingCoefficient()}(${productText(expansion().cubicDistribution)})`,
      hint: 'Multiply the first term by all three quadratic terms, then do the same for the second term.',
    },
    {
      id: 'multiply-cubic',
      title: 'Combine like terms in the cubic.',
      note: 'Enter 0 when a term cancels.',
      build: () => [`f(x) = ${leadingCoefficient()}(`, ...combinationFields(expansion().cubicDistribution), ')'],
      expected: () => combinationAnswers(expansion().cubicDistribution),
      result: () => `f(x) = ${leadingCoefficient()}(${polynomialText(expansion().cubicDistribution.combined)})`,
      hint: 'Combine terms that have the same power of x. Keep the leading coefficient outside the parentheses.',
    },
    {
      id: 'standard-form',
      title: 'Standard Form',
      note: () => `Distribute ${leadingCoefficient()} to every term.`,
      build: () => ['f(x) =', ...coefficientFields(3)],
      expected: () => expansion().standard,
      result: standardFormText,
      hint: () => `Multiply every coefficient by ${leadingCoefficient()}, including the leading term and any 0 coefficients.`,
    },
  ];

  const stepText = text => typeof text === 'function' ? text() : text;

  function showStep(index, focus = true) {
    const step = steps[index];
    const item = document.createElement('li');
    item.className = 'fq active p6-question';
    const form = document.createElement('form');
    form.id = step.id;
    const title = span(step.title);
    title.className = 'fq-label';
    form.append(title);
    const instructions = stepText(step.note);
    if (instructions) {
      const note = document.createElement('p');
      note.className = 'p6-note';
      note.textContent = instructions;
      form.append(note);
    }
    if (step.diagram) form.append(distributionDiagram(step.id, step.diagram()));
    const expression = document.createElement('div');
    expression.className = 'p6-expression math';
    expression.append(...step.build().map(part => typeof part === 'string' ? span(part) : part));
    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'Check';
    const feedback = document.createElement('p');
    feedback.className = 'feedback';
    feedback.setAttribute('aria-live', 'polite');
    form.append(expression, button, feedback);
    item.append(form);
    questions.append(item);

    const inputs = [...form.querySelectorAll('input')];
    if (focus) inputs[0].focus();
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (item.classList.contains('done')) return;
      const values = inputs.map((input, index) => (step.read ?? parseValue)(input.value, index));
      const expected = step.expected?.();
      const correct = step.check?.(values) ?? values.map((value, i) => Math.abs(value - expected[i]) < 1e-9);
      inputs.forEach((input, i) => {
        input.classList.toggle('invalid', !correct[i]);
        input.setAttribute('aria-invalid', String(!correct[i]));
      });
      if (!correct.every(Boolean)) {
        feedback.textContent = stepText(step.hint);
        feedback.className = 'feedback no';
        return;
      }

      step.remember?.(values);
      item.classList.add('done');
      inputs.forEach(input => { input.disabled = true; });
      if (step.result) expression.textContent = step.result();
      button.hidden = true;
      feedback.textContent = '';
      feedback.className = 'feedback';
      if (index + 1 < steps.length) showStep(index + 1);
      else {
        completedFactored.textContent = factoredFormText();
        completedStandard.textContent = standardFormText();
        complete.hidden = false;
        fireConfetti(180);
        retry.focus();
      }
    });
  }

  function reset(focus = false) {
    clearConfetti();
    questions.replaceChildren();
    complete.hidden = true;
    completedFactored.textContent = '';
    completedStandard.textContent = '';
    zeroCount = undefined;
    factors = undefined;
    point = undefined;
    const firstStep = fromGraph ? 0 : steps.findIndex(step => step.id === 'factors');
    showStep(firstStep, focus);
  }

  function loadExample(focus = false) {
    example = examples[picker.selectedIndex];
    renderExample(example);
    reset(focus);
  }

  examples.forEach((_, index) => picker.add(new Option(String(index + 1), index)));
  picker.addEventListener('change', () => loadExample());
  retry.addEventListener('click', () => reset(true));
  next.addEventListener('click', () => {
    picker.selectedIndex = (picker.selectedIndex + 1) % examples.length;
    loadExample(true);
  });
  loadExample();
}
