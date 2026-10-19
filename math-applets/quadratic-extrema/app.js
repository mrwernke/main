import {
  examples, extremumType, formatNumber, functionText, parseNumber,
  standardAxisWork, vertex, vertexSubstitution,
} from './model.mjs';

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

function formatSigned(value) {
  return value < 0 ? `−${formatNumber(Math.abs(value))}` : formatNumber(value);
}

function updateExample() {
  const current = item();
  $('#scenario').textContent = current.scenario;
  $('#x-meaning').textContent = current.xMeaning;
  $('#y-meaning').textContent = current.yMeaning;
  $('#equation').textContent = functionText(current);
  $('#standard-axis-work').textContent = standardAxisWork(current);
  $('#factored-average-work').textContent = current.form === 'factored'
    ? `(${formatNumber(current.r1)} + ${formatNumber(current.r2)}) / 2`
    : '';
  $('#substitution-work').textContent = vertexSubstitution(current, correctVertex().x);
  $('#final-type').textContent = extremumType(current);
  $('#substitution-heading').textContent = current.form === 'factored'
    ? '4. Find the y-coordinate of the vertex'
    : '3. Find the y-coordinate of the vertex';
  $('#final-step-heading').textContent = current.form === 'factored'
    ? '5. State the extremum'
    : current.form === 'vertex' ? '3. State the extremum' : '4. State the extremum';
}

function reset() {
  all('.q9-step').forEach(step => {
    step.hidden = step.id !== 'step-type';
    step.classList.remove('complete');
  });
  $('#complete').hidden = true;
  $('#type-form').reset();
  $('#roots-form').reset();
  $('#standard-x-form').reset();
  $('#factored-x-form').reset();
  $('#standard-y-form').reset();
  $('#vertex-form').reset();
  $('#final-form').reset();
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
}

function checkNumber(input, expected) {
  const actual = parseNumber(input.value);
  const invalid = !Number.isFinite(actual) || Math.abs(actual - expected) > 1e-9;
  mark(input, invalid);
  return !invalid;
}

function showFinalStep() {
  revealStep('#step-final');
}

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
  else if (item().form === 'factored') revealStep('#step-factored-roots');
  else revealStep('#step-vertex');
});

$('#standard-x-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!checkNumber($('#standard-x'), correctVertex().x)) {
    showFeedback('#standard-x-feedback', 'Use x = −b/(2a). Substitute the signed a- and b-values from the function, then simplify.');
    return;
  }
  freezeStep('#step-standard-x', '#standard-x-feedback');
  $('#substitution-work').textContent = vertexSubstitution(item(), correctVertex().x);
  revealStep('#step-standard-y');
});

$('#roots-form').addEventListener('submit', event => {
  event.preventDefault();
  const inputs = [$('#root-one'), $('#root-two')];
  const actual = inputs.map(input => parseNumber(input.value));
  const expected = [item().r1, item().r2];
  const duplicate = actual[0] === actual[1];
  const correct = !duplicate && actual.every(value => expected.includes(value));
  inputs.forEach((input, index) => {
    mark(input, !Number.isFinite(actual[index]) || duplicate || !expected.includes(actual[index]));
  });
  if (!correct) {
    showFeedback('#roots-feedback', 'Set each factor equal to zero. Enter the two different x-intercepts; either order is fine.');
    return;
  }
  freezeStep('#step-factored-roots', '#roots-feedback');
  revealStep('#step-factored-x');
});

$('#factored-x-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!checkNumber($('#factored-x'), correctVertex().x)) {
    showFeedback('#factored-x-feedback', 'Average the two x-intercepts: add them, then divide by 2.');
    return;
  }
  freezeStep('#step-factored-x', '#factored-x-feedback');
  $('#substitution-work').textContent = vertexSubstitution(item(), correctVertex().x);
  revealStep('#step-standard-y');
});

$('#standard-y-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!checkNumber($('#vertex-y'), correctVertex().y)) {
    showFeedback('#vertex-y-feedback', 'Substitute the x-coordinate into the given function and simplify carefully.');
    return;
  }
  freezeStep('#step-standard-y', '#vertex-y-feedback');
  showFinalStep();
});

$('#vertex-form').addEventListener('submit', event => {
  event.preventDefault();
  const correctX = checkNumber($('#vertex-x'), correctVertex().x);
  const correctY = checkNumber($('#vertex-form-y'), correctVertex().y);
  if (!correctX || !correctY) {
    showFeedback('#vertex-feedback', 'In vertex form, f(x) = a(x − h)² + k has vertex (h, k). Read both values from the equation.');
    return;
  }
  freezeStep('#step-vertex', '#vertex-feedback');
  showFinalStep();
});

$('#final-form').addEventListener('submit', event => {
  event.preventDefault();
  const answer = correctVertex();
  const correctY = checkNumber($('#final-y'), answer.y);
  const correctX = checkNumber($('#final-x'), answer.x);
  if (!correctY || !correctX) {
    showFeedback('#final-feedback', 'Use the coordinates you found in the steps above to complete the extrema statement.');
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

all('.q9-work input, .q9-work select').forEach(input => {
  input.addEventListener('input', () => mark(input, false));
  input.addEventListener('change', () => mark(input, false));
});

reset();
