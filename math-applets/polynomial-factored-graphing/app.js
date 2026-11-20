import { parseInteger } from '../absolute-value-features/model.mjs';
import { drawCurve, drawGrid, graphLimit, horizontalScale, svgElement, yPixel } from '../absolute-value-features/graph.js?v=20261120p2b';
import { polynomialTails } from '../polynomial-features/graph.js?v=20261120p2b';
import { createPointPicker } from '../polynomial-features/point-picker.js?v=20261120p2c';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';
import { parseNumber } from '../quadratic-graphing/model.mjs';
import { problems } from './model.mjs?v=20261120p2e';

const picker = document.querySelector('#example-picker');
const plane = document.querySelector('#plane');
const equation = document.querySelector('#equation');
const complete = document.querySelector('#complete');
const nextExample = document.querySelector('#next-example');
const zeroInputs = document.querySelector('#zero-inputs');
const tailOptions = document.querySelector('#tail-options');
const tailButtons = [...tailOptions.querySelectorAll('button')];
const turnOptions = document.querySelector('#turn-options');
const turnButtons = [...turnOptions.querySelectorAll('button')];
const turnInstruction = document.querySelector('#turn-instruction');
const questions = [...document.querySelectorAll('#questions .fq')];
const [degree, maxTurns, yIntercept, singleRoots, repeatedRoots, zeros, plotY, plotX,
  rightEnd, leftEnd, turningPoints] = questions;
const pointPicker = createPointPicker(plane, document.querySelector('#plot-dialog'), {
  projectX: x => projectX(x),
});
const intervalLayer = svgElement('g', { 'aria-hidden': 'true' });
const curveLayer = svgElement('g', { 'aria-hidden': 'true' });
let problem;
let activeQuestion;
let xBounds;
let projectX;
let turnCenter;

function feedback(question, message = '') {
  const status = question.querySelector('.feedback');
  status.textContent = message;
  status.className = message ? 'feedback no' : 'feedback';
}

function markControl(input, correct) {
  input.classList.toggle('invalid', !correct);
  input.setAttribute('aria-invalid', String(!correct));
  return correct;
}

function advance(question, next = question.nextElementSibling) {
  feedback(question);
  question.classList.add('done');
  question.querySelectorAll('input').forEach(input => { input.disabled = true; });
  question.querySelectorAll('button').forEach(button => { button.hidden = true; });
  if (!next) {
    activeQuestion = null;
    complete.hidden = false;
    fireConfetti(180);
    nextExample.focus();
    return;
  }
  showQuestion(next);
}

function showQuestion(question) {
  activeQuestion = question;
  question.classList.add('active');
  const startGraphStep = graphSteps.get(question);
  if (startGraphStep) startGraphStep();
  else question.querySelector('input, button')?.focus();
}

function onSubmit(question, handle) {
  question.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    if (activeQuestion === question) handle(event.submitter);
  });
}

function checkNumbers(question, answers, hint, correctAnswer, parse = parseInteger) {
  const inputs = [...question.querySelectorAll('input')];
  onSubmit(question, () => {
    const values = inputs.map(input => parse(input.value));
    const expected = answers(problem);
    const correct = inputs.map((input, index) =>
      markControl(input, values[index] === expected[index]));
    if (correct.every(Boolean)) correctAnswer(values);
    else feedback(question, hint);
  });
}

checkNumbers(degree, p => [p.degree], 'Add the exponents on the factors. A factor without an exponent has exponent 1.',
  () => advance(degree));
checkNumbers(maxTurns, p => [p.degree - 1], 'The maximum possible number of turns is one less than the degree.',
  () => advance(maxTurns));
checkNumbers(yIntercept, p => [p.yIntercept], 'Substitute 0 for x in every factor and multiply.',
  () => advance(yIntercept), parseNumber);

function buildZeroInputs(doubleCount, tripleCount) {
  const singleCount = problem.degree - 2 * doubleCount - 3 * tripleCount;
  zeroInputs.replaceChildren(...Array.from({ length: singleCount + doubleCount + tripleCount }, (_, index) => {
    const input = document.createElement('input');
    input.className = 'coord';
    input.inputMode = 'text';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', `Zero ${index + 1}`);
    return input;
  }));
}

onSubmit(singleRoots, button => {
  if (!button?.value) return;
  const allSingle = problem.counts.double === 0 && problem.counts.triple === 0;
  if ((button.value === 'yes') !== allSingle) {
    button.classList.add('invalid');
    button.disabled = true;
    feedback(singleRoots, 'Check the exponent on each factor for repeated roots.');
  } else if (allSingle) {
    buildZeroInputs(0, 0);
    advance(singleRoots, zeros);
  } else {
    advance(singleRoots);
  }
});

checkNumbers(repeatedRoots, p => [p.counts.double, p.counts.triple],
  'Count the factors raised to the second and third powers separately. Enter 0 if there are none.',
  ([doubles, triples]) => {
    buildZeroInputs(doubles, triples);
    advance(repeatedRoots);
  });

onSubmit(zeros, () => {
  const inputs = [...zeroInputs.querySelectorAll('input')];
  const values = inputs.map(input => parseInteger(input.value));
  const correct = inputs.map((input, index) => {
    const value = values[index];
    return markControl(input, problem.roots.includes(value) && values.indexOf(value) === values.lastIndexOf(value));
  });
  if (correct.every(Boolean)) advance(zeros);
  else feedback(zeros, 'Set each factor equal to zero. Enter each distinct x-value once.');
});

function plotYIntercept() {
  pointPicker.start({
    title: `Plot (0, ${problem.yIntercept})`,
    targets: [{ x: 0, y: problem.yIntercept }],
    wrongMessage: 'Place the point on the y-axis at the y-intercept you found.',
    onComplete: () => advance(plotY),
  });
}

function plotXIntercepts() {
  pointPicker.start({
    title: 'Plot each x-intercept',
    targets: problem.roots.map(x => ({ x, y: 0 })),
    wrongMessage: 'Place a point on the x-axis at a zero you found. Select each zero once for this step.',
    onComplete: () => advance(plotX),
  });
}

function chooseTail(side) {
  tailOptions.dataset.side = side;
  tailOptions.setAttribute('aria-label', `${side === 'right' ? 'Right' : 'Left'} end-behavior choices`);
  tailOptions.hidden = false;
  tailButtons.forEach(button => {
    button.disabled = false;
    button.classList.remove('invalid');
  });
  tailButtons[0].focus();
}

tailButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (activeQuestion !== rightEnd && activeQuestion !== leftEnd) return;
    const right = activeQuestion === rightEnd;
    const expected = right ? problem.rightEnd : problem.leftEnd;
    if (Number(button.dataset.direction) !== expected) {
      button.classList.add('invalid');
      button.disabled = true;
      feedback(activeQuestion, right
        ? 'Use the leading coefficient sign to decide which way the right end points.'
        : 'Use the degree’s parity to decide whether the left end matches the right end.');
      return;
    }

    const [leftBound, rightBound] = polynomialTails(problem, xBounds);
    const left = right ? problem.roots.at(-1) : leftBound;
    const rightEdge = right ? rightBound : problem.roots[0];
    drawCurve(curveLayer, problem.evaluate, left, rightEdge, {
      leftArrow: !right, rightArrow: right, projectX,
    });
    tailOptions.hidden = true;
    advance(activeQuestion);
  });
});

turnButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (turnOptions.hidden) return;
    if (!pointPicker.selectAt(turnCenter, yPixel(Number(button.dataset.direction)))) {
      button.classList.add('invalid');
      button.disabled = true;
    }
  });
});

function plotTurn(index = 0) {
  const turn = problem.interiorTurns[index];
  if (!turn) {
    turnOptions.hidden = true;
    intervalLayer.replaceChildren();
    turnInstruction.textContent = '';
    advance(turningPoints);
    return;
  }
  const left = problem.roots[index];
  const right = problem.roots[index + 1];
  const leftPixel = projectX(left);
  const rightPixel = projectX(right);
  const midpoint = (left + right) / 2;
  const graphWidth = plane.viewBox.baseVal.width;
  turnCenter = projectX(midpoint);
  const top = yPixel(graphLimit);
  const bottom = yPixel(-graphLimit);
  const axis = yPixel(0);
  const side = Math.sign(turn.y);
  intervalLayer.replaceChildren(svgElement('rect', {
    x: leftPixel, y: top, width: rightPixel - leftPixel, height: bottom - top, class: 'turn-interval',
  }));
  turnInstruction.textContent = `Between x = ${left} and x = ${right}, choose Above or Below for the turning point.`;
  turnOptions.style.left = `${leftPixel / graphWidth * 100}%`;
  turnOptions.style.width = `${(rightPixel - leftPixel) / graphWidth * 100}%`;
  turnOptions.hidden = false;
  turnButtons.forEach(button => {
    button.disabled = false;
    button.classList.remove('invalid');
  });
  pointPicker.start({
    title: `Choose above or below the x-axis between x = ${left} and x = ${right}.`,
    startX: midpoint,
    accepts: (x, y) => x > leftPixel && x < rightPixel && y >= top && y <= bottom && side * (axis - y) > 2,
    wrongMessage: 'Click inside the shaded interval on the side where the polynomial has the correct sign.',
    onComplete: () => {
      drawCurve(curveLayer, problem.evaluate, left, right, { projectX });
      plotTurn(index + 1);
    },
  });
  turnButtons[0].focus({ preventScroll: true });
}

const graphSteps = new Map([
  [plotY, plotYIntercept],
  [plotX, plotXIntercepts],
  [rightEnd, () => chooseTail('right')],
  [leftEnd, () => chooseTail('left')],
  [turningPoints, plotTurn],
]);

function span(text, className = '') {
  const part = document.createElement('span');
  part.textContent = text;
  part.className = className;
  return part;
}

function renderEquation() {
  const { numerator, denominator, factors } = problem;
  equation.replaceChildren(span('f(x) ='));
  const magnitude = Math.abs(numerator);
  if (numerator < 0) equation.append(span('−'));
  if (denominator === 1) {
    equation.append(span(magnitude));
  } else {
    const fraction = span('', 'fraction');
    fraction.setAttribute('aria-hidden', 'true');
    fraction.append(span(magnitude, 'numerator'), span(denominator, 'denominator'));
    equation.append(span(`${magnitude} over ${denominator}`, 'sr-only'), fraction);
  }
  const orderedFactors = factors.filter(([root]) => root !== 0);
  const originFactor = factors.find(([root]) => root === 0);
  if (originFactor) orderedFactors.unshift(originFactor);
  for (const [root, power] of orderedFactors) {
    const factor = span(root === 0 ? 'x' : `(x ${root < 0 ? '+' : '−'} ${Math.abs(root)})`);
    if (power > 1) {
      const exponent = document.createElement('sup');
      exponent.textContent = power;
      factor.append(exponent);
    }
    equation.append(factor);
  }
}

function render() {
  problem = problems[picker.selectedIndex];
  xBounds = {
    xMin: Math.min(0, problem.roots[0]) - 1,
    xMax: Math.max(0, problem.roots.at(-1)) + 1,
  };
  projectX = horizontalScale(xBounds.xMin, xBounds.xMax);
  clearConfetti();
  complete.hidden = true;
  tailOptions.hidden = true;
  turnOptions.hidden = true;
  zeroInputs.replaceChildren();
  turnInstruction.textContent = '';
  questions.forEach(question => {
    question.classList.remove('active', 'done');
    question.querySelector('form')?.reset();
    question.querySelectorAll('input, button').forEach(control => {
      control.disabled = false;
      control.hidden = false;
      control.classList.remove('invalid');
      control.removeAttribute('aria-invalid');
    });
    feedback(question);
  });
  renderEquation();
  plane.replaceChildren(svgElement('title', { id: 'graph-title' }, 'Coordinate plane for plotting the polynomial'));
  intervalLayer.replaceChildren();
  plane.append(intervalLayer);
  drawGrid(plane, { ...xBounds, xStep: 1 });
  curveLayer.replaceChildren();
  plane.append(curveLayer);
  pointPicker.reset();
  activeQuestion = degree;
  degree.classList.add('active');
}

problems.forEach((_, index) => picker.add(new Option(String(index + 1), index)));
picker.addEventListener('change', render);
nextExample.addEventListener('click', () => {
  picker.selectedIndex = (picker.selectedIndex + 1) % problems.length;
  render();
  document.querySelector('#degree').focus();
});
render();
