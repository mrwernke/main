import {
  families, parentName, equationText, transformations,
  dilationFactor, horizontalShift, verticalShift, parseInteger,
} from './model.mjs';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';

const $ = selector => document.querySelector(selector);
const dataFamily = document.body.dataset.family;
const family = dataFamily === 'absolute' || dataFamily === 'quadratic' ? dataFamily : 'generic';
const bank = families[family];
let index = 0;
const current = () => bank[index];

function feedback(id, text, good = false) {
  const element = $(id);
  element.textContent = text;
  element.className = `feedback ${text ? (good ? 'ok' : 'no') : ''}`;
}

function markInput(input, good) {
  input.classList.toggle('invalid', !good);
  input.setAttribute('aria-invalid', String(!good));
}

function detailLine(...children) {
  const line = document.createElement('div');
  line.className = 'detail-line';
  line.append(...children);
  return line;
}

function span(text, className = '') {
  const node = document.createElement('span');
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function numberInput(id, label) {
  const input = document.createElement('input');
  input.className = 'coord';
  input.id = id;
  input.setAttribute('inputmode', 'numeric');
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('aria-label', label);
  return input;
}

function directionSelect(id, label, options) {
  const select = document.createElement('select');
  select.id = id;
  select.setAttribute('aria-label', label);
  select.append(new Option('?', ''), ...options.map(option => new Option(option, option)));
  return select;
}

function buildDetails() {
  const active = transformations(current());
  const wrap = $('#detail-lines');
  wrap.replaceChildren();
  if (active.reflectV) wrap.append(detailLine(span('Reflect Vertically', 'static-line')));
  if (active.dilateV) {
    wrap.append(detailLine(span('Dilate vertically by'), numberInput('dilate-value', 'Vertical dilation factor')));
  }
  if (active.shiftH || active.shiftV) {
    const parts = [span('Shift')];
    if (active.shiftH) {
      parts.push(directionSelect('h-direction', 'Horizontal shift direction', ['right', 'left']), numberInput('h-amount', 'Horizontal shift amount'));
    }
    if (active.shiftH && active.shiftV) parts.push(span('and'));
    if (active.shiftV) {
      parts.push(directionSelect('v-direction', 'Vertical shift direction', ['up', 'down']), numberInput('v-amount', 'Vertical shift amount'));
    }
    wrap.append(detailLine(...parts));
  }
}

function render() {
  clearConfetti();
  $('#example-picker').value = String(index);
  $('#parent').textContent = parentName(family);
  $('#equation').textContent = equationText(family, current());
  $('#choose-step').hidden = false;
  $('#choose-step').querySelector('button').hidden = false;
  document.querySelectorAll('#choose-step input[type="checkbox"]').forEach(box => {
    box.checked = false;
    box.disabled = false;
  });
  feedback('#choose-feedback', '');
  $('#detail-step').hidden = true;
  $('#detail-step').querySelector('button').hidden = false;
  feedback('#detail-feedback', '');
  $('#complete').hidden = true;
}

$('#choose-step').onsubmit = event => {
  event.preventDefault();
  const expected = transformations(current());
  const boxes = [...document.querySelectorAll('#choose-step input[type="checkbox"]')];
  const ok = boxes.every(box => box.checked === Boolean(expected[box.value]));
  if (!ok) {
    feedback('#choose-feedback', 'Not quite. Compare the equation to the parent function and adjust your choices.');
    return;
  }
  boxes.forEach(box => { box.disabled = true; });
  $('#choose-step').querySelector('button').hidden = true;
  feedback('#choose-feedback', '');
  buildDetails();
  $('#detail-step').hidden = false;
};

$('#detail-step').onsubmit = event => {
  event.preventDefault();
  const fn = current();
  const active = transformations(fn);
  let ok = true;
  if (active.dilateV) {
    const good = parseInteger($('#dilate-value').value) === dilationFactor(fn);
    markInput($('#dilate-value'), good);
    ok = ok && good;
  }
  if (active.shiftH) {
    const horizontal = horizontalShift(fn);
    const hDirOk = $('#h-direction').value === horizontal.direction;
    const hAmtOk = parseInteger($('#h-amount').value) === horizontal.amount;
    $('#h-direction').classList.toggle('invalid', !hDirOk);
    markInput($('#h-amount'), hAmtOk);
    ok = ok && hDirOk && hAmtOk;
  }
  if (active.shiftV) {
    const vertical = verticalShift(fn);
    const vDirOk = $('#v-direction').value === vertical.direction;
    const vAmtOk = parseInteger($('#v-amount').value) === vertical.amount;
    $('#v-direction').classList.toggle('invalid', !vDirOk);
    markInput($('#v-amount'), vAmtOk);
    ok = ok && vDirOk && vAmtOk;
  }
  if (!ok) {
    feedback('#detail-feedback', 'Correct the highlighted parts. Shift amounts and dilation factors are positive numbers.');
    return;
  }
  $('#detail-step').querySelectorAll('input, select').forEach(control => { control.disabled = true; });
  $('#detail-step').querySelector('button').hidden = true;
  feedback('#detail-feedback', '');
  fireConfetti(180);
  $('#complete').hidden = false;
};

$('#example-picker').replaceChildren(
  ...bank.map((fn, position) => new Option(`${position + 1}. ${equationText(family, fn)}`, String(position))),
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
