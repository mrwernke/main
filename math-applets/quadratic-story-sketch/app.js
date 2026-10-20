import {
  examples, openingChoices, sameSketch, sketchParameters, validSketches,
  vertexChoices, yInterceptChoices,
} from './model.mjs';

const $ = selector => document.querySelector(selector);
let exampleIndex = 0;

const item = () => examples[exampleIndex];
const shuffle = values => {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

function setFeedback(selector, message) {
  const element = $(selector);
  element.textContent = message;
  element.hidden = false;
  element.className = 'feedback q8-feedback no';
}

function revealStep(selector) {
  const step = $(selector);
  step.hidden = false;
  step.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function finishChoice(button, containerSelector, stepSelector, feedbackSelector, nextStepSelector) {
  const options = [...$(containerSelector).querySelectorAll('button')];
  options.forEach(option => option.classList.remove('invalid'));
  const selectedIsCorrect = button.dataset.correct === 'true';
  if (!selectedIsCorrect) {
    button.classList.add('invalid');
    setFeedback(feedbackSelector, 'Not yet. Recheck the story clue and compare it with this choice.');
    return;
  }

  button.classList.add('correct');
  options.forEach(option => { option.disabled = true; });
  $(stepSelector).classList.add('complete');
  $(feedbackSelector).hidden = true;
  if (nextStepSelector) {
    revealStep(nextStepSelector);
  } else {
    $('#complete-text').textContent = `Your sketch matches the story: ${graphDescription(item())}.`;
    $('#complete').hidden = false;
    $('#complete').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function svgElement(tag, attributes = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
  return element;
}

function addGraphLine(svg, x1, y1, x2, y2, className) {
  svg.append(svgElement('line', { x1, y1, x2, y2, class: className }));
}

function drawSketch(svg, spec, clipId) {
  const width = 230;
  const height = 170;
  const plot = { left: 25, right: 214, top: 12, bottom: 145 };
  const plotWidth = plot.right - plot.left;
  const plotHeight = plot.bottom - plot.top;
  const { a, h, k } = sketchParameters(spec);
  const xMin = Math.min(-1, h - 3);
  const xMax = Math.max(3, h + 3);
  const yAt = x => a * (x - h) ** 2 + k;
  const visibleY = [k, yAt(0), yAt(xMin), yAt(xMax)];
  const ySpan = Math.max(...visibleY) - Math.min(...visibleY);
  const yPadding = Math.max(0.5, ySpan * 0.12);
  const yMin = Math.min(...visibleY) - yPadding;
  const yMax = Math.max(...visibleY) + yPadding;
  const xPixel = x => plot.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const yPixel = y => plot.top + ((yMax - y) / (yMax - yMin)) * plotHeight;
  const xAxisY = yPixel(0);
  const yAxisX = xPixel(0);

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.append(svgElement('rect', { x: 0, y: 0, width, height, class: 'q8-graph-background' }));

  const definitions = svgElement('defs');
  const clip = svgElement('clipPath', { id: clipId });
  clip.append(svgElement('rect', {
    x: plot.left, y: plot.top, width: plotWidth, height: plotHeight,
  }));
  definitions.append(clip);
  svg.append(definitions);

  for (let value = Math.ceil(xMin); value <= Math.floor(xMax); value += 1) {
    if (value !== 0) addGraphLine(svg, xPixel(value), plot.top, xPixel(value), plot.bottom, 'q8-grid');
  }
  for (let value = Math.ceil(yMin); value <= Math.floor(yMax); value += 1) {
    if (value !== 0) addGraphLine(svg, plot.left, yPixel(value), plot.right, yPixel(value), 'q8-grid');
  }
  addGraphLine(svg, plot.left, xAxisY, plot.right, xAxisY, 'q8-axis');
  addGraphLine(svg, yAxisX, plot.top, yAxisX, plot.bottom, 'q8-axis');
  svg.append(svgElement('path', {
    d: `M ${plot.right - 6} ${xAxisY - 4} L ${plot.right} ${xAxisY} L ${plot.right - 6} ${xAxisY + 4} M ${yAxisX - 4} ${plot.top + 6} L ${yAxisX} ${plot.top} L ${yAxisX + 4} ${plot.top + 6}`,
    class: 'q8-axis-arrow',
  }));

  const curveGroup = svgElement('g', { 'clip-path': `url(#${clipId})` });
  const path = [];
  const sampleCount = 96;
  for (let index = 0; index <= sampleCount; index += 1) {
    const x = xMin + ((xMax - xMin) * index) / sampleCount;
    const y = yAt(x);
    path.push(`${index === 0 ? 'M' : 'L'} ${xPixel(x).toFixed(2)} ${yPixel(y).toFixed(2)}`);
  }
  curveGroup.append(svgElement('path', { d: path.join(' '), class: 'q8-curve' }));
  curveGroup.append(svgElement('circle', {
    cx: xPixel(h), cy: yPixel(k), r: 3.3, class: 'q8-vertex-dot',
  }));
  svg.append(curveGroup);

  const xLabel = svgElement('text', { x: plot.right - 1, y: xAxisY - 8, class: 'q8-axis-label', 'text-anchor': 'end' });
  xLabel.textContent = 'x';
  const yLabel = svgElement('text', { x: yAxisX + 8, y: plot.top + 10, class: 'q8-axis-label' });
  yLabel.textContent = 'y';
  svg.append(xLabel, yLabel);
}

function graphDescription(spec) {
  const yDescription = yInterceptChoices.find(choice => choice.value === spec.yIntercept).description;
  const openingDescription = openingChoices.find(choice => choice.value === spec.opening).label.toLowerCase();
  const vertexDescription = vertexChoices.find(choice => choice.value === spec.vertex).label.toLowerCase();
  return `${openingDescription}; vertex ${vertexDescription}; ${yDescription}`;
}

function buildSketchOptions() {
  const answer = item();
  const distractors = shuffle(validSketches().filter(spec => !sameSketch(spec, answer))).slice(0, 3);
  const choices = shuffle([
    { ...answer, correct: true },
    ...distractors.map(spec => ({ ...spec, correct: false })),
  ]);

  $('#sketch-options').replaceChildren(...choices.map((spec, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'q8-sketch-choice';
    button.dataset.correct = String(spec.correct);
    const letter = String.fromCharCode(65 + index);
    button.setAttribute('aria-label', `Sketch ${letter}: ${graphDescription(spec)}`);

    const label = document.createElement('span');
    label.className = 'q8-sketch-label';
    label.textContent = `Sketch ${letter}`;
    const graph = svgElement('svg');
    drawSketch(graph, spec, `q8-clip-${exampleIndex}-${index}`);
    button.append(label, graph);
    button.addEventListener('click', () => finishChoice(
      button, '#sketch-options', '#step-sketch', '#sketch-feedback', null,
    ));
    return button;
  }));
}

function buildSimpleChoices(containerSelector, choices, answer, stepSelector, feedbackSelector, nextStepSelector) {
  const container = $(containerSelector);
  container.replaceChildren(...shuffle(choices).map(choice => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'q8-choice';
    button.textContent = choice.label;
    button.dataset.correct = String(choice.value === answer);
    button.addEventListener('click', () => finishChoice(
      button, containerSelector, stepSelector, feedbackSelector, nextStepSelector,
    ));
    return button;
  }));
}

function reset() {
  const current = item();
  $('#progress').textContent = `Example ${exampleIndex + 1} of ${examples.length}`;
  $('#example-picker').value = String(exampleIndex);
  $('#story').textContent = current.story;
  $('#function').textContent = current.equation;
  $('#x-meaning').textContent = current.xMeaning;
  $('#y-meaning').textContent = current.yMeaning;
  $('#zero-meaning').textContent = current.zeroMeaning;
  $('#complete').hidden = true;
  document.querySelectorAll('.q8-step').forEach(step => {
    step.hidden = true;
    step.classList.remove('complete');
  });
  document.querySelectorAll('.q8-feedback').forEach(feedback => {
    feedback.textContent = '';
    feedback.hidden = true;
    feedback.className = 'feedback q8-feedback';
  });
  buildSimpleChoices('#intercept-options', yInterceptChoices, current.yIntercept, '#step-intercept', '#intercept-feedback', '#step-opening');
  buildSimpleChoices('#opening-options', openingChoices, current.opening, '#step-opening', '#opening-feedback', '#step-vertex');
  buildSimpleChoices('#vertex-options', vertexChoices, current.vertex, '#step-vertex', '#vertex-feedback', '#step-sketch');
  buildSketchOptions();
  $('#step-intercept').hidden = false;
}

$('#example-picker').replaceChildren(...examples.map((example, index) => new Option(`${index + 1}. ${example.title}`, String(index))));
$('#example-picker').addEventListener('change', () => {
  exampleIndex = Number($('#example-picker').value);
  reset();
});

$('#reset').addEventListener('click', reset);
$('#next-example').addEventListener('click', () => {
  exampleIndex = (exampleIndex + 1) % examples.length;
  reset();
  $('#story').scrollIntoView({ block: 'start', behavior: 'smooth' });
});

reset();
