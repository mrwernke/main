import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';
import { problems, functionText, discriminant, isPerfectSquare, solutionInfo } from './model.mjs';

const $ = selector => document.querySelector(selector);
let index = 0;
const problem = () => problems[index];
const info = () => solutionInfo(problem());

const formulaOptions = [
  { id: 'discriminant', label: 'b squared minus 4 a c' },
  { id: 'quadratic-formula', label: 'Negative b plus or minus the square root of b squared minus 4 a c, all over 2 a' },
  { id: 'axis', label: 'Negative b over 2 a' },
  { id: 'square-root', label: 'Square root of b squared minus 4 a c' },
  { id: 'wrong-plus', label: 'b squared plus 4 a c' },
  { id: 'wrong-ac', label: 'c squared minus 4 a b' },
];

function mathNode(name, text = null, children = []) {
  const element = document.createElementNS('http://www.w3.org/1998/Math/MathML', name);
  if (text !== null) element.textContent = text;
  if (children.length) element.append(...children);
  return element;
}

const row = (...children) => mathNode('mrow', null, children);
const variable = value => mathNode('mi', value);
const number = value => mathNode('mn', value);
const operator = value => mathNode('mo', value);
const square = value => mathNode('msup', null, [variable(value), number('2')]);

function discriminantMath(squareVariable = 'b', firstProduct = 'a', secondProduct = 'c', sign = '−') {
  return row(square(squareVariable), operator(sign), number('4'), variable(firstProduct), variable(secondProduct));
}

function formulaMath(id) {
  const d = () => discriminantMath();
  if (id === 'discriminant') return d();
  if (id === 'quadratic-formula') {
    const numerator = row(operator('−'), variable('b'), operator('±'), mathNode('msqrt', null, [d()]));
    const denominator = row(number('2'), variable('a'));
    return mathNode('mfrac', null, [numerator, denominator]);
  }
  if (id === 'axis') return mathNode('mfrac', null, [row(operator('−'), variable('b')), row(number('2'), variable('a'))]);
  if (id === 'square-root') return mathNode('msqrt', null, [d()]);
  if (id === 'wrong-plus') return discriminantMath('b', 'a', 'c', '+');
  return discriminantMath('c', 'a', 'b');
}

function makeFormulaMath(id) {
  const math = mathNode('math');
  math.setAttribute('display', 'inline');
  math.append(formulaMath(id));
  return math;
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function mark(field, correct) {
  field.classList.toggle('invalid', !correct);
  field.setAttribute('aria-invalid', String(!correct));
}

function showFeedback(selector, message, correct = false) {
  const element = $(selector);
  element.textContent = message;
  element.className = `feedback ${message ? (correct ? 'ok' : 'no') : ''}`;
}

function parseValue(value) {
  const text = String(value).trim().replace(/\s/g, '').replace(/−/g, '-');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return NaN;
  return Number(text);
}

function close(actual, expected) {
  return Number.isFinite(actual) && Math.abs(actual - expected) < 1e-9;
}

function hideSubmit(form) {
  const button = form.querySelector('button[type="submit"]');
  if (button) button.hidden = true;
}

function lockField(field) {
  field.readOnly = true;
  field.disabled = true;
}

function revealInterceptStep() {
  $('#intercepts-title').textContent = `${info().value > 0 ? '6' : '5'}. How many x-intercepts does the graph have?`;
  $('#intercepts-step').hidden = false;
}

function buildFormulaOptions() {
  $('#formula-options').replaceChildren(...shuffle(formulaOptions).map(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'q12-formula-choice';
    button.setAttribute('aria-label', option.label);
    button.append(makeFormulaMath(option.id));
    button.onclick = () => chooseFormula(button, option.id);
    return button;
  }));
}

function chooseFormula(button, id) {
  $('#formula-options').querySelectorAll('button').forEach(option => option.classList.remove('invalid'));
  if (id !== 'discriminant') {
    button.classList.add('invalid');
    showFeedback('#formula-feedback', 'Choose the expression that equals b squared minus 4 a c.');
    return;
  }
  button.classList.add('correct');
  button.disabled = true;
  $('#formula-options').replaceChildren(button);
  showFeedback('#formula-feedback', 'Correct formula.', true);
  $('#substitution-step').hidden = false;
  $('#sub-b').focus();
}

function appendText(target, value) {
  target.append(document.createTextNode(value));
}

function buildEvaluatedExpression() {
  const target = $('#evaluated-expression');
  target.replaceChildren();
  appendText(target, `(${problem().b})`);
  const power = document.createElement('sup');
  power.textContent = '2';
  target.append(power);
  appendText(target, ` − 4(${problem().a})(${problem().c}) = `);
  const input = document.createElement('input');
  input.id = 'discriminant-answer';
  input.inputMode = 'numeric';
  input.setAttribute('aria-label', 'Value of the discriminant');
  target.append(input);
}

function buildPicker() {
  const guided = document.createElement('optgroup');
  guided.label = 'Guided Examples';
  const independent = document.createElement('optgroup');
  independent.label = 'Independent Practice';
  let guidedNumber = 0;
  let independentNumber = 0;
  problems.forEach((entry, problemIndex) => {
    const isGuided = entry.kind === 'guided';
    const numberInSection = isGuided ? ++guidedNumber : ++independentNumber;
    const label = `${isGuided ? 'Guided' : 'Independent'} ${numberInSection}: ${functionText(entry)}`;
    const option = new Option(label, String(problemIndex));
    (isGuided ? guided : independent).append(option);
  });
  $('#problem-picker').replaceChildren(guided, independent);
  $('#problem-picker').value = String(index);
}

function reset() {
  clearConfetti();
  buildPicker();
  $('#equation').textContent = functionText(problem());
  const isGuided = problem().kind === 'guided';
  $('#guided-work').hidden = !isGuided;
  $('#independent-work').hidden = isGuided;
  $('#formula-options').replaceChildren();
  if (isGuided) buildFormulaOptions();

  [
    '#substitution-step', '#discriminant-step', '#sign-step', '#perfect-square-step', '#intercepts-step',
    '#independent-answer-form', '#complete',
  ].forEach(selector => { $(selector).hidden = true; });
  $('#formula-step').hidden = false;
  $('#independent-discriminant-form').hidden = false;

  document.querySelectorAll('.q12-work input').forEach(field => {
    field.value = '';
    field.readOnly = false;
    field.disabled = false;
    field.classList.remove('invalid');
    field.setAttribute('aria-invalid', 'false');
  });
  document.querySelectorAll('.q12-work select').forEach(select => {
    select.value = '';
    select.disabled = false;
    select.classList.remove('invalid');
    select.setAttribute('aria-invalid', 'false');
  });
  document.querySelectorAll('.q12-work button').forEach(button => { button.hidden = false; });
  [
    '#formula-feedback', '#substitution-feedback', '#discriminant-feedback', '#sign-feedback',
    '#perfect-square-feedback', '#intercepts-feedback', '#independent-discriminant-feedback',
    '#independent-answer-feedback',
  ].forEach(selector => showFeedback(selector, ''));
  $('#sign-result').hidden = true;
  $('#perfect-square-result').hidden = true;
  $('#evaluated-expression').replaceChildren();
}

function complete(message) {
  $('#complete-text').textContent = message;
  $('#complete').hidden = false;
  fireConfetti(180);
}

function solutionDescription(solution) {
  if (solution.count === 1) return '1 real rational solution';
  if (solution.type === 'complex') return '2 complex (imaginary) solutions';
  return `2 ${solution.type} solutions`;
}

$('#substitution-form').onsubmit = event => {
  event.preventDefault();
  const fields = [$('#sub-b'), $('#sub-a'), $('#sub-c')];
  const expected = [problem().b, problem().a, problem().c];
  const correct = fields.map((field, i) => close(parseValue(field.value), expected[i]));
  fields.forEach((field, i) => mark(field, correct[i]));
  if (!correct.every(Boolean)) {
    showFeedback('#substitution-feedback', 'Enter the signed values in b, a, c order.');
    return;
  }
  fields.forEach(lockField);
  hideSubmit(event.currentTarget);
  showFeedback('#substitution-feedback', 'Correct substitution.', true);
  buildEvaluatedExpression();
  $('#discriminant-step').hidden = false;
  $('#discriminant-answer').focus();
};

$('#discriminant-form').onsubmit = event => {
  event.preventDefault();
  const field = $('#discriminant-answer');
  if (!close(parseValue(field.value), discriminant(problem()))) {
    mark(field, false);
    showFeedback('#discriminant-feedback', 'Evaluate the squared value and the product, then subtract.');
    return;
  }
  mark(field, true);
  lockField(field);
  hideSubmit(event.currentTarget);
  showFeedback('#discriminant-feedback', 'Correct discriminant.', true);
  $('#sign-step').hidden = false;
  $('#sign-select').focus();
};

$('#sign-form').onsubmit = event => {
  event.preventDefault();
  const field = $('#sign-select');
  const value = info().value;
  const expected = value > 0 ? 'positive' : value < 0 ? 'negative' : 'zero';
  const correct = field.value === expected;
  mark(field, correct);
  if (!correct) {
    showFeedback('#sign-feedback', 'Compare the discriminant with zero.');
    return;
  }
  field.disabled = true;
  hideSubmit(event.currentTarget);
  showFeedback('#sign-feedback', 'Correct.', true);
  const result = $('#sign-result');
  result.hidden = false;
  result.textContent = expected === 'positive'
    ? 'A positive discriminant means there are 2 real solutions.'
    : expected === 'zero'
      ? 'A zero discriminant means there is 1 real solution.'
      : 'A negative discriminant means there are 2 complex (imaginary) solutions.';
  if (expected === 'positive') {
    $('#perfect-square-step').hidden = false;
    $('#perfect-square-select').focus();
  } else {
    revealInterceptStep();
    $('#intercepts-select').focus();
  }
};

$('#perfect-square-form').onsubmit = event => {
  event.preventDefault();
  const field = $('#perfect-square-select');
  const expected = isPerfectSquare(info().value) ? 'yes' : 'no';
  const correct = field.value === expected;
  mark(field, correct);
  if (!correct) {
    showFeedback('#perfect-square-feedback', 'Check whether the positive discriminant has an integer square root.');
    return;
  }
  field.disabled = true;
  hideSubmit(event.currentTarget);
  showFeedback('#perfect-square-feedback', 'Correct.', true);
  $('#perfect-square-result').hidden = false;
  $('#perfect-square-result').textContent = expected === 'yes'
    ? 'The 2 real solutions are rational.'
    : 'The 2 real solutions are irrational.';
  revealInterceptStep();
  $('#intercepts-select').focus();
};

$('#intercepts-form').onsubmit = event => {
  event.preventDefault();
  const field = $('#intercepts-select');
  const expected = String(info().intercepts);
  const correct = field.value === expected;
  mark(field, correct);
  if (!correct) {
    showFeedback('#intercepts-feedback', 'The number of x-intercepts matches the number of distinct real solutions.');
    return;
  }
  field.disabled = true;
  hideSubmit(event.currentTarget);
  showFeedback('#intercepts-feedback', 'Correct.', true);
  const solution = info();
  const graphResult = solution.intercepts === 2
    ? 'The graph crosses the x-axis twice.'
    : solution.intercepts === 1
      ? 'The graph touches the x-axis once.'
      : 'The graph does not meet the x-axis.';
  complete(`${functionText(problem())} has ${solutionDescription(solution)}. ${graphResult}`);
};

$('#independent-discriminant-form').onsubmit = event => {
  event.preventDefault();
  const field = $('#independent-discriminant');
  if (!close(parseValue(field.value), discriminant(problem()))) {
    mark(field, false);
    showFeedback('#independent-discriminant-feedback', 'Calculate b squared minus 4 a c.');
    return;
  }
  mark(field, true);
  lockField(field);
  hideSubmit(event.currentTarget);
  showFeedback('#independent-discriminant-feedback', 'Correct discriminant.', true);
  $('#independent-answer-form').hidden = false;
  $('#solution-count-select').focus();
};

$('#independent-answer-form').onsubmit = event => {
  event.preventDefault();
  const solution = info();
  const countField = $('#solution-count-select');
  const typeField = $('#solution-type-select');
  const fields = [countField, typeField];
  const correct = [countField.value === String(solution.count), typeField.value === solution.type];
  fields.forEach((field, i) => mark(field, correct[i]));
  if (!correct.every(Boolean)) {
    showFeedback('#independent-answer-feedback', 'Choose the correct number and type of solutions.');
    return;
  }
  fields.forEach(field => { field.disabled = true; });
  hideSubmit(event.currentTarget);
  showFeedback('#independent-answer-feedback', 'Correct.', true);
  const countText = solution.count === 1 ? '1 real rational solution' : `${solution.count} ${solution.type} solutions`;
  complete(`${functionText(problem())} has ${countText}.`);
};

$('#problem-picker').onchange = () => { index = Number($('#problem-picker').value); reset(); };
$('#reset').onclick = reset;
$('#next-problem').onclick = () => { index = (index + 1) % problems.length; reset(); };

reset();
