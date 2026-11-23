import { factorPractice, groupingPractice, quadraticFormPractice, orderQuadraticFormPractice, sections, checkStep } from './model.mjs?v=20261123g';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';
import { showGroups, field, groupedDivision, factoringBox } from './factoring-aids.mjs?v=20261123a';

const $ = selector => document.querySelector(selector);
const trackNav = $('#tracks');
const sectionNav = $('#sections');
const picker = $('#example-picker');
const questions = $('#questions');
const complete = $('#complete');
const next = $('#next-example');
let sectionIndex = 0;
let trackIndex = 0;
let problem;
const factorSections = [
  { title: 'GCF', examples: factorPractice },
  { title: 'Grouping', examples: groupingPractice },
  { title: 'Quadratic Form', examples: quadraticFormPractice },
];
const currentSections = () => trackIndex === 0 ? factorSections : sections;

function innerExpression(expression) {
  const display = document.createElement('p');
  display.className = 'p8-inner-expression';
  const label = document.createElement('span');
  label.className = 'p8-note';
  label.textContent = 'Expression inside the parentheses: ';
  const value = document.createElement('span');
  value.className = 'math';
  value.textContent = expression;
  display.append(label, value);
  return display;
}

function divisionDisplay({ coefficients, outside }) {
  const display = document.createElement('div');
  display.className = 'p8-division math';
  const terms = coefficients.flatMap((coefficient, index) => {
    if (!coefficient) return [];
    const power = coefficients.length - index - 1;
    const magnitude = Math.abs(coefficient);
    const numerator = (power && magnitude === 1 ? '' : magnitude)
      + (power ? `x${['', '', '²', '³', '⁴', '⁵', '⁶'][power]}` : '');
    return [{ negative: coefficient < 0, numerator }];
  });
  display.setAttribute('aria-label', `${outside} times the quantity ` + terms.map(({ negative, numerator }, index) =>
    `${index ? negative ? 'minus ' : 'plus ' : negative ? 'negative ' : ''}${numerator} divided by ${outside}`).join(' '));
  const opening = document.createElement('span');
  opening.textContent = `${outside}(`;
  display.append(opening);
  terms.forEach(({ negative, numerator }, index) => {
    if (index || negative) {
      const sign = document.createElement('span');
      sign.textContent = negative ? '−' : '+';
      display.append(sign);
    }
    const fraction = document.createElement('span');
    fraction.className = 'fraction';
    const top = document.createElement('span');
    const bottom = document.createElement('span');
    top.className = 'numerator';
    bottom.className = 'denominator';
    top.textContent = numerator;
    bottom.textContent = outside;
    fraction.append(top, bottom);
    display.append(fraction);
  });
  const closing = document.createElement('span');
  closing.textContent = ')';
  display.append(closing);
  return display;
}

function equationFields(row, step) {
  const pieces = step.equation.split('□');
  pieces.forEach((part, index) => {
    if (part) {
      const text = document.createElement('span');
      text.textContent = part;
      row.append(text);
    }
    if (index < pieces.length - 1) {
      const label = step.inputLabels ? step.inputLabels[index]
        : step.polynomialAnswer && index === step.polynomialAnswer.index ? 'Expression inside parentheses'
        : step.roots ? `Root ${index + 1}`
        : step.powers || step.completeFactors ? `Factor ${index + 1}${step.powers && step.powers[index] === 2 ? ', squared' : ''}`
          : `Blank ${index + 1}`;
      const input = field(label, Boolean(step.powers || step.roots || step.completeFactors));
      if ((step.polynomialAnswer && index === step.polynomialAnswer.index) || step.polynomialAnswers) input.classList.add('polynomial-input');
      row.append(input);
    }
  });
}

function renderStep(index, focus = true) {
  const step = problem.steps[index];
  const item = document.createElement('li');
  item.className = 'fq active p8-step';
  if (step.action === 'group') {
    const title = document.createElement('span');
    title.className = 'fq-label';
    title.textContent = step.title;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'p8-box-toggle';
    button.textContent = 'Add Grouping Parentheses';
    const expression = problem.mixed ? innerExpression(problem.remainingExpression) : null;
    button.addEventListener('click', () => {
      if (expression) expression.remove();
      else showGroups(problem.groups, $('#equation'), trackIndex === 1);
      item.classList.add('done');
      button.hidden = true;
      renderStep(index + 1);
    });
    const content = document.createElement('div');
    content.append(title);
    if (expression) content.append(expression);
    content.append(button);
    item.append(content);
    questions.append(item);
    if (focus) button.focus();
    return;
  }
  const form = document.createElement('form');
  const title = document.createElement('span');
  title.className = 'fq-label';
  title.textContent = step.title;
  form.append(title);
  if (problem.mixed && (step.groupFields || (step.box && step.box.power === 2))) {
    const expression = innerExpression(problem.remainingExpression);
    if (step.groupFields) showGroups(problem.groups, expression.lastElementChild, false);
    form.append(expression);
  }
  if (step.note) {
    const note = document.createElement('p');
    note.className = 'p8-note';
    note.textContent = step.note;
    form.append(note);
  }
  const exponentAnswers = step.answers.map(answer => /[²³⁴⁵⁶]|\^\d/.test(String(answer)));
  if (exponentAnswers.some(Boolean)) {
    const note = document.createElement('p');
    note.className = 'p8-note';
    note.id = `exponent-note-${index}`;
    note.textContent = 'For exponents, use the caret symbol (^). For example, type x^2 for x².';
    form.append(note);
  }
  if (step.division) form.append(divisionDisplay(step.division));
  if (step.groupedDivision) form.append(groupedDivision(step.groupedDivision));

  const row = document.createElement('div');
  row.className = 'fq-row p8-row math';
  if (step.groupFields) row.classList.add('p8-group-fields');
  if (step.polynomialAnswers && !step.zeroFactors) row.classList.add('p8-grouped-factors');
  if (step.zeroFactors) {
    step.answers.forEach((_, index) => {
      const label = document.createElement('label');
      label.className = 'p8-zero-factor';
      const input = field(`Factor ${index + 1}`, true);
      input.classList.add('polynomial-input');
      label.append(input, document.createTextNode(' = 0'));
      row.append(label);
    });
  } else if (step.options) {
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Factoring method');
    select.add(new Option('Choose a method', ''));
    step.options.forEach(value => select.add(new Option(value)));
    row.append(select);
  } else if (step.fields) {
    for (const label of step.fields) {
      const group = document.createElement('label');
      group.className = 'group';
      group.append(label, field(label));
      row.append(group);
    }
  } else {
    equationFields(row, step);
  }

  const button = document.createElement('button');
  button.textContent = 'Check';
  button.type = 'submit';
  const feedback = document.createElement('p');
  feedback.className = 'feedback';
  feedback.setAttribute('aria-live', 'polite');
  let boxPanel;
  if (step.box) {
    const initialQuadraticBox = step.box.power === 2;
    const quadraticFormFollowup = !initialQuadraticBox && problem.steps.some(item => item.box && item.box.power === 2);
    boxPanel = document.createElement('aside');
    boxPanel.id = `box-panel-${index}`;
    boxPanel.className = 'p8-box-panel';
    boxPanel.setAttribute('aria-label', 'Factoring box help');
    boxPanel.hidden = !initialQuadraticBox;
    boxPanel.append(factoringBox(step.box, !initialQuadraticBox && !quadraticFormFollowup));
    if (initialQuadraticBox) {
      item.classList.add(index === 0 ? 'p8-initial-box' : 'p8-side-box');
    } else {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'p8-box-toggle';
      toggle.textContent = 'Need Help: Show Factoring Box';
      toggle.setAttribute('aria-controls', boxPanel.id);
      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', () => {
        boxPanel.hidden = !boxPanel.hidden;
        if (quadraticFormFollowup) item.classList.toggle('p8-side-box', !boxPanel.hidden);
        toggle.textContent = boxPanel.hidden ? 'Need Help: Show Factoring Box' : 'Need Help: Hide Factoring Box';
        toggle.setAttribute('aria-expanded', String(!boxPanel.hidden));
      });
      form.append(toggle);
    }
  }
  form.append(row, button, feedback);
  item.append(form);
  if (boxPanel) item.append(boxPanel);
  questions.append(item);
  const fields = [...row.querySelectorAll('input, select')];
  fields.forEach((input, i) => {
    if (exponentAnswers[i]) input.setAttribute('aria-describedby', `exponent-note-${index}`);
  });
  if (focus) fields[0].focus();

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (item.classList.contains('done')) return;
    const matches = checkStep(step, fields.map(input => input.value));
    fields.forEach((input, i) => {
      input.classList.toggle('invalid', !matches[i]);
      input.setAttribute('aria-invalid', String(!matches[i]));
    });
    if (!matches.every(Boolean)) {
      feedback.textContent = step.hint;
      feedback.className = 'feedback no';
      return;
    }

    if (step.box && step.box.power === 2) {
      problem = orderQuadraticFormPractice(problem, fields[0].value);
    }
    item.classList.add('done');
    button.hidden = true;
    feedback.textContent = '';
    fields.forEach(input => { input.disabled = true; });
    if (step.result) row.textContent = problem.steps[index].result;
    if (index + 1 < problem.steps.length) renderStep(index + 1);
    else showComplete();
  });
}

function showComplete() {
  const solving = trackIndex === 1;
  $('#final-standard').textContent = problem.equation;
  $('#final-factors').textContent = problem.factored + (solving ? ' = 0' : '');
  $('#roots-summary').hidden = !solving;
  if (solving) {
    $('#final-roots').textContent = problem.solutions.join(', ');
  }
  complete.hidden = false;
  fireConfetti(180);
  next.focus();
}

function renderExample(focus = false) {
  problem = currentSections()[sectionIndex].examples[picker.selectedIndex];
  clearConfetti();
  complete.hidden = true;
  questions.replaceChildren();
  $('#equation').textContent = problem.equation;
  renderStep(0, focus);
}

function selectSection(index, focus = false) {
  sectionIndex = index;
  const section = currentSections()[index];
  const examples = section.examples;
  $('#section-title').textContent = trackIndex === 0 ? `${section.title} Practice` : section.title;
  [...sectionNav.children].forEach((button, position) => button.setAttribute('aria-pressed', String(position === index)));
  picker.replaceChildren(...examples.map((example, i) => new Option(`${i + 1}: ${example.equation}`, i)));
  renderExample(focus);
}

function selectTrack(index, focus = false) {
  trackIndex = index;
  $('#practice-title').textContent = index === 0 ? 'Factor practice' : 'Factor and solve';
  [...trackNav.children].forEach((button, position) => button.setAttribute('aria-pressed', String(position === index)));
  sectionNav.replaceChildren(...currentSections().map(({ title }, section) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = title;
    button.addEventListener('click', () => selectSection(section));
    return button;
  }));
  selectSection(0, focus);
}

['Factor Only Practice', 'Factor and Solve Practice'].forEach((title, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = title;
  button.addEventListener('click', () => selectTrack(index));
  trackNav.append(button);
});
picker.addEventListener('change', () => renderExample());
$('#try-again').addEventListener('click', () => renderExample(true));
next.addEventListener('click', () => {
  if (picker.selectedIndex + 1 === picker.options.length) {
    if (sectionIndex + 1 < currentSections().length) selectSection(sectionIndex + 1, true);
    else selectTrack(trackIndex === 0 ? 1 : 0, true);
  } else {
    picker.selectedIndex++;
    renderExample(true);
  }
});
selectTrack(0);
