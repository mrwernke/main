import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';
import { examples, discriminant, formatDecimal, resultingConstant, roundedSolutions, roundedSquareRoot } from './model.mjs';

const $ = selector => document.querySelector(selector);
let exampleIndex = 0;
const problem = () => examples[exampleIndex];
const result = () => roundedSolutions(problem());

function parseValue(value) {
  const text = String(value).trim().replace(/\s/g, '').replace(/−/g, '-');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return NaN;
  return Number(text);
}

function close(actual, expected) {
  return Number.isFinite(actual) && Math.abs(actual - expected) < 1e-8;
}

function input(id, label) {
  const field = document.createElement('input');
  field.id = id;
  field.inputMode = 'decimal';
  field.autocomplete = 'off';
  field.setAttribute('aria-label', label);
  return field;
}

function span(text, className = '') {
  const element = document.createElement('span');
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function radical(children) {
  const wrapper = span('', 'q14-radical');
  wrapper.append(span('√', 'q14-root-symbol'));
  const radicand = span('', 'q14-radicand');
  radicand.append(...children);
  wrapper.append(radicand);
  return wrapper;
}

function fraction(top, bottom) {
  const wrapper = span('', 'q14-fraction');
  const numerator = span('', 'q14-numerator');
  if (typeof top === 'string') numerator.append(span(top));
  else if (top instanceof HTMLElement && top.classList.contains('q14-numerator')) numerator.append(...top.childNodes);
  else numerator.append(top);
  const denominator = span('', 'q14-denominator');
  denominator.append(typeof bottom === 'string' ? span(bottom) : bottom);
  wrapper.append(numerator, denominator);
  return wrapper;
}

function mark(field, correct) {
  field.classList.toggle('invalid', !correct);
  field.setAttribute('aria-invalid', String(!correct));
}

function showFeedback(selector, message, correct = false) {
  const element = $(selector);
  element.textContent = message;
  element.className = `feedback${message ? (correct ? ' ok' : ' no') : ''}`;
}

function lock(fields) {
  fields.forEach(field => { field.disabled = true; });
}

function hideSubmit(form) {
  const button = form.querySelector('button[type="submit"]');
  if (button) button.hidden = true;
}

function reveal(selector, focusSelector) {
  $(selector).hidden = false;
  if (focusSelector) $(focusSelector)?.focus();
}

function buildPicker() {
  $('#problem-picker').replaceChildren(...examples.map((entry, index) => (
    new Option(entry.title, String(index))
  )));
  $('#problem-picker').value = String(exampleIndex);
}

function polynomialTerm(value, variable, isFirst = false) {
  if (value === 0) return '';
  const magnitude = Math.abs(value);
  const coefficient = variable && magnitude === 1 ? '' : formatNumber(magnitude);
  const body = `${coefficient}${variable}`;
  if (isFirst) return value < 0 ? `−${body}` : body;
  return value < 0 ? ` − ${body}` : ` + ${body}`;
}

function polynomialText(current) {
  return [
    polynomialTerm(current.a, 'x²', true),
    polynomialTerm(current.b, 'x'),
    polynomialTerm(current.c, ''),
  ].filter(Boolean).join('');
}

function buildTargetExpression() {
  const current = problem();
  $('#target-expression').replaceChildren(
    span(polynomialText(current)), span(' = '), input('target-value', `Target ${current.targetLabel}`),
  );
}

function balanceRow(terms, right, className = '') {
  const row = document.createElement('div');
  row.className = `q10-balance-row${className ? ` ${className}` : ''}`;
  const termCells = terms.map((content, index) => {
    const cell = span('', `q10-balance-term${index === 2 ? ' q10-balance-constant' : ''}`);
    cell.append(content);
    return cell;
  });
  const equals = span('=', 'q10-balance-equals');
  const rightCell = span('', 'q10-balance-right');
  rightCell.append(...(Array.isArray(right) ? right : [right]));
  row.append(...termCells, equals, rightCell);
  return row;
}

function buildMoveOverWork() {
  const current = problem();
  const initialTerms = [
    span(polynomialTerm(current.a, 'x²', true)),
    span(polynomialTerm(current.b, 'x')),
    span(polynomialTerm(current.c, '') || '+ 0'),
  ];
  const resultTerms = [
    span(polynomialTerm(current.a, 'x²', true)),
    span(polynomialTerm(current.b, 'x')),
  ];
  const subtract = span('', 'q10-subtract-entry');
  subtract.append(span('− '), input('subtract-left', 'Value subtracted from the constant term'));
  const subtractRight = span('', 'q10-subtract-entry');
  subtractRight.append(span('− '), input('subtract-right', 'Value subtracted from the right side'));
  const newConstant = input('new-constant', 'New constant in standard form');
  const resultConstant = span('', 'q10-result-polynomial');
  resultConstant.append(span('+ '), newConstant);
  resultTerms.push(resultConstant);
  $('#move-over-work').replaceChildren(
    balanceRow(initialTerms, span(formatNumber(current.targetValue))),
    balanceRow([span(''), span(''), subtract], subtractRight, 'q10-balance-operation'),
    balanceRow(resultTerms, span('0'), 'q10-balance-result'),
  );
}

function buildGivenFormula() {
  const numerator = span('', 'q14-numerator');
  numerator.append(
    span('−b'), span(' ± '), radical([span('b² − 4ac')]),
  );
  $('#formula-given').replaceChildren(span('x ='), fraction(numerator, '2a'));
}

function buildFormula() {
  const numerator = span('', 'q14-numerator');
  numerator.append(
    span('−('), input('formula-b', 'Value of b'), span(') ± '),
    radical([
      span('('), input('formula-b-square', 'Value of b in the discriminant'), span(')² − 4('),
      input('formula-a', 'Value of a'), span(')('), input('formula-c', 'Value of c after moving the target'), span(')'),
    ]),
  );
  const denominator = span('', 'q14-denominator');
  denominator.append(span('2('), input('formula-a-denominator', 'Value of a in the denominator'), span(')'));
  $('#formula-expression').replaceChildren(span('x ='), fraction(numerator, denominator));
}

function buildSimplifyExpression() {
  const numerator = span('', 'q14-numerator');
  numerator.append(
    input('simplify-negative-b', 'Value of negative b'), span(' ± '),
    radical([input('simplify-discriminant', 'Value of the discriminant')]),
  );
  $('#simplify-expression').replaceChildren(
    span('x ='), fraction(numerator, input('simplify-denominator', 'Value of 2a')),
  );
}

function formatNumber(value) {
  return Number(value).toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function signed(value) {
  const valueText = formatNumber(Math.abs(value));
  return value < 0 ? `−${valueText}` : valueText;
}

function buildSquareRootExpression() {
  const rootInput = input('rounded-square-root', 'Square root rounded to four decimal places as needed');
  $('#square-root-expression').replaceChildren(
    radical([span(formatNumber(discriminant(problem())))]), span(' ≈ '), rootInput,
  );
}

function addSolutionColumn(branch, signText, label) {
  const column = document.createElement('div');
  column.className = 'q14-solution-column q10-solution-column';

  const equation = document.createElement('div');
  equation.className = 'q14-solution-equation q10-solution-equation';
  const numerator = span('', 'q14-numerator');
  numerator.append(
    input(`substitution-${branch}-negative-b`, `${label}: value of negative b`),
    span(` ${signText} `),
    input(`substitution-${branch}-square-root`, `${label}: rounded square root`),
  );
  const denominator = span('', 'q14-denominator');
  denominator.append(input(`substitution-${branch}-denominator`, `${label}: value of 2a`));
  equation.append(
    span(`${label}: x = `),
    fraction(numerator, denominator),
  );
  column.append(equation);
  return column;
}

function buildSolutionsExpression() {
  const layout = document.createElement('div');
  layout.className = 'q14-solution-columns';
  layout.append(
    addSolutionColumn('plus', '+', 'Using addition'),
    span('and', 'q14-solution-and'),
    addSolutionColumn('minus', '−', 'Using subtraction'),
  );
  $('#solutions-expression').replaceChildren(layout);
}

function buildSolutionsAnswerExpression() {
  const p = problem();
  const sqrtValue = formatDecimal(roundedSquareRoot(p), 4);
  const negativeBText = signed(-p.b);
  const denominatorText = signed(2 * p.a);
  const layout = document.createElement('div');
  layout.className = 'q14-solution-columns';

  const addColumn = (branch, signText, label) => {
    const column = document.createElement('div');
    column.className = 'q14-solution-column q10-solution-column';
    const equation = document.createElement('div');
    equation.className = 'q14-solution-equation q10-solution-equation';
    equation.append(
      span(`${label}: x = `),
      fraction(`(${negativeBText} ${signText} ${sqrtValue})`, `(${denominatorText})`),
    );
    const answer = document.createElement('label');
    answer.className = 'q14-solution-entry q10-solution-entry';
    answer.append(span('x = '), input(`solution-${branch}`, `Solution using the ${branch} quadratic-formula branch`));
    column.append(equation, answer);
    return column;
  };

  layout.append(
    addColumn('plus', '+', 'Using addition'),
    span('and', 'q14-solution-and'),
    addColumn('minus', '−', 'Using subtraction'),
  );
  $('#solutions-answer-expression').replaceChildren(layout);
}

function buildContextAnswers(count) {
  const target = $('#context-answer-fields');
  const fields = [];
  for (let index = 0; index < count; index += 1) {
    if (index > 0) fields.push(span('and', 'q10-answer-and'));
    const label = document.createElement('label');
    label.append(span('x = '), input(`context-answer-${index + 1}`, `Contextual solution ${index + 1}`));
    fields.push(label);
  }
  target.replaceChildren(...fields);
  $('#context-units').textContent = problem().answerUnit;
}

function reset() {
  clearConfetti();
  const current = problem();
  buildPicker();
  $('#scenario').textContent = current.scenario;
  $('#model').textContent = current.model;
  $('#x-meaning').textContent = current.xMeaning;
  $('#target-step-title').textContent = `1. Set the function equal to the ${current.targetLabel} in the question`;
  $('#target-step-prompt').textContent = `Enter the ${current.targetLabel} described in the story.`;
  buildTargetExpression();
  buildMoveOverWork();
  buildGivenFormula();
  buildFormula();
  buildSimplifyExpression();
  buildSquareRootExpression();
  buildSolutionsExpression();
  buildSolutionsAnswerExpression();
  $('#context-answer-fields').replaceChildren();
  $('#context-units').textContent = current.answerUnit;

  const formulaStepNumber = current.targetValue === 0 ? 2 : 3;
  $('#formula-step-title').textContent = `${formulaStepNumber}. Substitute into the quadratic formula`;
  $('#simplify-step-title').textContent = `${formulaStepNumber + 1}. Simplify the discriminant and denominator`;
  $('#square-root-step-title').textContent = `${formulaStepNumber + 2}. Evaluate the square root`;
  $('#solutions-step-title').textContent = `${formulaStepNumber + 3}. Substitute the values, then calculate each x-value`;
  $('#context-step-title').textContent = `${formulaStepNumber + 4}. How many solutions make sense?`;

  ['#move-over-step', '#formula-step', '#simplify-step', '#square-root-step', '#solutions-step', '#context-step', '#complete', '#solutions-answer-form', '#context-form']
    .forEach(selector => { $(selector).hidden = true; });
  $('#target-step').hidden = false;
  $('#solutions-substitution-form').hidden = false;
  $('#context-count-form').hidden = false;
  $('#context-solution-count').value = '';
  document.querySelectorAll('.q10-work input, .q10-work select').forEach(field => {
    field.value = '';
    field.disabled = false;
    field.classList.remove('invalid');
    field.setAttribute('aria-invalid', 'false');
  });
  document.querySelectorAll('.q10-work button[type="submit"]').forEach(button => { button.hidden = false; });
  [
    '#target-feedback', '#move-over-feedback', '#formula-feedback', '#simplify-feedback',
    '#square-root-feedback', '#solutions-substitution-feedback', '#solutions-answer-feedback',
    '#context-count-feedback', '#context-feedback',
  ].forEach(selector => showFeedback(selector, ''));
}

function finish() {
  const answers = problem().validBranches.map(branch => `x = ${formatDecimal(result()[branch], 2)}`);
  const answerText = answers.length === 1 ? answers[0] : answers.join(' and ');
  $('#complete-text').textContent = `${problem().answerLead} ${answerText} ${problem().answerUnit}.`;
  $('#complete').hidden = false;
  fireConfetti(180);
}

$('#target-form').addEventListener('submit', event => {
  event.preventDefault();
  const field = $('#target-value');
  const correct = close(parseValue(field.value), problem().targetValue);
  mark(field, correct);
  if (!correct) {
    showFeedback('#target-feedback', `Set the function equal to the ${problem().targetLabel} given in the story.`);
    return;
  }
  lock([field]);
  hideSubmit(event.currentTarget);
  showFeedback('#target-feedback', 'Correct target value.', true);
  if (problem().targetValue !== 0) {
    reveal('#move-over-step', '#subtract-left');
  } else {
    reveal('#formula-step', '#formula-a');
  }
});

$('#move-over-form').addEventListener('submit', event => {
  event.preventDefault();
  const p = problem();
  const fields = [$('#subtract-left'), $('#subtract-right'), $('#new-constant')];
  const expected = [p.targetValue, p.targetValue, resultingConstant(p)];
  const correct = fields.map((field, index) => close(parseValue(field.value), expected[index]));
  fields.forEach((field, index) => mark(field, correct[index]));
  if (!correct.every(Boolean)) {
    showFeedback('#move-over-feedback', 'Subtract the target value from each side, then enter the new constant in the equation set equal to zero.');
    return;
  }
  lock(fields);
  hideSubmit(event.currentTarget);
  showFeedback('#move-over-feedback', 'Correct. The equation is now in standard form and set equal to zero.', true);
  reveal('#formula-step', '#formula-a');
});

$('#formula-form').addEventListener('submit', event => {
  event.preventDefault();
  const p = problem();
  const fields = [$('#formula-a'), $('#formula-b'), $('#formula-b-square'), $('#formula-c'), $('#formula-a-denominator')];
  const expected = [p.a, p.b, p.b, resultingConstant(p), p.a];
  const correct = fields.map((field, index) => close(parseValue(field.value), expected[index]));
  fields.forEach((field, index) => mark(field, correct[index]));
  if (!correct.every(Boolean)) {
    showFeedback('#formula-feedback', 'Substitute the signed values of a, b, and c in the matching blanks.');
    return;
  }
  lock(fields);
  hideSubmit(event.currentTarget);
  showFeedback('#formula-feedback', 'Correct substitution.', true);
  reveal('#simplify-step', '#simplify-negative-b');
});

$('#simplify-form').addEventListener('submit', event => {
  event.preventDefault();
  const p = problem();
  const fields = [$('#simplify-negative-b'), $('#simplify-discriminant'), $('#simplify-denominator')];
  const expected = [-p.b, discriminant(p), 2 * p.a];
  const correct = fields.map((field, index) => close(parseValue(field.value), expected[index]));
  fields.forEach((field, index) => mark(field, correct[index]));
  if (!correct.every(Boolean)) {
    showFeedback('#simplify-feedback', 'Enter −b, evaluate b² − 4ac, and calculate 2a.');
    return;
  }
  lock(fields);
  hideSubmit(event.currentTarget);
  showFeedback('#simplify-feedback', 'Correct.', true);
  reveal('#square-root-step', '#rounded-square-root');
});

$('#square-root-form').addEventListener('submit', event => {
  event.preventDefault();
  const field = $('#rounded-square-root');
  const correct = close(parseValue(field.value), roundedSquareRoot(problem()));
  mark(field, correct);
  if (!correct) {
    showFeedback('#square-root-feedback', 'Evaluate the square root of the discriminant and round to four decimal places as needed.');
    return;
  }
  lock([field]);
  hideSubmit(event.currentTarget);
  showFeedback('#square-root-feedback', 'Correct square root.', true);
  reveal('#solutions-step', '#substitution-plus-negative-b');
});

$('#solutions-substitution-form').addEventListener('submit', event => {
  event.preventDefault();
  const p = problem();
  const fields = [
    $('#substitution-plus-negative-b'), $('#substitution-plus-square-root'), $('#substitution-plus-denominator'),
    $('#substitution-minus-negative-b'), $('#substitution-minus-square-root'), $('#substitution-minus-denominator'),
  ];
  const expected = [-p.b, roundedSquareRoot(p), 2 * p.a, -p.b, roundedSquareRoot(p), 2 * p.a];
  const correct = fields.map((field, index) => close(parseValue(field.value), expected[index]));
  fields.forEach((field, index) => mark(field, correct[index]));
  if (!correct.every(Boolean)) {
    showFeedback('#solutions-substitution-feedback', 'Enter −b, the square root rounded to four decimal places as needed, and 2a in each branch.');
    return;
  }
  lock(fields);
  hideSubmit(event.currentTarget);
  showFeedback('#solutions-substitution-feedback', 'Correct substitutions.', true);
  $('#solutions-answer-form').hidden = false;
  $('#solution-plus').focus();
});

$('#solutions-answer-form').addEventListener('submit', event => {
  event.preventDefault();
  const values = result();
  const fields = [$('#solution-plus'), $('#solution-minus')];
  const expected = [values.plus, values.minus];
  const correct = fields.map((field, index) => close(parseValue(field.value), expected[index]));
  fields.forEach((field, index) => mark(field, correct[index]));
  if (!correct.every(Boolean)) {
    showFeedback('#solutions-answer-feedback', 'Use the substituted values and round each x-value to two decimal places.');
    return;
  }
  lock(fields);
  hideSubmit(event.currentTarget);
  showFeedback('#solutions-answer-feedback', 'Correct mathematical solutions.', true);
  reveal('#context-step', '#context-solution-count');
});

$('#context-solution-count').addEventListener('change', event => {
  mark(event.target, true);
  showFeedback('#context-count-feedback', '');
});

$('#context-count-form').addEventListener('submit', event => {
  event.preventDefault();
  const field = $('#context-solution-count');
  const correct = Number(field.value) === problem().validBranches.length;
  mark(field, correct);
  if (!correct) {
    showFeedback('#context-count-feedback', 'Count only the solution(s) that are possible in this situation.');
    return;
  }
  field.disabled = true;
  hideSubmit(event.currentTarget);
  showFeedback('#context-count-feedback', 'Correct. Now enter the final contextual answer(s).', true);
  buildContextAnswers(Number(field.value));
  $('#context-form').hidden = false;
  $('#context-answer-fields input')?.focus();
});

$('#context-form').addEventListener('submit', event => {
  event.preventDefault();
  const fields = [...$('#context-answer-fields').querySelectorAll('input')];
  const expected = problem().validBranches.map(branch => result()[branch]);
  const unmatched = [...expected];
  const fieldCorrect = fields.map(field => {
    if (!field.value.trim()) return null;
    const matchIndex = unmatched.findIndex(value => close(parseValue(field.value), value));
    if (matchIndex < 0) return false;
    unmatched.splice(matchIndex, 1);
    return true;
  });
  const enteredCount = fields.filter(field => field.value.trim()).length;
  const valid = enteredCount === expected.length && unmatched.length === 0;
  fields.forEach((field, index) => {
    mark(field, fieldCorrect[index]);
  });
  if (!valid) {
    showFeedback('#context-feedback', 'Use the context to rule out impossible values, such as negative time, ticket sales, or side lengths. Enter the rounded answer(s) that make sense.');
    return;
  }
  lock(fields);
  hideSubmit(event.currentTarget);
  showFeedback('#context-feedback', 'Correct contextual answer(s).', true);
  finish();
});

$('#problem-picker').addEventListener('change', event => {
  exampleIndex = Number(event.target.value);
  reset();
});

$('#next-problem').addEventListener('click', () => {
  exampleIndex = (exampleIndex + 1) % examples.length;
  reset();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('#reset').addEventListener('click', reset);
reset();
