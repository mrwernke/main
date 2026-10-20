import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';
import { problems, equationText, formatRational, polynomialText, solutionData } from './model.mjs';

const $ = selector => document.querySelector(selector);
let index = 0;
const problem = () => problems[index];
const data = () => solutionData(problem());
const needsFinalRadicand = result => result.radical.hasRadical
  && result.radical.imaginary
  && result.radical.coefficient !== 1;
const moveProblem = () => problem().kind === 'move';
const formulaChoices = [
  { id: 'correct', negativeB: true, discriminantSign: '−', factors: ['a', 'c'], denominator: '2a', label: 'Negative b plus or minus the square root of b squared minus 4 a c, all over 2 a' },
  { id: 'plus-discriminant', negativeB: true, discriminantSign: '+', factors: ['a', 'c'], denominator: '2a', label: 'Negative b plus or minus the square root of b squared plus 4 a c, all over 2 a' },
  { id: 'positive-b', negativeB: false, discriminantSign: '−', factors: ['a', 'c'], denominator: '2a', label: 'b plus or minus the square root of b squared minus 4 a c, all over 2 a' },
  { id: 'missing-two', negativeB: true, discriminantSign: '−', factors: ['a', 'c'], denominator: 'a', label: 'Negative b plus or minus the square root of b squared minus 4 a c, all over a' },
  { id: 'denominator-c', negativeB: true, discriminantSign: '−', factors: ['a', 'c'], denominator: '2c', label: 'Negative b plus or minus the square root of b squared minus 4 a c, all over 2 c' },
  { id: 'wrong-product', negativeB: true, discriminantSign: '−', factors: ['a', 'b'], denominator: '2a', label: 'Negative b plus or minus the square root of b squared minus 4 a b, all over 2 a' },
];

function parseValue(value) {
  const text = String(value).trim().replace(/\s/g, '').replace(/−/g, '-');
  const fraction = text.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    return denominator === 0 ? NaN : Number(fraction[1]) / denominator;
  }
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return NaN;
  return Number(text);
}

function parseSignedCoefficient(value) {
  const text = String(value).trim().replace(/\s/g, '').replace(/−/g, '-');
  if (!/^[+-]/.test(text)) return NaN;
  return parseValue(text);
}

function close(actual, expected) {
  return Number.isFinite(actual) && Math.abs(actual - expected) < 1e-8;
}

function input(id, label, value = '', inputMode = 'decimal') {
  const field = document.createElement('input');
  field.id = id;
  field.inputMode = inputMode;
  field.autocomplete = 'off';
  field.setAttribute('aria-label', label);
  if (value !== '') field.value = String(value);
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
  const symbol = span('√', 'q14-root-symbol');
  const radicand = span('', 'q14-radicand');
  radicand.append(...children);
  wrapper.append(symbol, radicand);
  return wrapper;
}

function fraction(top, bottom) {
  const wrapper = span('', 'q14-fraction');
  const numerator = span('', 'q14-numerator');
  const denominator = span('', 'q14-denominator');
  if (typeof top === 'string') numerator.append(span(top));
  else if (top instanceof HTMLElement && top.classList.contains('q14-numerator')) numerator.append(...top.childNodes);
  else numerator.append(top);
  if (typeof bottom === 'string') denominator.append(span(bottom));
  else denominator.append(bottom);
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
  element.className = `feedback ${message ? (correct ? 'ok' : 'no') : ''}`;
}

function hideSubmit(form) {
  const button = form.querySelector('button[type="submit"]');
  if (button) button.hidden = true;
}

function lock(fields) {
  fields.forEach(field => { field.disabled = true; });
}

function buildPicker() {
  const standard = document.createElement('optgroup');
  standard.label = 'Standard Form';
  const move = document.createElement('optgroup');
  move.label = 'Move Terms First';
  let standardNumber = 0;
  let moveNumber = 0;
  problems.forEach((entry, problemIndex) => {
    const isMove = entry.kind === 'move';
    const number = isMove ? ++moveNumber : ++standardNumber;
    const option = new Option(`${number}: ${equationText(entry)}`, String(problemIndex));
    (isMove ? move : standard).append(option);
  });
  $('#problem-picker').replaceChildren(standard, move);
  $('#problem-picker').value = String(index);
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function formulaChoiceButton(choice) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'q14-formula-choice';
  button.setAttribute('aria-label', choice.label);
  const numerator = span('', 'q14-numerator');
  numerator.append(
    span(choice.negativeB ? '−b' : 'b'), span(' ± '),
    radical([
      span('b² '), span(choice.discriminantSign), span(' 4'),
      span(choice.factors[0]), span(choice.factors[1]),
    ]),
  );
  const denominator = span(choice.denominator);
  button.append(span('x ='), fraction(numerator, denominator));
  button.onclick = () => chooseFormula(button, choice.id);
  return button;
}

function buildFormulaChoiceOptions() {
  const target = $('#formula-options');
  target.replaceChildren(...shuffle(formulaChoices).map(formulaChoiceButton));
}

function chooseFormula(button, choiceId) {
  const correct = choiceId === 'correct';
  if (!correct) {
    button.classList.add('invalid');
    showFeedback('#formula-choice-feedback', 'Check the sign of b, the discriminant, and the denominator.');
    return;
  }
  button.classList.add('correct');
  $('#formula-options').querySelectorAll('button').forEach(option => { option.disabled = true; });
  $('#formula-options').replaceChildren(button);
  showFeedback('#formula-choice-feedback', 'Correct formula.', true);
  reveal('#formula-step', '#formula-b');
}

const moveKeys = ['a', 'b', 'c'];
const moveVariables = ['x²', 'x', ''];
const moveTermNames = ['x squared term', 'x term', 'constant term'];

function equationTermCells(coefficients) {
  const firstTerm = coefficients.findIndex(value => value !== 0);
  return coefficients.map((coefficient, index) => {
    if (coefficient === 0) return span('', 'q14-move-term q14-move-empty');
    const magnitude = Math.abs(coefficient);
    const body = `${moveVariables[index] && magnitude === 1 ? '' : formatRational(magnitude)}${moveVariables[index]}`;
    const sign = coefficient < 0 ? '− ' : index === firstTerm ? '' : '+ ';
    return span(`${sign}${body}`, 'q14-move-term');
  });
}

function operationTermCell(side, index) {
  const coefficient = problem().right[index];
  if (coefficient === 0) return span('', 'q14-move-term q14-move-empty');

  const cell = span('', 'q14-move-term q14-move-operation-term');
  const coefficientInput = input(
    `move-${side}-${moveKeys[index]}-value`,
    `Signed coefficient to move on the ${side} side for the ${moveTermNames[index]}`,
    '',
    'text',
  );
  cell.append(coefficientInput, span(moveVariables[index]));
  return cell;
}

function moveGridRow(left, right, className = '') {
  const equals = span('=', `q14-move-equals${className === 'q14-move-operation' ? ' q14-move-operation-equals' : ''}`);
  const cells = [...left, equals, ...right];
  if (className) cells.forEach(cell => cell.classList.add(className));
  return cells;
}

function buildMoveWork() {
  const p = problem();
  const leftOperations = moveKeys.map((_, termIndex) => operationTermCell('left', termIndex));
  const rightOperations = moveKeys.map((_, termIndex) => operationTermCell('right', termIndex));
  $('#move-work').replaceChildren(
    ...moveGridRow(equationTermCells(p.left), equationTermCells(p.right), 'q14-move-equation'),
    ...moveGridRow(leftOperations, rightOperations, 'q14-move-operation'),
  );
}

function moveOperationFields() {
  const fields = [];
  problem().right.forEach((coefficient, index) => {
    if (coefficient === 0) return;
    fields.push({
      leftValue: $(`#move-left-${moveKeys[index]}-value`),
      rightValue: $(`#move-right-${moveKeys[index]}-value`),
      expected: -coefficient,
    });
  });
  return fields;
}

function buildStandardForm() {
  const target = $('#standard-expression');
  target.replaceChildren(
    input('standard-a', 'Standard form coefficient a'), span('x² + '),
    input('standard-b', 'Standard form coefficient b'), span('x + '),
    input('standard-c', 'Standard form coefficient c'), span(' = 0'),
  );
}

function buildFormula() {
  const target = $('#formula-expression');
  const numerator = span('', 'q14-numerator');
  numerator.append(
    span('−('), input('formula-b', 'Value of b'), span(') ± '),
    radical([
      span('('), input('formula-b-square', 'Value of b in the discriminant'), span(')² − 4('),
      input('formula-a', 'Value of a'), span(')('), input('formula-c', 'Value of c'), span(')'),
    ]),
  );
  const denominator = span('', 'q14-denominator');
  denominator.append(span('2('), input('formula-a-denominator', 'Value of a in the denominator'), span(')'));
  target.replaceChildren(span('x ='), fraction(numerator, denominator));
}

function buildSimplifyExpression() {
  const target = $('#simplify-expression');
  const numerator = span('', 'q14-numerator');
  numerator.append(input('simplify-negative-b', 'Signed value of negative b'), span(' \u00b1 '), radical([input('simplify-d', 'Discriminant value')]));
  const denominator = input('simplify-denominator', 'Simplified denominator');
  target.replaceChildren(span('x ='), fraction(numerator, denominator));
}

function buildRadicalExpression(showSimplified = false) {
  const root = data().radical;
  const value = data().discriminant;
  const target = $('#radical-expression');
  target.replaceChildren(radical([span(formatRational(value).replace('-', '−'))]));
  target.append(span(' = '));
  if (showSimplified) {
    if (root.hasRadical && root.coefficient !== 1) target.append(span(formatRational(root.coefficient)));
    if (root.hasRadical) target.append(radical([span(String(root.radicand))]));
    else target.append(span(formatRational(root.coefficient)));
    if (root.imaginary) target.append(span('i'));
  }
}

function buildRadicalEntryExpression() {
  const type = $('#radical-type').value;
  const root = data().radical;
  const target = $('#radical-expression');
  target.replaceChildren(radical([span(formatRational(data().discriminant).replace('-', '\u2212'))]), span(' = '));
  if (!type || type !== root.kind) return;

  const fields = span('', 'q14-radical-fields q14-radical-part');
  const coefficientType = type.startsWith('coefficient-') || type.startsWith('integer');
  const hasRadical = type.includes('radical');
  if (coefficientType) fields.append(input('radical-coefficient', 'Coefficient in simplified radical'));
  if (hasRadical) fields.append(radical([input('radical-radicand', 'Radicand in simplified radical')]));
  if (type.endsWith('-i')) fields.append(span('i'));
  target.append(fields);
}

function buildSplitExpression() {
  const target = $('#split-expression');
  const root = data().radical;
  const baseNumerator = input('split-base-top', 'Numerator of the first fraction');
  const baseDenominator = input('split-base-bottom', 'Denominator of the first fraction');
  const radicalNumerator = span('', 'q14-numerator');
  radicalNumerator.append(input('split-radical-coefficient', 'Coefficient of the radical fraction'));
  if (root.hasRadical) radicalNumerator.append(radical([input('split-radicand', 'Radicand in the second fraction')]));
  if (root.imaginary) radicalNumerator.append(span('i'));
  const radicalDenominator = input('split-radical-bottom', 'Denominator of the radical fraction');
  target.replaceChildren(
    span('x ='), fraction(baseNumerator, baseDenominator), span('±'),
    fraction(radicalNumerator, radicalDenominator),
  );
}

function buildFinalExpression() {
  const target = $('#final-expression');
  const result = data();
  const root = result.radical;
  const parenthesizeFraction = (field, value) => {
    if (Number.isInteger(value)) return field;
    const wrapper = span('', 'q14-parenthesized-fraction');
    wrapper.append(span('('), field, span(')'));
    return wrapper;
  };
  const radicalPart = span('', 'q14-radical-part');
  radicalPart.append(parenthesizeFraction(input('final-offset', 'Simplified radical coefficient'), result.offset));
  if (root.hasRadical) {
    const radicand = needsFinalRadicand(result)
      ? input('final-radicand', 'Radicand in the final answer')
      : span(String(root.radicand));
    radicalPart.append(radical([radicand]));
  }
  if (root.imaginary) radicalPart.append(span('i'));

  const basePart = span('', 'q14-radical-part');
  basePart.append(parenthesizeFraction(input('final-base', 'Simplified rational part'), result.base));
  target.replaceChildren(span('x ='), basePart, span(' \u00b1 '), radicalPart);
}

function buildNumericAnswer() {
  const target = $('#answer-expression');
  const result = data();
  target.replaceChildren();
  const layout = document.createElement('div');
  layout.className = 'q14-solution-columns';
  const addColumn = (expression, id, accessibleLabel) => {
    const column = document.createElement('div');
    column.className = 'q14-solution-column';
    const equation = document.createElement('p');
    equation.className = 'q14-solution-equation';
    equation.textContent = expression;
    const answer = document.createElement('div');
    answer.className = 'q14-solution-entry';
    answer.append(span('x ='), input(id, accessibleLabel));
    column.append(equation, answer);
    return column;
  };
  if (result.discriminant === 0) {
    layout.classList.add('q14-single-solution');
    layout.append(addColumn(`x = ${formatRational(result.base)}`, 'answer-single', 'The real solution'));
  } else {
    layout.append(
      addColumn(`x = ${formatRational(result.base)} + ${formatRational(result.offset)}`, 'answer-plus', 'Solution using addition'),
      span('and', 'q14-solution-and'),
      addColumn(`x = ${formatRational(result.base)} − ${formatRational(result.offset)}`, 'answer-minus', 'Solution using subtraction'),
    );
  }
  target.append(layout);
}

function buildEquationState() {
  $('#equation').textContent = equationText(problem());
  const isMove = moveProblem();
  $('.q14-work').classList.toggle('q14-standard-case', !isMove);
  $('#standardize-step').hidden = !isMove;
  $('#formula-choice-step').hidden = isMove;
  $('#formula-step').hidden = true;
  $('#formula-choice-title').textContent = 'Choose the quadratic formula';
  $('#formula-title').textContent = isMove ? '2. Substitute into the quadratic formula' : '1. Substitute into the quadratic formula';
  $('#simplify-title').textContent = isMove ? '3. Simplify the discriminant and denominator' : '2. Simplify the discriminant and denominator';
  $('#radical-title').textContent = isMove ? '4. Simplify the radical' : '3. Simplify the radical';
  $('#split-title').textContent = isMove ? '5. Split the numerator into two fractions' : '4. Split the numerator into two fractions';
  $('#final-title').textContent = isMove ? '6. Simplify each part' : '5. Simplify each part';
  $('#answer-title').textContent = isMove ? '7. Calculate the final solution' : '6. Calculate the final solution';
  if (isMove) {
    buildMoveWork();
    buildStandardForm();
  }
}

function reset() {
  clearConfetti();
  const radicalLabels = { radical: '\u221a(#)', 'radical-i': '\u221a(#)i', 'coefficient-radical': '#\u221a(#)', 'coefficient-radical-i': '#\u221a(#)i' };
  Object.entries(radicalLabels).forEach(([value, label]) => {
    const option = $('#radical-type').querySelector(`option[value="${value}"]`);
    if (option) option.textContent = label;
  });
  buildPicker();
  buildEquationState();
  buildFormulaChoiceOptions();
  buildFormula();
  $('#standard-form').hidden = true;
  $('#formula-choice-step').hidden = moveProblem();
  $('#formula-step').hidden = true;
  ['#simplify-step', '#radical-step', '#split-step', '#final-step', '#answer-step', '#complete'].forEach(selector => { $(selector).hidden = true; });
  $('#move-form').hidden = false;
  document.querySelectorAll('.q14-work input, .q14-work select').forEach(field => {
    field.value = '';
    field.disabled = false;
    field.classList.remove('invalid');
    field.setAttribute('aria-invalid', 'false');
  });
  document.querySelectorAll('.q14-work button[type="submit"]').forEach(button => { button.hidden = false; });
  ['#move-feedback', '#standard-feedback', '#formula-choice-feedback', '#formula-feedback', '#simplify-feedback', '#radical-feedback', '#split-feedback', '#final-feedback', '#answer-feedback'].forEach(selector => showFeedback(selector, ''));
  $('#radical-expression').replaceChildren();
  $('#answer-expression').replaceChildren();
  if (moveProblem()) $('#standardize-step').hidden = false;
}

function reveal(selector, focusSelector) {
  $(selector).hidden = false;
  if (focusSelector) $(focusSelector)?.focus();
}

function finish() {
  const result = data();
  const root = result.radical;
  const answerValue = value => Number.isInteger(value) ? formatRational(value) : `(${formatRational(value)})`;
  const completeText = $('#complete-text');
  completeText.replaceChildren(document.createTextNode(`The solution${result.discriminant === 0 ? ' is ' : 's are '}`));
  if (result.discriminant === 0) {
    completeText.append(document.createTextNode(`x = ${formatRational(result.base)}.`));
  } else if (result.realSolutions) {
    completeText.append(document.createTextNode(`x = ${formatRational(result.realSolutions[0])} or x = ${formatRational(result.realSolutions[1])}.`));
  } else {
    const baseText = result.base === 0 ? '' : answerValue(result.base);
    completeText.append(document.createTextNode(`x = ${baseText}${baseText ? ' \u00b1 ' : '\u00b1 '}`));
    if (!root.hasRadical || result.offset !== 1) completeText.append(document.createTextNode(answerValue(result.offset)));
    if (root.hasRadical) completeText.append(radical([span(String(root.radicand))]));
    if (root.imaginary) completeText.append(document.createTextNode('i'));
    completeText.append(document.createTextNode('.'));
  }
  $('#complete').hidden = false;
  fireConfetti(180);
}

$('#move-form').onsubmit = event => {
  event.preventDefault();
  const entries = moveOperationFields();
  const fields = entries.flatMap(entry => [entry.leftValue, entry.rightValue]);
  const correct = entries.flatMap(entry => [
    close(parseSignedCoefficient(entry.leftValue.value), entry.expected),
    close(parseSignedCoefficient(entry.rightValue.value), entry.expected),
  ]);
  fields.forEach((field, i) => mark(field, correct[i]));
  if (!correct.every(Boolean)) {
    showFeedback('#move-feedback', 'Enter the opposite term with its sign under both sides. Use + when adding and − when subtracting.');
    return;
  }
  lock(fields);
  hideSubmit(event.currentTarget);
  showFeedback('#move-feedback', '');
  $('#standard-form').hidden = false;
  $('#standard-a').focus();
};

$('#standard-form').onsubmit = event => {
  event.preventDefault();
  const fields = [$('#standard-a'), $('#standard-b'), $('#standard-c')];
  const expected = [problem().a, problem().b, problem().c];
  const correct = fields.map((field, i) => close(parseValue(field.value), expected[i]));
  fields.forEach((field, i) => mark(field, correct[i]));
  if (!correct.every(Boolean)) {
    showFeedback('#standard-feedback', 'Combine each pair of like terms and keep the equation equal to 0.');
    return;
  }
  lock(fields);
  hideSubmit(event.currentTarget);
  showFeedback('#standard-feedback', 'Correct standard form.', true);
  reveal('#formula-choice-step', '#formula-options button');
};

$('#formula-form').onsubmit = event => {
  event.preventDefault();
  const fields = [$('#formula-a'), $('#formula-b'), $('#formula-b-square'), $('#formula-c'), $('#formula-a-denominator')];
  const expected = [problem().a, problem().b, problem().b, problem().c, problem().a];
  const correct = fields.map((field, i) => close(parseValue(field.value), expected[i]));
  fields.forEach((field, i) => mark(field, correct[i]));
  if (!correct.every(Boolean)) {
    showFeedback('#formula-feedback', 'Substitute the signed values of a, b, and c in each matching blank.');
    return;
  }
  lock(fields);
  hideSubmit(event.currentTarget);
  showFeedback('#formula-feedback', 'Correct substitution.', true);
  buildSimplifyExpression();
  reveal('#simplify-step', '#simplify-negative-b');
};

$('#simplify-form').onsubmit = event => {
  event.preventDefault();
  const fields = [$('#simplify-negative-b'), $('#simplify-d'), $('#simplify-denominator')];
  const result = data();
  const expected = [result.negativeB, result.discriminant, result.denominator];
  const correct = fields.map((field, i) => close(parseValue(field.value), expected[i]));
  fields.forEach((field, i) => mark(field, correct[i]));
  if (!correct.every(Boolean)) {
    showFeedback('#simplify-feedback', 'Enter the value of -b, then evaluate b^2 - 4ac and 2a.');
    return;
  }
  lock(fields);
  hideSubmit(event.currentTarget);
  showFeedback('#simplify-feedback', 'Correct.', true);
  buildRadicalExpression();
  reveal('#radical-step', '#radical-type');
};

$('#radical-type').onchange = () => {
  buildRadicalEntryExpression();
  mark($('#radical-type'), true);
  showFeedback('#radical-feedback', '');
};
$('#radical-form').onsubmit = event => {
  event.preventDefault();
  const typeField = $('#radical-type');
  const root = data().radical;
  const typeCorrect = typeField.value === root.kind;
  mark(typeField, typeCorrect);
  const fields = [...$('#radical-expression').querySelectorAll('input')];
  if (!typeCorrect) {
    showFeedback('#radical-feedback', 'Choose the fully simplified radical form, including i when the discriminant is negative.');
    return;
  }
  const expected = [];
  if (typeField.value.startsWith('coefficient-') || typeField.value.startsWith('integer')) expected.push(root.coefficient);
  if (typeField.value.includes('radical')) expected.push(root.radicand);
  const correct = fields.map((field, i) => close(parseValue(field.value), expected[i]));
  fields.forEach((field, i) => mark(field, correct[i]));
  if (!correct.every(Boolean)) {
    showFeedback('#radical-feedback', 'Enter the coefficient and radicand in simplified form.');
    return;
  }
  lock([typeField, ...fields]);
  hideSubmit(event.currentTarget);
  showFeedback('#radical-feedback', 'Correct radical.', true);
  buildRadicalExpression(true);
  buildSplitExpression();
  reveal('#split-step', '#split-base-top');
};

$('#split-form').onsubmit = event => {
  event.preventDefault();
  const result = data();
  const fields = [$('#split-base-top'), $('#split-base-bottom'), $('#split-radical-coefficient')];
  const expected = [result.negativeB, result.denominator, result.radical.coefficient];
  if (result.radical.hasRadical) {
    fields.push($('#split-radicand'));
    expected.push(result.radical.radicand);
  }
  fields.push($('#split-radical-bottom'));
  expected.push(result.denominator);
  const correct = fields.map((field, i) => close(parseValue(field.value), expected[i]));
  fields.forEach((field, i) => mark(field, correct[i]));
  if (!correct.every(Boolean)) {
    showFeedback('#split-feedback', 'Use −b as the first numerator, enter the radicand, and keep 2a as the denominator of both fractions.');
    return;
  }
  lock(fields);
  hideSubmit(event.currentTarget);
  showFeedback('#split-feedback', 'Correct split.', true);
  buildFinalExpression();
  reveal('#final-step', '#final-base');
};

$('#final-form').onsubmit = event => {
  event.preventDefault();
  const result = data();
  const fields = [$('#final-base'), $('#final-offset')];
  const expected = [result.base, result.offset];
  if (needsFinalRadicand(result)) {
    fields.push($('#final-radicand'));
    expected.push(result.radical.radicand);
  }
  const correct = fields.map((field, i) => close(parseValue(field.value), expected[i]));
  fields.forEach((field, i) => mark(field, correct[i]));
  if (!correct.every(Boolean)) {
    showFeedback('#final-feedback', 'Reduce each fraction and enter the radicand when it is blank. You may enter an equivalent terminating decimal or fraction.');
    return;
  }
  lock(fields);
  hideSubmit(event.currentTarget);
  showFeedback('#final-feedback', 'Correct simplification.', true);
  if (result.discriminant > 0 && !result.radical.hasRadical) {
    buildNumericAnswer();
    reveal('#answer-step', '#answer-plus');
  } else finish();
};

$('#answer-form').onsubmit = event => {
  event.preventDefault();
  const result = data();
  const fields = result.discriminant === 0
    ? [$('#answer-single')]
    : [$('#answer-plus'), $('#answer-minus')];
  const expected = result.discriminant === 0 ? [result.base] : result.realSolutions;
  const correct = fields.map((field, i) => close(parseValue(field.value), expected[i]));
  fields.forEach((field, i) => mark(field, correct[i]));
  if (!correct.every(Boolean)) {
    showFeedback('#answer-feedback', 'Combine the rational parts to find each value of x.');
    return;
  }
  lock(fields);
  hideSubmit(event.currentTarget);
  showFeedback('#answer-feedback', 'Correct solutions.', true);
  finish();
};

$('#problem-picker').onchange = event => {
  index = Number(event.target.value);
  reset();
};

$('#next-problem').onclick = () => {
  index = (index + 1) % problems.length;
  reset();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

$('#reset').onclick = reset;
reset();
