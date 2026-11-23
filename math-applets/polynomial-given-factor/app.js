import { examples, givenText, checkStep } from './model.mjs?v=20261123e';
import { polynomialText, checkAnswer, checkInteger, checkRoot } from '../polynomial-synthetic-division/model.mjs?v=20261123n';
import { numberText, input, renderSyntheticBoard } from '../polynomial-synthetic-division/board.mjs?v=20261123a';
import { showGroups, groupedDivision, factoringBox } from '../polynomial-factoring/factoring-aids.mjs?v=20261123a';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';

const $ = selector => document.querySelector(selector);
const picker = $('#example-picker');
const board = $('#division');
const form = $('#question');
const fields = $('#answer-fields');
const workFields = $('#work-fields');
const feedback = $('#feedback');
const history = $('#work-history');
const help = $('#factoring-help');
const layout = $('.practice-layout');
let example;
let phase;
let column;
let steps;
let stepIndex;
let groupingHelpOpen;

function practiceSteps(item) {
  const outside = polynomialText(item.divisor);
  const quotient = polynomialText(item.quotient);
  const result = `(${outside})(${quotient}) = 0`;
  const list = [
    {
      title: 'Write the factored form after synthetic division.',
      note: 'Enter the original divisor first and the quotient second.',
      equation: '(□)(□) = 0',
      labels: ['Original divisor', 'Quotient'],
      check: values => [checkAnswer(values[0], [0, ...item.divisor]), checkAnswer(values[1], item.quotient)],
      result,
    },
    {
      title: `Will (${quotient}) factor more?`,
      options: ['Yes', 'No'],
      answer: item.kind === 'square-root' ? 'No' : 'Yes',
    },
  ];
  if (item.kind !== 'square-root') {
    list.push({
      title: 'Which method should you use next?',
      note: `Choose a method for ${quotient}.`,
      options: ['Factorable quadratic', 'GCF', 'Grouping', 'Special quadratic form'],
      answer: item.kind === 'grouping' ? 'Grouping'
        : item.kind === 'quadratic-form' ? 'Special quadratic form' : 'Factorable quadratic',
    });
    if (item.kind === 'quadratic') {
      const step = item.practice.steps[2];
      list.push({
        ...step,
        title: 'Factor the quadratic quotient.',
        note: 'Find two numbers with the correct product and sum. Enter both complete factors; keep the original divisor.',
        equation: `(${outside})(□)(□) = 0`,
        labels: ['Quadratic factor 1', 'Quadratic factor 2'],
        result: `${item.factored} = 0`,
        check: values => checkStep(step, values),
      });
    } else if (item.kind === 'quadratic-form') {
      item.practice.steps.forEach(step => {
        list.push({
          ...step,
          equation: `(${outside})${step.equation} = 0`,
          labels: step.inputLabels || step.answers.map((answer, index) => `Factor ${index + 1}`),
          result: `(${outside})${step.result} = 0`,
          check: values => checkStep(step, values),
        });
      });
    } else {
      const grouped = item.practice;
      grouped.steps.slice(1).forEach((step, index) => {
        const equation = index === 0 ? null
          : index === 1 ? `(${outside})[${step.equation}] = 0`
            : `(${outside})${step.equation} = 0`;
        list.push({
          ...step,
          groupHelp: true,
          groupDivision: index > 0 ? grouped.steps[2].groupedDivision : null,
          note: index === 0
            ? `Group the quotient as (${grouped.groups[0]}) + (${grouped.groups[1]}). Include a negative GCF when needed.`
            : step.note,
          equation,
          labels: (step.inputLabels || step.fields || step.answers.map((answer, factorIndex) => `Factor ${factorIndex + 1}`))
            .map(label => label.replace('Red group', 'First group').replace('Green group', 'Second group')),
          hint: step.hint?.replace('green GCF', 'second group GCF'),
          result: index === 0 ? `Group GCFs: ${step.answers.join(', ')}`
            : `(${outside})${index === 1 ? `[${step.result}]` : step.result} = 0`,
          check: values => checkStep(step, values),
        });
      });
    }
  }
  list.push({
    title: 'Set each factor equal to zero.',
    note: 'Enter each complete factor. The = 0 is provided; factors may be entered in any order.',
    equation: item.zeroFactors.map(() => '□ = 0').join(', '),
    labels: item.zeroFactors.map((factor, index) => `Zero factor ${index + 1}`),
    result: item.zeroFactors.map(factor => `${factor} = 0`).join(', '),
    check: values => checkStep(item.factorEquations, values),
  });
  list.push(
    {
      title: 'Find all roots/zeros/solutions.',
      note: item.kind === 'square-root' || item.kind === 'quadratic-form'
        ? 'Solve each equation. For each quadratic, take both square roots and use i for imaginary solutions.'
        : 'Solve each factor equation. Enter each distinct solution once, in any order.',
      equation: `x = ${item.solutions.map(() => '□').join(', ')}`,
      labels: item.solutions.map((solution, index) => `Solution ${index + 1}`),
      result: `x = ${item.solutions.map(numberText).join(', ')}`,
      squareRootHelp: item.squareSteps,
      check: values => checkStep(item.rootStep, values),
    },
    {
      title: 'How many solutions are real and how many are complex?',
      note: 'Count imaginary complex solutions separately from real solutions.',
      labels: ['Number of Real Solutions', 'Number of Imaginary Complex Solutions'],
      result: `${item.realCount} real, ${item.complexCount} imaginary complex`,
      check: values => [checkInteger(values[0], item.realCount), checkInteger(values[1], item.complexCount)],
    },
  );
  return list;
}

function addEquation(equation, labels) {
  const row = document.createElement('div');
  row.className = 'equation-row math';
  const pieces = equation.split('□');
  pieces.forEach((text, index) => {
    if (text) row.append(document.createTextNode(text));
    if (index < pieces.length - 1) row.append(workInput(labels[index]));
  });
  workFields.append(row);
}

function workInput(label) {
  const element = input(label);
  element.setAttribute('form', 'question');
  element.setAttribute('aria-describedby', 'question-title question-note feedback');
  return element;
}

function updateWorkWidth() {
  layout.classList.toggle('wide-work', phase === 'practice' && !help.querySelector('aside:not([hidden])'));
}

function addHelpToggle(label, panel, open, onToggle) {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'p8-box-toggle';
  toggle.setAttribute('aria-controls', panel.id);
  const update = () => {
    panel.hidden = !open;
    toggle.textContent = `Need Help: ${open ? 'Hide' : 'Show'} ${label}`;
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => {
    open = !open;
    update();
    if (onToggle) onToggle(open);
    updateWorkWidth();
  });
  update();
  help.append(toggle, panel);
  return toggle;
}

function addSquareRootHelp({ factor, value, solutions }, index) {
  const panel = document.createElement('aside');
  panel.id = `square-root-help-${index}`;
  panel.setAttribute('aria-label', `Square root help for ${factor}`);
  const equation = document.createElement('p');
  equation.className = 'math';
  equation.textContent = `${factor} = 0`;
  const isolate = document.createElement('div');
  isolate.className = 'square-root-row math';
  const squareInput = input(`Value of x squared for ${factor}`);
  const isolateCheck = document.createElement('button');
  isolateCheck.type = 'button';
  isolateCheck.textContent = 'Check';
  isolate.append('x² = ', squareInput, isolateCheck);
  const roots = document.createElement('div');
  roots.hidden = true;
  const rootsRow = document.createElement('div');
  rootsRow.className = 'square-root-row math';
  const first = input(`First square root for ${factor}`);
  const second = input(`Second square root for ${factor}`);
  const rootsCheck = document.createElement('button');
  rootsCheck.type = 'button';
  rootsCheck.textContent = 'Check';
  rootsRow.append('x = ', first, ', ', second, rootsCheck);
  const message = document.createElement('p');
  message.className = 'feedback';
  message.setAttribute('role', 'status');
  const back = document.createElement('button');
  back.type = 'button';
  back.textContent = 'Return to all solutions';
  back.hidden = true;
  roots.append(rootsRow);
  panel.append(equation, isolate, roots, message, back);
  const toggle = addHelpToggle(`Square Root Method (${factor})`, panel, false);

  function mark(element, correct) {
    element.classList.toggle('invalid', !correct);
    element.setAttribute('aria-invalid', String(!correct));
  }
  isolateCheck.addEventListener('click', () => {
    const correct = checkInteger(squareInput.value, value);
    mark(squareInput, correct);
    message.textContent = correct ? '' : 'Check the sign and value, then try again.';
    message.className = `feedback${correct ? '' : ' no'}`;
    if (!correct) return;
    squareInput.readOnly = true;
    isolateCheck.hidden = true;
    roots.hidden = false;
    first.focus();
  });
  rootsCheck.addEventListener('click', () => {
    const matches = checkStep({ answers: solutions, roots: true, unordered: true }, [first.value, second.value]);
    [first, second].forEach((element, i) => mark(element, matches[i]));
    const correct = matches.every(Boolean);
    message.textContent = correct ? 'Both solutions are correct.' : 'Enter both square roots, including their signs.';
    message.className = `feedback ${correct ? 'ok' : 'no'}`;
    if (!correct) return;
    first.readOnly = true;
    second.readOnly = true;
    rootsCheck.hidden = true;
    back.hidden = false;
    back.focus();
  });
  [[squareInput, isolateCheck], [first, rootsCheck], [second, rootsCheck]].forEach(([element, button]) => {
    element.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        button.click();
      }
    });
  });
  back.addEventListener('click', () => {
    toggle.click();
    workFields.querySelector('input').focus();
  });
}

function renderFactoringHelp(step) {
  if (step.groupHelp) {
    const panel = document.createElement('aside');
    panel.id = 'grouping-help';
    panel.setAttribute('aria-label', 'Grouping help');
    const grouped = document.createElement('p');
    grouped.className = 'math';
    showGroups(example.practice.groups, grouped, false);
    panel.append(grouped);
    if (step.groupDivision) panel.append(groupedDivision(step.groupDivision));
    addHelpToggle('Grouping', panel, groupingHelpOpen, open => { groupingHelpOpen = open; });
  }
  if (step.box) {
    const panel = document.createElement('aside');
    panel.id = 'box-help';
    panel.className = 'p8-box-panel';
    panel.setAttribute('aria-label', 'Factoring box help');
    panel.append(factoringBox(step.box, true));
    addHelpToggle('Factoring Box', panel, false);
  }
  if (step.squareRootHelp) step.squareRootHelp.forEach(addSquareRootHelp);
}

function renderQuestion() {
  fields.replaceChildren();
  workFields.replaceChildren();
  help.replaceChildren();
  fields.removeAttribute('role');
  fields.removeAttribute('aria-labelledby');
  fields.removeAttribute('aria-describedby');
  feedback.textContent = '';
  feedback.className = 'feedback';
  const title = $('#question-title');
  const note = $('#question-note');
  if (phase === 'coefficients') {
    title.textContent = 'Enter the coefficients of the polynomial.';
    note.textContent = 'Use descending powers of x. Enter 0 for each missing term, including a missing constant.';
  } else if (phase === 'root') {
    title.textContent = 'What number goes outside the synthetic division setup?';
    note.textContent = 'Use the given root, zero, or x-intercept. If a factor is given, set it equal to 0.';
  } else if (phase === 'bring') {
    title.textContent = 'Bring down the first coefficient.';
    note.textContent = 'Copy the leading coefficient directly below the line.';
  } else if (phase === 'multiply') {
    title.textContent = 'Multiply.';
    note.textContent = `Multiply ${numberText(example.rootText)} by ${numberText(example.results[column - 1])}. Enter the product under the next coefficient.`;
  } else if (phase === 'add') {
    title.textContent = 'Add the column.';
    note.textContent = `Add ${numberText(example.dividend[column])} and ${numberText(example.products[column - 1])}. Enter the sum below the line.`;
  } else {
    const step = steps[stepIndex];
    title.textContent = step.title;
    note.textContent = step.note || '';
    renderFactoringHelp(step);
    if (step.options) {
      fields.setAttribute('role', 'radiogroup');
      fields.setAttribute('aria-labelledby', 'question-title');
      fields.setAttribute('aria-describedby', 'question-note feedback');
      const row = document.createElement('div');
      row.className = 'choice-row';
      step.options.forEach(option => {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'choice';
        radio.value = option;
        label.append(radio, document.createTextNode(option));
        row.append(label);
      });
      fields.append(row);
    } else if (step.equation) {
      addEquation(step.equation, step.labels);
    } else {
      step.labels.forEach(labelText => {
        const label = document.createElement('label');
        label.append(document.createTextNode(`${labelText}:`), workInput(labelText));
        workFields.append(label);
      });
    }
  }
  updateWorkWidth();
  (board.querySelector('.division-input') || workFields.querySelector('input') || fields.querySelector('input')).focus();
}

function renderExample() {
  example = examples[picker.selectedIndex];
  phase = 'coefficients';
  column = 0;
  stepIndex = 0;
  groupingHelpOpen = false;
  steps = practiceSteps(example);
  clearConfetti();
  history.replaceChildren();
  form.hidden = false;
  $('#complete').hidden = true;
  $('#problem').textContent = `${polynomialText(example.dividend)} = 0`;
  $('#given').textContent = givenText(example);
  renderSyntheticBoard(board, example, phase, column);
  renderQuestion();
}

function complete() {
  workFields.replaceChildren();
  help.replaceChildren();
  updateWorkWidth();
  $('#final-factored').textContent = example.factored;
  $('#final-roots').textContent = example.solutions.map(numberText).join(', ');
  $('#final-real').textContent = example.realCount;
  $('#final-complex').textContent = example.complexCount;
  form.hidden = true;
  $('#complete').hidden = false;
  fireConfetti(180);
  $('#next-example').focus();
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (phase === 'practice') {
    const step = steps[stepIndex];
    if (step.options) {
      const selected = fields.querySelector('input:checked');
      if (!selected || selected.value !== step.answer) {
        feedback.textContent = selected ? 'That is not quite right. Look at the quotient and try again.' : 'Choose an answer.';
        feedback.className = 'feedback no';
        return;
      }
    } else {
      const inputs = [...workFields.querySelectorAll('input')];
      const matches = step.check(inputs.map(element => element.value));
      inputs.forEach((element, index) => {
        element.classList.toggle('invalid', !matches[index]);
        element.setAttribute('aria-invalid', String(!matches[index]));
      });
      if (!matches.every(Boolean)) {
        feedback.textContent = step.hint || 'Check your signs and answers, then try again.';
        feedback.className = 'feedback no';
        return;
      }
      if (step.result) {
        const result = document.createElement('p');
        result.className = 'math';
        result.textContent = step.result;
        history.append(result);
      }
    }
    stepIndex++;
    if (stepIndex === steps.length) complete();
    else renderQuestion();
    return;
  }
  const inputs = [...board.querySelectorAll('.division-input')];
  let matches;
  if (phase === 'coefficients') {
    matches = inputs.map((element, index) => checkInteger(element.value, example.dividend[index]));
  } else {
    const expected = phase === 'root' ? example.root : phase === 'bring' ? example.results[0]
      : phase === 'multiply' ? example.products[column - 1] : example.results[column];
    matches = [phase === 'root' ? checkRoot(inputs[0].value, expected) : checkInteger(inputs[0].value, expected)];
  }
  inputs.forEach((element, index) => {
    element.classList.toggle('invalid', !matches[index]);
    element.setAttribute('aria-invalid', String(!matches[index]));
  });
  if (!matches.every(Boolean)) {
    feedback.textContent = 'Check your signs and numbers, then try again.';
    feedback.className = 'feedback no';
    return;
  }
  if (phase === 'coefficients') phase = 'root';
  else if (phase === 'root') phase = 'bring';
  else if (phase === 'bring') { column = 1; phase = 'multiply'; }
  else if (phase === 'multiply') phase = 'add';
  else if (column === example.dividend.length - 1) phase = 'practice';
  else { column++; phase = 'multiply'; }
  renderSyntheticBoard(board, example, phase === 'practice' ? 'final' : phase, column);
  renderQuestion();
});

picker.replaceChildren(...examples.map((item, index) =>
  new Option(`${index + 1}: ${polynomialText(item.dividend)} = 0`, index)));
picker.addEventListener('change', renderExample);
$('#try-again').addEventListener('click', renderExample);
$('#next-example').addEventListener('click', () => {
  picker.selectedIndex = (picker.selectedIndex + 1) % examples.length;
  renderExample();
});
renderExample();
