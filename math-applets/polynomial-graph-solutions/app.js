import { parseInteger } from '../absolute-value-features/model.mjs';
import { drawPolynomialGraph } from '../polynomial-features/graph.js';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';
import { problems } from './model.mjs';

const picker = document.querySelector('#example-picker');
const plane = document.querySelector('#plane');
const complete = document.querySelector('#complete');
const nextExample = document.querySelector('#next-example');
let problem;

const steps = [
  ['#turns-form', p => p.turningXs.length, 'Count the peaks and valleys where the graph changes direction.'],
  ['#degree-form', p => p.degree, 'A degree n polynomial has at most n − 1 turns. Find the least degree that allows this many.'],
  ['#real-zeros-form', p => p.roots.length, 'Count the points where the curve crosses the x-axis. Each crossing counts once.'],
  ['#complex-zeros-form', p => p.nonrealZeros, 'Subtract the number of real zeros from the degree.'],
].map(([selector, answer, hint]) => {
  const form = document.querySelector(selector);
  return {
    form,
    question: form.parentElement,
    input: form.querySelector('input'),
    button: form.querySelector('button'),
    feedback: form.querySelector('.feedback'),
    answer,
    hint,
  };
});

steps.forEach(({ form, question, input, button, feedback, answer, hint }, index) => {
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!question.classList.contains('active') || question.classList.contains('done')) return;

    const correct = parseInteger(input.value) === answer(problem);
    input.classList.toggle('invalid', !correct);
    input.setAttribute('aria-invalid', String(!correct));
    feedback.textContent = correct ? '' : hint;
    feedback.className = correct ? 'feedback' : 'feedback no';
    if (!correct) return;

    question.classList.add('done');
    input.disabled = true;
    button.hidden = true;
    const next = steps[index + 1];
    if (next) {
      next.question.classList.add('active');
      next.input.focus();
    } else {
      complete.hidden = false;
      fireConfetti(180);
      nextExample.focus();
    }
  });
});

function render() {
  problem = problems[picker.selectedIndex];
  drawPolynomialGraph(plane, problem);
  const coordinates = values => values.map(x => Math.round(x * 100) / 100).join(', ');
  plane.querySelector('desc').append(
    ` The curve turns near x = ${coordinates(problem.turningXs)}.`,
    ` It crosses the x-axis near x = ${coordinates(problem.roots)}.`,
  );
  clearConfetti();
  complete.hidden = true;
  steps.forEach(({ form, question, input, button, feedback }, index) => {
    form.reset();
    question.classList.toggle('active', index === 0);
    question.classList.remove('done');
    input.disabled = false;
    input.classList.remove('invalid');
    input.removeAttribute('aria-invalid');
    button.hidden = false;
    feedback.textContent = '';
    feedback.className = 'feedback';
  });
}

problems.forEach((_, index) => picker.add(new Option(String(index + 1), index)));
picker.addEventListener('change', render);
nextExample.addEventListener('click', () => {
  picker.selectedIndex = (picker.selectedIndex + 1) % problems.length;
  render();
  steps[0].input.focus();
});
render();
