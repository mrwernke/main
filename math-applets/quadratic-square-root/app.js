import {
  problems,
  equationText,
  equationLeftText,
  formatValue,
  squareTermText,
  binomialText,
  solveData,
} from './model.mjs';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';

const $ = selector => document.querySelector(selector);
let index = 0;
let solveStage = '';
let activeSolveOperation = '';
let activeSolveInput = null;
const problem = () => problems[index];
const data = () => solveData(problem());
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

function mark(input, correct) {
  input.classList.toggle('invalid', !correct);
  input.setAttribute('aria-invalid', String(!correct));
}

function showFeedback(selector, message) {
  const element = $(selector);
  element.textContent = message;
  element.className = `feedback ${message ? 'no' : ''}`;
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

function addSolveLine(lhsText, rhsText, operation = false) {
  const line = document.createElement('div');
  line.className = `q16-work-line${operation ? ' q16-op' : ''}`;
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
  radical.className = 'q16-radical';
  const symbol = document.createElement('span');
  symbol.className = 'q16-radical-symbol';
  symbol.textContent = '√';
  const radicand = document.createElement('span');
  radicand.className = 'q16-radicand';
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
  fraction.className = 'q16-fraction';
  const numerator = document.createElement('span');
  numerator.className = 'q16-numerator';
  numerator.textContent = numeratorText;
  const denominator = document.createElement('span');
  denominator.className = 'q16-denominator';
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

function addSolveInput(row, label, { before = '', after = '' } = {}) {
  row.line.classList.add('q16-result-line');
  row.rhs.replaceChildren();
  if (before) row.rhs.append(document.createTextNode(before));
  const input = createSolveInput(label);
  row.rhs.append(input);
  if (after) row.rhs.append(document.createTextNode(after));
  return input;
}

function addSolveRadicalInput(row, label) {
  row.line.classList.add('q16-result-line');
  row.rhs.replaceChildren(document.createTextNode('± '));
  const { radical, radicand } = createRadical();
  radicand.append(createSolveInput(label));
  row.rhs.append(radical);
  return activeSolveInput;
}

function addSolveShiftRadicalInput(row, label, radicandText) {
  row.line.classList.add('q16-result-line');
  row.rhs.replaceChildren();
  const input = createSolveInput(label);
  row.rhs.append(input, document.createTextNode(' ± '));
  addRadical(row.rhs, radicandText);
  return input;
}

function moveKOperation() {
  return problem().k > 0 ? 'move-k-subtract' : 'move-k-add';
}

function shiftOperation() {
  return problem().h > 0 ? 'shift-add' : 'shift-subtract';
}

function scaleIsFraction() {
  return !Number.isInteger(problem().a);
}

function scaleLabel() {
  const current = problem();
  return scaleIsFraction()
    ? `Multiply both sides by ${formatValue(1 / current.a)}`
    : `Divide both sides by ${formatValue(current.a)}`;
}

function buildChoices() {
  const current = problem();
  const kMagnitude = formatValue(Math.abs(current.k));
  const choices = [
    { id: 'move-k-add', label: `Add ${kMagnitude} to both sides` },
    { id: 'move-k-subtract', label: `Subtract ${kMagnitude} from both sides` },
  ];

  if (current.a !== 1) choices.push({ id: 'scale', label: scaleLabel() });
  choices.push({ id: 'root', label: 'Take the square root of both sides' });
  if (current.h !== 0) {
    const hMagnitude = formatValue(Math.abs(current.h));
    choices.push({ id: 'shift-add', label: `Add ${hMagnitude} to both sides` });
    choices.push({ id: 'shift-subtract', label: `Subtract ${hMagnitude} from both sides` });
  }
  if (current.a !== 1) {
    choices.push({ id: 'distribute', label: 'Distribute the coefficient to the parentheses' });
  }
  choices.push({ id: 'square', label: 'Square the parentheses to get rid of exponent' });
  if (current.a > 0) {
    choices.push({ id: 'a-operation', label: `Subtract ${formatValue(current.a)} from both sides` });
  } else {
    choices.push({ id: 'a-operation', label: `Add ${formatValue(Math.abs(current.a))} to both sides` });
  }

  for (let i = choices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  $('#solve-choices').replaceChildren(...choices.map(choice => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'q16-choice';
    button.dataset.operation = choice.id;
    button.textContent = choice.label;
    button.onclick = () => chooseSolveOperation(button, choice.id);
    return button;
  }));
}

function setStage(stage, first = false) {
  solveStage = stage;
  $('#solve-step-title').textContent = stage.startsWith('move-k')
    ? '1. Move the constant to the right side'
    : '2. Solve using the square root method';
  $('#solve-question-title').textContent = first
    ? 'Choose whether to add or subtract the constant.'
    : 'Correct. Choose the next step.';
}

function appendOriginalEquation() {
  addSolveLine(equationLeftText(problem()), formatValue(problem().right));
}

function appendMoveKWork(operation) {
  const current = problem();
  const amount = formatValue(Math.abs(current.k));
  const term = operation === 'move-k-add' ? `+ ${amount}` : `− ${amount}`;
  addSolveLine(term, term, true);
  const result = addSolveLine(squareTermText(current), '');
  addSolveInput(result, 'Right side after moving the constant');
}

function appendScaleWork() {
  const current = problem();
  const values = data();
  const binomial = binomialText(current.h);
  if (scaleIsFraction()) {
    const reciprocal = formatValue(1 / current.a);
    addSolveLine(`${reciprocal} × ${squareTermText(current)}`, `${formatValue(values.movedRight)} × ${reciprocal}`);
    const result = addSolveLine(`(${binomial})²`, '');
    addSolveInput(result, 'Right side after multiplying by the reciprocal');
    return;
  }

  const division = addSolveLine('', '');
  addFraction(division.lhs, squareTermText(current), formatValue(current.a));
  addFraction(division.rhs, formatValue(values.movedRight), formatValue(current.a));
  const result = addSolveLine(`(${binomial})²`, '');
  addSolveInput(result, 'Right side after dividing by the coefficient');
}

function appendRootWork() {
  const current = problem();
  const values = data();
  const binomial = binomialText(current.h);
  const rootOperation = addSolveLine('', '');
  addRadical(rootOperation.lhs, `(${binomial})²`);
  if (values.dividedRight !== 0) rootOperation.rhs.append(document.createTextNode('± '));
  addRadical(rootOperation.rhs, formatValue(values.dividedRight));

  const result = addSolveLine(binomial, '');
  if (values.dividedRight === 0) {
    addSolveInput(result, 'Value after taking the square root');
  } else if (hasRationalSquareRoot(values.dividedRight)) {
    addSolveInput(result, 'Positive square root', { before: '± ' });
  } else {
    addSolveRadicalInput(result, 'Number under the square root');
  }
}

function appendShiftWork(operation) {
  const current = problem();
  const values = data();
  const amount = formatValue(Math.abs(current.h));
  const term = operation === 'shift-add' ? `+ ${amount}` : `− ${amount}`;
  addSolveLine(term, term, true);
  const result = addSolveLine('x', '');
  if (values.dividedRight === 0) {
    addSolveInput(result, 'Single value of x');
  } else if (hasRationalSquareRoot(values.dividedRight)) {
    addSolveInput(result, 'Horizontal shift', { after: ` ± ${formatValue(values.squareRoot)}` });
  } else {
    addSolveShiftRadicalInput(result, 'Horizontal shift', formatValue(values.dividedRight));
  }
}

function appendOperationWork(operation) {
  activeSolveOperation = operation;
  activeSolveInput = null;
  if (operation === 'move-k-add' || operation === 'move-k-subtract') {
    appendMoveKWork(operation);
  } else if (operation === 'scale') {
    appendScaleWork();
  } else if (operation === 'root') {
    appendRootWork();
  } else {
    appendShiftWork(operation);
  }
  $('#solve-entry').hidden = false;
  $('#solve-entry').querySelector('button[type="submit"]').hidden = false;
  $('#solve-entry-feedback').hidden = false;
  showFeedback('#solve-entry-feedback', '');
  activeSolveInput?.focus();
}

function nextStageAfter(operation) {
  const current = problem();
  if (operation === 'move-k-add' || operation === 'move-k-subtract') {
    return current.a === 1 ? 'root' : 'scale';
  }
  if (operation === 'scale') return 'root';
  if (operation === 'root') return current.h === 0 ? 'done' : shiftOperation();
  return 'done';
}

function showSolutionTypeStep() {
  $('#solve-step .q16-step-question').hidden = true;
  $('#solution-type-step').hidden = false;
  $('#solution-type-select').focus();
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
  appendOperationWork(operation);
}

function buildPicker() {
  $('#problem-picker').replaceChildren(...problems.map((entry, i) => new Option(`${i + 1}. ${equationText(entry)}`, String(i))));
  $('#problem-picker').value = String(index);
}

function reset() {
  clearConfetti();
  buildPicker();
  $('#equation').textContent = equationText(problem());

  $('#square-root-work').querySelectorAll('input').forEach(input => {
    input.value = '';
    input.readOnly = false;
    input.disabled = false;
    input.hidden = false;
    input.classList.remove('invalid');
    input.setAttribute('aria-invalid', 'false');
  });
  $('#square-root-work').querySelectorAll('select').forEach(select => {
    select.value = '';
    select.disabled = false;
    select.classList.remove('invalid');
    select.setAttribute('aria-invalid', 'false');
  });
  $('#square-root-work').querySelectorAll('button').forEach(button => { button.hidden = false; });
  [
    '#solve-feedback', '#solve-entry-feedback', '#solution-type-feedback', '#solutions-feedback',
    '#radical-answer-feedback', '#complex-answer-feedback', '#single-answer-feedback',
  ].forEach(selector => {
    $(selector).hidden = false;
    showFeedback(selector, '');
  });

  $('#solution-type-step').hidden = true;
  $('#branches').hidden = true;
  $('#radical-answer').hidden = true;
  $('#complex-answer').hidden = true;
  $('#complex-radical-part').hidden = false;
  $('#complex-answer-coefficient').hidden = false;
  $('#radical-answer-coefficient').hidden = false;
  $('#single-answer').hidden = true;
  $('#complete').hidden = true;
  $('#solve-step .q16-step-question').hidden = false;
  $('#solve-entry').hidden = true;
  $('#solve-work-lines').replaceChildren();
  $('#solve-entry-feedback').hidden = false;
  activeSolveOperation = '';
  activeSolveInput = null;

  appendOriginalEquation();
  buildChoices();
  setStage(moveKOperation(), true);
}

function completeWith(message) {
  $('#complete-text').textContent = message;
  $('#complete').hidden = false;
  fireConfetti(180);
}

$('#solve-entry').onsubmit = event => {
  event.preventDefault();
  const input = activeSolveInput;
  if (!input) return;
  let expected;
  let feedback;
  if (activeSolveOperation === 'move-k-add' || activeSolveOperation === 'move-k-subtract') {
    expected = data().movedRight;
    feedback = 'Use the opposite operation to move the constant, then simplify the right side.';
  } else if (activeSolveOperation === 'scale') {
    expected = data().dividedRight;
    feedback = scaleIsFraction()
      ? `Multiply the right side by ${formatValue(1 / problem().a)}.`
      : `Divide the right side by ${formatValue(problem().a)}.`;
  } else if (activeSolveOperation === 'root') {
    const keepRadical = !hasRationalSquareRoot(data().dividedRight);
    expected = keepRadical ? data().dividedRight : data().squareRoot;
    feedback = keepRadical
      ? 'Keep the value under the square root unchanged.'
      : 'Enter the positive square root; the ± sign shows both roots.';
  } else {
    expected = problem().h;
    feedback = 'Use the opposite operation to isolate x and keep the sign correct.';
  }
  if (!checkValues([input], [expected], '#solve-entry-feedback', feedback)) return;
  activeSolveInput = null;
  const next = nextStageAfter(activeSolveOperation);
  activeSolveOperation = '';
  $('#solve-entry').hidden = true;
  $('#solve-feedback').hidden = true;
  showFeedback('#solve-feedback', '');

  if (next === 'done') {
    showSolutionTypeStep();
    return;
  }
  setStage(next);
  $('#solve-choices .invalid').forEach(button => button.classList.remove('invalid'));
}

$('#solution-type-step').onsubmit = event => {
  event.preventDefault();
  const expectedType = data().dividedRight === 0
    ? 'one'
    : data().dividedRight < 0 ? 'complex' : 'real';
  if (!checkValues([$('#solution-type-select')], [expectedType], '#solution-type-feedback', 'Choose the number and type that matches the value under the square root.')) return;

  if (expectedType === 'one') {
    $('#single-answer').hidden = false;
    $('#single-answer-value').focus();
    return;
  }
  if (expectedType === 'complex') {
    const simplified = simplifyRadical(Math.abs(data().dividedRight));
    $('#complex-radical-part').hidden = simplified.radicand === 1;
    $('#complex-answer-coefficient').hidden = simplified.coefficient === 1;
    $('#complex-answer').hidden = false;
    $('#complex-answer-shift').focus();
    return;
  }
  if (!hasRationalSquareRoot(data().dividedRight)) {
    const simplified = simplifyRadical(data().dividedRight);
    $('#radical-answer-coefficient').hidden = simplified.coefficient === 1;
    $('#radical-answer').hidden = false;
    $('#radical-answer-shift').focus();
    return;
  }
  const shift = formatValue(problem().h);
  const root = formatValue(data().squareRoot);
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
  const ordered = close(entered[0], expected[0]) && close(entered[1], expected[1]);
  const reversed = close(entered[0], expected[1]) && close(entered[1], expected[0]);
  fields.forEach(field => mark(field, ordered || reversed));
  if (!ordered && !reversed) {
    showFeedback('#solutions-feedback', 'Check both solutions. Solve each equation that came from the ± square root.');
    return;
  }
  fields.forEach(field => { field.readOnly = true; });
  $('#solutions-step button').hidden = true;
  $('#solutions-feedback').hidden = true;
  completeWith(`${equationText(problem())} has 2 real solutions: x = ${formatValue(expected[0])} and x = ${formatValue(expected[1])}.`);
};

$('#single-answer-step').onsubmit = event => {
  event.preventDefault();
  const value = problem().h;
  if (!checkValues([$('#single-answer-value')], [value], '#single-answer-feedback', 'Enter the value of x after taking the square root.')) return;
  completeWith(`${equationText(problem())} has 1 real solution: x = ${formatValue(value)}.`);
};

$('#radical-answer-step').onsubmit = event => {
  event.preventDefault();
  const simplified = simplifyRadical(data().dividedRight);
  const fields = [$('#radical-answer-shift')];
  const expected = [problem().h];
  if (simplified.coefficient !== 1) {
    fields.push($('#radical-answer-coefficient'));
    expected.push(simplified.coefficient);
  }
  fields.push($('#radical-answer-radicand'));
  expected.push(simplified.radicand);
  const enteredCoefficient = parseValue($('#radical-answer-coefficient').value);
  const enteredRadicand = parseValue($('#radical-answer-radicand').value);
  const unsimplified = simplified.coefficient > 1 && close(enteredCoefficient, 1)
    && close(enteredRadicand, data().dividedRight);
  const feedback = unsimplified
    ? 'Simplify the radical first. For example, √12 = 2√3.'
    : 'Enter the horizontal shift and simplified radical. Use a coefficient only when one remains outside the radical.';
  if (!checkValues(fields, expected, '#radical-answer-feedback', feedback)) return;
  const coefficient = simplified.coefficient === 1 ? '' : formatValue(simplified.coefficient);
  const radical = `${coefficient}√(${formatValue(simplified.radicand)})`;
  completeWith(`${equationText(problem())} has 2 real solutions: x = ${formatValue(problem().h)} ± ${radical}.`);
};

$('#complex-answer-step').onsubmit = event => {
  event.preventDefault();
  const simplified = simplifyRadical(Math.abs(data().dividedRight));
  const fields = [$('#complex-answer-shift')];
  const expected = [problem().h];
  if (simplified.coefficient !== 1) {
    fields.push($('#complex-answer-coefficient'));
    expected.push(simplified.coefficient);
  }
  if (simplified.radicand !== 1) {
    fields.push($('#complex-answer-radicand'));
    expected.push(simplified.radicand);
  }
  const enteredCoefficient = parseValue($('#complex-answer-coefficient').value);
  const enteredRadicand = parseValue($('#complex-answer-radicand').value);
  const unsimplified = simplified.coefficient > 1 && close(enteredCoefficient, 1)
    && close(enteredRadicand, Math.abs(data().dividedRight));
  const feedback = unsimplified
    ? 'Simplify the radical first. For example, √12 = 2√3.'
    : 'Enter the real part and simplified imaginary part. Keep i after the radical.';
  if (!checkValues(fields, expected, '#complex-answer-feedback', feedback)) return;

  const coefficient = simplified.coefficient === 1 ? '' : formatValue(simplified.coefficient);
  const complexPart = simplified.radicand === 1
    ? `${coefficient || '1'}i`
    : `${coefficient}√(${formatValue(simplified.radicand)})i`;
  completeWith(`${equationText(problem())} has 2 complex solutions: x = ${formatValue(problem().h)} ± ${complexPart}.`);
};

$('#problem-picker').onchange = () => { index = Number($('#problem-picker').value); reset(); };
$('#reset').onclick = reset;
$('#next-problem').onclick = () => { index = (index + 1) % problems.length; reset(); };
reset();
