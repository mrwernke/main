import {
  systems, parsePolynomial, parseInteger, parseFactor, samePolynomial,
  differenceFor, polynomialText, formatInteger,
  evaluateQuadratic, substitutionText, splitConstantsFor, rootsFor,
} from './model.mjs';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';

const $ = selector => document.querySelector(selector);
let index = 0;
let splitConstants = [];
let repeated = false;
let solvedRoots = [];
let solvedYs = [];
let activeMethod = 'algebraic';
let graphPointSets = [];
let graphEquationReady = [];
let graphPlottedPoints = [[], []];
let graphIntersections = [];
let selectedIntersections = [];
let graphBounds = null;
let activePlotEquation = 0;
const graphColors = ['#2f65a7', '#c2543d'];
const graphWidth = 600;
const graphPadding = 48;
const graphPointsPerEquation = 5;

const system = () => systems[index];
const targetPolynomial = () => differenceFor(system());
const expectedFactors = () => splitConstantsFor(system());
const expectedRoots = () => rootsFor(system());
const moveKeys = ['a', 'b', 'c'];
const moveVariables = ['x²', 'x', ''];
const moveTermNames = ['x squared term', 'x term', 'constant term'];

function mark(field, state) {
  field.classList.toggle('correct', state === true);
  field.classList.toggle('incorrect', state === false);
  field.classList.toggle('invalid', state === false);
  field.setAttribute('aria-invalid', String(state === false));
}

function feedback(selector, message, kind = '') {
  const element = $(selector);
  element.textContent = message;
  element.className = `feedback${kind ? ` ${kind}` : ''}`;
  element.hidden = false;
}

function lockForm(formSelector, feedbackSelector) {
  const form = $(formSelector);
  form.querySelectorAll('input').forEach(input => { input.readOnly = true; });
  const button = form.querySelector('button[type="submit"]');
  if (button) button.hidden = true;
  if (feedbackSelector) {
    $(feedbackSelector).textContent = '';
    $(feedbackSelector).hidden = true;
  }
}

function showStep(selector) {
  $(selector).hidden = false;
}

function setMethod(method) {
  const changed = activeMethod !== method;
  activeMethod = method;
  $('#algebraic-mode').setAttribute('aria-pressed', String(method === 'algebraic'));
  $('#graphical-mode').setAttribute('aria-pressed', String(method === 'graphical'));
  $('#algebraic-work').hidden = method !== 'algebraic';
  $('#graphical-work').hidden = method !== 'graphical';
  if (method === 'graphical' && changed) resetGraph();
}

function linearTerm(value, showPositive = false) {
  if (value === 0) return '0';
  const magnitude = Math.abs(value);
  const body = `${magnitude === 1 ? '' : magnitude}x`;
  if (value < 0) return `−${body}`;
  return showPositive ? `+ ${body}` : body;
}

function signedInteger(value, allowBareMinus = false) {
  const text = String(value).trim().replace(/−/g, '-');
  if (allowBareMinus && text === '-') return -1;
  if (!/^[+-]/.test(text)) return NaN;
  const fraction = /^([+-])(\d+)\/(\d+)$/.exec(text);
  if (fraction) {
    const denominator = Number(fraction[3]);
    if (!denominator) return NaN;
    return (fraction[1] === '-' ? -1 : 1) * Number(fraction[2]) / denominator;
  }
  return /^[+-](?:\d+(?:\.\d+)?|\.\d+)$/.test(text) ? Number(text) : NaN;
}

function coefficientInteger(value, allowBareMinus = false) {
  const text = String(value).trim().replace(/−/g, '-');
  if (allowBareMinus && text === '-') return -1;
  return parseInteger(text);
}

function createInput(id, label, inputMode = 'text') {
  const field = document.createElement('input');
  field.id = id;
  field.inputMode = inputMode;
  field.autocomplete = 'off';
  field.setAttribute('aria-label', label);
  return field;
}

function equationTermCells(coefficients) {
  const firstTerm = coefficients.findIndex(value => value !== 0);
  return coefficients.map((coefficient, termIndex) => {
    const cell = document.createElement('span');
    cell.className = 'q14-move-term';
    if (coefficient === 0) {
      cell.classList.add('q14-move-empty');
      return cell;
    }
    const magnitude = Math.abs(coefficient);
    const variable = moveVariables[termIndex];
    const coefficientLabel = magnitude === 0.5 ? '1/2' : String(magnitude);
    const body = `${variable && magnitude === 1 ? '' : coefficientLabel}${variable}`;
    const sign = coefficient < 0 ? '− ' : termIndex === firstTerm ? '' : '+ ';
    cell.textContent = `${sign}${body}`;
    return cell;
  });
}

function operationTermCell(side, termIndex) {
  const coefficient = system().right[termIndex];
  const cell = document.createElement('span');
  cell.className = 'q14-move-term';
  if (coefficient === 0) {
    cell.classList.add('q14-move-empty');
    return cell;
  }
  cell.classList.add('q14-move-operation-term');
  cell.append(
    createInput(`move-${side}-${moveKeys[termIndex]}-value`, `Signed coefficient to move on the ${side} side for the ${moveTermNames[termIndex]}`),
    document.createTextNode(moveVariables[termIndex]),
  );
  return cell;
}

function moveGridRow(leftCells, rightCells, className = '') {
  const equals = document.createElement('span');
  equals.textContent = '=';
  equals.className = `q14-move-equals${className === 'q14-move-operation' ? ' q14-move-operation-equals' : ''}`;
  const cells = [...leftCells, equals, ...rightCells];
  if (className) cells.forEach(cell => cell.classList.add(className));
  return cells;
}

function buildMoveWork() {
  const leftOperations = moveKeys.map((_, termIndex) => operationTermCell('left', termIndex));
  const rightOperations = moveKeys.map((_, termIndex) => operationTermCell('right', termIndex));
  $('#move-work').replaceChildren(
    ...moveGridRow(equationTermCells(system().left), equationTermCells(system().right), 'q14-move-equation'),
    ...moveGridRow(leftOperations, rightOperations, 'q14-move-operation'),
  );
}

function moveOperationFields() {
  const fields = [];
  system().right.forEach((coefficient, termIndex) => {
    if (coefficient === 0) return;
    fields.push({
      leftValue: $(`#move-left-${moveKeys[termIndex]}-value`),
      rightValue: $(`#move-right-${moveKeys[termIndex]}-value`),
      expected: -coefficient,
      allowBareMinus: termIndex < 2,
    });
  });
  return fields;
}

function renderSystem() {
  $('#system-equations').replaceChildren(...[system().left, system().right].map((expression, equationIndex) => {
    const row = document.createElement('p');
    row.className = 'system-line';
    row.setAttribute('aria-label', `Equation ${equationIndex + 1}`);
    row.textContent = `y = ${polynomialText(expression)}`;
    return row;
  }));
  $('#problem-picker').value = String(index);
  const difference = targetPolynomial();
  $('#constant-value').textContent = formatInteger(difference[2]);
  $('#middle-value').textContent = linearTerm(difference[1], true);
  buildMoveWork();
}

function clearInputState(input) {
  input.value = '';
  input.readOnly = false;
  input.classList.remove('correct', 'incorrect', 'invalid');
  input.setAttribute('aria-invalid', 'false');
}

function resetProblem() {
  clearConfetti();
  splitConstants = [];
  repeated = false;
  solvedRoots = [];
  solvedYs = [];
  renderSystem();

  const stepSelectors = ['#step-equal', '#step-move', '#step-box', '#step-factors', '#step-zero', '#step-roots', '#step-y', '#step-pairs', '#complete'];
  stepSelectors.forEach((selector, stepIndex) => { $(selector).hidden = stepIndex !== 0; });
  $('#standard-form').hidden = true;
  document.querySelectorAll('.work input').forEach(clearInputState);
  document.querySelectorAll('.work button[type="submit"]').forEach(button => { button.hidden = false; });
  document.querySelectorAll('.feedback').forEach(element => {
    element.textContent = '';
    element.className = 'feedback';
    element.hidden = false;
  });
  $('#problem-picker').value = String(index);
  $('#top-product').textContent = '?';
  $('#side-product').textContent = '?';
  $('#product-check').textContent = 'Product: enter both integers.';
  $('#sum-check').textContent = 'Sum: enter both integers.';
  $('#product-check').className = '';
  $('#sum-check').className = '';
  $('#product-mark').textContent = '';
  $('#sum-mark').textContent = '';
  mark($('#constant-cell'), undefined);
  mark($('#middle-term'), undefined);
  $('#product-check').hidden = false;
  $('#sum-check').hidden = false;
  $('#factor-second').hidden = false;
  $('#factor-middle').hidden = false;
  $('#factor-square').hidden = true;
  $('#factor-close').textContent = ') = 0';
  $('#zero-second').hidden = false;
  $('#zero-middle').hidden = false;
  $('#zero-middle').textContent = ' = 0     ';
  $('#zero-close').hidden = false;
  $('#root-entries').replaceChildren();
  $('#y-entries').replaceChildren();
  $('#pair-entries').replaceChildren();
  $('#complete-text').textContent = '';
  $('#reset').hidden = false;
  $('#next-problem').textContent = index === systems.length - 1 ? 'Start Again' : 'Next Problem';
  if (activeMethod === 'graphical') resetGraph();
}

function orderedPairMatch(first, second) {
  const equal = (actual, expected) => actual && expected && actual.x === expected.x && actual.y === expected.y;
  if (first.length !== second.length) return false;
  if (first.length === 1) return equal(first[0], second[0]);
  return equal(first[0], second[0]) && equal(first[1], second[1])
    || equal(first[0], second[1]) && equal(first[1], second[0]);
}

function parseGraphNumber(value) {
  const text = String(value).trim().replace(/−/g, '-').replace(/\s/g, '');
  const fraction = text.match(/^([+-]?\d+)\/([+-]?\d+)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    return denominator === 0 ? NaN : Number(fraction[1]) / denominator;
  }
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) ? Number(text) : NaN;
}

function graphNumberText(value) {
  const rounded = Math.abs(value) < 1e-9 ? 0 : Number(value.toFixed(6));
  return String(rounded).replace('-', '−');
}

function graphExpressions() {
  return [system().left, system().right];
}

function graphPointsFor(expression) {
  const [a, b, c] = expression;
  if (a !== 0) {
    const vertexX = -b / (2 * a);
    return [vertexX - 2, vertexX - 1, vertexX, vertexX + 1, vertexX + 2].map(x => ({ x, y: a * x * x + b * x + c }));
  }
  return [-2, -1, 0, 1, 2].map(x => ({ x, y: b * x + c }));
}

function systemIntersections() {
  return rootsFor(system()).map(x => ({ x, y: evaluateQuadratic(system().left, x) }));
}

function createGraphInput(id, label) {
  const input = createInput(id, label, 'decimal');
  input.className = 'graph-coordinate';
  return input;
}

function graphField(labelText, input) {
  const label = document.createElement('label');
  label.className = 'graph-field';
  label.append(document.createTextNode(labelText), input);
  return label;
}

function buildGraphPointTable(equationIndex) {
  const host = $(`#graph-table-${equationIndex}`);
  const points = graphPointSets[equationIndex];
  const isQuadratic = graphExpressions()[equationIndex][0] !== 0;
  const pointNames = isQuadratic
    ? ['Two left of vertex', 'One left of vertex', 'Vertex', 'One right of vertex', 'Two right of vertex']
    : ['Two units left', 'One unit left', 'Y-intercept', 'One unit right', 'Two units right'];
  const table = document.createElement('table');
  table.className = 'graph-point-table';
  const head = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Point', 'x', 'y'].forEach(text => {
    const cell = document.createElement('th');
    cell.textContent = text;
    headerRow.append(cell);
  });
  head.append(headerRow);
  const body = document.createElement('tbody');
  points.forEach((point, pointIndex) => {
    const row = document.createElement('tr');
    const pointName = document.createElement('td');
    pointName.textContent = pointNames[pointIndex];
    const xCell = document.createElement('td');
    xCell.textContent = graphNumberText(point.x);
    const yCell = document.createElement('td');
    const yInput = createGraphInput(`graph-y-${equationIndex}-${pointIndex}`, `Equation ${equationIndex + 1}, point ${pointIndex + 1}, y-coordinate`);
    yCell.append(yInput);
    row.append(pointName, xCell, yCell);
    body.append(row);
  });
  table.append(head, body);
  const form = document.createElement('form');
  form.id = `graph-table-form-${equationIndex}`;
  form.className = 'graph-table-form';
  const directions = document.createElement('p');
  directions.className = 'muted';
  directions.textContent = isQuadratic
    ? 'Use the vertex and two x-values on each side. Evaluate the quadratic at each x-value.'
    : 'Start at the y-intercept (0, b), then use the slope’s rise and run to find the y-values.';
  form.append(directions);
  form.append(table);
  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Check y-values';
  form.append(button);
  const message = document.createElement('p');
  message.id = `graph-table-feedback-${equationIndex}`;
  message.className = 'feedback';
  message.setAttribute('aria-live', 'polite');
  form.append(message);
  form.onsubmit = event => {
    event.preventDefault();
    const fields = points.map((_, pointIndex) => $(`#graph-y-${equationIndex}-${pointIndex}`));
    const values = fields.map(field => parseGraphNumber(field.value));
    const correct = values.map((value, pointIndex) => Number.isFinite(value) && Math.abs(value - points[pointIndex].y) < 1e-7);
    fields.forEach((field, fieldIndex) => mark(field, correct[fieldIndex]));
    if (!correct.every(Boolean)) {
      feedback(`#graph-table-feedback-${equationIndex}`, 'Evaluate each equation at the x-value in its row.', 'no');
      return;
    }
    lockForm(`#graph-table-form-${equationIndex}`, `#graph-table-feedback-${equationIndex}`);
    graphEquationReady[equationIndex] = true;
    updateGraphSetupReady(equationIndex);
  };
  host.replaceChildren(form);
  host.hidden = false;
  fieldsFocus(`#graph-y-${equationIndex}-0`);
}

function fieldsFocus(selector) {
  $(selector)?.focus();
}

function buildGraphEquationCard(equationIndex, expression) {
  const card = document.createElement('article');
  card.id = `graph-equation-card-${equationIndex}`;
  card.className = 'graph-equation-card';
  card.hidden = equationIndex > 0;
  card.style.setProperty('--equation-color', graphColors[equationIndex]);
  const heading = document.createElement('h3');
  heading.textContent = `Equation ${equationIndex + 1}: y = ${polynomialText(expression)}`;
  card.append(heading);
  const isQuadratic = expression[0] !== 0;
  const methodForm = document.createElement('form');
  methodForm.id = `graph-method-form-${equationIndex}`;
  methodForm.className = 'graph-method-form';
  let vertexForm = null;
  if (isQuadratic) {
    const directions = document.createElement('p');
    directions.className = 'muted';
    directions.textContent = 'Use x = −b/(2a) to find the line of symmetry.';
    const axis = createGraphInput(`graph-axis-${equationIndex}`, `Equation ${equationIndex + 1} line of symmetry`);
    methodForm.append(directions, graphField('x =', axis));
    vertexForm = document.createElement('form');
    vertexForm.id = `graph-vertex-form-${equationIndex}`;
    vertexForm.className = 'graph-method-form graph-vertex-form';
    vertexForm.hidden = true;
    const vertexDirections = document.createElement('p');
    vertexDirections.className = 'muted';
    vertexDirections.textContent = 'Substitute the line-of-symmetry value into the function to find the vertex y-coordinate.';
    const vertexY = createGraphInput(`graph-vertex-y-${equationIndex}`, `Equation ${equationIndex + 1} vertex y-coordinate`);
    const vertexValueRow = document.createElement('div');
    vertexValueRow.className = 'graph-vertex-value';
    vertexValueRow.append(document.createTextNode(`y = f(${graphNumberText(-expression[1] / (2 * expression[0]))}) = `), vertexY);
    vertexForm.append(vertexDirections, vertexValueRow);
    const vertexCheck = document.createElement('button');
    vertexCheck.type = 'submit';
    vertexCheck.textContent = 'Check vertex y-value';
    vertexForm.append(vertexCheck);
    const vertexFeedback = document.createElement('p');
    vertexFeedback.id = `graph-vertex-feedback-${equationIndex}`;
    vertexFeedback.className = 'feedback';
    vertexFeedback.setAttribute('aria-live', 'polite');
    vertexForm.append(vertexFeedback);
  } else {
    const directions = document.createElement('p');
    directions.className = 'muted';
    directions.textContent = 'Use y = mx + b to identify the y-intercept and slope. Then use the slope’s rise and run to find more points.';
    const slope = createGraphInput(`graph-slope-${equationIndex}`, `Equation ${equationIndex + 1} slope`);
    const intercept = createGraphInput(`graph-intercept-${equationIndex}`, `Equation ${equationIndex + 1} y-intercept`);
    methodForm.append(directions, graphField('Slope m:', slope), graphField('Y-intercept b:', intercept));
  }
  const check = document.createElement('button');
  check.type = 'submit';
  check.textContent = isQuadratic ? 'Check line of symmetry' : 'Check slope and intercept';
  methodForm.append(check);
  const methodFeedback = document.createElement('p');
  methodFeedback.id = `graph-method-feedback-${equationIndex}`;
  methodFeedback.className = 'feedback';
  methodFeedback.setAttribute('aria-live', 'polite');
  methodForm.append(methodFeedback);
  card.append(methodForm);
  if (vertexForm) card.append(vertexForm);
  const tableHost = document.createElement('div');
  tableHost.id = `graph-table-${equationIndex}`;
  tableHost.hidden = true;
  card.append(tableHost);
  methodForm.onsubmit = event => {
    event.preventDefault();
    let fields;
    let expected;
    if (isQuadratic) {
      const [a, b, c] = expression;
      const h = -b / (2 * a);
      fields = [$(`#graph-axis-${equationIndex}`)];
      expected = [h];
    } else {
      fields = [$(`#graph-slope-${equationIndex}`), $(`#graph-intercept-${equationIndex}`)];
      expected = [expression[1], expression[2]];
    }
    const correct = fields.map((field, fieldIndex) => {
      const value = parseGraphNumber(field.value);
      return Number.isFinite(value) && Math.abs(value - expected[fieldIndex]) < 1e-7;
    });
    fields.forEach((field, fieldIndex) => mark(field, correct[fieldIndex]));
    if (!correct.every(Boolean)) {
      feedback(`#graph-method-feedback-${equationIndex}`, isQuadratic
        ? 'Use x = −b/(2a) to find the line of symmetry.'
        : 'Read the slope and y-intercept from y = mx + b.', 'no');
      return;
    }
    lockForm(`#graph-method-form-${equationIndex}`, `#graph-method-feedback-${equationIndex}`);
    if (isQuadratic) {
      const h = -expression[1] / (2 * expression[0]);
      feedback(`#graph-method-feedback-${equationIndex}`, `Correct. Now substitute x = ${graphNumberText(h)} to find the vertex y-value.`, 'ok');
      vertexForm.hidden = false;
      $(`#graph-vertex-y-${equationIndex}`).focus();
    } else {
      buildGraphPointTable(equationIndex);
    }
  };
  if (vertexForm) {
    vertexForm.onsubmit = event => {
      event.preventDefault();
      const [a, b] = expression;
      const h = -b / (2 * a);
      const k = evaluateQuadratic(expression, h);
      const field = $(`#graph-vertex-y-${equationIndex}`);
      const correct = Number.isFinite(parseGraphNumber(field.value)) && Math.abs(parseGraphNumber(field.value) - k) < 1e-7;
      mark(field, correct);
      if (!correct) {
        feedback(`#graph-vertex-feedback-${equationIndex}`, 'Substitute the line-of-symmetry x-value into every x in the quadratic.', 'no');
        return;
      }
      lockForm(`#graph-vertex-form-${equationIndex}`, `#graph-vertex-feedback-${equationIndex}`);
      feedback(`#graph-vertex-feedback-${equationIndex}`, `Correct. The vertex is (${graphNumberText(h)}, ${graphNumberText(k)}). Now complete the five y-values.`, 'ok');
      buildGraphPointTable(equationIndex);
    };
  }
  return card;
}

function resetGraph() {
  graphPointSets = graphExpressions().map(graphPointsFor);
  graphEquationReady = [false, false];
  graphPlottedPoints = [[], []];
  graphIntersections = systemIntersections();
  selectedIntersections = [];
  graphBounds = null;
  activePlotEquation = 0;
  $('#graph-equations').replaceChildren(...graphExpressions().map((expression, equationIndex) => buildGraphEquationCard(equationIndex, expression)));
  $('#graph-setup-feedback').textContent = '';
  $('#graph-setup-feedback').className = 'feedback';
  $('#graph-plot-stage').hidden = true;
  $('#graph-intersection-stage').hidden = true;
  $('#graph-answer-stage').hidden = true;
  $('#graph-complete').hidden = true;
  $('#graph-plot-choices').replaceChildren();
  $('#graph-pair-entries').replaceChildren();
  $('#graph-pairs-form button[type="submit"]').hidden = false;
  $('#graph-pairs-feedback').textContent = '';
  $('#graph-pairs-feedback').className = 'feedback';
  $('#graph-pairs-feedback').hidden = false;
  $('#graph-plot-feedback').textContent = '';
  $('#graph-plot-feedback').className = 'feedback';
  $('#graph-plot-note').textContent = '';
  $('#intersection-note').textContent = '';
  $('#intersection-feedback').textContent = '';
  $('#intersection-feedback').className = 'feedback';
  $('#finish-intersections').hidden = true;
  $('#system-grid').replaceChildren();
  $('#system-graph-0').removeAttribute('d');
  $('#system-graph-1').removeAttribute('d');
  $('#system-plotted-points').replaceChildren();
  $('#intersection-clicks').replaceChildren();
  $('#graph-reset').hidden = false;
  $('#graph-next-system').textContent = index === systems.length - 1 ? 'Start Again' : 'Next system';
}

function updateGraphSetupReady(equationIndex) {
  if (equationIndex === 0 && $('#graph-plot-stage').hidden) {
    $('#graph-setup-feedback').textContent = 'Equation 1 is ready. Plot its five points to draw the first graph.';
    $('#graph-setup-feedback').className = 'feedback ok';
    setGraphBounds();
    drawSystemGrid();
    $('#graph-plot-stage').hidden = false;
    activePlotEquation = 0;
  } else if (equationIndex === 1) {
    $('#graph-setup-feedback').textContent = 'Equation 2 is ready. Plot its five points to draw the second graph.';
    $('#graph-setup-feedback').className = 'feedback ok';
  }
  renderPlotChoices();
  updateGraphPlotNote();
}

function setGraphBounds() {
  const points = [...graphPointSets.flat(), ...graphIntersections];
  const minX = Math.min(...points.map(point => point.x)) - 2;
  const maxX = Math.max(...points.map(point => point.x)) + 2;
  const minY = Math.min(...points.map(point => point.y)) - 2;
  const maxY = Math.max(...points.map(point => point.y)) + 2;
  const span = Math.ceil(Math.max(12, maxX - minX, maxY - minY));
  graphBounds = {
    xMin: Math.floor((minX + maxX - span) / 2),
    yMin: Math.floor((minY + maxY - span) / 2),
    span,
  };
}

function graphScale() {
  return (graphWidth - 2 * graphPadding) / graphBounds.span;
}

function graphX(x) {
  return graphPadding + (x - graphBounds.xMin) * graphScale();
}

function graphY(y) {
  return graphWidth - graphPadding - (y - graphBounds.yMin) * graphScale();
}

function drawSystemGrid() {
  const { xMin, yMin, span } = graphBounds;
  const xMax = xMin + span;
  const yMax = yMin + span;
  const labelStep = span > 24 ? 2 : 1;
  let markup = '';
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += 1) {
    const axis = x === 0;
    markup += `<line x1="${graphX(x)}" y1="${graphY(yMin)}" x2="${graphX(x)}" y2="${graphY(yMax)}" stroke="${axis ? '#15213a' : '#d6dde4'}" stroke-width="${axis ? 2 : 1}"/>`;
    if (x % labelStep === 0 && x !== 0) markup += `<text x="${graphX(x)}" y="${graphY(0) + 18}" text-anchor="middle" class="system-tick">${x}</text>`;
  }
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += 1) {
    const axis = y === 0;
    markup += `<line x1="${graphX(xMin)}" y1="${graphY(y)}" x2="${graphX(xMax)}" y2="${graphY(y)}" stroke="${axis ? '#15213a' : '#d6dde4'}" stroke-width="${axis ? 2 : 1}"/>`;
    if (y % labelStep === 0 && y !== 0) markup += `<text x="${graphX(0) - 9}" y="${graphY(y) + 4}" text-anchor="end" class="system-tick">${y}</text>`;
  }
  markup += `<text x="${graphX(xMax) - 12}" y="${graphY(0) - 8}" class="system-tick">x</text><text x="${graphX(0) + 8}" y="${graphY(yMax) + 14}" class="system-tick">y</text><text x="${graphX(0) - 9}" y="${graphY(0) + 18}" text-anchor="end" class="system-tick">0</text>`;
  $('#system-grid').innerHTML = markup;
}

function renderPlotChoices() {
  const choices = graphExpressions().map((expression, equationIndex) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'graph-plot-choice';
    button.style.setProperty('--equation-color', graphColors[equationIndex]);
    button.setAttribute('aria-pressed', String(activePlotEquation === equationIndex));
    button.disabled = !graphEquationReady[equationIndex]
      || graphPlottedPoints[equationIndex].length === graphPointsPerEquation;
    const count = graphPlottedPoints[equationIndex].length;
    button.textContent = `Equation ${equationIndex + 1}: ${count} of ${graphPointsPerEquation} points`;
    button.onclick = () => {
      activePlotEquation = equationIndex;
      renderPlotChoices();
      updateGraphPlotNote();
    };
    return button;
  });
  $('#graph-plot-choices').replaceChildren(...choices);
}

function updateGraphPlotNote() {
  const eqIndex = activePlotEquation;
  if (!graphEquationReady[eqIndex]) {
    $('#graph-plot-note').textContent = `Equation ${eqIndex + 1} is locked until its five point values are complete.`;
    return;
  }
  const remaining = graphPlottedPoints.filter(points => points.length < graphPointsPerEquation).length;
  if (remaining) {
    $('#graph-plot-note').textContent = `Plotting Equation ${eqIndex + 1}: ${graphPlottedPoints[eqIndex].length} of ${graphPointsPerEquation} points. Colors match the equation labels.`;
  }
}

function drawPlottedPoints() {
  const circles = [];
  graphPlottedPoints.forEach((points, equationIndex) => points.forEach(point => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', graphX(point.x));
    circle.setAttribute('cy', graphY(point.y));
    circle.setAttribute('r', '6');
    circle.setAttribute('fill', graphColors[equationIndex]);
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', '2');
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `Equation ${equationIndex + 1}: (${graphNumberText(point.x)}, ${graphNumberText(point.y)})`;
    circle.append(title);
    circles.push(circle);
  }));
  $('#system-plotted-points').replaceChildren(...circles);
}

function graphPath(expression) {
  const { xMin, span } = graphBounds;
  const xMax = xMin + span;
  const [a, b, c] = expression;
  if (a === 0) {
    return `M ${graphX(xMin)} ${graphY(b * xMin + c)} L ${graphX(xMax)} ${graphY(b * xMax + c)}`;
  }
  const commands = [];
  const steps = 160;
  for (let step = 0; step <= steps; step += 1) {
    const x = xMin + span * step / steps;
    const y = a * x * x + b * x + c;
    commands.push(`${step === 0 ? 'M' : 'L'} ${graphX(x)} ${graphY(y)}`);
  }
  return commands.join(' ');
}

function drawSystemGraph(equationIndex) {
  const path = $(`#system-graph-${equationIndex}`);
  path.setAttribute('d', graphPath(graphExpressions()[equationIndex]));
  path.setAttribute('stroke', graphColors[equationIndex]);
}

function nearestExpectedPoint(coordinate, candidates, tolerance) {
  let closest = null;
  let distance = Infinity;
  candidates.forEach(candidate => {
    const current = Math.hypot(coordinate.x - candidate.point.x, coordinate.y - candidate.point.y);
    if (current < distance) {
      closest = candidate;
      distance = current;
    }
  });
  return distance <= tolerance ? closest : null;
}

function updateIntersectionMarker(point) {
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', graphX(point.x));
  circle.setAttribute('cy', graphY(point.y));
  circle.setAttribute('r', '10');
  circle.setAttribute('fill', '#fffdf8');
  circle.setAttribute('stroke', '#267a5e');
  circle.setAttribute('stroke-width', '3');
  $('#intersection-clicks').append(circle);
}

function buildGraphPairInputs() {
  $('#graph-pair-entries').replaceChildren(...graphIntersections.map((_, rowIndex) => {
    const row = document.createElement('div');
    row.className = 'ordered-pair-row';
    const label = document.createElement('span');
    label.textContent = `Intersection ${rowIndex + 1}:`;
    const open = document.createElement('span');
    open.textContent = '(';
    const xInput = createGraphInput(`graph-pair-x-${rowIndex}`, `Intersection ${rowIndex + 1} x-coordinate`);
    const comma = document.createElement('span');
    comma.textContent = ',';
    const yInput = createGraphInput(`graph-pair-y-${rowIndex}`, `Intersection ${rowIndex + 1} y-coordinate`);
    const close = document.createElement('span');
    close.textContent = ')';
    row.append(label, open, xInput, comma, yInput, close);
    return row;
  }));
}

$('#system-plane').addEventListener('click', event => {
  if (!graphBounds) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const px = (event.clientX - rect.left) * graphWidth / rect.width;
  const py = (event.clientY - rect.top) * graphWidth / rect.height;
  if (px < graphPadding || px > graphWidth - graphPadding || py < graphPadding || py > graphWidth - graphPadding) return;
  const coordinate = {
    x: graphBounds.xMin + (px - graphPadding) / graphScale(),
    y: graphBounds.yMin + (graphWidth - graphPadding - py) / graphScale(),
  };
  if (graphPlottedPoints.some(points => points.length < graphPointsPerEquation)) {
    if (!graphEquationReady[activePlotEquation]) {
      feedback('#graph-plot-feedback', `Complete Equation ${activePlotEquation + 1}'s point table before plotting it.`, 'no');
      return;
    }
    const plotted = graphPlottedPoints[activePlotEquation];
    if (plotted.length >= graphPointsPerEquation) return;
    const candidates = graphPointSets[activePlotEquation]
      .filter(point => !plotted.some(existing => existing.x === point.x && existing.y === point.y))
      .map(point => ({ point }));
    const match = nearestExpectedPoint(coordinate, candidates, 0.4);
    if (!match) {
      feedback('#graph-plot-feedback', `Click one of the remaining points for Equation ${activePlotEquation + 1}.`, 'no');
      return;
    }
    plotted.push(match.point);
    drawPlottedPoints();
    if (plotted.length === graphPointsPerEquation) {
      drawSystemGraph(activePlotEquation);
      if (activePlotEquation === 0) {
        $('#graph-equation-card-1').hidden = false;
        activePlotEquation = 1;
        $('#graph-plot-note').textContent = 'Equation 1 is drawn. Complete the point table for Equation 2, then plot its points.';
        feedback('#graph-plot-feedback', 'Equation 1 is graphed. Equation 2 is now unlocked.', 'ok');
      } else {
        $('#graph-plot-note').textContent = 'Both graphs are drawn. Compare them and locate their intersection(s).';
        feedback('#graph-plot-feedback', 'Equation 2 is graphed. Now click the intersection point(s).', 'ok');
        $('#graph-intersection-stage').hidden = false;
        $('#intersection-note').textContent = 'Click each intersection point you see, then continue.';
      }
    } else {
      feedback('#graph-plot-feedback', `Point plotted. Keep going until Equation ${activePlotEquation + 1} has five points.`, 'ok');
      renderPlotChoices();
      updateGraphPlotNote();
    }
    renderPlotChoices();
    return;
  }

  if (selectedIntersections.length >= graphIntersections.length) return;

  const candidates = graphIntersections
    .filter(point => !selectedIntersections.some(selected => selected.x === point.x && selected.y === point.y))
    .map(point => ({ point }));
  const match = nearestExpectedPoint(coordinate, candidates, 0.48);
  if (!match) {
    feedback('#intersection-feedback', 'Click where the two graphs cross.', 'no');
    return;
  }
  selectedIntersections.push(match.point);
  updateIntersectionMarker(match.point);
  $('#intersection-note').textContent = `${selectedIntersections.length} intersection point${selectedIntersections.length === 1 ? '' : 's'} selected. Check for any others.`;
  $('#intersection-feedback').textContent = '';
  $('#intersection-feedback').className = 'feedback';
  $('#finish-intersections').hidden = false;
});

$('#finish-intersections').onclick = () => {
  if (selectedIntersections.length !== graphIntersections.length) {
    feedback('#intersection-feedback', 'There is at least one more intersection to click. Check the graph again.', 'no');
    return;
  }
  $('#intersection-feedback').textContent = '';
  $('#intersection-feedback').className = 'feedback';
  $('#finish-intersections').hidden = true;
  buildGraphPairInputs();
  $('#graph-answer-stage').hidden = false;
  $('#graph-pair-x-0').focus();
};

$('#graph-pairs-form').onsubmit = event => {
  event.preventDefault();
  const rows = graphIntersections.map((_, rowIndex) => ({
    x: parseGraphNumber($(`#graph-pair-x-${rowIndex}`).value),
    y: parseGraphNumber($(`#graph-pair-y-${rowIndex}`).value),
  }));
  const correct = orderedPairMatch(rows, graphIntersections);
  rows.forEach((point, rowIndex) => {
    const pairCorrect = graphIntersections.some(expected => Math.abs(point.x - expected.x) < 1e-7 && Math.abs(point.y - expected.y) < 1e-7);
    mark($(`#graph-pair-x-${rowIndex}`), pairCorrect);
    mark($(`#graph-pair-y-${rowIndex}`), pairCorrect);
  });
  if (!correct) {
    feedback('#graph-pairs-feedback', 'Enter each clicked intersection as its ordered pair.', 'no');
    return;
  }
  lockForm('#graph-pairs-form', '#graph-pairs-feedback');
  const answers = graphIntersections.map(point => `(${graphNumberText(point.x)}, ${graphNumberText(point.y)})`);
  $('#graph-complete-text').textContent = `This system has ${answers.length} ${answers.length === 1 ? 'solution' : 'solutions'}: ${answers.join(' and ')}.`;
  $('#graph-complete').hidden = false;
  $('#graph-reset').hidden = true;
  fireConfetti(180);
};

$('#graph-reset').onclick = resetGraph;
$('#graph-next-system').onclick = () => selectProblem((index + 1) % systems.length);

$('#equal-form').onsubmit = event => {
  event.preventDefault();
  const leftInput = $('#equal-left');
  const rightInput = $('#equal-right');
  const left = parsePolynomial(leftInput.value);
  const right = parsePolynomial(rightInput.value);
  const expectedLeft = system().left;
  const expectedRight = system().right;
  const leftCorrect = samePolynomial(left, expectedLeft);
  const rightCorrect = samePolynomial(right, expectedRight);
  const correct = leftCorrect && rightCorrect;
  mark(leftInput, leftCorrect);
  mark(rightInput, rightCorrect);
  if (!correct) {
    feedback('#equal-feedback', 'Enter the first expression on the left and the second expression on the right. Use ^2 for x squared.', 'no');
    return;
  }
  lockForm('#equal-form', '#equal-feedback');
  showStep('#step-move');
  $('#move-work input')?.focus();
};

$('#move-form').onsubmit = event => {
  event.preventDefault();
  const entries = moveOperationFields();
  const fields = entries.flatMap(entry => [entry.leftValue, entry.rightValue]);
  const results = entries.flatMap(entry => [
    signedInteger(entry.leftValue.value, entry.allowBareMinus) === entry.expected,
    signedInteger(entry.rightValue.value, entry.allowBareMinus) === entry.expected,
  ]);
  fields.forEach((field, fieldIndex) => mark(field, results[fieldIndex]));
  if (!results.every(Boolean)) {
    feedback('#move-feedback', 'Enter the opposite signed coefficient under both sides for each term on the right. Include + or −.', 'no');
    return;
  }
  lockForm('#move-form', '#move-feedback');
  $('#standard-form').hidden = false;
  $('#standard-a').focus();
};

$('#standard-form').onsubmit = event => {
  event.preventDefault();
  const fields = [$('#standard-a'), $('#standard-b'), $('#standard-c')];
  const values = fields.map((field, fieldIndex) => coefficientInteger(field.value, fieldIndex === 1));
  const expected = targetPolynomial();
  const results = values.map((value, fieldIndex) => Number.isSafeInteger(value) && value === expected[fieldIndex]);
  fields.forEach((field, fieldIndex) => mark(field, results[fieldIndex]));
  if (!results.every(Boolean)) {
    feedback('#standard-feedback', 'Combine the matching terms from both sides. Enter each signed coefficient in ax² + bx + c = 0.', 'no');
    return;
  }
  lockForm('#standard-form', '#standard-feedback');
  showStep('#step-box');
  $('#split-top').focus();
};

function updateBox() {
  if (splitConstants.length) return;
  const first = parseInteger($('#split-top').value);
  const second = parseInteger($('#split-side').value);
  const ready = Number.isSafeInteger(first) && Number.isSafeInteger(second);
  const [, b, c] = targetPolynomial();
  $('#top-product').textContent = Number.isSafeInteger(first) ? linearTerm(first, true) : '?';
  $('#side-product').textContent = Number.isSafeInteger(second) ? linearTerm(second, true) : '?';

  const productCorrect = ready && first * second === c;
  const sumCorrect = ready && first + second === b;
  mark($('#constant-cell'), ready ? productCorrect : undefined);
  mark($('#middle-term'), ready ? sumCorrect : undefined);
  $('#product-mark').textContent = ready ? productCorrect ? '✓' : '✗' : '';
  $('#sum-mark').textContent = ready ? sumCorrect ? '✓' : '✗' : '';
  $('#product-check').textContent = ready
    ? `${first} × ${second} = ${first * second}. ${productCorrect ? 'Product matches.' : `The product needs to be ${c}.`}`
    : 'Product: enter both integers.';
  $('#sum-check').textContent = ready
    ? `${first} + (${second}) = ${first + second}. ${sumCorrect ? 'Sum matches.' : `The sum needs to be ${b}.`}`
    : 'Sum: enter both integers.';
  $('#product-check').className = ready ? productCorrect ? 'condition-correct' : 'condition-incorrect' : '';
  $('#sum-check').className = ready ? sumCorrect ? 'condition-correct' : 'condition-incorrect' : '';
  $('#product-check').hidden = ready && productCorrect;
  $('#sum-check').hidden = ready && sumCorrect;
  if (ready && productCorrect && sumCorrect) {
    splitConstants = [first, second];
    repeated = first === second;
    $('#split-top').readOnly = true;
    $('#split-side').readOnly = true;
    $('#product-check').hidden = true;
    $('#sum-check').hidden = true;
    $('#split-feedback').textContent = '';
    $('#split-feedback').className = 'feedback';
    $('#split-feedback').hidden = true;
    $('#factor-second').hidden = repeated;
    $('#factor-middle').hidden = repeated;
    $('#factor-square').hidden = !repeated;
    $('#factor-close').textContent = ') = 0';
    showStep('#step-factors');
    $('#factor-first').focus();
  } else if (ready) {
    feedback('#split-feedback', 'Keep adjusting the two integers until both conditions match.', 'no');
  } else {
    $('#split-feedback').textContent = '';
    $('#split-feedback').className = 'feedback';
    $('#split-feedback').hidden = false;
  }
}

['#split-top', '#split-side'].forEach(selector => $(selector).addEventListener('input', updateBox));

$('#factor-form').onsubmit = event => {
  event.preventDefault();
  if (!splitConstants.length) return;
  const firstInput = $('#factor-first');
  const secondInput = $('#factor-second');
  const first = parseFactor(firstInput.value);
  const second = repeated ? first : parseFactor(secondInput.value);
  const expected = expectedFactors();
  const correct = Number.isSafeInteger(first) && Number.isSafeInteger(second)
    && (repeated ? first === expected[0]
      : first === expected[0] && second === expected[1]
        || first === expected[1] && second === expected[0]);
  mark(firstInput, Number.isSafeInteger(first) && correct);
  if (!repeated) mark(secondInput, Number.isSafeInteger(second) && correct);
  if (!correct) {
    feedback('#factor-feedback', 'Enter the complete factors, including x and each signed constant.', 'no');
    return;
  }
  splitConstants = [first, second];
  lockForm('#factor-form', '#factor-feedback');
  if (repeated) {
    $('#factor-second').hidden = true;
    $('#factor-middle').hidden = true;
    $('#factor-square').hidden = false;
    $('#factor-close').textContent = ') = 0';
  }
  showStep('#step-zero');
  $('#zero-second').hidden = repeated;
  $('#zero-middle').hidden = false;
  $('#zero-middle').textContent = repeated ? ' = 0' : ' = 0     ';
  $('#zero-close').hidden = repeated;
  $('#zero-first').focus();
};

function factorInputsMatch(firstValue, secondValue) {
  const first = parseFactor(firstValue);
  const second = repeated ? first : parseFactor(secondValue);
  if (!Number.isSafeInteger(first) || !Number.isSafeInteger(second)) return false;
  return repeated ? first === splitConstants[0]
    : first === splitConstants[0] && second === splitConstants[1]
      || first === splitConstants[1] && second === splitConstants[0];
}

$('#zero-form').onsubmit = event => {
  event.preventDefault();
  const first = $('#zero-first');
  const second = $('#zero-second');
  const correct = factorInputsMatch(first.value, second.value);
  mark(first, correct);
  if (!repeated) mark(second, correct);
  if (!correct) {
    feedback('#zero-feedback', 'Use the same factor or factors shown above, and set each equal to zero.', 'no');
    return;
  }
  lockForm('#zero-form', '#zero-feedback');
  const roots = expectedRoots();
  $('#root-entries').replaceChildren(...roots.map((root, rootIndex) => {
    const row = document.createElement('label');
    row.className = 'root-row';
    row.htmlFor = `root-${rootIndex}`;
    row.append(document.createTextNode(`Factor ${rootIndex + 1}: x = `));
    const input = document.createElement('input');
    input.id = `root-${rootIndex}`;
    input.inputMode = 'numeric';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', `Solution ${rootIndex + 1} for x`);
    row.append(input);
    return row;
  }));
  showStep('#step-roots');
  $('#root-0').focus();
};

$('#roots-form').onsubmit = event => {
  event.preventDefault();
  const inputs = [...$('#root-entries').querySelectorAll('input')];
  const values = inputs.map(input => parseInteger(input.value));
  const expected = expectedRoots();
  const correct = values.length === expected.length && values.every(Number.isSafeInteger)
    && (values.length === 1 ? values[0] === expected[0]
      : values[0] === expected[0] && values[1] === expected[1]
        || values[0] === expected[1] && values[1] === expected[0]);
  inputs.forEach((input, inputIndex) => mark(input, correct || values[inputIndex] === expected[inputIndex]));
  if (!correct) {
    feedback('#roots-feedback', 'Solve each factor equation for x. Enter both x-values in either order.', 'no');
    return;
  }
  solvedRoots = values;
  lockForm('#roots-form', '#roots-feedback');
  buildYStep();
  showStep('#step-y');
};

function buildYStep() {
  const quadratic = system().left;
  $('#substitution-instructions').textContent = `Use the first equation, y = ${polynomialText(quadratic)}, to find each y-value.`;
  $('#y-entries').replaceChildren(...solvedRoots.map((x, rowIndex) => {
    const row = document.createElement('div');
    row.className = 'substitution-row';
    const prompt = document.createElement('p');
    prompt.textContent = `For x = ${formatInteger(x)}:`;
    const equation = document.createElement('div');
    equation.className = 'substitution-equation';
    equation.append(document.createTextNode(`y = ${substitutionText(quadratic, x)} = `));
    const input = document.createElement('input');
    input.id = `y-value-${rowIndex}`;
    input.inputMode = 'numeric';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', `y-value when x equals ${x}`);
    equation.append(input);
    row.append(prompt, equation);
    return row;
  }));
}

$('#y-form').onsubmit = event => {
  event.preventDefault();
  const inputs = [...$('#y-entries').querySelectorAll('input')];
  const values = inputs.map(input => parseInteger(input.value));
  const expected = solvedRoots.map(x => evaluateQuadratic(system().left, x));
  const correct = values.length === expected.length && values.every((value, i) => Number.isSafeInteger(value) && value === expected[i]);
  inputs.forEach((input, inputIndex) => mark(input, Number.isSafeInteger(values[inputIndex]) && values[inputIndex] === expected[inputIndex]));
  if (!correct) {
    feedback('#y-feedback', 'Evaluate the substitution shown for each x-value.', 'no');
    return;
  }
  solvedYs = values;
  lockForm('#y-form', '#y-feedback');
  buildPairStep();
  showStep('#step-pairs');
};

function buildPairStep() {
  $('#pair-entries').replaceChildren(...solvedRoots.map((x, rowIndex) => {
    const row = document.createElement('div');
    row.className = 'ordered-pair-row';
    const label = document.createElement('span');
    label.textContent = `Solution ${rowIndex + 1}:`;
    const open = document.createElement('span');
    open.textContent = '(';
    const xInput = document.createElement('input');
    xInput.id = `pair-x-${rowIndex}`;
    xInput.inputMode = 'numeric';
    xInput.autocomplete = 'off';
    xInput.setAttribute('aria-label', `x-coordinate of solution ${rowIndex + 1}`);
    const comma = document.createElement('span');
    comma.textContent = ',';
    const yInput = document.createElement('input');
    yInput.id = `pair-y-${rowIndex}`;
    yInput.inputMode = 'numeric';
    yInput.autocomplete = 'off';
    yInput.setAttribute('aria-label', `y-coordinate of solution ${rowIndex + 1}`);
    const close = document.createElement('span');
    close.textContent = ')';
    row.append(label, open, xInput, comma, yInput, close);
    return row;
  }));
}

$('#pairs-form').onsubmit = event => {
  event.preventDefault();
  const expected = solvedRoots.map((x, i) => ({ x, y: solvedYs[i] }));
  const rows = [...$('#pair-entries').querySelectorAll('.ordered-pair-row')];
  const actual = rows.map((row, rowIndex) => ({
    x: parseInteger($(`#pair-x-${rowIndex}`).value),
    y: parseInteger($(`#pair-y-${rowIndex}`).value),
  }));
  const correct = orderedPairMatch(actual, expected);
  rows.forEach((row, rowIndex) => {
    const pairCorrect = correct || expected.some(pair => pair.x === actual[rowIndex].x && pair.y === actual[rowIndex].y);
    mark($(`#pair-x-${rowIndex}`), pairCorrect);
    mark($(`#pair-y-${rowIndex}`), pairCorrect);
  });
  if (!correct) {
    feedback('#pairs-feedback', 'Check that each ordered pair has the matching x- and y-values.', 'no');
    return;
  }
  lockForm('#pairs-form', '#pairs-feedback');
  const displayPairs = expected.map(pair => `(${formatInteger(pair.x)}, ${formatInteger(pair.y)})`);
  const count = displayPairs.length;
  $('#complete-text').textContent = `This system has ${count} ${count === 1 ? 'solution' : 'solutions'}: ${displayPairs.join(' and ')}.`;
  showStep('#complete');
  $('#reset').hidden = true;
  fireConfetti(180);
};

function selectProblem(value) {
  index = value;
  resetProblem();
}

systems.forEach((item, problemIndex) => {
  const label = `{ y = ${polynomialText(item.left)}; y = ${polynomialText(item.right)} }`;
  $('#problem-picker').add(new Option(label, String(problemIndex)));
});
$('#problem-picker').onchange = () => selectProblem(Number($('#problem-picker').value));
$('#algebraic-mode').onclick = () => setMethod('algebraic');
$('#graphical-mode').onclick = () => setMethod('graphical');
$('#reset').onclick = resetProblem;
$('#next-problem').onclick = () => {
  selectProblem((index + 1) % systems.length);
};

setMethod(activeMethod);
resetProblem();
