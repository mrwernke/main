import {
  families, evaluate, xIntercepts, yIntercept, rangeSymbol, extremumType, parseInteger,
} from './model.mjs';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';

const $ = selector => document.querySelector(selector);
const family = document.body.dataset.family === 'quadratic' ? 'quadratic' : 'absolute';
const bank = families[family];
let index = 0;
const current = () => bank[index];
const done = new Set();
const ORDER = ['domain', 'range', 'symmetry', 'vertex', 'extremum', 'xints', 'yint', 'ends'];
const TOTAL = ORDER.length;

const SIZE = 520, HALF = SIZE / 2, UNITS = 10, SCALE = (SIZE - 40) / (2 * UNITS);
const sx = x => HALF + x * SCALE;
const sy = y => HALF - y * SCALE;
const NS = 'http://www.w3.org/2000/svg';

function el(name, attrs) {
  const node = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function feedback(id, text, good = false) {
  const element = $(id);
  element.textContent = text;
  element.className = `feedback ${text ? (good ? 'ok' : 'no') : ''}`;
}

function markInput(input, good) {
  input.classList.toggle('invalid', !good);
  input.setAttribute('aria-invalid', String(!good));
}

function drawGraph() {
  const svg = $('#plane');
  svg.replaceChildren();
  let gridD = '';
  for (let i = -UNITS; i <= UNITS; i++) {
    gridD += `M ${sx(i)} ${sy(-UNITS)} L ${sx(i)} ${sy(UNITS)} M ${sx(-UNITS)} ${sy(i)} L ${sx(UNITS)} ${sy(i)} `;
  }
  svg.append(el('path', { d: gridD, class: 'grid' }));
  svg.append(el('path', {
    d: `M ${sx(-UNITS)} ${sy(0)} L ${sx(UNITS)} ${sy(0)} M ${sx(0)} ${sy(-UNITS)} L ${sx(0)} ${sy(UNITS)}`,
    class: 'axes',
  }));
  for (let i = -UNITS; i <= UNITS; i += 2) {
    if (i === 0) continue;
    const xLabel = el('text', { x: sx(i), y: sy(0) + 16, 'text-anchor': 'middle', class: 'tick' });
    xLabel.textContent = i;
    const yLabel = el('text', { x: sx(0) - 7, y: sy(i) + 4, 'text-anchor': 'end', class: 'tick' });
    yLabel.textContent = i;
    svg.append(xLabel, yLabel);
  }
  const points = [];
  for (let x = -10.3; x <= 10.3; x += 0.05) {
    const y = evaluate(family, current(), x);
    if (y >= -10.4 && y <= 10.4) points.push(`${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
  }
  svg.append(el('polyline', { points: points.join(' '), class: 'curve' }));
}

function markDone(name, message = '') {
  const block = $(`#q-${name}`);
  block.classList.add('done');
  block.querySelectorAll('input, select').forEach(control => { control.disabled = true; });
  block.querySelectorAll('button[type="submit"]').forEach(button => { button.hidden = true; });
  feedback(`#${name}-feedback`, message, true);
  done.add(name);
  const next = ORDER[ORDER.indexOf(name) + 1];
  if (next) $(`#q-${next}`).classList.add('active');
  if (done.size === TOTAL) {
    fireConfetti(180);
    $('#complete').hidden = false;
  }
}

function resetQuestions() {
  done.clear();
  document.querySelectorAll('.fq').forEach(block => {
    block.classList.remove('done', 'active');
    block.querySelectorAll('input').forEach(input => {
      input.disabled = false;
      input.value = '';
      input.classList.remove('invalid');
      input.setAttribute('aria-invalid', 'false');
    });
    block.querySelectorAll('select').forEach(select => {
      select.disabled = false;
      select.value = '';
      select.classList.remove('invalid');
    });
    block.querySelectorAll('button').forEach(button => {
      button.disabled = false;
      button.hidden = false;
      button.classList.remove('invalid', 'correct');
    });
    block.querySelectorAll('.feedback').forEach(element => {
      element.textContent = '';
      element.className = 'feedback';
    });
  });
  $('#q-domain').classList.add('active');
  const count = xIntercepts(family, current()).length;
  $('#xint-pair').hidden = count !== 2;
  $('#xint-count-row').hidden = count === 2;
  $('#xint-single').hidden = true;
  $('#complete').hidden = true;
}

function render() {
  clearConfetti();
  $('#example-picker').value = String(index);
  drawGraph();
  resetQuestions();
}

$('#domain-true').onclick = () => {
  $('#domain-false').hidden = true;
  $('#domain-true').hidden = true;
  markDone('domain');
};
$('#domain-false').onclick = () => {
  $('#domain-false').disabled = true;
  $('#domain-false').classList.add('invalid');
  feedback('#domain-feedback', 'Not quite. Every x-value has an output, so the domain is all real numbers.');
};

$('#range-form').onsubmit = event => {
  event.preventDefault();
  const symbolOk = $('#range-symbol').value === rangeSymbol(current());
  const value = parseInteger($('#range-value').value);
  const valueOk = value === current().k;
  $('#range-symbol').classList.toggle('invalid', !symbolOk);
  markInput($('#range-value'), valueOk);
  if (symbolOk && valueOk) markDone('range');
  else feedback('#range-feedback', 'Not quite. The range starts at the vertex and follows the opening direction.');
};

$('#symmetry-form').onsubmit = event => {
  event.preventDefault();
  const value = parseInteger($('#symmetry-value').value);
  const ok = value === current().h;
  markInput($('#symmetry-value'), ok);
  if (ok) markDone('symmetry');
  else feedback('#symmetry-feedback', 'Not quite. The line of symmetry passes through the vertex.');
};

$('#vertex-form').onsubmit = event => {
  event.preventDefault();
  const x = parseInteger($('#vertex-x').value);
  const y = parseInteger($('#vertex-y').value);
  const xOk = x === current().h, yOk = y === current().k;
  markInput($('#vertex-x'), xOk);
  markInput($('#vertex-y'), yOk);
  if (xOk && yOk) markDone('vertex');
  else feedback('#vertex-feedback', 'Not quite. Read the turning point from the graph.');
};

$('#extremum-form').onsubmit = event => {
  event.preventDefault();
  const typeOk = $('#extremum-type').value === extremumType(current());
  const y = parseInteger($('#extremum-y').value);
  const x = parseInteger($('#extremum-x').value);
  const yOk = y === current().k, xOk = x === current().h;
  $('#extremum-type').classList.toggle('invalid', !typeOk);
  markInput($('#extremum-y'), yOk);
  markInput($('#extremum-x'), xOk);
  if (typeOk && yOk && xOk) markDone('extremum');
  else feedback('#extremum-feedback', 'Not quite. The extreme value happens at the vertex.');
};

$('#xint-pair').onsubmit = event => {
  event.preventDefault();
  const intercepts = xIntercepts(family, current());
  const first = parseInteger($('#xint-first').value);
  const second = parseInteger($('#xint-second').value);
  const ok = first !== null && second !== null && first !== second
    && intercepts.includes(first) && intercepts.includes(second);
  markInput($('#xint-first'), ok);
  markInput($('#xint-second'), ok);
  if (ok) markDone('xints');
  else feedback('#xints-feedback', 'Not quite. Find both points where the graph crosses the x-axis.');
};

$('#xint-count-row').onsubmit = event => {
  event.preventDefault();
  const intercepts = xIntercepts(family, current());
  const count = parseInteger($('#xint-count').value);
  const ok = count === intercepts.length;
  markInput($('#xint-count'), ok);
  if (!ok) {
    feedback('#xints-feedback', 'Not quite. Count how many times the graph touches or crosses the x-axis.');
    return;
  }
  if (intercepts.length === 0) {
    markDone('xints', 'Correct, there are none.');
  } else {
    $('#xint-count').disabled = true;
    $('#xint-count-row').querySelector('button').hidden = true;
    feedback('#xints-feedback', 'Correct. There is exactly one — enter it below.', true);
    $('#xint-single').hidden = false;
    $('#xint-only').focus();
  }
};

$('#xint-single').onsubmit = event => {
  event.preventDefault();
  const [intercept] = xIntercepts(family, current());
  const value = parseInteger($('#xint-only').value);
  const ok = value === intercept;
  markInput($('#xint-only'), ok);
  if (ok) markDone('xints');
  else feedback('#xints-feedback', 'Not quite. The vertex sits right on the x-axis.');
};

$('#yint-form').onsubmit = event => {
  event.preventDefault();
  const value = parseInteger($('#yint-value').value);
  const ok = value === yIntercept(family, current());
  markInput($('#yint-value'), ok);
  if (ok) markDone('yint');
  else feedback('#yint-feedback', 'Not quite. Find where the graph crosses the y-axis.');
};

$('#ends-form').onsubmit = event => {
  event.preventDefault();
  const expected = current().a > 0 ? 'positive' : 'negative';
  const selects = [$('#left-end'), $('#right-end')];
  selects.forEach(select => select.classList.toggle('invalid', select.value !== expected));
  if (selects.every(select => select.value === expected)) markDone('ends');
  else feedback('#ends-feedback', 'Correct the highlighted end-behavior choice. Both ends follow the opening direction.');
};

$('#example-picker').replaceChildren(
  ...bank.map((unused, position) => new Option(`${position + 1}`, String(position))),
);
$('#example-picker').onchange = () => {
  index = Number($('#example-picker').value);
  render();
};
$('#next-example').onclick = () => {
  index = (index + 1) % bank.length;
  render();
};

render();
