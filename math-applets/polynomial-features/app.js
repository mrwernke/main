import { parseNumber } from '../quadratic-graphing/model.mjs';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';
import { drawPolynomialGraph } from './graph.js';
import { problems } from './model.mjs?v=20261120b';
import { createPointPicker } from './point-picker.js';

const picker = document.querySelector('#example-picker');
const plane = document.querySelector('#plane');
const complete = document.querySelector('#complete');
const zeroInputs = document.querySelector('#zero-inputs');
const pointPicker = createPointPicker(plane, document.querySelector('#extremum-dialog'));
const forms = [...document.querySelectorAll('.feature-questions form')];
const [domain, range, count, zeros, globalExtrema, localExtrema] = forms;
const rangeStatement = document.querySelector('#range-statement');
const rangeInequality = document.querySelector('#range-inequality');
const rangeSymbol = document.querySelector('#range-symbol');
const rangeValue = document.querySelector('#range-value');
let problem;

function revealZeros(total) {
  zeroInputs.replaceChildren(...Array.from({ length: total }, (_, index) => {
    const input = document.createElement('input');
    input.className = 'coord';
    input.inputMode = 'text';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', `Zero ${index + 1}`);
    return input;
  }));
}

function feedback(form, message, correct = false) {
  const status = form.querySelector('.feedback');
  status.textContent = message;
  status.className = message ? `feedback ${correct ? 'ok' : 'no'}` : 'feedback';
}

function markControl(control, correct) {
  control.classList.toggle('invalid', !correct);
  control.setAttribute('aria-invalid', String(!correct));
  return correct;
}

function advance(form, message = '') {
  feedback(form, message, true);
  form.parentElement.classList.add('done');
  form.querySelectorAll('input, select').forEach(control => { control.disabled = true; });
  form.querySelectorAll('button').forEach(button => { button.hidden = true; });
  const next = forms[forms.indexOf(form) + 1];
  if (next) {
    next.parentElement.classList.add('active');
    next.querySelector('input, select, button').focus();
  } else {
    complete.hidden = false;
    fireConfetti(180);
    document.querySelector('#next-example').focus();
  }
}

function pickExtrema(form, scope) {
  form.querySelectorAll('button').forEach(button => { button.hidden = true; });
  pointPicker.start({
    title: scope === 'global' ? 'Find the global extrema' : 'Find the remaining local extrema',
    targets: problem.extrema[scope].map(point => ({
      ...point,
      label: `${scope === 'global' ? 'Global' : 'Local'} ${point.kind}`,
      labelOffset: point.kind === 'Max' ? -15 : 19,
    })),
    wrongMessage: 'Select an unmarked turning point that matches this question.',
    onComplete: () => advance(form),
  });
}

function onSubmit(form, handle) {
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (form.parentElement.classList.contains('active')
      && !form.parentElement.classList.contains('done')) handle(event.submitter);
  });
}

function rejectChoice(form, button, hint) {
  button.classList.add('invalid');
  button.disabled = true;
  feedback(form, hint);
}

onSubmit(domain, button => {
  if (button?.value === 'true') advance(domain);
  else if (button?.value === 'false') {
    rejectChoice(domain, button, 'Every x-value has an output, so the domain is all real numbers.');
  }
});

onSubmit(range, button => {
  const answer = problem.range;
  if (!rangeStatement.hidden) {
    if (!button?.value) return;
    if ((button.value === 'true') !== (answer === null)) {
      rejectChoice(range, button, 'Use both arrows to decide which y-values the graph reaches.');
    } else if (!answer) {
      advance(range);
    } else {
      rangeStatement.hidden = true;
      rangeInequality.hidden = false;
      feedback(range, '');
      rangeSymbol.focus();
    }
    return;
  }

  const symbolOk = markControl(rangeSymbol, rangeSymbol.value === answer.symbol);
  const valueOk = markControl(rangeValue, parseNumber(rangeValue.value) === answer.boundary);
  if (symbolOk && valueOk) advance(range);
  else feedback(range, 'Start at the global maximum or minimum and follow the direction of the ends.');
});

onSubmit(count, () => {
  const input = count.querySelector('input');
  const total = parseNumber(input.value);
  if (markControl(input, total === problem.roots.length)) {
    revealZeros(total);
    advance(count);
  } else {
    feedback(count, 'Count each place where the graph touches or crosses the x-axis.');
  }
});

onSubmit(zeros, () => {
  const inputs = [...zeroInputs.children];
  const values = inputs.map(input => parseNumber(input.value));
  const correct = inputs.map((input, index) => {
    const value = values[index];
    return markControl(input, problem.roots.includes(value) && values.indexOf(value) === values.lastIndexOf(value));
  });
  if (correct.every(Boolean)) advance(zeros);
  else feedback(zeros, 'Enter the x-coordinate of each distinct point on the x-axis.');
});

for (const [scope, form] of [['global', globalExtrema], ['local', localExtrema]]) {
  onSubmit(form, button => {
    if (!button?.value || pointPicker.active) return;
    const exists = problem.extrema[scope].length > 0;
    if ((button.value === 'yes') !== exists) {
      const hint = scope === 'global'
        ? 'Look at both ends to see if the graph reaches an overall highest or lowest point.'
        : 'Look for peaks and valleys beyond those already labeled.';
      rejectChoice(form, button, hint);
    } else if (exists) {
      feedback(form, 'Select all matching points on the graph.', true);
      pickExtrema(form, scope);
    } else {
      advance(form, 'Correct, there are none.');
    }
  });
}

function resetExample() {
  const index = Number(picker.value);
  problem = problems[index];
  clearConfetti();
  complete.hidden = true;
  zeroInputs.replaceChildren();
  rangeStatement.hidden = false;
  rangeInequality.hidden = true;
  forms.forEach((form, position) => {
    form.reset();
    form.parentElement.classList.remove('done');
    form.parentElement.classList.toggle('active', position === 0);
    form.querySelectorAll('input, select, button').forEach(control => {
      control.disabled = false;
      control.hidden = false;
      control.classList.remove('invalid');
      control.removeAttribute('aria-invalid');
    });
    feedback(form, '');
  });
  drawPolynomialGraph(plane, problem);
  pointPicker.reset();
}

problems.forEach((_, index) => picker.add(new Option(String(index + 1), index)));
picker.addEventListener('change', resetExample);
document.querySelector('#next-example').addEventListener('click', () => {
  picker.selectedIndex = (picker.selectedIndex + 1) % problems.length;
  resetExample();
  domain.querySelector('button').focus();
});
resetExample();
