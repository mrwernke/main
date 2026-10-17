import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';
import { problems, functionText, answerCounts } from './model.mjs';

const $ = selector => document.querySelector(selector);
const svgNS = 'http://www.w3.org/2000/svg';
const plot = { left: 50, top: 20, width: 180, height: 360 };
let index = 0;

function svgElement(name, attributes = {}, content = '') {
  const element = document.createElementNS(svgNS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  if (content) element.textContent = content;
  return element;
}

function xToSvg(x) {
  return plot.left + ((x + 5) / 10) * plot.width;
}

function yToSvg(y) {
  return plot.top + ((10 - y) / 20) * plot.height;
}

function drawGraph(problem) {
  const graph = $('#graph');
  graph.replaceChildren();
  graph.setAttribute('aria-label', `Graph of ${functionText(problem)} with x-values from negative 5 to 5 and y-values from negative 10 to 10`);
  const defs = svgElement('defs');
  const clip = svgElement('clipPath', { id: 'q11-plot-clip' });
  clip.append(svgElement('rect', { x: plot.left, y: plot.top, width: plot.width, height: plot.height }));
  defs.append(clip);
  graph.append(defs);

  for (let x = -5; x <= 5; x += 1) {
    const xpos = xToSvg(x);
    graph.append(svgElement('line', { x1: xpos, y1: plot.top, x2: xpos, y2: plot.top + plot.height, class: 'q11-grid' }));
  }
  for (let y = -10; y <= 10; y += 1) {
    const ypos = yToSvg(y);
    graph.append(svgElement('line', { x1: plot.left, y1: ypos, x2: plot.left + plot.width, y2: ypos, class: 'q11-grid' }));
  }

  const xAxisY = yToSvg(0);
  const yAxisX = xToSvg(0);
  graph.append(svgElement('line', { x1: plot.left, y1: xAxisY, x2: plot.left + plot.width, y2: xAxisY, class: 'q11-axis' }));
  graph.append(svgElement('line', { x1: yAxisX, y1: plot.top, x2: yAxisX, y2: plot.top + plot.height, class: 'q11-axis' }));

  for (let x = -5; x <= 5; x += 1) {
    const xpos = xToSvg(x);
    graph.append(svgElement('line', { x1: xpos, y1: xAxisY - 3, x2: xpos, y2: xAxisY + 3, class: 'q11-tick' }));
    graph.append(svgElement('text', { x: xpos, y: xAxisY + 17, 'text-anchor': 'middle', class: 'q11-tick-label' }, String(x)));
  }
  for (let y = -10; y <= 10; y += 2) {
    const ypos = yToSvg(y);
    graph.append(svgElement('line', { x1: yAxisX - 3, y1: ypos, x2: yAxisX + 3, y2: ypos, class: 'q11-tick' }));
    graph.append(svgElement('text', { x: yAxisX - 6, y: ypos + 3, 'text-anchor': 'end', class: 'q11-tick-label' }, String(y)));
  }

  const { a, h, k } = problem;
  let path = '';
  for (let i = 0; i <= 400; i += 1) {
    const x = -5 + (i / 400) * 10;
    const y = a * (x - h) ** 2 + k;
    path += `${i === 0 ? 'M' : 'L'} ${xToSvg(x).toFixed(2)} ${yToSvg(y).toFixed(2)} `;
  }
  graph.append(svgElement('path', { d: path, class: 'q11-curve', 'clip-path': 'url(#q11-plot-clip)' }));
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

function buildPicker() {
  const guided = document.createElement('optgroup');
  guided.label = 'Guided Examples';
  const independent = document.createElement('optgroup');
  independent.label = 'Try on Your Own';
  let guidedNumber = 0;
  let independentNumber = 0;
  problems.forEach((problem, problemIndex) => {
    const isGuided = problem.kind === 'guided';
    const sectionNumber = isGuided ? ++guidedNumber : ++independentNumber;
    const option = new Option(`Example ${sectionNumber}: ${functionText(problem)}`, String(problemIndex));
    (isGuided ? guided : independent).append(option);
  });
  $('#problem-picker').replaceChildren(guided, independent);
  $('#problem-picker').value = String(index);
}

function reset() {
  clearConfetti();
  buildPicker();
  const problem = problems[index];
  const guided = problem.kind === 'guided';
  const sectionNumber = problems.slice(0, index + 1).filter(entry => entry.kind === problem.kind).length;
  const totalInSection = problems.filter(entry => entry.kind === problem.kind).length;

  $('#progress').textContent = `${guided ? 'Guided Example' : 'Try on Your Own'} ${sectionNumber} of ${totalInSection}`;
  $('#equation').textContent = functionText(problem);
  drawGraph(problem);
  $('#guided-work').hidden = !guided;
  $('#independent-work').hidden = guided;
  $('#solutions-step').hidden = true;
  $('#complete').hidden = true;

  document.querySelectorAll('.q11-work select').forEach(field => {
    field.value = '';
    field.disabled = false;
    field.classList.remove('invalid');
    field.setAttribute('aria-invalid', 'false');
  });
  document.querySelectorAll('.q11-work button[type="submit"]').forEach(button => { button.hidden = false; });
  showFeedback('#intercepts-feedback', '');
  showFeedback('#solutions-feedback', '');
  showFeedback('#independent-feedback', '');
}

function complete(result) {
  $('#complete-text').textContent = `This graph shows ${result} solution${result === '1 real' ? '' : 's'}.`;
  $('#complete').hidden = false;
  fireConfetti(180);
}

$('#intercepts-form').addEventListener('submit', event => {
  event.preventDefault();
  const field = $('#intercepts-select');
  const expected = String(answerCounts(problems[index]).intercepts);
  const correct = field.value === expected;
  mark(field, correct);
  if (!correct) {
    showFeedback('#intercepts-feedback', 'Count the points where the curve meets the x-axis. A vertex on the axis counts once.');
    return;
  }
  field.disabled = true;
  event.currentTarget.querySelector('button[type="submit"]').hidden = true;
  showFeedback('#intercepts-feedback', expected === '1' ? 'Correct. The graph touches the x-axis at its vertex.' : 'Correct.', true);
  $('#solutions-step').hidden = false;
  $('#real-select').focus();
});

$('#solutions-form').addEventListener('submit', event => {
  event.preventDefault();
  const counts = answerCounts(problems[index]);
  const realField = $('#real-select');
  const complexField = $('#complex-select');
  const realCorrect = realField.value === String(counts.real);
  const complexCorrect = complexField.value === String(counts.complex);
  mark(realField, realCorrect);
  mark(complexField, complexCorrect);
  if (!realCorrect || !complexCorrect) {
    showFeedback('#solutions-feedback', 'The x-intercepts show the real solutions. Choose the matching number of complex solutions too.');
    return;
  }
  realField.disabled = true;
  complexField.disabled = true;
  event.currentTarget.querySelector('button[type="submit"]').hidden = true;
  showFeedback('#solutions-feedback', 'Correct.', true);
  complete(counts.result);
});

$('#independent-form').addEventListener('submit', event => {
  event.preventDefault();
  const field = $('#result-select');
  const expected = answerCounts(problems[index]).result;
  const correct = field.value === expected;
  mark(field, correct);
  if (!correct) {
    showFeedback('#independent-feedback', 'Use the graph to decide whether it has two real solutions, one real solution, or two complex solutions.');
    return;
  }
  field.disabled = true;
  event.currentTarget.querySelector('button[type="submit"]').hidden = true;
  showFeedback('#independent-feedback', 'Correct.', true);
  complete(expected);
});

$('#problem-picker').addEventListener('change', () => {
  index = Number($('#problem-picker').value);
  reset();
});
$('#reset').addEventListener('click', reset);
$('#next-problem').addEventListener('click', () => {
  index = (index + 1) % problems.length;
  reset();
});

reset();
