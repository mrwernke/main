import { drawCurve, drawGrid, horizontalScale, svgElement, verticalScale } from '../absolute-value-features/graph.js';
import { createPointPicker } from '../polynomial-features/point-picker.js?v=20261125p1d';
import { polynomialText, checkInteger } from '../polynomial-synthetic-division/model.mjs?v=20261123n';
import { renderSyntheticBoard, numberText } from '../polynomial-synthetic-division/board.mjs?v=20261123a';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';
import { problems, evaluate, graphLimitFor, nextTableValues, syntheticSubstitution, tailExtent } from './model.mjs?v=20261125p1e';

const $ = selector => document.querySelector(selector);
const plane = $('#plane');
const picker = $('#example-picker');
const fields = $('#question-fields');
const calculation = $('#calculation');
const feedback = $('#feedback');
const tableFeedback = $('#table-feedback');
const sketchFeedback = $('#sketch-feedback');
const projectX = horizontalScale(-4, 4);
let projectY;
const pointPicker = createPointPicker(plane, $('#plot-dialog'), {
  projectX, projectY: y => projectY(y),
  yTolerance: () => (projectY(0) - projectY(1)) / 2,
  yStep: event => (projectY(0) - projectY(1)) * (event.shiftKey ? 10 : 1),
});
const curveLayer = svgElement('g', { class: 'curve-segments', 'aria-hidden': 'true' });
const endLayer = svgElement('g', { class: 'end-behavior-arrows', 'aria-hidden': 'true' });
let problem;
let phase;
let yLimit;
let values;
let trial;
let column;
let currentX;
let segments;
let coefficientsEntered;

function message(element, text = '', correct = false) {
  element.textContent = text;
  element.className = text ? `feedback ${correct ? 'ok' : 'no'}` : 'feedback';
}

function field(label) {
  const element = document.createElement('input');
  element.type = 'text';
  element.autocomplete = 'off';
  element.setAttribute('aria-label', label);
  return element;
}

function endChoice(label) {
  const wrapper = document.createElement('label');
  const select = document.createElement('select');
  select.setAttribute('aria-label', label);
  select.append(new Option('Choose', ''), new Option('Up', '1'), new Option('Down', '-1'));
  wrapper.append(`${label}: `, select);
  return wrapper;
}

function renderQuestion() {
  fields.replaceChildren();
  message(feedback);
  $('#check-button').hidden = ['plot-intercept', 'table', 'sketch', 'complete'].includes(phase);
  const title = $('#question-title');
  const note = $('#question-note');
  if (phase === 'degree') {
    title.textContent = 'Identify the degree.';
    note.textContent = 'Look at the greatest exponent.';
    fields.append(field('Degree'));
  } else if (phase === 'leading') {
    title.textContent = 'Identify the leading coefficient.';
    note.textContent = 'Include its sign.';
    fields.append(field('Leading coefficient'));
  } else if (phase === 'ends') {
    title.textContent = 'Identify the end behavior.';
    note.textContent = 'Choose the direction of each end of the graph.';
    fields.append(endChoice('Left end'), endChoice('Right end'));
  } else if (phase === 'intercept') {
    title.textContent = 'Identify the y-intercept.';
    note.textContent = 'Substitute 0 for x.';
    fields.append('(0, ', field('y-intercept'), ')');
  } else if (phase === 'plot-intercept') {
    title.textContent = 'Plot the y-intercept.';
    note.textContent = 'Find the point on the y-axis before evaluating more values.';
  } else if (phase === 'direct') {
    title.textContent = `Find f(${numberText(currentX)}) by direct substitution.`;
    note.textContent = 'Evaluate the expression and enter the result.';
    const answer = document.createElement('div');
    answer.className = 'direct-answer';
    answer.append('f(', numberText(currentX), ') = ', field('Substitution result'));
    calculation.append(answer);
  } else if (phase === 'coefficients') {
    title.textContent = 'Enter the coefficients for synthetic substitution.';
    note.textContent = 'Use descending powers and include 0 for missing terms.';
  } else if (phase === 'bring') {
    title.textContent = 'Bring down the first coefficient.';
    note.textContent = 'Copy the leading coefficient below the line.';
  } else if (phase === 'multiply') {
    title.textContent = 'Multiply.';
    note.textContent = `Multiply ${numberText(currentX)} by ${numberText(trial.results[column - 1])}.`;
  } else if (phase === 'add') {
    title.textContent = 'Add the column.';
    note.textContent = `Add ${numberText(trial.dividend[column])} and ${numberText(trial.products[column - 1])}.`;
  } else if (phase === 'solution-counts') {
    title.textContent = 'How many real and non-real complex solutions are there?';
    note.textContent = 'Count distinct real solutions. A double root touches the x-axis and counts once as a real solution, but twice toward the degree.';
    const real = document.createElement('label');
    real.append('Real: ', field('Real solutions'));
    const complex = document.createElement('label');
    complex.append('Non-real complex: ', field('Non-real complex solutions'));
    fields.append(real, complex);
  } else {
    title.textContent = phase === 'sketch' ? 'Connect your plotted points.' : '';
    note.textContent = phase === 'sketch' ? 'Choose each interval to reveal the corresponding curve segment.' : '';
  }
  const active = fields.querySelector('input, select') || calculation.querySelector('input');
  if (active && !['plot-intercept', 'table', 'sketch', 'complete'].includes(phase)) active.focus();
}

function mark(element, correct) {
  element.classList.toggle('invalid', !correct);
  element.setAttribute('aria-invalid', String(!correct));
  return correct;
}

function addFeature(text) {
  const row = document.createElement('p');
  row.textContent = text;
  $('#feature-summary').append(row);
}

function addEndBehavior() {
  const row = document.createElement('p');
  row.className = 'end-behavior-summary';
  const text = `As x → −∞, f(x) → ${problem.leftEnd > 0 ? '∞' : '−∞'}; as x → ∞, f(x) → ${problem.rightEnd > 0 ? '∞' : '−∞'}.`;
  text.split('∞').forEach((part, index) => {
    if (index) {
      const infinity = document.createElement('span');
      infinity.className = 'infinity';
      infinity.textContent = '∞';
      row.append(infinity);
    }
    row.append(part);
  });
  $('#feature-summary').append(row);
}

function substitutionText(coefficients, x) {
  const powers = ['', '', '²', '³', '⁴', '⁵'];
  return coefficients.flatMap((coefficient, index) => {
    if (!coefficient) return [];
    const power = coefficients.length - index - 1;
    const magnitude = Math.abs(coefficient);
    const variable = power ? `(${numberText(x)})${power > 1 ? powers[power] : ''}` : '';
    const body = `${power && magnitude === 1 ? '' : magnitude}${variable}`;
    return [{ sign: coefficient < 0 ? '−' : '+', body }];
  }).map(({ sign, body }, index) => `${index ? ` ${sign} ` : sign === '−' ? '−' : ''}${body}`).join('');
}

function renderTable() {
  const body = $('#table-body');
  body.replaceChildren();
  for (let value = -4; value <= 4; value++) {
    const item = values.find(point => point.x === value);
    const row = document.createElement('tr');
    const x = document.createElement('td');
    const y = document.createElement('td');
    const action = document.createElement('td');
    x.textContent = numberText(value);
    if (item) y.textContent = numberText(item.y);
    else y.setAttribute('aria-label', 'Not yet calculated');
    if (item?.plotted) action.textContent = 'Plotted';
    else if (item && phase !== 'plot-intercept') {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Plot';
      button.setAttribute('aria-label', `Plot (${item.x}, ${item.y})`);
      button.disabled = phase !== 'table' || pointPicker.active;
      button.addEventListener('click', () => plotPoint(item));
      action.append(button);
    }
    row.append(x, y, action);
    body.append(row);
  }
  const next = nextTableValues(values.map(item => item.x));
  $('#next-x').replaceChildren(...next.map(x => new Option(numberText(x), String(x))));
  const busy = phase !== 'table' || pointPicker.active;
  $('#method').disabled = busy;
  $('#next-x').disabled = busy || !next.length;
  $('#calculate').disabled = busy || !next.length;
  $('#sketch').disabled = busy;
}

function plotPoint(item) {
  if (!['table', 'plot-intercept'].includes(phase) || pointPicker.active) return;
  message(tableFeedback);
  pointPicker.start({
    title: `Plot (${numberText(item.x)}, ${numberText(item.y)}).`,
    targets: [{ x: item.x, y: item.y }],
    startX: item.x,
    wrongMessage: 'Check the x-coordinate and the y-axis scale, then try again.',
    onComplete: () => {
      item.plotted = true;
      if (phase === 'plot-intercept') {
        phase = 'table';
        $('#table-controls').hidden = false;
        $('#sketch').hidden = false;
        renderQuestion();
      }
      renderTable();
      message(tableFeedback, `(${numberText(item.x)}, ${numberText(item.y)}) plotted.`, true);
    },
  });
  renderTable();
}

function addTableValue(x, y) {
  values.push({ x, y, plotted: false });
  const nextLimit = graphLimitFor(problem.dividend, Math.max(2.5, ...values.map(item => Math.abs(item.x))));
  if (nextLimit !== yLimit) {
    yLimit = nextLimit;
    projectY = verticalScale(yLimit);
    drawPlane();
  }
  phase = 'table';
  renderQuestion();
  renderTable();
  message(tableFeedback, `f(${numberText(x)}) = ${numberText(y)}. Plot it or calculate another value.`, true);
}

$('#calculate').addEventListener('click', () => {
  if (phase !== 'table' || pointPicker.active) return;
  currentX = Number($('#next-x').value);
  message(tableFeedback);
  calculation.replaceChildren();
  if ($('#method').value === 'direct') {
    phase = 'direct';
    const expression = document.createElement('p');
    expression.className = 'math';
    expression.textContent = `f(${numberText(currentX)}) = ${substitutionText(problem.dividend, currentX)}`;
    calculation.append(expression);
  } else {
    trial = syntheticSubstitution(problem.dividend, currentX);
    column = 0;
    phase = coefficientsEntered ? 'bring' : 'coefficients';
    const heading = document.createElement('p');
    heading.textContent = `Synthetic substitution with x = ${numberText(currentX)}:`;
    const board = document.createElement('div');
    board.id = 'division';
    board.className = 'division math';
    board.setAttribute('aria-label', 'Synthetic substitution work');
    calculation.append(heading, board);
    renderSyntheticBoard(board, trial, phase, column);
  }
  renderQuestion();
  renderTable();
});

$('#question').addEventListener('submit', event => {
  event.preventDefault();
  if (['degree', 'leading', 'intercept', 'direct'].includes(phase)) {
    const input = phase === 'direct' ? calculation.querySelector('input') : fields.querySelector('input');
    const answer = phase === 'degree' ? problem.degree : phase === 'leading' ? problem.leading
      : phase === 'intercept' ? problem.yIntercept : evaluate(problem.dividend, currentX);
    if (!mark(input, checkInteger(input.value, answer))) {
      message(feedback, 'Check your answer and try again.');
      return;
    }
    if (phase === 'degree') { addFeature(`Degree: ${answer}`); phase = 'leading'; }
    else if (phase === 'leading') { addFeature(`Leading coefficient: ${numberText(answer)}`); phase = 'ends'; }
    else if (phase === 'intercept') {
      addFeature(`y-intercept: (0, ${numberText(answer)})`);
      values.push({ x: 0, y: answer, plotted: false });
      phase = 'plot-intercept';
      $('#table-section').hidden = false;
      renderQuestion();
      renderTable();
      plotPoint(values[0]);
      return;
    } else {
      input.disabled = true;
      addTableValue(currentX, answer);
      return;
    }
  } else if (phase === 'ends') {
    const inputs = [...fields.querySelectorAll('select')];
    const expected = [problem.leftEnd, problem.rightEnd];
    const matches = inputs.map((input, index) => mark(input, input.value !== '' && Number(input.value) === expected[index]));
    if (!matches.every(Boolean)) {
      message(feedback, 'Use the degree and the sign of the leading coefficient.');
      return;
    }
    addEndBehavior();
    showEndBehavior();
    phase = 'intercept';
  } else if (['coefficients', 'bring', 'multiply', 'add'].includes(phase)) {
    const board = $('#division');
    const inputs = [...board.querySelectorAll('.division-input')];
    const answers = phase === 'coefficients' ? trial.dividend : [phase === 'bring' ? trial.results[0]
      : phase === 'multiply' ? trial.products[column - 1] : trial.results[column]];
    const matches = inputs.map((input, index) => mark(input, checkInteger(input.value, answers[index])));
    if (!matches.every(Boolean)) {
      message(feedback, 'Check the highlighted numbers and try again.');
      return;
    }
    if (phase === 'coefficients') { coefficientsEntered = true; phase = 'bring'; }
    else if (phase === 'bring') { column = 1; phase = 'multiply'; }
    else if (phase === 'multiply') phase = 'add';
    else if (column === trial.dividend.length - 1) {
      renderSyntheticBoard(board, trial, 'final', column);
      const reminder = document.createElement('p');
      reminder.textContent = `The remainder is f(${numberText(currentX)}) = ${numberText(trial.remainder)}.`;
      calculation.append(reminder);
      addTableValue(currentX, trial.remainder);
      return;
    } else { column++; phase = 'multiply'; }
    renderSyntheticBoard(board, trial, phase, column);
  } else if (phase === 'solution-counts') {
    const inputs = [...fields.querySelectorAll('input')];
    const answers = [problem.realCount, problem.complexCount];
    const matches = inputs.map((input, index) => mark(input, checkInteger(input.value, answers[index])));
    if (!matches.every(Boolean)) {
      message(feedback, 'Check the x-intercepts and account for any double root before counting non-real solutions.');
      return;
    }
    addFeature(`Distinct real solutions: ${problem.realCount}; non-real complex solutions: ${problem.complexCount}.`);
    if (problem.doubleRoots) addFeature('The graph touches the x-axis at a double root, which counts as one distinct real solution.');
    phase = 'complete';
    $('#complete').hidden = false;
    fireConfetti(180);
    renderQuestion();
    $('#next-example').focus();
    return;
  } else return;
  renderQuestion();
});

function connectSegment(index) {
  if (phase !== 'sketch') return;
  const segment = segments[index];
  if (!segment || segment.done) {
    message(sketchFeedback, 'Choose an interval that has not been connected yet.');
    return;
  }
  segment.done = true;
  drawCurve(curveLayer, x => evaluate(problem.dividend, x), segment.left.x, segment.right.x, { projectX, projectY });
  segment.button.disabled = true;
  message(sketchFeedback, `Connected x = ${numberText(segment.left.x)} to x = ${numberText(segment.right.x)}.`, true);
  if (!segments.every(item => item.done)) return;
  const first = segments[0].left.x;
  const last = segments.at(-1).right.x;
  const solutionLimit = graphLimitFor(problem.dividend);
  const rescaled = yLimit !== solutionLimit;
  if (rescaled) {
    yLimit = solutionLimit;
    projectY = verticalScale(yLimit);
    curveLayer.replaceChildren();
    drawPlane();
    const left = tailExtent(problem.dividend, -2.5, -1, yLimit);
    const right = tailExtent(problem.dividend, 2.5, 1, yLimit);
    drawCurve(curveLayer, x => evaluate(problem.dividend, x), left, right, { projectX, projectY, leftArrow: true, rightArrow: true });
  } else {
    const left = tailExtent(problem.dividend, first, -1, yLimit);
    const right = tailExtent(problem.dividend, last, 1, yLimit);
    drawCurve(curveLayer, x => evaluate(problem.dividend, x), left, left === first ? first + 0.1 : first, { projectX, projectY, leftArrow: true });
    drawCurve(curveLayer, x => evaluate(problem.dividend, x), right === last ? last - 0.1 : last, right, { projectX, projectY, rightArrow: true });
  }
  endLayer.replaceChildren();
  $('#ends-key').hidden = true;
  phase = 'solution-counts';
  plane.classList.remove('sketching');
  renderQuestion();
  message(sketchFeedback, rescaled
    ? 'All intervals are connected. The graph is rescaled to show its roots and turns; points outside the grid remain in the table.'
    : 'All intervals are connected. The arrows show the ends of the graph.', true);
}

$('#sketch').addEventListener('click', () => {
  if (phase !== 'table' || pointPicker.active) return;
  if (!values.some(item => item.x === -1) || !values.some(item => item.x === 1)) {
    message(tableFeedback, 'Find and plot at least x = 0, −1, and 1 before sketching.');
    return;
  }
  if (values.some(item => !item.plotted)) {
    message(tableFeedback, 'Plot every value in your table before sketching.');
    return;
  }
  phase = 'sketch';
  calculation.replaceChildren();
  message(tableFeedback);
  const sorted = [...values].sort((a, b) => a.x - b.x);
  const buttons = $('#segment-buttons');
  buttons.replaceChildren();
  segments = sorted.slice(1).map((right, index) => {
    const left = sorted[index];
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${numberText(left.x)} to ${numberText(right.x)}`;
    button.setAttribute('aria-label', `Connect (${left.x}, ${left.y}) to (${right.x}, ${right.y})`);
    button.addEventListener('click', () => connectSegment(index));
    buttons.append(button);
    return { left, right, button, done: false };
  });
  $('#sketch-controls').hidden = false;
  plane.classList.add('sketching');
  renderQuestion();
  renderTable();
  buttons.querySelector('button').focus();
});

plane.addEventListener('click', event => {
  if (phase !== 'sketch') return;
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(plane.getScreenCTM().inverse());
  if (point.y < 20 || point.y > 500) return;
  const x = (point.x - 20) / 60 - 4;
  const index = segments.findIndex(segment => x > segment.left.x && x < segment.right.x);
  if (index < 0) message(sketchFeedback, 'Click between two neighboring plotted points.');
  else connectSegment(index);
});

function showEndBehavior() {
  endLayer.replaceChildren(...[
    [35, problem.leftEnd],
    [485, problem.rightEnd],
  ].map(([x, direction]) => {
    const tip = direction > 0 ? 40 : 480;
    const base = direction > 0 ? 105 : 415;
    return svgElement('path', {
      d: `M ${x} ${base} V ${tip} M ${x - 7} ${tip + direction * 9} L ${x} ${tip} L ${x + 7} ${tip + direction * 9}`,
    });
  }));
  $('#ends-key').hidden = false;
}

function drawPlane() {
  plane.replaceChildren(svgElement('title', { id: 'graph-title' }, 'Coordinate plane for plotting the polynomial'));
  drawGrid(plane, { xMin: -4, xMax: 4, xStep: 1, yLimit,
    yStep: yLimit / 5, yGridStep: yLimit / 10 });
  plane.append(endLayer, curveLayer);
  pointPicker.reset();
  values.filter(item => item.plotted && Math.abs(item.y) <= yLimit).forEach(item => pointPicker.markPoint(item));
}

function reset() {
  problem = problems[picker.selectedIndex];
  phase = 'degree';
  values = [];
  segments = [];
  coefficientsEntered = false;
  yLimit = graphLimitFor(problem.dividend);
  projectY = verticalScale(yLimit);
  clearConfetti();
  $('#complete').hidden = true;
  $('#table-section').hidden = true;
  $('#table-controls').hidden = true;
  $('#sketch').hidden = true;
  $('#ends-key').hidden = true;
  $('#sketch-controls').hidden = true;
  $('#feature-summary').replaceChildren();
  calculation.replaceChildren();
  $('#method').value = 'direct';
  message(tableFeedback);
  message(sketchFeedback);
  $('#equation').textContent = `f(x) = ${polynomialText(problem.dividend)}`;
  plane.classList.remove('sketching');
  endLayer.replaceChildren();
  curveLayer.replaceChildren();
  drawPlane();
  renderQuestion();
}

problems.forEach((problem, index) => picker.add(new Option(`${index + 1}: ${polynomialText(problem.dividend)}`, index)));
picker.addEventListener('change', reset);
$('#try-again').addEventListener('click', reset);
$('#next-example').addEventListener('click', () => {
  picker.selectedIndex = (picker.selectedIndex + 1) % problems.length;
  reset();
});
reset();
