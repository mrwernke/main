import {
  examples, extremumType, formatNumber, functionText, parseNumber,
  vertex, vertexSubstitution,
} from './model.mjs';
import { parseCompleteFactor } from '../quadratic-factoring/model.mjs';

const $ = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
let exampleIndex = 0;

const item = () => examples[exampleIndex];
const correctVertex = () => vertex(item());

function mark(input, invalid) {
  input.classList.toggle('invalid', invalid);
  input.setAttribute('aria-invalid', String(invalid));
}

function showFeedback(selector, message, good = false) {
  const element = $(selector);
  element.textContent = message;
  element.className = `feedback ${good ? 'ok' : 'no'}`;
}

function clearFeedback(selector) {
  const element = $(selector);
  element.textContent = '';
  element.className = 'feedback';
}

function freezeStep(stepSelector, feedbackSelector) {
  const section = $(stepSelector);
  section.classList.add('complete');
  section.querySelectorAll('input').forEach(input => { input.readOnly = true; });
  section.querySelectorAll('select').forEach(select => { select.disabled = true; });
  section.querySelector('button[type="submit"]')?.setAttribute('hidden', '');
  clearFeedback(feedbackSelector);
}

function revealStep(selector) {
  const section = $(selector);
  section.hidden = false;
  section.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function renderSubstitutionTemplate() {
  const pieces = functionText(item()).split('x');
  const fragment = document.createDocumentFragment();
  let inputIndex = 0;
  pieces.forEach((piece, index) => {
    fragment.append(document.createTextNode(piece));
    if (index < pieces.length - 1) {
      inputIndex += 1;
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'q9-number q9-substitution-x';
      input.inputMode = 'decimal';
      input.autocomplete = 'off';
      input.setAttribute('aria-label', `Substituted x-value ${inputIndex}`);
      fragment.append(input);
    }
  });
  $('#substitution-work').replaceChildren(fragment);
}

function updateExample() {
  const current = item();
  $('#scenario').textContent = current.scenario;
  $('#x-meaning').textContent = current.xMeaning;
  $('#y-meaning').textContent = current.yMeaning;
  $('#equation').textContent = functionText(current);
  $('#evaluate-heading').textContent = current.form === 'factored'
    ? '5. Substitute the x-value'
    : '3. Substitute the x-value';
  $('#evaluate-y-heading').textContent = current.form === 'factored'
    ? '6. Evaluate to find the y-coordinate'
    : '4. Evaluate to find the y-coordinate';
  $('#final-step-heading').textContent = current.form === 'factored'
    ? '7. Complete the extrema statement'
    : current.form === 'standard'
      ? '5. Complete the extrema statement'
      : '4. Complete the extrema statement';
  $('#substituted-expression').textContent = '';
  renderSubstitutionTemplate();
}

function reset() {
  all('.q9-step').forEach(step => {
    step.hidden = true;
    step.classList.remove('complete');
  });
  $('#complete').hidden = true;
  [
    '#standard-x-form', '#zero-factors-form', '#roots-form', '#factored-x-form',
    '#substitution-form', '#evaluate-y-form',
    '#vertex-x-form', '#vertex-y-form', '#type-form', '#final-form',
  ].forEach(selector => $(selector).reset());
  all('.q9-work input, .q9-work select').forEach(input => {
    input.disabled = false;
    input.readOnly = false;
    mark(input, false);
  });
  all('.feedback').forEach(element => {
    element.textContent = '';
    element.className = 'feedback';
  });
  all('.q9-work button[type="submit"]').forEach(button => { button.hidden = false; });
  updateExample();
  $('#step-type').hidden = false;
}

function checkNumber(input, expected) {
  const actual = parseNumber(input.value);
  const invalid = !Number.isFinite(actual) || Math.abs(actual - expected) > 1e-9;
  mark(input, invalid);
  return !invalid;
}

$('#standard-x-form').addEventListener('submit', event => {
  event.preventDefault();
  const bCorrect = checkNumber($('#standard-b'), item().b);
  const aCorrect = checkNumber($('#standard-a'), item().a);
  const xCorrect = checkNumber($('#standard-x'), correctVertex().x);
  if (!bCorrect || !aCorrect || !xCorrect) {
    showFeedback('#standard-x-feedback', 'Use the signed b- and a-values in x = −b/(2a), then simplify the fraction.');
    return;
  }
  freezeStep('#step-standard-x', '#standard-x-feedback');
  revealStep('#step-evaluate');
});

$('#zero-factors-form').addEventListener('submit', event => {
  event.preventDefault();
  const inputs = [$('#zero-factor-one'), $('#zero-factor-two')];
  const entries = inputs.map(input => parseCompleteFactor(input.value));
  const expected = [item().r1, item().r2].map(root => ({ coefficient: 1, constant: -root }));
  const matches = (entry, factor) => entry?.coefficient === factor.coefficient && entry?.constant === factor.constant;
  const orderOne = [matches(entries[0], expected[0]), matches(entries[1], expected[1])];
  const orderTwo = [matches(entries[0], expected[1]), matches(entries[1], expected[0])];
  const bestOrder = orderTwo.filter(Boolean).length > orderOne.filter(Boolean).length ? orderTwo : orderOne;
  const correct = bestOrder.every(Boolean);
  inputs.forEach((input, index) => mark(input, !bestOrder[index]));
  if (!correct) {
    showFeedback('#zero-factors-feedback', 'Write each factor from the function above without parentheses, then put each one equal to 0.');
    return;
  }
  freezeStep('#step-factored-zero', '#zero-factors-feedback');
  revealStep('#step-factored-roots');
});

$('#roots-form').addEventListener('submit', event => {
  event.preventDefault();
  const inputs = [$('#root-one'), $('#root-two')];
  const actual = inputs.map(input => parseNumber(input.value));
  const expected = [item().r1, item().r2];
  const duplicateRoots = expected[0] !== expected[1];
  const duplicate = duplicateRoots && Number.isFinite(actual[0]) && actual[0] === actual[1];
  const correct = !duplicate && actual.every(value => Number.isFinite(value) && expected.includes(value));
  inputs.forEach((input, index) => {
    mark(input, !Number.isFinite(actual[index]) || duplicate || !expected.includes(actual[index]));
  });
  if (!correct) {
    showFeedback('#roots-feedback', 'Set each factor equal to zero and solve for x. Enter both x-intercepts.');
    return;
  }
  freezeStep('#step-factored-roots', '#roots-feedback');
  revealStep('#step-factored-x');
});

$('#factored-x-form').addEventListener('submit', event => {
  event.preventDefault();
  const inputs = [$('#average-one'), $('#average-two')];
  const actual = inputs.map(input => parseNumber(input.value));
  const expected = [item().r1, item().r2];
  const duplicateRoots = expected[0] !== expected[1];
  const duplicate = duplicateRoots && Number.isFinite(actual[0]) && actual[0] === actual[1];
  const firstCorrect = Number.isFinite(actual[0]) && expected.includes(actual[0]) && !duplicate;
  const secondCorrect = Number.isFinite(actual[1]) && expected.includes(actual[1]) && !duplicate;
  const xCorrect = checkNumber($('#factored-x'), correctVertex().x);
  mark(inputs[0], !firstCorrect);
  mark(inputs[1], !secondCorrect);
  if (!firstCorrect || !secondCorrect || !xCorrect) {
    showFeedback('#factored-x-feedback', 'Enter both different x-intercepts in the numerator, then divide their sum by 2.');
    return;
  }
  freezeStep('#step-factored-x', '#factored-x-feedback');
  revealStep('#step-evaluate');
});

$('#substitution-form').addEventListener('submit', event => {
  event.preventDefault();
  const inputs = all('#substitution-work .q9-substitution-x');
  const results = inputs.map(input => checkNumber(input, correctVertex().x));
  if (!results.every(Boolean)) {
    showFeedback('#substitution-feedback', 'Enter the vertex x-coordinate in each blank in the original function.');
    return;
  }
  freezeStep('#step-evaluate', '#substitution-feedback');
  $('#substituted-expression').textContent = vertexSubstitution(item(), correctVertex().x);
  revealStep('#step-evaluate-y');
});

$('#evaluate-y-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!checkNumber($('#vertex-y'), correctVertex().y)) {
    showFeedback('#evaluate-y-feedback', 'Evaluate the function with the substituted x-value to find y.');
    return;
  }
  freezeStep('#step-evaluate-y', '#evaluate-y-feedback');
  revealStep('#step-final');
});

$('#vertex-x-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!checkNumber($('#vertex-x'), correctVertex().x)) {
    showFeedback('#vertex-x-feedback', 'In vertex form, the x-coordinate of the vertex is h. Check the sign inside the parentheses.');
    return;
  }
  freezeStep('#step-vertex-x', '#vertex-x-feedback');
  revealStep('#step-vertex-y');
});

$('#vertex-y-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!checkNumber($('#vertex-form-y'), correctVertex().y)) {
    showFeedback('#vertex-form-y-feedback', 'In vertex form, the y-coordinate of the vertex is k.');
    return;
  }
  freezeStep('#step-vertex-y', '#vertex-form-y-feedback');
  revealStep('#step-final');
});

$('#type-form').addEventListener('submit', event => {
  event.preventDefault();
  const select = $('#extremum-type');
  const correct = select.value === extremumType(item());
  mark(select, !correct);
  if (!correct) {
    showFeedback('#type-feedback', 'Check the sign of a. A positive a opens up and has a minimum; a negative a opens down and has a maximum.');
    return;
  }
  freezeStep('#step-type', '#type-feedback');
  if (item().form === 'standard') revealStep('#step-standard-x');
  else if (item().form === 'factored') revealStep('#step-factored-zero');
  else revealStep('#step-vertex-x');
});

$('#final-form').addEventListener('submit', event => {
  event.preventDefault();
  const answer = correctVertex();
  const typeCorrect = $('#final-extremum-type').value === extremumType(item());
  mark($('#final-extremum-type'), !typeCorrect);
  const correctY = checkNumber($('#final-y'), answer.y);
  const correctX = checkNumber($('#final-x'), answer.x);
  if (!typeCorrect || !correctY || !correctX) {
    showFeedback('#final-feedback', 'Use the coordinates you found above to complete the extrema statement.');
    return;
  }
  freezeStep('#step-final', '#final-feedback');
  $('#complete-statement').textContent = `The vertex is a ${extremumType(item())} of y = ${formatNumber(answer.y)} at x = ${formatNumber(answer.x)}.`;
  $('#complete').hidden = false;
  $('#complete').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});

$('#example-picker').replaceChildren(...examples.map((example, index) => new Option(`${index + 1}. ${example.title}`, index)));
$('#example-picker').addEventListener('change', event => {
  exampleIndex = Number(event.target.value);
  reset();
});

$('#next-example').addEventListener('click', () => {
  exampleIndex = (exampleIndex + 1) % examples.length;
  $('#example-picker').value = String(exampleIndex);
  reset();
  $('#scenario').scrollIntoView({ block: 'start', behavior: 'smooth' });
});

$('.q9-work').addEventListener('input', event => {
  if (event.target.matches('input, select')) mark(event.target, false);
});
$('.q9-work').addEventListener('change', event => {
  if (event.target.matches('input, select')) mark(event.target, false);
});

reset();
