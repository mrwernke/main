import { parseInteger } from '../absolute-value-features/model.mjs';
import { drawPolynomialGraph } from '../polynomial-features/graph.js';
import { problems } from '../polynomial-features/model.mjs?v=20261120b';
import { createPointPicker } from '../polynomial-features/point-picker.js';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';

const picker = document.querySelector('#example-picker');
const graph = document.querySelector('#plane');
const complete = document.querySelector('#complete');
const nextExample = document.querySelector('#next-example');
const pointPicker = createPointPicker(graph, document.querySelector('#root-dialog'));
let problem;

const turningPointCount = ({ extrema }) => extrema.global.length + extrema.local.length;
const turnCount = example => turningPointCount(example)
  + 2 * example.roots.filter(x => example.multiplicities[x] === 3).length;
const signName = sign => sign > 0 ? 'positive' : 'negative';
const steps = [
  {
    id: '#turns-form',
    answers: example => [turnCount(example)],
    hint: 'Count each peak and valley as one turn. For this exercise, count each triple root as two turns.',
  },
  {
    id: '#degree-form',
    answers: example => [example.degree],
    hint: 'The degree must be at least one more than the number of turns and at least the sum of the visible root multiplicities.',
  },
  {
    id: '#single-roots-form',
    allSingle: example => example.roots.every(x => (example.multiplicities[x] ?? 1) === 1),
    hint: 'Look at each x-intercept. A single root crosses the axis without flattening or turning back.',
  },
  {
    id: '#double-roots-form',
    multiplicity: 2,
    label: 'Double',
    hint: 'Look for a point where the graph touches the x-axis and turns back.',
  },
  {
    id: '#triple-roots-form',
    multiplicity: 3,
    label: 'Triple',
    hint: 'Look for a crossing where the graph flattens at the x-axis.',
  },
  {
    id: '#sign-form',
    answers: example => [signName(example.rightEnd)],
    hint: 'Follow the right end. It rises for a positive leading coefficient and falls for a negative one.',
  },
  {
    id: '#ends-form',
    answers: example => [signName(example.leftEnd), signName(example.rightEnd)],
    hint: 'Correct the highlighted end-behavior choice. Follow each arrow separately.',
  },
].map(step => {
  const form = document.querySelector(step.id);
  return {
    ...step,
    form,
    question: form.parentElement,
    fields: [...form.querySelectorAll('input, select')],
    buttons: [...form.querySelectorAll('button')],
    feedback: form.querySelector('.feedback'),
  };
});

function feedback(step, message = '', correct = false) {
  step.feedback.textContent = message;
  step.feedback.className = message ? `feedback ${correct ? 'ok' : 'no'}` : 'feedback';
}

function advance(index, message, next = steps[index + 1]) {
  const step = steps[index];
  step.question.classList.add('done');
  step.fields.forEach(field => { field.disabled = true; });
  step.buttons.forEach(button => { button.hidden = true; });
  feedback(step, message, true);
  if (next) {
    next.question.classList.add('active');
    (next.fields[0] ?? next.buttons[0]).focus();
  } else {
    complete.hidden = false;
    fireConfetti(180);
    nextExample.focus();
  }
}

function rejectChoice(step, button) {
  button.classList.add('invalid');
  button.disabled = true;
  feedback(step, step.hint);
}

function checkRootQuestion(step, index, button) {
  if (!button?.value || pointPicker.active) return;
  const { label, multiplicity, hint } = step;
  const rootType = label.toLowerCase();
  const roots = problem.roots.filter(x => problem.multiplicities[x] === multiplicity);
  if ((button.value === 'yes') !== (roots.length > 0)) {
    rejectChoice(step, button);
  } else if (!roots.length) {
    advance(index, `Correct, there are no ${rootType} roots.`);
  } else {
    step.buttons.forEach(choice => { choice.hidden = true; });
    feedback(step, `Select the ${rootType} roots on the graph.`, true);
    pointPicker.start({
      title: `Find the ${rootType} roots`,
      targets: roots.map(x => ({ x, y: 0, label, labelOffset: -15 })),
      wrongMessage: hint,
      onComplete: () => advance(index, roots.length === 1 ? `${label} root marked.` : `${label} roots marked.`),
    });
  }
}

steps.forEach((step, index) => {
  const { form, question, fields, answers, hint } = step;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!question.classList.contains('active') || question.classList.contains('done')) return;

    if (step.allSingle) {
      const button = event.submitter;
      if (!button?.value) return;
      const allSingle = step.allSingle(problem);
      if ((button.value === 'yes') !== allSingle) {
        rejectChoice(step, button);
      } else if (allSingle) {
        const signStep = steps.find(candidate => candidate.id === '#sign-form');
        advance(index, 'Correct, all the roots shown are single.', signStep);
      } else {
        advance(index, 'Correct, at least one root is repeated.');
      }
      return;
    }
    if (step.multiplicity) {
      checkRootQuestion(step, index, event.submitter);
      return;
    }
    const expected = answers(problem);
    const correct = fields.map((field, position) => {
      const value = field instanceof HTMLInputElement ? parseInteger(field.value) : field.value;
      const matches = value === expected[position];
      field.classList.toggle('invalid', !matches);
      field.setAttribute('aria-invalid', String(!matches));
      return matches;
    });
    if (correct.every(Boolean)) advance(index);
    else feedback(step, hint);
  });
});

function render() {
  problem = problems[picker.selectedIndex];
  drawPolynomialGraph(graph, problem);
  pointPicker.reset();
  const directions = Array.from({ length: turningPointCount(problem) + 1 }, (_, index) =>
    (index % 2 === 0 ? -problem.leftEnd : problem.leftEnd) > 0 ? 'rises' : 'falls');
  const crossings = problem.roots.map(x => {
    const behavior = {
      2: 'touches the x-axis and turns back',
      3: 'flattens as it crosses the x-axis',
    }[problem.multiplicities[x]] ?? 'crosses the x-axis';
    return ` At x = ${x}, it ${behavior}.`;
  });
  graph.querySelector('desc').append(` From left to right, the curve ${directions.join(', then ')}.`, ...crossings);

  clearConfetti();
  complete.hidden = true;
  steps.forEach((step, index) => {
    const { form, question, fields, buttons } = step;
    form.reset();
    question.classList.toggle('active', index === 0);
    question.classList.remove('done');
    fields.forEach(field => {
      field.disabled = false;
      field.classList.remove('invalid');
      field.removeAttribute('aria-invalid');
    });
    buttons.forEach(button => {
      button.hidden = false;
      button.disabled = false;
      button.classList.remove('invalid');
    });
    feedback(step);
  });
}

problems.forEach((_, index) => picker.add(new Option(String(index + 1), index)));
picker.addEventListener('change', render);
nextExample.addEventListener('click', () => {
  picker.selectedIndex = (picker.selectedIndex + 1) % problems.length;
  render();
  steps[0].fields[0].focus();
});
render();
