import {
  practiceForForm, evaluate, roots, parseNumber, equationText,
  tablePoints, factoredPoints, graphBounds, parabolaGeometry,
} from './model.mjs';
import { clearConfetti, fireConfetti } from './confetti.js';

const $ = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const W = 600, pad = 52;
let form = 'standard', problemIndex = 0, tableStage, plotted, needed, bounds;
let unlocked = new Set();
const item = () => practiceForForm(form)[problemIndex];
const number = id => parseNumber($(id).value);
const scale = () => (W - 2 * pad) / (bounds.xMax - bounds.xMin);
const sx = x => pad + (x - bounds.xMin) * scale();
const sy = y => W - pad - (y - bounds.yMin) * scale();
const samePoint = (first, second) => first.x === second.x && first.y === second.y;
const aMovement = () => `${Math.abs(item().a)} ${Math.abs(item().a) === 1 ? 'unit' : 'units'} ${item().a > 0 ? 'up' : 'down'}`;
function feedback(id, text, good = false) {
  const element = $(id);
  element.textContent = text;
  element.className = `feedback ${good ? 'ok' : 'no'}`;
}

function mark(input, invalid) {
  input.classList.toggle('invalid', invalid);
  input.setAttribute('aria-invalid', String(invalid));
}

function checkFields(entries) {
  entries.forEach(([id, expected]) => mark($(id), number(id) !== expected));
  return entries.every(([id]) => !$(id).classList.contains('invalid'));
}

function lockFields(ids) {
  ids.forEach(id => { $(id).readOnly = true; });
}

function reveal(step) {
  unlocked.add(step);
  $(`#step-${step}`).classList.add('active');
}

function buildTable() {
  $('#table-body').innerHTML = [-2, -1, 0, 1, 2].map((offset, index) => `
    <tr class="${offset === 0 ? 'vertex-row' : ''}">
      <td>${offset === 0 ? 'Vertex' : offset < 0 ? 'Left' : 'Right'}</td>
      <td><input data-role="x" aria-label="Table row ${index + 1} x-coordinate" inputmode="decimal" ${offset === 0 ? '' : 'disabled'}></td>
      <td><input data-role="y" aria-label="Table row ${index + 1} y-coordinate" inputmode="decimal" ${offset === 0 ? '' : 'disabled'}></td>
    </tr>`).join('');
  tableStage = 'vertex';
  $('#table-instructions').textContent = 'Enter the vertex in the middle of the table.';
}

function reset() {
  clearConfetti();
  $('.work').dataset.form = form;
  plotted = [];
  needed = form === 'factored' ? factoredPoints(item()) : tablePoints(item());
  unlocked = new Set([1]);
  all('.step').forEach(element => element.classList.remove('active'));
  all('.form-work').forEach(element => {
    element.hidden = element.dataset.for !== form && !(element.dataset.for === 'table' && form !== 'factored');
  });
  all('input:not([type="checkbox"])').forEach(input => {
    input.value = '';
    input.readOnly = false;
  });
  all('button, select').forEach(element => { element.disabled = false; });
  all('.invalid').forEach(input => mark(input, false));
  all('.feedback').forEach(element => {
    element.textContent = '';
    element.className = 'feedback';
  });
  ['#standard-y-work', '#vertex-axis-work', '#factored-vertex-work', '#range-work', '#a-work'].forEach(id => { $(id).hidden = true; });
  ['#range-symbol', '#left-end', '#right-end'].forEach(id => { $(id).value = ''; });
  all('.form-choice').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.form === form)));
  $('#function-picker').replaceChildren(...practiceForForm(form).map((problem, index) => new Option(`${index + 1}. ${equationText(problem, form)}`, index)));
  $('#function-picker').value = String(problemIndex);
  $('#equation').textContent = equationText(item(), form);
  $('#standard-substitution').textContent = `f(${item().h}) =`;
  $('#factored-substitution').textContent = `f(${item().h}) =`;
  $('#check-xs').disabled = false;
  $('#plot-instructions').textContent = form === 'factored'
    ? 'First plot your vertex and the two x-intercepts on the coordinate plane.'
    : 'Click the coordinate plane to plot your five table points.';
  $('#a-instructions').textContent = `Here a=${item().a} so move ${aMovement()} and one unit right and left from the vertex to get 2 more points. Plot both points on the graph below.`;
  buildTable();
  redraw();
  reveal(1);
}

function updateBounds() {
  // Keep all required points available even when the student turns auto-scale off.
  const points = $('#autoscale').checked ? needed : [...needed, { x: -8, y: -8 }, { x: 8, y: 8 }];
  bounds = graphBounds(item(), points);
}

function drawGrid() {
  const { xMin, xMax, yMin, yMax } = bounds;
  const labelStep = xMax - xMin <= 24 ? 1 : 2;
  let markup = '';
  for (let x = xMin; x <= xMax; x++) {
    markup += `<line x1="${sx(x)}" y1="${sy(yMin)}" x2="${sx(x)}" y2="${sy(yMax)}" stroke="#c8d2de" />`;
    if (x && x % labelStep === 0) markup += `<text x="${sx(x)}" y="${sy(0) + 18}" text-anchor="middle" class="tick">${x}</text>`;
  }
  for (let y = yMin; y <= yMax; y++) {
    markup += `<line x1="${sx(xMin)}" y1="${sy(y)}" x2="${sx(xMax)}" y2="${sy(y)}" stroke="#c8d2de" />`;
    if (y && y % labelStep === 0) markup += `<text x="${sx(0) - 9}" y="${sy(y) + 4}" text-anchor="end" class="tick">${y}</text>`;
  }
  markup += `<line x1="${sx(xMin)}" y1="${sy(0)}" x2="${sx(xMax)}" y2="${sy(0)}" stroke="#15213a" stroke-width="2"/>
    <line x1="${sx(0)}" y1="${sy(yMin)}" x2="${sx(0)}" y2="${sy(yMax)}" stroke="#15213a" stroke-width="2"/>
    <text x="${sx(xMax) + 14}" y="${sy(0) + 4}" class="tick">x</text>
    <text x="${sx(0) + 8}" y="${sy(yMax) - 14}" class="tick">y</text>
    <text x="${sx(0) - 10}" y="${sy(0) + 18}" class="tick">0</text>`;
  $('#grid').innerHTML = markup;
}

function redraw() {
  updateBounds();
  drawGrid();
  $('#student-points').innerHTML = plotted.map(point => `<circle cx="${sx(point.x)}" cy="${sy(point.y)}" r="6" fill="#edb64d" stroke="#15213a" stroke-width="2"><title>(${point.x}, ${point.y})</title></circle>`).join('');
  $('#plot-note').textContent = `${plotted.length} of ${needed.length} points plotted`;
  const curve = $('#parabola');
  if (plotted.length !== needed.length) {
    curve.removeAttribute('d');
    return;
  }
  const { start, control, end } = parabolaGeometry(item(), bounds);
  curve.setAttribute('d', `M ${sx(start.x)} ${sy(start.y)} Q ${sx(control.x)} ${sy(control.y)} ${sx(end.x)} ${sy(end.y)}`);
}

function plot(point) {
  if (!unlocked.has(4) || plotted.length === needed.length) return;
  const available = form === 'factored' && plotted.length < 3 ? needed.slice(0, 3) : needed;
  if (plotted.some(existing => samePoint(existing, point))) {
    feedback('#plot-feedback', 'That point is already plotted. Choose a different point.');
    return;
  }
  if (!available.some(expected => samePoint(expected, point))) {
    feedback('#plot-feedback', form === 'factored'
      ? plotted.length < 3
        ? 'First plot the vertex and the two x-intercepts.'
        : `From the vertex, move ${aMovement()} and one unit right or left.`
      : 'Plot one of the five points from your completed table.');
    return;
  }
  plotted.push(point);
  redraw();
  if (plotted.length === needed.length) {
    feedback('#plot-feedback', `Correct. Your ${needed.length === 3 ? 'three' : 'five'} points lie on this parabola.`, true);
    reveal(5);
  } else if (form === 'factored' && plotted.length === 3) {
    $('#a-work').hidden = false;
    feedback('#plot-feedback', 'Correct. Now use the a-value to plot the two neighboring points.', true);
  } else {
    feedback('#plot-feedback', 'Correct. Keep plotting.', true);
  }
}

$('#check-standard-axis').onclick = () => {
  if (checkFields([['#standard-axis', item().h]])) {
    lockFields(['#standard-axis']);
    feedback('#standard-axis-feedback', `Correct. The line of symmetry is x = ${item().h}.`, true);
    $('#standard-y-work').hidden = false;
  } else feedback('#standard-axis-feedback', 'Not yet. Identify a and b, then calculate −b/(2a).');
};

$('#check-standard-y').onclick = () => {
  if (checkFields([['#standard-y', item().k]])) {
    lockFields(['#standard-y']);
    feedback('#standard-y-feedback', `Correct. The vertex is (${item().h}, ${item().k}).`, true);
    reveal(2);
  } else feedback('#standard-y-feedback', 'Substitute the line-of-symmetry x-value into every x in f(x).');
};

$('#check-vertex').onclick = () => {
  if (checkFields([['#vertex-x', item().h], ['#vertex-y', item().k]])) {
    lockFields(['#vertex-x', '#vertex-y']);
    feedback('#vertex-feedback', 'Correct. Now find the line of symmetry.', true);
    $('#vertex-axis-work').hidden = false;
  } else feedback('#vertex-feedback', 'In f(x) = a(x − h)² + k, the vertex is (h, k). Check the signs.');
};

$('#check-vertex-axis').onclick = () => {
  if (checkFields([['#vertex-axis', item().h]])) {
    lockFields(['#vertex-axis']);
    feedback('#vertex-axis-feedback', 'Correct. Now start the table.', true);
    reveal(2);
  } else feedback('#vertex-axis-feedback', 'Use the x-coordinate of your vertex.');
};

function checkRootPair(firstId, secondId) {
  const values = [number(firstId), number(secondId)];
  const expected = roots(item());
  const distinct = values[0] !== values[1];
  [firstId, secondId].forEach((id, index) => mark($(id), !expected.includes(values[index]) || !distinct));
  return distinct && values.every(value => expected.includes(value));
}

$('#check-roots').onclick = () => {
  if (checkRootPair('#root-1', '#root-2')) {
    lockFields(['#root-1', '#root-2']);
    feedback('#roots-feedback', 'Correct. Average the intercepts next.', true);
    reveal(2);
  } else feedback('#roots-feedback', 'Set each factor equal to zero. Use both distinct x-intercepts.');
};

$('#check-average').onclick = () => {
  const pairCorrect = checkRootPair('#average-1', '#average-2');
  const axisCorrect = checkFields([['#factored-axis', item().h]]);
  if (pairCorrect && axisCorrect) {
    lockFields(['#average-1', '#average-2', '#factored-axis']);
    feedback('#average-feedback', `Correct. The line of symmetry is x = ${item().h}.`, true);
    reveal(3);
  } else feedback('#average-feedback', 'Use the two x-intercepts in the numerator, then divide their sum by 2.');
};

$('#check-factored-y').onclick = () => {
  if (checkFields([['#factored-y', item().k]])) {
    lockFields(['#factored-y']);
    feedback('#factored-y-feedback', 'Correct. Enter the vertex as an ordered pair next.', true);
    $('#factored-vertex-work').hidden = false;
  } else feedback('#factored-y-feedback', 'Substitute your line-of-symmetry x-value into both factors and multiply by a.');
};

$('#check-factored-vertex').onclick = () => {
  if (checkFields([['#factored-vx', item().h], ['#factored-vy', item().k]])) {
    lockFields(['#factored-vx', '#factored-vy']);
    feedback('#factored-vertex-feedback', 'Correct. Plot the vertex and the two x-intercepts.', true);
    reveal(4);
  } else feedback('#factored-vertex-feedback', 'Use the x- and y-values you found above.');
};

$('#check-xs').onclick = () => {
  const xs = all('[data-role="x"]'), ys = all('[data-role="y"]');
  if (tableStage === 'vertex') {
    const correctX = parseNumber(xs[2].value) === item().h;
    const correctY = parseNumber(ys[2].value) === item().k;
    mark(xs[2], !correctX);
    mark(ys[2], !correctY);
    if (!correctX || !correctY) {
      feedback('#x-feedback', 'Enter the vertex from Question 1 in the middle row.');
      return;
    }
    xs[2].readOnly = ys[2].readOnly = true;
    xs.forEach(input => { input.disabled = false; });
    tableStage = 'x';
    $('#table-instructions').textContent = 'Enter two different integer x-values to the left and two to the right. Prefer the values one and two units from the vertex. Keep x between −8 and 8 and y between −24 and 24.';
    feedback('#x-feedback', 'Correct. Now choose your four x-values.', true);
    return;
  }
  if (tableStage !== 'x') return;
  const values = xs.map(input => parseNumber(input.value));
  xs.forEach((input, index) => {
    const value = values[index];
    const correct = Number.isInteger(value) && Math.abs(value) <= 8
      && Math.abs(evaluate(item(), value)) <= 24
      && (index < 2 ? value < item().h : index > 2 ? value > item().h : value === item().h)
      && values.filter(other => other === value).length === 1;
    mark(input, !correct);
  });
  if (xs.some(input => input.classList.contains('invalid'))) {
    feedback('#x-feedback', 'Correct the highlighted x-values. Use distinct integers on the indicated side within the stated scale.');
    return;
  }
  xs.forEach(input => { input.readOnly = true; });
  ys.forEach(input => { input.disabled = false; });
  tableStage = 'y';
  $('#check-xs').disabled = true;
  $('#table-instructions').textContent = 'Use the function to complete the y-values.';
  feedback('#x-feedback', 'Correct. The y-value boxes are ready.', true);
  reveal(3);
};

$('#check-ys').onclick = () => {
  if (tableStage !== 'y') return;
  const xs = all('[data-role="x"]'), ys = all('[data-role="y"]');
  ys.forEach((input, index) => mark(input, parseNumber(input.value) !== evaluate(item(), parseNumber(xs[index].value))));
  if (ys.some(input => input.classList.contains('invalid'))) {
    feedback('#y-feedback', 'Correct the highlighted y-values. Substitute each x into f(x).');
    return;
  }
  ys.forEach(input => { input.readOnly = true; });
  needed = xs.map((input, index) => ({ x: parseNumber(input.value), y: parseNumber(ys[index].value) }));
  redraw();
  feedback('#y-feedback', 'Correct. Plot these five points on the coordinate plane.', true);
  reveal(4);
};

$('#plane').addEventListener('click', event => {
  const rect = $('#plane').getBoundingClientRect();
  const px = (event.clientX - rect.left) / rect.width * W;
  const py = (event.clientY - rect.top) / rect.height * W;
  if (px < pad || px > W - pad || py < pad || py > W - pad) {
    if (unlocked.has(4)) feedback('#plot-feedback', 'Click inside the coordinate grid.');
    return;
  }
  plot({
    x: Math.round((px - pad) / scale() + bounds.xMin),
    y: Math.round((W - pad - py) / scale() + bounds.yMin),
  });
});

all('.domain-choice').forEach(button => {
  button.onclick = () => {
    const correct = button.dataset.domain === 'yes';
    all('.domain-choice').forEach(choice => mark(choice, !correct && choice === button));
    if (correct) {
      all('.domain-choice').forEach(choice => { choice.disabled = true; });
      feedback('#domain-feedback', 'Correct. Now describe the range.', true);
      $('#range-work').hidden = false;
    } else feedback('#domain-feedback', 'A quadratic function is defined for every real x-value.');
  };
});

$('#check-range').onclick = () => {
  const symbol = $('#range-symbol'), correctSymbol = symbol.value === (item().a > 0 ? '>=' : '<=');
  mark(symbol, !correctSymbol);
  const correctNumber = checkFields([['#range-number', item().k]]);
  if (correctSymbol && correctNumber) {
    symbol.disabled = true;
    lockFields(['#range-number']);
    feedback('#range-feedback', 'Correct.', true);
    reveal(6);
  } else feedback('#range-feedback', 'Correct the highlighted range entry. Include the vertex y-value.');
};

all('.choice').forEach(button => {
  button.onclick = () => {
    const correct = button.dataset.choice === (item().a > 0 ? 'minimum' : 'maximum');
    all('.choice').forEach(choice => mark(choice, !correct && choice === button));
    if (correct) {
      all('.choice').forEach(choice => { choice.disabled = true; });
      feedback('#extrema-feedback', 'Correct.', true);
      reveal(7);
    } else feedback('#extrema-feedback', 'Look at whether the parabola opens upward or downward.');
  };
});

$('#check-intercept').onclick = () => {
  if (checkFields([['#y-intercept', evaluate(item(), 0)]])) {
    lockFields(['#y-intercept']);
    feedback('#intercept-feedback', `Correct. The y-intercept is (0, ${evaluate(item(), 0)}).`, true);
    reveal(8);
  } else feedback('#intercept-feedback', 'Set x = 0 in the function and calculate f(0).');
};

$('#check-ends').onclick = () => {
  if ($('#complete').classList.contains('active')) return;
  const expected = item().a > 0 ? 'positive' : 'negative';
  const selects = [$('#left-end'), $('#right-end')];
  selects.forEach(select => mark(select, select.value !== expected));
  if (selects.every(select => select.value === expected)) {
    selects.forEach(select => { select.disabled = true; });
    feedback('#ends-feedback', 'Correct. You completed the graphing lab.', true);
    $('#complete').classList.add('active');
    fireConfetti(180);
  } else feedback('#ends-feedback', 'Correct the highlighted end-behavior choice. Both ends follow the opening direction.');
};

all('.form-choice').forEach(button => {
  button.onclick = () => {
    if (form === button.dataset.form) return;
    form = button.dataset.form;
    problemIndex %= practiceForForm(form).length;
    reset();
  };
});
$('#function-picker').onchange = () => {
  problemIndex = Number($('#function-picker').value);
  reset();
};
$('#new-function').onclick = () => {
  problemIndex = (problemIndex + 1) % practiceForForm(form).length;
  reset();
  $('#equation').scrollIntoView({ block: 'center' });
};
$('#autoscale').onchange = redraw;

reset();
