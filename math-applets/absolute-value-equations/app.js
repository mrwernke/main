import {
  guidedProblems, challengeProblems, equationText, fullLeftText, scaledAbsText, absText,
  afterConstant, isolatedValue, constantOpText, branchText,
  solutions, stepChoices, absChoices, parseInteger, formatNumber,
} from './model.mjs';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';

const $ = selector => document.querySelector(selector);
let mode = 'guided', index = 0;
const bank = () => mode === 'guided' ? guidedProblems : challengeProblems;
const problem = () => bank()[index];
const pickerValue = () => `${mode}-${index}`;

function feedback(id, text, good = false) {
  const element = $(id);
  element.textContent = text;
  element.className = `feedback ${text ? (good ? 'ok' : 'no') : ''}`;
}

function markInput(input, good) {
  input.classList.toggle('invalid', !good);
  input.setAttribute('aria-invalid', String(!good));
}

function clearInput(input) {
  input.value = '';
  input.readOnly = false;
  input.classList.remove('invalid');
  input.setAttribute('aria-invalid', 'false');
}

function addWorkLine(lhs, rhs, op = false) {
  const line = document.createElement('div');
  line.className = `work-line${op ? ' op' : ''}`;
  const left = document.createElement('span');
  left.className = 'lhs';
  left.textContent = lhs;
  const equals = document.createElement('span');
  equals.className = 'eq';
  equals.textContent = '=';
  const right = document.createElement('span');
  right.className = 'rhs';
  right.textContent = rhs;
  line.append(left, equals, right);
  $('#work-lines').append(line);
  return line;
}

function fraction(numerator, denominator) {
  const wrap = document.createElement('span');
  wrap.className = 'fraction';
  const top = document.createElement('span');
  top.className = 'numerator';
  top.textContent = numerator;
  const bottom = document.createElement('span');
  bottom.className = 'denominator';
  bottom.textContent = denominator;
  wrap.append(top, bottom);
  return wrap;
}

// Turns an existing work line into a division by stacking the divisor under each side.
function convertToDivision(line, divisor) {
  line.classList.add('division');
  ['lhs', 'rhs'].forEach(part => {
    const span = line.querySelector(`.${part}`);
    const numerator = span.textContent;
    span.textContent = '';
    span.append(fraction(numerator, String(divisor)));
  });
}

function renderQuestion(title, choices, correctId, praise, hint, onCorrect) {
  $('#question-title').textContent = title;
  feedback('#choice-feedback', '');
  $('#choices').replaceChildren(...choices.map(choice => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.textContent = choice.label;
    button.onclick = () => {
      if (choice.id === correctId) {
        $('#choices').querySelectorAll('button').forEach(other => { other.disabled = true; });
        button.classList.add('correct');
        feedback('#choice-feedback', praise, true);
        onCorrect();
      } else {
        button.disabled = true;
        button.classList.add('invalid');
        feedback('#choice-feedback', hint);
      }
    };
    return button;
  }));
}

function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function askFirstStep() {
  const current = problem();
  renderQuestion(
    'What is the first step to isolate the absolute value?',
    shuffled(stepChoices(current)), 'constant',
    'Correct. Undo the constant that is farthest from x first.',
    'Not quite. Undo the operations outside the absolute value, working from the outside in.',
    () => {
      addWorkLine(constantOpText(current), constantOpText(current), true);
      const resultLine = addWorkLine(scaledAbsText(current), formatNumber(afterConstant(current)));
      askSecondStep(resultLine);
    },
  );
}

function askSecondStep(resultLine) {
  const current = problem();
  renderQuestion(
    'What is the next step?',
    shuffled(stepChoices(current).filter(choice => choice.id !== 'constant')), 'divide',
    'Correct. Dividing both sides leaves the absolute value alone.',
    'Not quite. The absolute value is still multiplied by a number.',
    () => {
      convertToDivision(resultLine, current.a);
      addWorkLine(absText(current), formatNumber(isolatedValue(current)));
      askAbsoluteStep();
    },
  );
}

function askAbsoluteStep() {
  const current = problem();
  const value = isolatedValue(current);
  renderQuestion(
    'How do we undo the absolute value operation?',
    absChoices(current), 'two-equations',
    'Correct. The inside can equal the positive or the negative value.',
    `Not quite. An absolute value equals ${value} when the inside is ${value} or \u2212${value}.`,
    () => {
      $('#question-area').hidden = true;
      showBranches();
    },
  );
}

function showBranches() {
  const current = problem();
  $('#branch-plus').textContent = branchText(current, 1);
  $('#branch-minus').textContent = branchText(current, -1);
  [$('#answer-plus'), $('#answer-minus')].forEach(clearInput);
  feedback('#branch-feedback', '');
  $('#check-solutions').disabled = false;
  $('#branch-area').hidden = false;
  $('#answer-plus').focus();
}

function finishProblem() {
  fireConfetti(180);
  $('#complete').hidden = false;
  const last = index === bank().length - 1;
  if (mode === 'guided') {
    $('#complete-note').textContent = last
      ? 'You finished all three guided problems. Ready to try some with no hints?'
      : 'You isolated the absolute value and found both solutions.';
    $('#next-problem').hidden = last;
    $('#to-solo').hidden = !last;
    $('#restart').hidden = true;
  } else {
    $('#complete-note').textContent = last
      ? 'You solved every equation on your own. That is the whole lab!'
      : 'Both solutions are correct — no hints needed.';
    $('#next-problem').hidden = last;
    $('#to-solo').hidden = true;
    $('#restart').hidden = !last;
  }
}

function checkBranches(event) {
  event.preventDefault();
  const [expectedPlus, expectedMinus] = solutions(problem());
  const plus = parseInteger($('#answer-plus').value);
  const minus = parseInteger($('#answer-minus').value);
  if (plus === null || minus === null) {
    feedback('#branch-feedback', 'Enter an integer for each equation.');
    markInput($('#answer-plus'), plus !== null);
    markInput($('#answer-minus'), minus !== null);
    return;
  }
  const plusOk = plus === expectedPlus, minusOk = minus === expectedMinus;
  markInput($('#answer-plus'), plusOk);
  markInput($('#answer-minus'), minusOk);
  if (plusOk && minusOk) {
    feedback('#branch-feedback', 'Both solutions are correct.', true);
    [$('#answer-plus'), $('#answer-minus')].forEach(input => { input.readOnly = true; });
    $('#check-solutions').disabled = true;
    finishProblem();
  } else feedback('#branch-feedback', 'Check the highlighted equation and solve it again.');
}

function checkSolo(event) {
  event.preventDefault();
  const expected = solutions(problem());
  const first = parseInteger($('#solo-first').value);
  const second = parseInteger($('#solo-second').value);
  if (first === null || second === null) {
    feedback('#solo-feedback', 'Enter an integer in each blank.');
    markInput($('#solo-first'), first !== null);
    markInput($('#solo-second'), second !== null);
    return;
  }
  const ok = first !== second && expected.includes(first) && expected.includes(second);
  markInput($('#solo-first'), ok);
  markInput($('#solo-second'), ok);
  if (ok) {
    feedback('#solo-feedback', 'Both solutions are correct.', true);
    [$('#solo-first'), $('#solo-second')].forEach(input => { input.readOnly = true; });
    $('#check-solo').disabled = true;
    finishProblem();
  } else feedback('#solo-feedback', 'At least one solution is incorrect. Isolate the absolute value and try again.');
}

function renderProblem() {
  clearConfetti();
  const current = problem();
  $('#equation').textContent = equationText(current);
  $('#problem-picker').value = pickerValue();
  $('#work-lines').replaceChildren();
  $('#complete').hidden = true;
  $('#branch-area').hidden = true;
  if (mode === 'guided') {
    $('#solo-area').hidden = true;
    $('#question-area').hidden = false;
    addWorkLine(fullLeftText(current), String(current.e));
    askFirstStep();
  } else {
    $('#question-area').hidden = true;
    $('#solo-area').hidden = false;
    [$('#solo-first'), $('#solo-second')].forEach(clearInput);
    feedback('#solo-feedback', '');
    $('#check-solo').disabled = false;
  }
}

function switchMode(next) {
  if (mode === next) return;
  mode = next;
  index = 0;
  syncModeButtons();
  renderProblem();
}

function syncModeButtons() {
  $('#guided-mode').setAttribute('aria-pressed', String(mode === 'guided'));
  $('#solo-mode').setAttribute('aria-pressed', String(mode === 'solo'));
}

$('#problem-picker').replaceChildren(
  ...guidedProblems.map((unused, position) => new Option(`Guided Problem ${position + 1}`, `guided-${position}`)),
  ...challengeProblems.map((unused, position) => new Option(`Practice ${position + 1}`, `solo-${position}`)),
);
$('#problem-picker').onchange = () => {
  const [nextMode, nextIndex] = $('#problem-picker').value.split('-');
  mode = nextMode;
  index = Number(nextIndex);
  syncModeButtons();
  renderProblem();
};

$('#guided-mode').onclick = () => switchMode('guided');
$('#solo-mode').onclick = () => switchMode('solo');
$('#branch-area').onsubmit = checkBranches;
$('#solo-area').onsubmit = checkSolo;
$('#next-problem').onclick = () => { index += 1; renderProblem(); };
$('#to-solo').onclick = () => switchMode('solo');
$('#restart').onclick = () => { index = 0; renderProblem(); };

renderProblem();
