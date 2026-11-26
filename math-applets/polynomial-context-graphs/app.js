import { drawCurve, svgElement } from '../absolute-value-features/graph.js';
import { parseNumber } from '../quadratic-graphing/model.mjs';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';
import { problems, evaluate, displayValue, localExtrema, minimumDegree, checkList, checkPoints, formatList } from './model.mjs?v=20261125p13n';

const $ = selector => document.querySelector(selector);
const picker = $('#example-picker');
const plane = $('#plane');
const fields = $('#question-fields');
let problem;
let step;
let counting;
let extremaStage;

const list = formatList;
const direction = value => value > 0 ? 'up' : 'down';
const numberField = (id, label, expected) => ({ id, label, expected, type: 'number' });
const listField = (id, label, countLabel, expected) => ({ id, label, countLabel, expected, type: 'list' });
const choiceField = (id, label, expected, options) => ({ id, label, expected, options, type: 'choice' });
const intervalField = (id, label, variable, min, max) => ({ id, label, variable, min, max, type: 'interval' });

function questions(p) {
  const maximum = p.globalMax;
  const minimum = p.globalMin;
  const turns = p.localMax.length + p.localMin.length;
  const degree = minimumDegree(p);
  const local = localExtrema(p);
  const extrema = (name, times, global, value) => {
    const points = times.map(x => [displayValue(p, x), global ? value : displayValue(p, evaluate(p, x))]);
    const pointList = list(points.map(([x, y]) => `(${x}, ${y})`));
    const pluralName = name.replace('maximum', 'maxima').replace('minimum', 'minima');
    const summary = points.length === 0 ? `There is no ${name}.`
      : global
        ? `The ${name} is ${pointList}: ${p.ySubject} is ${value} ${p.yUnit} at ${list(points.map(point => point[0]))} ${p.xUnit}.`
        : `The ${points.length === 1 ? name : pluralName} ${points.length === 1 ? 'is' : 'are'} ${pointList}. Coordinates use ${p.xUnit} and ${p.yUnit}.`;
    return {
      title: `P14: ${name[0].toUpperCase()}${name.slice(1)}.`,
      extrema: { name, pluralName, points, global },
      hint: global
        ? 'Compare the entire graph, including both endpoints.'
        : 'Include endpoints when they are local extrema, but do not count global extrema as local.',
      summary,
    };
  };
  return [
    {
      title: 'P13: Find the x-intercepts.',
      countNote: 'First, count the x-intercepts. Include endpoints on the x-axis.',
      note: `Enter each x-value in ${p.xUnit} in its own box. Include endpoints on the x-axis.`,
      fields: [listField('x-intercepts', `x-intercept time (${p.xUnit})`, 'How many x-intercepts are there?', p.xIntercepts)],
      hint: 'Look where the graph touches or crosses the horizontal axis, including its endpoints.',
      summary: `The x-intercepts occur at ${list(p.xIntercepts)} ${p.xUnit}.`,
    },
    {
      title: 'P13: Interpret the x-intercepts.',
      note: 'What does an output of zero mean in this situation?',
      fields: [choiceField('x-meaning', 'Meaning of the x-intercepts', 'zero', [
        ['nonzero', `At ${list(p.xIntercepts)} ${p.xUnit}, ${p.ySubject} is 1 ${p.yUnit}.`],
        ['zero', `At ${list(p.xIntercepts)} ${p.xUnit}, ${p.ySubject} is 0 ${p.yUnit}.`],
        ['input', `${list(p.xIntercepts)} ${p.xUnit} describes values of ${p.ySubject}, not times.`],
      ])],
      hint: 'An x-intercept has an output of zero.',
      summary: `At ${list(p.xIntercepts)} ${p.xUnit}, ${p.ySubject} is 0 ${p.yUnit}.`,
    },
    {
      title: 'P13: Find and interpret the y-intercept.',
      countNote: 'First, count the points where the graph meets the vertical axis.',
      note: 'Use the point on the vertical axis and include its meaning.',
      fields: [
        listField('y-intercept', `y-intercept (${p.yUnit})`, 'How many y-intercepts are there?', [p.yIntercept]),
        choiceField('y-meaning', 'Meaning of the y-intercept', 'start', [
          ['constant', `From 0 to ${p.xMax} ${p.xUnit}, ${p.ySubject} stays at ${p.yIntercept} ${p.yUnit}.`],
          ['start', `At time 0 ${p.xUnit}, ${p.ySubject} is ${p.yIntercept} ${p.yUnit}.`],
          ['end', `At time ${p.xMax} ${p.xUnit}, ${p.ySubject} must be ${p.yIntercept} ${p.yUnit}.`],
        ]),
      ],
      hint: 'The y-intercept is the output when time is 0.',
      summary: `At time 0 ${p.xUnit}, ${p.ySubject} is ${p.yIntercept} ${p.yUnit}.`,
    },
    extrema('global maximum', maximum.times, true, maximum.value),
    extrema('global minimum', minimum.times, true, minimum.value),
    extrema('local maximum', local.maxima, false),
    extrema('local minimum', local.minima, false),
    {
      title: 'P14: Interpret how the situation is changing.',
      note: `At ${p.directionTime} ${p.xUnit}, is ${p.ySubject} increasing or decreasing?`,
      fields: [choiceField('trend', 'How the output is changing', p.trend, [
        ['increasing', 'Increasing'], ['decreasing', 'Decreasing'],
      ])],
      hint: 'Follow the curve from left to right near that time.',
      summary: `At ${p.directionTime} ${p.xUnit}, ${p.ySubject} is ${p.trend}.`,
    },
    {
      title: 'P15: Find and interpret the domain and range.',
      note: 'Complete each compound inequality, then choose what it describes.',
      fields: [
        intervalField('domain', `Domain (${p.xUnit})`, 'x', 0, p.xMax),
        choiceField('domain-meaning', 'The domain describes', 'time', [
          ['output', `All values of ${p.ySubject}, from ${minimum.value} to ${maximum.value} ${p.yUnit}`],
          ['time', `All times from 0 to ${p.xMax} ${p.xUnit}`],
        ]),
        intervalField('range', `Range (${p.yUnit})`, 'y', minimum.value, maximum.value),
        choiceField('range-meaning', 'The range describes', 'output', [
          ['time', `All times from 0 to ${p.xMax} ${p.xUnit}`],
          ['output', `All values of ${p.ySubject}, from ${minimum.value} to ${maximum.value} ${p.yUnit}`],
        ]),
      ],
      hint: 'The domain is the input interval; the range includes every output from the least to the greatest.',
      summary: `Domain: 0 ≤ time ≤ ${p.xMax} ${p.xUnit}. Range: ${minimum.value} ≤ ${p.ySubject} ≤ ${maximum.value} ${p.yUnit}.`,
    },
    {
      title: 'P16: Minimum degree and leading coefficient',
      note: `For this question only, suppose the polynomial’s left end goes ${direction(p.leftEnd)} and its right end goes ${direction(p.rightEnd)} beyond the interval. This is additional information: the finite contextual graph alone does not determine the actual degree or leading coefficient.`,
      fields: [
        numberField('turns', 'Number of interior turning points', turns),
        numberField('degree', 'Least possible degree consistent with the turns and assumed ends', degree),
        choiceField('leading', 'Sign of the leading coefficient', p.leading > 0 ? 'positive' : 'negative', [
          ['positive', 'Positive'], ['negative', 'Negative'],
        ]),
      ],
      hint: 'A degree n polynomial has at most n − 1 turns. Use the assumed ends to choose the parity and leading sign.',
      summary: `${turns} turns and the assumed ends give a minimum degree of ${degree} and a ${p.leading > 0 ? 'positive' : 'negative'} leading coefficient. A higher degree may also fit.`,
    },
  ];
}

function drawGraph(p) {
  const left = 100;
  const right = 615;
  const top = 30;
  const bottom = 360;
  const projectX = x => left + x / p.xMax * (right - left);
  const projectY = y => bottom - (y - p.yMin) / (p.yMax - p.yMin) * (bottom - top);
  const turns = [...p.localMax, ...p.localMin].sort((a, b) => a - b);
  const points = list(turns.map(x => `(${displayValue(p, x)}, ${displayValue(p, evaluate(p, x))})`));
  plane.replaceChildren(
    svgElement('title', { id: 'graph-title' }, `${p.title}: ${p.yLabel} versus ${p.xLabel}`),
    svgElement('desc', { id: 'graph-description' }, `The graph starts at (0, ${p.yIntercept}) and ends at (${p.xMax}, ${displayValue(p, evaluate(p, p.xMax))}). It changes direction at ${points}.${p.rounded ? ' Coordinates are rounded to the nearest tenth.' : ''}`),
  );
  let grid = '';
  for (let x = 0; x <= p.xMax; x += p.xStep) {
    const px = projectX(x);
    grid += `M ${px} ${top} V ${bottom} `;
    plane.append(svgElement('text', { x: px, y: bottom + 22, 'text-anchor': 'middle', class: 'tick' }, String(x)));
  }
  for (let y = p.yMin; y <= p.yMax; y += p.yStep) {
    const py = projectY(y);
    grid += `M ${left} ${py} H ${right} `;
    plane.append(svgElement('text', { x: left - 8, y: py + 5, 'text-anchor': 'end', class: 'tick' }, String(y)));
  }
  plane.append(
    svgElement('path', { d: grid, class: 'grid' }),
    svgElement('path', { d: `M ${left} ${top} V ${bottom} M ${left} ${projectY(0)} H ${right}`, class: 'axes' }),
    svgElement('text', { x: (left + right) / 2, y: 425, 'text-anchor': 'middle', class: 'axis-label' }, p.xLabel),
    svgElement('text', { x: 19, y: (top + bottom) / 2, transform: `rotate(-90 19 ${(top + bottom) / 2})`, 'text-anchor': 'middle', class: 'axis-label' }, p.yLabel),
  );
  drawCurve(plane, x => evaluate(p, x), 0, p.xMax, { projectX, projectY });
  [0, p.xMax].forEach(x => plane.append(svgElement('circle', {
    cx: projectX(x), cy: projectY(evaluate(p, x)), r: 5, class: 'endpoint',
  })));
  if (p.labelPoints) {
    [...new Set([0, ...turns, ...p.xIntercepts, p.xMax])].sort((a, b) => a - b).forEach(x => {
      const y = evaluate(p, x);
      const px = projectX(x);
      const py = projectY(y);
      const alignRight = x >= p.xMax * 0.8;
      const [dx, dy, anchor] = p.pointLabelOffsets?.[displayValue(p, x)]
        ?? [alignRight ? -7 : 7, py < top + 20 ? 16 : -8, alignRight ? 'end' : 'start'];
      plane.append(
        svgElement('circle', { cx: px, cy: py, r: 4, class: 'marked-point' }),
        svgElement('text', {
          x: px + dx, y: py + dy, 'text-anchor': anchor,
          class: 'point-label',
        }, `(${displayValue(p, x)}, ${displayValue(p, y)})`),
      );
    });
  }
}

function renderQuestion() {
  const question = questions(problem)[step];
  $('#progress').textContent = `Question ${step + 1} of ${questions(problem).length}`;
  $('#question-title').textContent = question.title;
  $('#feedback').textContent = '';
  $('#feedback').className = 'feedback';
  fields.replaceChildren();
  $('#check').hidden = Boolean(question.extrema && extremaStage === 'presence');
  if (question.extrema) {
    const { name, pluralName, points, global } = question.extrema;
    if (extremaStage === 'presence') {
      $('#question-note').textContent = `Is there a ${name}? ${global ? 'Include endpoints.' : 'Include endpoints when appropriate; do not count global extrema as local.'}`;
      const buttons = document.createElement('div');
      buttons.className = 'extrema-presence';
      [['Yes', true], ['No', false]].forEach(([text, answer]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = text;
        button.addEventListener('click', () => {
          if (answer !== (points.length > 0)) {
            $('#feedback').textContent = question.hint;
            $('#feedback').className = 'feedback no';
          } else if (!answer) {
            finishQuestion(question);
          } else {
            extremaStage = global ? 'points' : 'count';
            renderQuestion();
          }
        });
        buttons.append(button);
      });
      fields.append(buttons);
      buttons.querySelector('button').focus();
    } else if (extremaStage === 'count') {
      $('#question-note').textContent = `How many ${pluralName} are there? Include endpoints when appropriate, but do not count global extrema.`;
      const label = document.createElement('label');
      label.textContent = `Number of ${pluralName}`;
      const input = document.createElement('input');
      input.id = 'extrema-count';
      input.type = 'text';
      input.inputMode = 'numeric';
      input.autocomplete = 'off';
      label.append(input);
      fields.append(label);
      input.focus();
    } else {
      $('#question-note').textContent = `Enter ${global ? 'the' : 'each'} ${name} as an ordered pair (time in ${problem.xUnit}, value in ${problem.yUnit}).${problem.rounded ? ' Use the rounded coordinates shown on the graph.' : ''}`;
      points.forEach((_, index) => {
        const group = document.createElement('fieldset');
        group.className = 'point-fields';
        const legend = document.createElement('legend');
        legend.textContent = points.length === 1 ? name : `${name} ${index + 1}`;
        group.append(legend);
        const row = document.createElement('div');
        row.className = 'point-row';
        row.append('(');
        [['x', `time in ${problem.xUnit}`], ['y', `value in ${problem.yUnit}`]].forEach(([coordinate, label], coordinateIndex) => {
          if (coordinateIndex) row.append(', ');
          const input = document.createElement('input');
          input.type = 'text';
          input.inputMode = 'decimal';
          input.autocomplete = 'off';
          input.id = `extrema-point-${index + 1}-${coordinate}`;
          input.setAttribute('aria-label', `${name} ${index + 1}, ${label}`);
          row.append(input);
        });
        row.append(')');
        group.append(row);
        fields.append(group);
      });
      fields.querySelector('input')?.focus();
    }
    return;
  }
  $('#question-note').textContent = counting ? question.countNote : question.note;
  const specs = counting
    ? question.fields.filter(spec => spec.type === 'list').map(spec => numberField(`${spec.id}-count`, spec.countLabel, spec.expected.length))
    : question.fields;
  specs.forEach(spec => {
    if (spec.type === 'list') {
      const group = document.createElement('fieldset');
      if (spec.id === 'x-intercepts') group.classList.add('x-intercept-fields');
      const legend = document.createElement('legend');
      legend.textContent = spec.label;
      group.append(legend);
      if (spec.expected.length === 0) {
        group.append('None');
      }
      spec.expected.forEach((_, index) => {
        const label = document.createElement('label');
        label.textContent = spec.id === 'x-intercepts' ? `Time ${index + 1}` : `${spec.label} ${index + 1}`;
        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'decimal';
        input.autocomplete = 'off';
        input.id = `${spec.id}-${index + 1}`;
        label.append(input);
        group.append(label);
      });
      fields.append(group);
      return;
    }
    if (spec.type === 'interval') {
      const group = document.createElement('fieldset');
      group.className = 'interval-fields';
      const legend = document.createElement('legend');
      legend.textContent = spec.label;
      group.append(legend);
      const row = document.createElement('div');
      row.className = 'interval-row';
      const addNumber = (suffix, label) => {
        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'decimal';
        input.autocomplete = 'off';
        input.id = `${spec.id}-${suffix}`;
        input.setAttribute('aria-label', `${spec.label}: ${label}`);
        row.append(input);
      };
      const addOperator = (suffix, label) => {
        const select = document.createElement('select');
        select.id = `${spec.id}-${suffix}`;
        select.setAttribute('aria-label', `${spec.label}: ${label} inequality`);
        select.add(new Option('?', ''));
        ['<', '≤', '>', '≥', '=', '≠'].forEach(value => select.add(new Option(value, value)));
        row.append(select);
      };
      addNumber('min', 'lower bound');
      addOperator('left', 'left');
      const variable = document.createElement('span');
      variable.textContent = spec.variable;
      row.append(variable);
      addOperator('right', 'right');
      addNumber('max', 'upper bound');
      group.append(row);
      fields.append(group);
      return;
    }
    if (spec.type === 'choice' && spec.id.endsWith('-meaning')) {
      const group = document.createElement('fieldset');
      group.className = 'choice-options';
      group.id = spec.id;
      const legend = document.createElement('legend');
      legend.textContent = spec.label;
      group.append(legend);
      spec.options.forEach(([value, text]) => {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = spec.id;
        input.value = value;
        const description = document.createElement('span');
        description.textContent = text;
        label.append(input, description);
        group.append(label);
      });
      fields.append(group);
      return;
    }
    const label = document.createElement('label');
    label.textContent = spec.label;
    let control;
    if (spec.type === 'choice') {
      control = document.createElement('select');
      control.append(new Option('Choose an answer', ''));
      spec.options.forEach(([value, text]) => control.add(new Option(text, value)));
    } else {
      control = document.createElement('input');
      control.type = 'text';
      control.autocomplete = 'off';
      control.inputMode = 'decimal';
    }
    control.id = spec.id;
    label.append(control);
    fields.append(label);
  });
  fields.querySelector('input, select')?.focus();
}

$('#question').addEventListener('submit', event => {
  event.preventDefault();
  const question = questions(problem)[step];
  if (question.extrema) {
    if (extremaStage === 'count') {
      const control = $('#extrema-count');
      const correct = parseNumber(control.value) === question.extrema.points.length;
      control.classList.toggle('invalid', !correct);
      control.setAttribute('aria-invalid', String(!correct));
      if (correct) {
        extremaStage = 'points';
        renderQuestion();
      } else {
        $('#feedback').textContent = question.hint;
        $('#feedback').className = 'feedback no';
      }
    } else if (extremaStage === 'points') {
      const controls = question.extrema.points.map((_, index) => [
        $(`#extrema-point-${index + 1}-x`), $(`#extrema-point-${index + 1}-y`),
      ]);
      const correct = checkPoints(controls.map(pair => pair.map(control => control.value)), question.extrema.points);
      controls.flat().forEach(control => {
        control.classList.toggle('invalid', !correct);
        control.setAttribute('aria-invalid', String(!correct));
      });
      if (correct) {
        finishQuestion(question);
      } else {
        $('#feedback').textContent = `Check both coordinates and their order. ${question.hint}`;
        $('#feedback').className = 'feedback no';
      }
    }
    return;
  }
  if (counting) {
    const matches = question.fields.filter(spec => spec.type === 'list').map(spec => {
      const control = document.getElementById(`${spec.id}-count`);
      const correct = parseNumber(control.value) === spec.expected.length;
      control.classList.toggle('invalid', !correct);
      control.setAttribute('aria-invalid', String(!correct));
      return correct;
    });
    if (!matches.every(Boolean)) {
      $('#feedback').textContent = question.hint;
      $('#feedback').className = 'feedback no';
      return;
    }
    counting = false;
    renderQuestion();
    return;
  }
  const matches = question.fields.map(spec => {
    if (spec.type === 'list') {
      const controls = spec.expected.map((_, index) => document.getElementById(`${spec.id}-${index + 1}`));
      const correct = checkList(controls.map(control => control.value), spec.expected);
      controls.forEach(control => {
        control.classList.toggle('invalid', !correct);
        control.setAttribute('aria-invalid', String(!correct));
      });
      return correct;
    }
    if (spec.type === 'interval') {
      return [
        ['min', spec.min, true], ['left', '≤', false],
        ['right', '≤', false], ['max', spec.max, true],
      ].map(([suffix, expected, numeric]) => {
        const control = document.getElementById(`${spec.id}-${suffix}`);
        const correct = numeric ? parseNumber(control.value) === expected : control.value === expected;
        control.classList.toggle('invalid', !correct);
        control.setAttribute('aria-invalid', String(!correct));
        return correct;
      }).every(Boolean);
    }
    const control = document.getElementById(spec.id);
    const correct = spec.type === 'number' ? parseNumber(control.value) === spec.expected
        : spec.id.endsWith('-meaning') ? control.querySelector('input:checked')?.value === spec.expected
          : control.value === spec.expected;
    control.classList.toggle('invalid', !correct);
    control.setAttribute('aria-invalid', String(!correct));
    return correct;
  });
  if (!matches.every(Boolean)) {
    $('#feedback').textContent = question.hint;
    $('#feedback').className = 'feedback no';
    return;
  }
  finishQuestion(question);
});

function finishQuestion(question) {
  const answer = document.createElement('p');
  const heading = document.createElement('strong');
  heading.textContent = `${question.title} `;
  answer.append(heading, question.summary);
  $('#answers').append(answer);
  step++;
  if (step < questions(problem).length) {
    beginQuestion();
  } else {
    $('#question').hidden = true;
    $('#progress').textContent = 'All questions complete.';
    $('#complete').hidden = false;
    fireConfetti(180);
    $('#next-example').focus();
  }
}

function beginQuestion() {
  const question = questions(problem)[step];
  extremaStage = question.extrema ? 'presence' : null;
  counting = !question.extrema && question.fields.some(spec => spec.type === 'list');
  renderQuestion();
}

function reset() {
  problem = problems[picker.selectedIndex];
  step = 0;
  clearConfetti();
  $('#scenario').textContent = problem.scenario;
  $('#graph-note').textContent = `Filled endpoints are included in the situation. Read values from the curve, labeled axes, and any marked coordinates.${problem.rounded ? ' Marked coordinates are rounded to the nearest tenth.' : ''}`;
  $('#answers').replaceChildren();
  $('#question').hidden = false;
  $('#complete').hidden = true;
  drawGraph(problem);
  beginQuestion();
}

problems.forEach((problem, index) => picker.add(new Option(`${index + 1}: ${problem.title}`, String(index))));
picker.addEventListener('change', reset);
$('#try-again').addEventListener('click', reset);
$('#next-example').addEventListener('click', () => {
  picker.selectedIndex = (picker.selectedIndex + 1) % problems.length;
  reset();
});
reset();
