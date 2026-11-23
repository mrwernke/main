import { examples, polynomialText, checkAnswer, checkInteger, checkRoot } from './model.mjs?v=20261123m';
import { numberText, input, renderSyntheticBoard } from './board.mjs?v=20261123a';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';

const $ = selector => document.querySelector(selector);
const picker = $('#example-picker');
const board = $('#division');
const form = $('#question');
const fields = $('#answer-fields');
const feedback = $('#feedback');
let example;
let phase;
let column;

function labeledInput(label) {
  const wrapper = document.createElement('label');
  const text = document.createElement('span');
  text.textContent = `${label}:`;
  wrapper.append(text, input(label));
  return wrapper;
}

function renderBoard() {
  renderSyntheticBoard(board, example, phase, column);
  const adjustment = $('#quotient-adjustment');
  adjustment.hidden = example.divisor[0] === 1 || (phase !== 'final' && phase !== 'factor');
  adjustment.textContent = adjustment.hidden ? ''
    : `Divide each unboxed number by ${example.divisor[0]}, the a-value of the divisor, to get the quotient coefficients. Do not divide the boxed remainder.`;
}

function renderQuestion() {
  fields.replaceChildren();
  fields.removeAttribute('role');
  fields.removeAttribute('aria-labelledby');
  fields.removeAttribute('aria-describedby');
  feedback.textContent = '';
  feedback.className = 'feedback';
  const title = $('#question-title');
  const note = $('#question-note');
  if (phase === 'coefficients') {
    title.textContent = 'Enter the coefficients of the dividend.';
    note.textContent = 'Use descending powers of x, and enter 0 for each missing term. Include the constant term.';
  } else if (phase === 'root') {
    title.textContent = 'What number goes outside the synthetic division setup?';
    note.textContent = `Set ${polynomialText(example.divisor)} equal to 0 and solve for x. Enter that number on the left${example.divisor[0] === 1 ? '.' : ' as a fraction, such as 1/2.'}`;
  } else if (phase === 'bring') {
    title.textContent = 'Bring down the first coefficient.';
    note.textContent = 'Copy the leading coefficient directly below the line.';
  } else if (phase === 'multiply') {
    title.textContent = 'Multiply.';
    note.textContent = `Multiply ${numberText(example.rootText)} by ${numberText(example.results[column - 1])}. Enter the product under the next coefficient.`;
  } else if (phase === 'add') {
    title.textContent = 'Add the column.';
    note.textContent = `Add ${numberText(example.dividend[column])} and ${numberText(example.products[column - 1])}. Enter the sum below the line.`;
  } else if (phase === 'final') {
    title.textContent = 'Write the quotient and remainder.';
    note.textContent = example.divisor[0] === 1
      ? 'The boxed last number is the remainder. The other numbers are the quotient coefficients, starting one degree lower than the dividend. Enter 0 for an exact division.'
      : 'Write the quotient using the adjusted coefficients, starting one degree lower than the dividend. The boxed last number is the remainder. Enter 0 for an exact division.';
    fields.append(labeledInput('Quotient'), labeledInput('Remainder'));
    if (example.divisor[0] !== 1) fields.querySelector('input').setAttribute('aria-describedby', 'quotient-adjustment question-note');
  } else {
    title.textContent = 'Based on the remainder, is the divisor a factor?';
    note.textContent = 'Use the remainder from your work to decide.';
    fields.setAttribute('role', 'radiogroup');
    fields.setAttribute('aria-labelledby', 'question-title');
    fields.setAttribute('aria-describedby', 'question-note feedback');
    ['Yes', 'No'].forEach(choice => {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'factor';
      radio.value = choice.toLowerCase();
      label.append(radio, document.createTextNode(choice));
      fields.append(label);
    });
  }
  (board.querySelector('.division-input') || fields.querySelector('input')).focus();
}

function showComplete() {
  const quotient = polynomialText(example.quotient);
  $('#final-quotient').textContent = quotient;
  $('#final-remainder').textContent = numberText(example.remainder);
  const answer = $('#final-answer');
  answer.replaceChildren(document.createTextNode(`${$('#problem').textContent} = ${quotient}`));
  if (example.remainder !== 0) {
    const fraction = document.createElement('span');
    fraction.className = 'fraction math';
    const numerator = document.createElement('span');
    numerator.className = 'numerator';
    numerator.textContent = String(Math.abs(example.remainder));
    const denominator = document.createElement('span');
    denominator.className = 'denominator';
    denominator.textContent = polynomialText(example.divisor);
    fraction.append(numerator, denominator);
    answer.append(document.createTextNode(example.remainder < 0 ? ' − ' : ' + '), fraction);
  }
  form.hidden = true;
  $('#complete').hidden = false;
  fireConfetti(180);
  $('#next-example').focus();
}

function renderExample() {
  example = examples[picker.selectedIndex];
  phase = 'coefficients';
  column = 0;
  clearConfetti();
  form.hidden = false;
  $('#complete').hidden = true;
  $('#problem').textContent = `(${polynomialText(example.dividend)}) ÷ (${polynomialText(example.divisor)})`;
  renderBoard();
  renderQuestion();
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (phase === 'factor') {
    const selected = fields.querySelector('input:checked');
    if (!selected || (selected.value === 'yes') !== (example.remainder === 0)) {
      feedback.textContent = selected ? 'Check what the remainder tells you about factors, then try again.' : 'Choose Yes or No.';
      feedback.className = 'feedback no';
      return;
    }
    showComplete();
    return;
  }
  const inputs = phase === 'final' ? [...fields.querySelectorAll('input')] : [...board.querySelectorAll('.division-input')];
  let matches;
  if (phase === 'final') {
    matches = [checkAnswer(inputs[0].value, example.quotient), checkInteger(inputs[1].value, example.remainder)];
  } else if (phase === 'coefficients') {
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
  if (phase === 'final') {
    phase = 'factor';
    renderBoard();
    renderQuestion();
    return;
  }
  if (phase === 'coefficients') phase = 'root';
  else if (phase === 'root') phase = 'bring';
  else if (phase === 'bring') { column = 1; phase = 'multiply'; }
  else if (phase === 'multiply') phase = 'add';
  else if (column === example.dividend.length - 1) phase = 'final';
  else { column++; phase = 'multiply'; }
  renderBoard();
  renderQuestion();
});

picker.replaceChildren(...examples.map((item, index) =>
  new Option(`${index + 1}: (${polynomialText(item.dividend)}) ÷ (${polynomialText(item.divisor)})`, index)));
picker.addEventListener('change', renderExample);
$('#try-again').addEventListener('click', renderExample);
$('#next-example').addEventListener('click', () => {
  picker.selectedIndex = (picker.selectedIndex + 1) % examples.length;
  renderExample();
});
renderExample();
