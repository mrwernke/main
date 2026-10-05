import { roots, parseNumber, graphBounds, parabolaGeometry, equationText } from '../quadratic-graphing/model.mjs';
import { exercises, markedPoints, aValueMovement, factorProduct, expansion, parseLinearTerm, signedConstant } from './model.mjs';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';

const $ = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
let index = 0, factorRoots, currentStage = 1, showAHint = false;
const item = () => exercises[index];
const number = id => parseNumber($(id).value);

function mark(id, correct) {
  $(id).classList.toggle('invalid', !correct);
  $(id).setAttribute('aria-invalid', String(!correct));
}

function feedback(id, text, good = false) {
  $(id).textContent = text;
  $(id).className = `feedback ${good ? 'ok' : 'no'}`;
}

function check(entries) {
  entries.forEach(([id, expected]) => mark(id, number(id) === expected));
  return entries.every(([id]) => !$(id).classList.contains('invalid'));
}

function checkRootPair(first, second) {
  const expected = roots(item()), values = [number(first), number(second)];
  const distinct = values[0] !== values[1];
  [first, second].forEach((id, i) => mark(id, distinct && expected.includes(values[i])));
  return distinct && values.every(value => expected.includes(value));
}

function updateAHint(id) {
  showAHint = number(id) !== item().a;
  drawGraph();
}

function advance(stage, feedbackId, message) {
  const section = $(`#stage-${stage}`);
  section.querySelectorAll('input').forEach(input => { input.readOnly = true; });
  section.querySelectorAll('button').forEach(button => { button.disabled = true; });
  feedback(feedbackId, message, true);
  currentStage = stage + 1;
  if (stage === 7) {
    $('#complete').hidden = false;
    fireConfetti(180);
  }
  else $(`#stage-${currentStage}`).hidden = false;
}

function drawGraph() {
  const points = markedPoints(item()), bounds = graphBounds(item(), points);
  const W = 640, pad = 48, scale = (W - 2 * pad) / (bounds.xMax - bounds.xMin);
  const sx = x => pad + (x - bounds.xMin) * scale;
  const sy = y => W - pad - (y - bounds.yMin) * scale;
  let grid = '';
  const labelStep = bounds.xMax - bounds.xMin <= 24 ? 1 : 2;
  for (let x = bounds.xMin; x <= bounds.xMax; x++) {
    grid += `<line x1="${sx(x)}" x2="${sx(x)}" y1="${sy(bounds.yMin)}" y2="${sy(bounds.yMax)}" stroke="#c8d2de"/>`;
    if (x && x % labelStep === 0) grid += `<text class="tick" x="${sx(x)}" y="${sy(0) + 18}" text-anchor="middle">${x}</text>`;
  }
  for (let y = bounds.yMin; y <= bounds.yMax; y++) {
    grid += `<line x1="${sx(bounds.xMin)}" x2="${sx(bounds.xMax)}" y1="${sy(y)}" y2="${sy(y)}" stroke="#c8d2de"/>`;
    if (y && y % labelStep === 0) grid += `<text class="tick" x="${sx(0) - 9}" y="${sy(y) + 4}" text-anchor="end">${y}</text>`;
  }
  grid += `<path d="M ${sx(bounds.xMin)} ${sy(0)} H ${sx(bounds.xMax)} M ${sx(0)} ${sy(bounds.yMin)} V ${sy(bounds.yMax)}" stroke="#15213a" stroke-width="2"/>
    <text class="tick" x="${sx(bounds.xMax) + 12}" y="${sy(0) + 4}">x</text>
    <text class="tick" x="${sx(0) + 8}" y="${sy(bounds.yMax) - 12}">y</text>`;
  $('#grid').innerHTML = grid;
  const { start, control, end } = parabolaGeometry(item(), bounds);
  $('#curve').setAttribute('d', `M ${sx(start.x)} ${sy(start.y)} Q ${sx(control.x)} ${sy(control.y)} ${sx(end.x)} ${sy(end.y)}`);
  $('#marked-points').innerHTML = points.map(point => `<circle cx="${sx(point.x)}" cy="${sy(point.y)}" r="6" fill="${point.roles.includes('Vertex') ? '#edb64d' : '#b7dfcf'}" stroke="#15213a" stroke-width="2"/>`).join('');
  const description = point => `(${point.x}, ${point.y}) — ${point.roles.join(', ')}`;
  $('#graph-description').textContent = `Quadratic graph with marked points. ${points.map(description).join('. ')}.`;
  $('#graph-title').textContent = `Graph ${index + 1}`;
  $('#a-movement').replaceChildren();
  $('#a-hint').hidden = !showAHint;
  $('#a-hint').textContent = '';
  if (showAHint) {
    const { start, corner, end, verticalLabel, horizontalLabel } = aValueMovement(item());
    $('#a-movement').innerHTML = `
      <line class="movement-line" x1="${sx(start.x)}" y1="${sy(start.y)}" x2="${sx(corner.x)}" y2="${sy(corner.y)}"/>
      <line class="movement-line" x1="${sx(corner.x)}" y1="${sy(corner.y)}" x2="${sx(end.x)}" y2="${sy(end.y)}"/>
      <text class="movement-label" x="${sx(start.x) - 12}" y="${(sy(start.y) + sy(corner.y)) / 2 + 4}" text-anchor="end">${verticalLabel}</text>
      <text class="movement-label" x="${(sx(corner.x) + sx(end.x)) / 2}" y="${sy(corner.y) + (item().a > 0 ? -14 : 22)}" text-anchor="middle">${horizontalLabel}</text>`;
    $('#a-hint').textContent = `From the vertex, move ${verticalLabel}, then ${horizontalLabel} to the marked neighboring point. The signed vertical change is a = ${item().a}.`;
  }
}

function reset() {
  clearConfetti();
  currentStage = 1;
  factorRoots = undefined;
  showAHint = false;
  all('.stage').forEach(section => { section.hidden = section.id !== 'stage-1'; });
  all('input').forEach(input => {
    input.value = '';
    input.readOnly = false;
    input.classList.remove('invalid');
    input.setAttribute('aria-invalid', 'false');
  });
  all('button').forEach(button => { button.disabled = false; });
  all('.feedback').forEach(element => {
    element.textContent = '';
    element.className = 'feedback';
  });
  ['#top-constant', '#side-constant', '#combined-equation', '#outside-a', '#box-factors'].forEach(id => { $(id).textContent = ''; });
  $('#equation-summary').replaceChildren();
  $('#graph-picker').value = String(index);
  drawGraph();
}

$('#check-vertex').onclick = () => {
  if (currentStage !== 1) return;
  updateAHint('#vertex-a');
  if (check([['#vx', item().h], ['#vy', item().k], ['#vertex-a', item().a]])) {
    advance(1, '#vertex-feedback', 'Correct. Use these values to write vertex form.');
  } else feedback('#vertex-feedback', 'Check the highlighted entries. The vertex is the turning point; a is the change in y one unit from it.');
};

$('#check-vertex-form').onclick = () => {
  if (currentStage !== 2) return;
  updateAHint('#form-va');
  if (check([['#form-va', item().a], ['#form-h', item().h], ['#form-k', item().k]])) {
    advance(2, '#vertex-form-feedback', `Correct. ${equationText(item(), 'vertex')}`);
  } else feedback('#vertex-form-feedback', 'Use your a-value, vertex x-coordinate h, and vertex y-coordinate k. Keep the signs.');
};

$('#check-roots').onclick = () => {
  if (currentStage !== 3) return;
  updateAHint('#factored-a');
  const correctRoots = checkRootPair('#root-1', '#root-2');
  const correctA = check([['#factored-a', item().a]]);
  if (correctRoots && correctA) advance(3, '#roots-feedback', 'Correct. Now write the two factors.');
  else feedback('#roots-feedback', 'Use both marked points where y = 0 and the same a-value you found earlier.');
};

$('#check-factored-form').onclick = () => {
  if (currentStage !== 4) return;
  updateAHint('#form-fa');
  const correctRoots = checkRootPair('#form-r1', '#form-r2');
  const correctA = check([['#form-fa', item().a]]);
  if (!correctRoots || !correctA) {
    feedback('#factored-form-feedback', 'Use y = a(x − r₁)(x − r₂). Enter each root once, including its sign.');
    return;
  }
  factorRoots = [number('#form-r1'), number('#form-r2')];
  $('#box-factors').textContent = `Multiply ${factorProduct(...factorRoots)}. Keep a = ${item().a} outside the box.`;
  $('#top-constant').textContent = signedConstant(-factorRoots[0]);
  $('#side-constant').textContent = signedConstant(-factorRoots[1]);
  $('#outside-a').textContent = `f(x) = ${item().a}`;
  advance(4, '#factored-form-feedback', 'Correct. Multiply these factors in the box, leaving a outside.');
};

$('#check-box').onclick = () => {
  if (currentStage !== 5) return;
  const result = expansion(...factorRoots, item().a);
  mark('#box-tr', parseLinearTerm($('#box-tr').value) === result.topRight);
  mark('#box-bl', parseLinearTerm($('#box-bl').value) === result.bottomLeft);
  mark('#box-br', number('#box-br') === result.bottomRight);
  if (['#box-tr', '#box-bl', '#box-br'].every(id => !$(id).classList.contains('invalid'))) {
    advance(5, '#box-feedback', 'Correct. Combine the two x-terms next.');
  } else feedback('#box-feedback', 'Multiply each row term by each column term. Include x in the two linear products; check the signs.');
};

$('#check-combined').onclick = () => {
  if (currentStage !== 6) return;
  const result = expansion(...factorRoots, item().a);
  if (!check([['#inside-b', result.linear], ['#inside-c', result.constant]])) {
    feedback('#combined-feedback', 'Add the coefficients of the two x-terms. Keep the constant from the bottom-right box.');
    return;
  }
  const middle = `${signedConstant(result.linear)}x`;
  $('#combined-equation').textContent = `f(x) = ${item().a}(x² ${middle} ${signedConstant(result.constant)})`;
  $('#distribution-instructions').textContent = item().a === 1
    ? 'Since a = 1, the coefficients stay the same. Enter a, b, and c in y = ax² + bx + c.'
    : `Distribute a = ${item().a} to every term inside the parentheses, including x². Enter signed a, b, and c values.`;
  advance(6, '#combined-feedback', 'Correct. Now write standard form.');
};

$('#check-standard').onclick = () => {
  if (currentStage !== 7) return;
  const result = expansion(...factorRoots, item().a);
  if (!check([['#standard-a', result.a], ['#standard-b', result.b], ['#standard-c', result.c]])) {
    feedback('#standard-feedback', 'Multiply every coefficient inside the parentheses by a, including the leading 1.');
    return;
  }
  $('#equation-summary').replaceChildren(...[
    ['vertex', 'Vertex Form'],
    ['factored', 'Factored Form'],
    ['standard', 'Standard Form'],
  ].map(([form, label]) => {
    const li = document.createElement('li');
    const name = document.createElement('strong');
    name.textContent = `${label}: `;
    li.append(name, equationText(item(), form));
    return li;
  }));
  advance(7, '#standard-feedback', 'Correct. All three equations describe the provided graph.');
};

exercises.forEach((exercise, i) => $('#graph-picker').add(new Option(`Graph ${i + 1}`, i)));
$('#graph-picker').onchange = () => {
  index = Number($('#graph-picker').value);
  reset();
};
$('#new-graph').onclick = () => {
  index = (index + 1) % exercises.length;
  reset();
  $('#graph-title').scrollIntoView({ block: 'center' });
};
reset();
