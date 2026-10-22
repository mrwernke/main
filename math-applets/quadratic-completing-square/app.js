import { problems, equationText, expressionText, formatNumber, squareData } from './model.mjs';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';

const $ = selector => document.querySelector(selector);
let index = 0;
let customProblem = null;
let solveStage = '';
let activeSolveOperation = '';
let activeSolveInput = null;
const problem = () => customProblem || problems[index];
const data = () => squareData(problem());
const close = (value, expected) => Number.isFinite(value) && Math.abs(value - expected) < 1e-5;

function hasRationalSquareRoot(value) {
  if (value < 0) return false;
  const root = Math.sqrt(value);
  for (let denominator = 1; denominator <= 1000; denominator += 1) {
    const numerator = Math.round(root * denominator);
    if (Math.abs(root - numerator / denominator) < 1e-10) return true;
  }
  return false;
}

function parseValue(value) {
  const text = String(value).trim().replace(/\s/g, '').replace(/−/g, '-');
  const fraction = /^([+-]?\d+)\/(\d+)$/.exec(text);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    return denominator ? numerator / denominator : NaN;
  }
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return NaN;
  return Number(text);
}

function gcd(first, second) {
  let a = Math.abs(first), b = Math.abs(second);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

function rational(numerator, denominator) {
  const divisor = gcd(numerator, denominator);
  const sign = denominator < 0 ? -1 : 1;
  return { numerator: sign * numerator / divisor, denominator: Math.abs(denominator) / divisor };
}

function rationalText(numerator, denominator) {
  const value = rational(numerator, denominator);
  return value.denominator === 1 ? String(value.numerator) : `${value.numerator}/${value.denominator}`;
}

function formatFraction(value) {
  for (let denominator = 1; denominator <= 1000; denominator += 1) {
    const numerator = Math.round(value * denominator);
    if (Math.abs(value - numerator / denominator) < 1e-10) return rationalText(numerator, denominator);
  }
  return formatNumber(value);
}

function simplifyRadical(value) {
  const integer = Math.round(value);
  if (integer < 1 || Math.abs(value - integer) >= 1e-9) {
    return { coefficient: 1, radicand: value };
  }
  let coefficient = 1;
  let radicand = integer;
  for (let factor = Math.floor(Math.sqrt(integer)); factor >= 2; factor -= 1) {
    const square = factor * factor;
    if (radicand % square === 0) {
      coefficient *= factor;
      radicand /= square;
    }
  }
  return { coefficient, radicand };
}

function signedTerm(value, variable = '') {
  const magnitude = Math.abs(value);
  const coefficient = variable && magnitude === 1 ? '' : formatNumber(magnitude);
  return `${value < 0 ? ' − ' : ' + '}${coefficient}${variable}`;
}

function mark(input, correct) {
  input.classList.toggle('invalid', !correct);
  input.setAttribute('aria-invalid', String(!correct));
}

function showFeedback(selector, message, good = false) {
  const element = $(selector);
  element.textContent = message;
  element.className = `feedback ${message ? (good ? 'ok' : 'no') : ''}`;
}

function checkValues(fields, expected, feedbackSelector, message) {
  const correct = fields.map((field, i) => field.tagName === 'SELECT'
    ? field.value === String(expected[i])
    : close(parseValue(field.value), expected[i]));
  fields.forEach((field, i) => mark(field, correct[i]));
  if (!correct.every(Boolean)) {
    showFeedback(feedbackSelector, message);
    return false;
  }
  fields.forEach(field => {
    if (field.tagName === 'SELECT') field.disabled = true;
    else field.readOnly = true;
  });
  const feedback = $(feedbackSelector);
  feedback.hidden = true;
  const button = feedback.closest('form')?.querySelector('button[type="submit"]');
  if (button) button.hidden = true;
  return true;
}

function parseXTerm(value) {
  const match = /^([+-]?(?:(?:\d+(?:\.\d*)?|\.\d+)|(?:\d+\/\d+))?)x$/i
    .exec(String(value).trim().replace(/\s/g, '').replace(/−/g, '-'));
  if (!match) return NaN;
  if (match[1] === '' || match[1] === '+') return 1;
  if (match[1] === '-') return -1;
  return parseValue(match[1]);
}

function checkXTerms() {
  const fields = [$('#half-top'), $('#half-left')];
  const correct = fields.map(field => close(parseXTerm(field.value), data().half));
  fields.forEach((field, i) => mark(field, correct[i]));
  if (!correct.every(Boolean)) {
    showFeedback('#halves-feedback', 'Enter each half as an x-term, such as 3x or +3x, with the correct sign.');
    return false;
  }
  fields.forEach(field => { field.readOnly = true; });
  $('#halves-feedback').hidden = true;
  $('#halves-step button').hidden = true;
  return true;
}

function binomialText() {
  const half = data().half;
  return `x ${half < 0 ? '\u2212' : '+'} ${formatNumber(Math.abs(half))}`;
}

function addSolveLine(lhsText, rhsText, operation = false) {
  const line = document.createElement('div');
  line.className = `q17-work-line${operation ? ' q17-op' : ''}`;
  const lhs = document.createElement('span');
  lhs.className = 'lhs';
  lhs.textContent = lhsText;
  const equals = document.createElement('span');
  equals.className = 'eq';
  equals.textContent = '=';
  const rhs = document.createElement('span');
  rhs.className = 'rhs';
  rhs.textContent = rhsText;
  line.append(lhs, equals, rhs);
  $('#solve-work-lines').append(line);
  return { line, lhs, equals, rhs };
}

function createRadical() {
  const radical = document.createElement('span');
  radical.className = 'q17-radical';
  const symbol = document.createElement('span');
  symbol.className = 'q17-radical-symbol';
  symbol.textContent = '\u221a';
  const radicand = document.createElement('span');
  radicand.className = 'q17-radicand';
  radical.append(symbol, radicand);
  return { radical, radicand };
}

function addRadical(target, radicandText) {
  const { radical, radicand } = createRadical();
  radicand.textContent = radicandText;
  target.append(radical);
  return radical;
}

function addFraction(target, numeratorText, denominatorText) {
  const fraction = document.createElement('span');
  fraction.className = 'q17-fraction';
  const numerator = document.createElement('span');
  numerator.className = 'q17-numerator';
  numerator.textContent = numeratorText;
  const denominator = document.createElement('span');
  denominator.className = 'q17-denominator';
  denominator.textContent = denominatorText;
  fraction.append(numerator, denominator);
  target.append(fraction);
}

function createSolveInput(label) {
  const input = document.createElement('input');
  input.id = `solve-${activeSolveOperation}-value`;
  input.setAttribute('form', 'solve-entry');
  input.inputMode = 'text';
  input.setAttribute('aria-label', label);
  activeSolveInput = input;
  return input;
}

function addSolveInput(row, label, { lhs, before = '', after = '' } = {}) {
  row.line.classList.add('q17-result-line');
  if (lhs !== undefined) row.lhs.textContent = lhs;
  row.rhs.replaceChildren();
  if (before) row.rhs.append(document.createTextNode(before));
  const input = createSolveInput(label);
  row.rhs.append(input);
  if (after) row.rhs.append(document.createTextNode(after));
  return input;
}

function addSolveRadicalInput(row, label) {
  row.line.classList.add('q17-result-line');
  row.rhs.replaceChildren(document.createTextNode('\u00b1 '));
  const { radical, radicand } = createRadical();
  radicand.append(createSolveInput(label));
  row.rhs.append(radical);
  return activeSolveInput;
}

function addSolveShiftRadicalInput(row, label, radicandText) {
  row.line.classList.add('q17-result-line');
  row.rhs.replaceChildren();
  const input = createSolveInput(label);
  row.rhs.append(input, document.createTextNode(' \u00b1 '));
  addRadical(row.rhs, radicandText);
  return input;
}

function setSolveChoicesEnabled(enabled) {
  $('#solve-choices').querySelectorAll('button').forEach(button => {
    button.disabled = !enabled;
  });
}

function buildSolveChoices() {
  const current = problem();
  const half = data().half;
  solveStage = current.a > 1 ? 'divide' : 'root';
  activeSolveOperation = '';
  activeSolveInput = null;
  const choices = [];
  if (current.a > 1) choices.push({ id: 'distribute', label: `Distribute ${current.a} to the parentheses` });
  choices.push({ id: 'square', label: 'Square the parentheses' });
  if (current.a > 1) choices.push({ id: 'divide', label: `Divide both sides by ${current.a}` });
  choices.push({ id: 'root', label: 'Take the square root of both sides' });
  choices.push({ id: 'subtract', label: `Subtract ${formatNumber(Math.abs(half))} to both sides` });
  choices.push({ id: 'add', label: `Add ${formatNumber(Math.abs(half))} to both sides` });
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  $('#solve-choices').replaceChildren(...choices.map(choice => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'q17-choice';
    button.dataset.operation = choice.id;
    button.textContent = choice.label;
    button.onclick = () => chooseSolveOperation(button, choice.id);
    return button;
  }));
  $('#solve-work-lines').replaceChildren();
  $('#solve-question-title').textContent = 'Choose the next step.';
  const left = current.a > 1 ? `${current.a}(${binomialText()})\u00b2` : `(${binomialText()})\u00b2`;
  addSolveLine(left, formatNumber(data().completedRight));
  $('#solve-entry').hidden = true;
  $('#solve-step .q17-step-question').hidden = false;
  setSolveChoicesEnabled(true);
}

function chooseSolveOperation(button, operation) {
  if (operation !== solveStage) {
    button.classList.add('invalid');
    $('#solve-feedback').hidden = false;
    showFeedback('#solve-feedback', 'That operation does not solve the equation at this step.');
    return;
  }
  button.remove();
  $('#solve-feedback').hidden = true;
  showFeedback('#solve-feedback', '');
  $('#solve-question-title').textContent = 'Enter the result of this step.';
  activeSolveOperation = operation;
  $('#solve-entry').hidden = false;
  $('#solve-entry').querySelector('button[type="submit"]').hidden = false;
  $('#solve-entry-feedback').hidden = false;
  showFeedback('#solve-entry-feedback', '');

  if (operation === 'divide') {
    const amount = formatNumber(problem().a);
    const division = addSolveLine('', '');
    addFraction(division.lhs, `${problem().a}(${binomialText()})²`, amount);
    addFraction(division.rhs, formatNumber(data().completedRight), amount);
    const result = addSolveLine(`(${binomialText()})\u00b2`, '');
    addSolveInput(result, 'Right side after dividing by a');
  } else if (operation === 'root') {
    const rootOperation = addSolveLine('', '');
    addRadical(rootOperation.lhs, `(${binomialText()})²`);
    rootOperation.rhs.append(document.createTextNode('\u00b1 '));
    addRadical(rootOperation.rhs, formatFraction(data().dividedRight));
    const result = addSolveLine(binomialText(), '');
    if (hasRationalSquareRoot(data().dividedRight)) {
      addSolveInput(result, 'Positive square root', { before: '\u00b1 ' });
    } else {
      addSolveRadicalInput(result, 'Number under the square root');
    }
  } else {
    const half = data().half;
    const amount = formatNumber(Math.abs(half));
    const term = `${operation === 'subtract' ? '\u2212' : '+'}${amount}`;
    addSolveLine(term, term, true);
    const row = addSolveLine('x', '');
    if (hasRationalSquareRoot(data().dividedRight)) {
      addSolveInput(row, 'Signed value after moving the h-term', { after: ` \u00b1 ${formatNumber(data().squareRoot)}` });
    } else {
      addSolveShiftRadicalInput(row, 'Signed value after moving the h-term', formatFraction(data().dividedRight));
    }
  }
  activeSolveInput.focus();
}

function buildPicker() {
  const categories = [
    { key: 'integer-a1', label: 'Integer answers with a=1' },
    { key: 'integer-a-more', label: 'Integer answers with a>1' },
    { key: 'fractional-a-more', label: 'Fractional answers (a>1)' },
    { key: 'irrational-a1', label: 'Irrational answers with a=1' },
    { key: 'irrational-a-more', label: 'Irrational answers with a>1' },
    { key: 'complex', label: 'Complex solutions' },
  ];
  const groups = categories.map(category => {
    const group = document.createElement('optgroup');
    group.label = category.label;
    problems.forEach((entry, i) => {
      if (entry.category === category.key) group.append(new Option(`${i + 1}. ${equationText(entry)}`, String(i)));
    });
    return group;
  });
  if (customProblem) {
    const customGroup = document.createElement('optgroup');
    customGroup.label = 'Custom Problem';
    const customOption = new Option(`My Problem: ${equationText(customProblem)}`, 'custom');
    customGroup.append(customOption);
    $('#problem-picker').replaceChildren(customGroup, ...groups);
    $('#problem-picker').value = 'custom';
  } else {
    $('#problem-picker').replaceChildren(...groups);
    $('#problem-picker').value = String(index);
  }
}

function reset() {
  clearConfetti();
  buildPicker();
  $('#equation').textContent = equationText(problem());

  $('#square-work').querySelectorAll('input').forEach(input => {
    input.value = '';
    input.readOnly = false;
    input.disabled = false;
    input.hidden = false;
    input.classList.remove('invalid');
    input.setAttribute('aria-invalid', 'false');
  });
  $('#square-work').querySelectorAll('select').forEach(select => {
    select.value = '';
    select.disabled = false;
    select.classList.remove('invalid');
    select.setAttribute('aria-invalid', 'false');
  });
  $('#square-work').querySelectorAll('button').forEach(button => { button.hidden = false; });
  [
    '#move-feedback', '#factor-feedback', '#halves-feedback', '#outside-feedback', '#corner-feedback',
    '#add-feedback', '#simplify-feedback', '#solve-feedback', '#solve-entry-feedback', '#solution-type-feedback',
    '#solutions-feedback', '#radical-answer-feedback', '#complex-answer-feedback', '#single-answer-feedback',
  ].forEach(selector => {
    $(selector).hidden = false;
    showFeedback(selector, '');
  });

  $('#factor-step').hidden = true;
  $('#box-work').hidden = true;
  $('#box-area').hidden = true;
  $('#outside-step').hidden = true;
  $('#corner-step').hidden = true;
  $('#outside-top').hidden = true;
  $('#outside-left').hidden = true;
  $('#outside-top').disabled = true;
  $('#outside-left').disabled = true;
  $('#corner-cell').hidden = true;
  $('#corner-value').disabled = true;
  $('#add-step').hidden = true;
  $('#simplify-step').hidden = true;
  $('#solve-step').hidden = true;
  $('#solve-entry').hidden = true;
  $('#solution-type-step').hidden = true;
  $('#branches').hidden = true;
  $('#single-answer').hidden = true;
  $('#radical-answer').hidden = true;
  $('#complex-answer').hidden = true;
  $('#complex-radical-part').hidden = true;
  $('#complete').hidden = true;
  $('#solve-step .q17-step-question').hidden = false;
  $('#solve-choices').replaceChildren();
  $('#solve-work-lines').replaceChildren();

  const current = problem();
  const values = data();
  $('#extended-note').hidden = current.a === 1;
  $('#extended-note').textContent = current.a === 1 ? '' : `Move c first, then factor out ${current.a} from the x² and x terms.`;
  $('#move-left').textContent = expressionText(current, false);
  $('#middle-target').textContent = `${values.insideB < 0 ? '−' : '+'}${rationalText(Math.abs(current.b), current.a)}x`;

  $('#factor-a').textContent = formatNumber(current.a);
  $('#factor-left').textContent = `${formatNumber(current.a)}(x² ${values.insideB < 0 ? '−' : '+'} `;
  $('#factor-middle').textContent = 'x';
  $('#factor-right').textContent = `) = ${formatNumber(values.movedRight)}`;
  $('#factor-instructions').textContent = 'Enter the x-term coefficient after factoring out a.';

  const insideTerm = values.insideB === 0 ? '' : signedTerm(values.insideB, 'x');
  $('#add-left').textContent = current.a > 1
    ? `${current.a}(x²${insideTerm} +`
    : `x²${insideTerm} +`;
  $('#add-left-close').textContent = current.a > 1 ? ')' : '';
  $('#add-right').textContent = `${formatNumber(values.movedRight)} + ${current.a > 1 ? `${current.a} × ` : ''}`;
  $('#simplify-a').textContent = current.a > 1 ? formatNumber(current.a) : '';
  $('#simplify-sign').value = '';
  $('#branch-positive').textContent = '';
  $('#branch-negative').textContent = '';
  solveStage = '';
  activeSolveOperation = '';
  activeSolveInput = null;
}

$('#move-step').onsubmit = event => {
  event.preventDefault();
  if (!checkValues([$('#move-right')], [data().movedRight], '#move-feedback', 'Move the c-term to the right side and change its sign.')) return;
  $('#box-area').hidden = false;
  if (problem().a > 1) {
    $('#factor-step').hidden = false;
    $('#factor-coefficient').focus();
  } else {
    $('#box-work').hidden = false;
    $('#half-top').focus();
  }
};

$('#factor-step').onsubmit = event => {
  event.preventDefault();
  if (!checkValues([$('#factor-coefficient')], [Math.abs(data().insideB)], '#factor-feedback', 'Divide the x-term coefficient by a.')) return;
  $('#box-work').hidden = false;
  $('#half-top').focus();
};

$('#halves-step').onsubmit = event => {
  event.preventDefault();
  if (!checkXTerms()) return;
  $('#outside-top').hidden = false;
  $('#outside-left').hidden = false;
  $('#outside-top').disabled = false;
  $('#outside-left').disabled = false;
  $('#outside-step').hidden = false;
  $('#outside-top').focus();
};

$('#outside-step').onsubmit = event => {
  event.preventDefault();
  if (!checkValues([$('#outside-top'), $('#outside-left')], [data().half, data().half], '#outside-feedback', 'Use the same signed half-bx value above and to the left of the box.')) return;
  $('#corner-cell').hidden = false;
  $('#corner-value').disabled = false;
  $('#corner-step').hidden = false;
  $('#corner-value').focus();
};

$('#corner-step').onsubmit = event => {
  event.preventDefault();
  if (!checkValues([$('#corner-value')], [data().corner], '#corner-feedback', 'Square the outside value to complete the bottom-right box.')) return;
  $('#add-step').hidden = false;
  $('#add-left-value').focus();
};

$('#add-step').onsubmit = event => {
  event.preventDefault();
  if (!checkValues([$('#add-left-value'), $('#add-right-value')], [data().corner, data().corner], '#add-feedback', 'Add the same completed-square value on both sides.')) return;
  $('#simplify-step').hidden = false;
  $('#simplify-sign').focus();
};

$('#simplify-step').onsubmit = event => {
  event.preventDefault();
  const sign = data().half < 0 ? '-' : '+';
  if (!checkValues([$('#simplify-sign'), $('#simplify-binomial'), $('#simplify-right')], [sign, Math.abs(data().half), data().completedRight], '#simplify-feedback', 'Choose the correct sign, enter the binomial value, and simplify the right side.')) return;
  $('#solve-step').hidden = false;
  buildSolveChoices();
};

$('#solve-entry').onsubmit = event => {
  event.preventDefault();
  const input = activeSolveInput;
  if (!input) return;
  let expected;
  let feedback;
  if (activeSolveOperation === 'divide') {
    expected = data().dividedRight;
    feedback = `Divide the right side by ${problem().a}.`;
  } else if (activeSolveOperation === 'root') {
    const keepRadical = !hasRationalSquareRoot(data().dividedRight);
    expected = keepRadical ? data().dividedRight : data().squareRoot;
    feedback = keepRadical
      ? 'Keep the value under the square root unchanged.'
      : 'Enter the positive square root; the ± sign shows both roots.';
  } else {
    expected = -data().half;
    feedback = 'Move the h-term using the opposite operation and keep the correct sign.';
  }
  if (!checkValues([input], [expected], '#solve-entry-feedback', feedback)) return;
  activeSolveInput = null;
  $('#solve-entry').hidden = true;
  activeSolveOperation = '';
  $('#solve-feedback').hidden = true;
  showFeedback('#solve-feedback', '');

  if (solveStage === 'divide') {
    solveStage = 'root';
    $('#solve-question-title').textContent = 'Correct. Choose the next step.';
    $('#solve-choices .invalid').forEach(button => button.classList.remove('invalid'));
    setSolveChoicesEnabled(true);
    return;
  }
  if (solveStage === 'root') {
    solveStage = data().half > 0 ? 'subtract' : 'add';
    $('#solve-question-title').textContent = 'Correct. Choose the next step.';
    $('#solve-choices .invalid').forEach(button => button.classList.remove('invalid'));
    setSolveChoicesEnabled(true);
    return;
  }

  $('#solve-step .q17-step-question').hidden = true;
  $('#solution-type-step').hidden = false;
  $('#solution-type-select').focus();
};

$('#solution-type-step').onsubmit = event => {
  event.preventDefault();
  const expectedType = data().dividedRight === 0
    ? 'one'
    : data().dividedRight < 0 ? 'complex' : 'real';
  if (!checkValues([$('#solution-type-select')], [expectedType], '#solution-type-feedback', 'Choose the type that matches the value under the square root.')) return;

  if (expectedType === 'one') {
    $('#single-answer').hidden = false;
    $('#single-answer-value').focus();
    return;
  }

  if (expectedType === 'complex') {
    const simplified = simplifyRadical(Math.abs(data().dividedRight));
    $('#complex-radical-part').hidden = simplified.radicand === 1;
    $('#complex-answer').hidden = false;
    $('#complex-answer-shift').focus();
    return;
  }

  if (!hasRationalSquareRoot(data().dividedRight)) {
    $('#radical-answer').hidden = false;
    $('#radical-answer-shift').focus();
    return;
  }
  const shift = formatNumber(-data().half);
  const root = formatNumber(data().squareRoot);
  $('#branch-positive').textContent = `x = ${shift} + ${root}`;
  $('#branch-negative').textContent = `x = ${shift} − ${root}`;
  $('#branches').hidden = false;
  $('#solution-one').focus();
};
$('#solutions-step').onsubmit = event => {
  event.preventDefault();
  const fields = [$('#solution-one'), $('#solution-two')];
  const expected = data().solutions;
  const entered = fields.map(field => parseValue(field.value));
  const correct = fields.map((field, i) => close(entered[i], expected[i]));
  fields.forEach((field, i) => mark(field, correct[i]));
  if (!correct.every(Boolean)) {
    showFeedback('#solutions-feedback', 'Check both solutions. Solve each equation that came from the ± square root.');
    return;
  }
  fields.forEach(field => { field.readOnly = true; });
  $('#solutions-step button').hidden = true;
  $('#solutions-feedback').hidden = true;
  $('#complete-text').textContent = `${equationText(problem())} has 2 real solutions: x = ${formatNumber(expected[0])} and x = ${formatNumber(expected[1])}.`;
  $('#complete').hidden = false;
  fireConfetti(180);
};

$('#single-answer-step').onsubmit = event => {
  event.preventDefault();
  const answer = -data().half;
  if (!checkValues([$('#single-answer-value')], [answer], '#single-answer-feedback', 'Enter the repeated solution for the completed-square equation.')) return;
  $('#complete-text').textContent = `${equationText(problem())} has 1 real solution: x = ${formatNumber(answer)}.`;
  $('#complete').hidden = false;
  fireConfetti(180);
};

$('#radical-answer-step').onsubmit = event => {
  event.preventDefault();
  const fields = [$('#radical-answer-shift'), $('#radical-answer-coefficient'), $('#radical-answer-radicand')];
  const simplified = simplifyRadical(data().dividedRight);
  const expected = [-data().half, simplified.coefficient, simplified.radicand];
  const enteredCoefficient = parseValue(fields[1].value);
  const enteredRadicand = parseValue(fields[2].value);
  const unsimplified = simplified.coefficient > 1 && close(enteredCoefficient, 1) && close(enteredRadicand, data().dividedRight);
  const feedback = unsimplified
    ? 'Simplify the radical first. For example, √12 = 2√3.'
    : 'Enter the horizontal shift, the coefficient outside the radical, and the simplified radicand.';
  if (!checkValues(fields, expected, '#radical-answer-feedback', feedback)) return;
  const shift = formatNumber(expected[0]);
  const coefficient = expected[1] === 1 ? '' : formatFraction(expected[1]);
  const radical = `${coefficient}√(${formatFraction(expected[2])})`;
  $('#complete-text').textContent = `${equationText(problem())} has 2 real solutions: x = ${shift} ± ${radical}.`;
  $('#complete').hidden = false;
  fireConfetti(180);
};

$('#complex-answer-step').onsubmit = event => {
  event.preventDefault();
  const simplified = simplifyRadical(Math.abs(data().dividedRight));
  const shiftField = $('#complex-answer-shift');
  const coefficientField = $('#complex-answer-coefficient');
  const radicandField = $('#complex-answer-radicand');
  const fields = [shiftField, coefficientField];
  const expected = [-data().half, simplified.coefficient];
  if (simplified.radicand !== 1) {
    fields.push(radicandField);
    expected.push(simplified.radicand);
  }

  const enteredCoefficient = parseValue(coefficientField.value);
  const enteredRadicand = parseValue(radicandField.value);
  const unsimplified = simplified.coefficient > 1 && close(enteredCoefficient, 1)
    && close(enteredRadicand, Math.abs(data().dividedRight));
  const feedback = unsimplified
    ? 'Simplify the radical first. For example, √12 = 2√3.'
    : 'Enter the real part and simplify the imaginary part. Keep i after the radical.';
  if (!checkValues(fields, expected, '#complex-answer-feedback', feedback)) return;

  const shift = formatNumber(expected[0]);
  const coefficient = expected[1] === 1 ? '' : formatFraction(expected[1]);
  const complexPart = simplified.radicand === 1
    ? `${coefficient || '1'}i`
    : `${coefficient}√(${formatFraction(simplified.radicand)})i`;
  $('#complete-text').textContent = `${equationText(problem())} has 2 complex solutions: x = ${shift} ± ${complexPart}.`;
  $('#complete').hidden = false;
  fireConfetti(180);
};

$('#problem-picker').onchange = () => { index = Number($('#problem-picker').value); reset(); };
$('#reset').onclick = reset;
$('#next-problem').onclick = () => { index = (index + 1) % problems.length; reset(); };
reset();

function formatCustomEquation(aText, bText, cText) {
  const aTrim = aText.trim();
  const bTrim = bText.trim();
  const cTrim = cText.trim();
  if (!aTrim && !bTrim && !cTrim) return 'ax² + bx + c = 0';

  const aVal = aTrim ? parseValue(aTrim) : NaN;
  const bVal = bTrim ? parseValue(bTrim) : NaN;
  const cVal = cTrim ? parseValue(cTrim) : NaN;

  if (Number.isFinite(aVal) && Number.isFinite(bVal) && Number.isFinite(cVal) && aVal > 0) {
    return equationText({ a: aVal, b: bVal, c: cVal });
  }

  let aPart = 'ax²';
  if (Number.isFinite(aVal)) {
    if (aVal === 1) aPart = 'x²';
    else aPart = `${formatNumber(aVal)}x²`;
  } else if (aTrim) aPart = `${aTrim}x²`;

  let bPart = '+ bx';
  if (Number.isFinite(bVal)) {
    if (bVal === 0) bPart = '';
    else if (bVal === 1) bPart = '+ x';
    else if (bVal === -1) bPart = '− x';
    else bPart = `${bVal < 0 ? '−' : '+'} ${formatNumber(Math.abs(bVal))}x`;
  } else if (bTrim) {
    const sign = bTrim.startsWith('-') || bTrim.startsWith('−') ? '−' : '+';
    bPart = `${sign} ${bTrim.replace(/^[+−-]/, '')}x`;
  }

  let cPart = '+ c';
  if (Number.isFinite(cVal)) {
    if (cVal === 0) cPart = '';
    else cPart = `${cVal < 0 ? '−' : '+'} ${formatNumber(Math.abs(cVal))}`;
  } else if (cTrim) {
    const sign = cTrim.startsWith('-') || cTrim.startsWith('−') ? '−' : '+';
    cPart = `${sign} ${cTrim.replace(/^[+−-]/, '')}`;
  }

  return `${[aPart, bPart, cPart].filter(Boolean).join(' ')} = 0`;
}

function updateCustomPreview() {
  $('#equation').textContent = formatCustomEquation($('#custom-a').value, $('#custom-b').value, $('#custom-c').value);
}

$('#make-own-btn').onclick = () => {
  const form = $('#custom-problem-form');
  const isHidden = form.hidden;
  form.hidden = !isHidden;
  if (!form.hidden) {
    $('#custom-a').value = '';
    $('#custom-b').value = '';
    $('#custom-c').value = '';
    $('#equation').textContent = 'ax² + bx + c = 0';
    $('#square-work').hidden = true;
    showFeedback('#custom-feedback', '');
    $('#custom-a').focus();
  } else {
    $('#square-work').hidden = false;
    reset();
  }
};

$('#custom-cancel-btn').onclick = () => {
  $('#custom-problem-form').hidden = true;
  $('#square-work').hidden = false;
  reset();
};

$('#custom-problem-form').oninput = updateCustomPreview;

$('#custom-problem-form').onsubmit = event => {
  event.preventDefault();
  const aVal = parseValue($('#custom-a').value);
  const bVal = parseValue($('#custom-b').value);
  const cVal = parseValue($('#custom-c').value);

  if (!Number.isFinite(aVal) || aVal <= 0) {
    showFeedback('#custom-feedback', "Please enter a positive integer for 'a'.");
    $('#custom-a').focus();
    return;
  }
  if (!Number.isFinite(bVal) || !Number.isInteger(bVal)) {
    showFeedback('#custom-feedback', "Please enter a valid integer for 'b'.");
    $('#custom-b').focus();
    return;
  }
  if (!Number.isFinite(cVal) || !Number.isInteger(cVal)) {
    showFeedback('#custom-feedback', "Please enter a valid integer for 'c'.");
    $('#custom-c').focus();
    return;
  }

  customProblem = { a: aVal, b: bVal, c: cVal, category: 'custom' };
  $('#custom-problem-form').hidden = true;
  $('#square-work').hidden = false;
  reset();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

$('#problem-picker').onchange = () => {
  $('#custom-problem-form').hidden = true;
  $('#square-work').hidden = false;
  if ($('#problem-picker').value === 'custom') {
    // keep custom
  } else {
    customProblem = null;
    index = Number($('#problem-picker').value);
  }
  reset();
};

$('#next-problem').onclick = () => {
  if (customProblem) {
    customProblem = null;
    index = 0;
  } else {
    index = (index + 1) % problems.length;
  }
  reset();
};
