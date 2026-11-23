import { examples, polynomialText, termText, checkAnswer } from './model.mjs?v=20261123f';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';

const $ = selector => document.querySelector(selector);
const picker = $('#example-picker');
const board = $('#division');
const form = $('#question');
const fields = $('#answer-fields');
const feedback = $('#feedback');
let example;
let roundIndex;
let phase;

function fraction(numerator, denominator) {
  const element = document.createElement('span');
  element.className = 'fraction math';
  const top = document.createElement('span');
  top.className = 'numerator';
  top.textContent = numerator;
  const bottom = document.createElement('span');
  bottom.className = 'denominator';
  bottom.textContent = denominator;
  element.append(top, bottom);
  return element;
}

function addRow(coefficients, options = {}) {
  const row = document.createElement('div');
  row.className = 'division-row';
  const label = document.createElement('span');
  label.className = options.dividend ? 'divisor' : '';
  label.textContent = options.dividend ? `(${polynomialText(example.divisor)})` : '';
  row.append(label);
  const nonzero = coefficients.flatMap((value, index) => value ? [index] : []);
  const first = nonzero[0];
  const last = nonzero[nonzero.length - 1];
  for (let index = 0; index < coefficients.length; index++) {
    if (options.input && index === options.input.start) {
      const cell = document.createElement('span');
      cell.className = `division-input-cell${options.product ? ' product-cell' : ''}`;
      cell.style.gridColumn = `span ${options.input.end - index + 1}`;
      const field = input(options.input.label);
      field.className = 'division-input';
      field.setAttribute('form', 'question');
      field.setAttribute('aria-describedby', 'question-title question-note feedback');
      if (options.product) cell.append(document.createTextNode('−('), field, document.createTextNode(')'));
      else cell.append(field);
      row.append(cell);
      index = options.input.end;
      continue;
    }
    const value = coefficients[index];
    const cell = document.createElement('span');
    if (value) {
      const term = document.createElement('span');
      term.className = 'division-term';
      term.textContent = termText(value, coefficients.length - 1 - index, index === first);
      if (options.product && index === first) {
        const prefix = document.createElement('span');
        prefix.className = 'subtract-prefix';
        prefix.textContent = '−(';
        term.prepend(prefix);
      }
      if (options.product && index === last) {
        const suffix = document.createElement('span');
        suffix.className = 'subtract-suffix';
        suffix.textContent = ')';
        term.append(suffix);
      }
      cell.append(term);
    } else if (options.showZero && !nonzero.length && index === (options.zeroIndex ?? coefficients.length - 1)) {
      cell.textContent = '0';
    }
    if (options.dividend) cell.className = `dividend-cell${index === 0 ? ' first' : ''}`;
    if (options.product && index >= options.start && index <= options.end) cell.className = 'product-cell';
    row.append(cell);
  }
  board.append(row);
}

function renderBoard() {
  board.replaceChildren();
  board.style.setProperty('--columns', example.dividend.length);
  const quotient = Array(example.dividend.length).fill(0);
  example.rounds.forEach((round, index) => {
    if (index < roundIndex || (index === roundIndex && phase > 0)) {
      round.term.forEach((value, position) => { quotient[position] += value; });
    }
  });
  const active = example.rounds[roundIndex];
  const quotientInput = active && phase === 0
    ? { start: active.term.findIndex(value => value !== 0), label: 'Next quotient term' } : null;
  if (quotientInput) quotientInput.end = quotientInput.start;
  addRow(quotient, { input: quotientInput });
  addRow(example.dividend, { dividend: true });
  example.rounds.forEach((round, index) => {
    if (index < roundIndex) {
      addRow(round.product, { product: true, start: round.productStart, end: round.productEnd });
      addRow(round.result, { showZero: true });
    } else if (index === roundIndex && phase > 0) {
      const productInput = phase === 1
        ? { start: round.productStart, end: round.productEnd, label: 'Product' } : null;
      addRow(phase === 1 ? Array(example.dividend.length).fill(0) : round.product,
        { product: true, start: round.productStart, end: round.productEnd, input: productInput });
      if (phase === 2) {
        addRow(Array(example.dividend.length).fill(0), {
          input: { start: round.productStart + 1, end: round.productEnd, label: 'Result after subtracting' },
        });
      } else if (phase === 3) {
        addRow(round.subtraction, {
          showZero: true,
          zeroIndex: round.productEnd,
          input: { start: round.productEnd + 1, end: round.productEnd + 1, label: 'Term to bring down' },
        });
      }
    }
  });
}

function input(label) {
  const element = document.createElement('input');
  element.type = 'text';
  element.autocomplete = 'off';
  element.setAttribute('aria-label', label);
  return element;
}

function labeledInput(label) {
  const wrapper = document.createElement('label');
  const text = document.createElement('span');
  text.textContent = `${label}:`;
  wrapper.append(text, input(label));
  return wrapper;
}

function renderQuestion() {
  fields.replaceChildren();
  feedback.textContent = '';
  feedback.className = 'feedback';
  const title = $('#question-title');
  const note = $('#question-note');
  if (roundIndex === example.rounds.length) {
    title.textContent = 'Write the quotient and remainder.';
    note.textContent = 'Enter 0 for the remainder if the division is exact.';
    fields.append(labeledInput('Quotient'), labeledInput('Remainder'));
  } else {
    const round = example.rounds[roundIndex];
    if (phase === 0) {
      title.textContent = `How many times does ${round.denominator} go into ${round.numerator}?`;
      note.textContent = 'Divide the leading terms. Enter the next quotient term above the division bar.';
      fields.append(fraction(round.numerator, round.denominator), document.createTextNode(' = ?'));
    } else if (phase === 1) {
      title.textContent = 'Multiply the divisor by the new quotient term.';
      note.textContent = `Enter the product of (${polynomialText(example.divisor)}) and ${polynomialText(round.term)} inside the parentheses.`;
    } else if (phase === 2) {
      title.textContent = round.bringsDown ? 'Subtract the product.' : 'Subtract to find the remainder.';
      note.textContent = round.bringsDown
        ? 'Enter the result before bringing down the next term. Enter 0 if nothing remains.'
        : 'Subtract the entire product. Enter 0 if nothing remains.';
      if (example.divisor.length > 2) {
        note.textContent += ' Include all remaining terms after subtracting, not just the first one.';
      }
    } else {
      title.textContent = 'Bring down the next term.';
      note.textContent = 'Enter the next term from the dividend, including its sign.';
    }
  }
  (board.querySelector('.division-input') || fields.querySelector('input')).focus();
}

function showComplete() {
  const quotient = polynomialText(example.quotient);
  const remainder = polynomialText(example.remainder);
  $('#final-quotient').textContent = quotient;
  $('#final-remainder').textContent = remainder;
  const answer = $('#final-answer');
  answer.replaceChildren(document.createTextNode(`${$('#problem').textContent} = ${quotient}`));
  if (remainder !== '0') {
    answer.append(document.createTextNode(' + '), fraction(remainder, polynomialText(example.divisor)));
  }
  form.hidden = true;
  $('#complete').hidden = false;
  fireConfetti(180);
  $('#next-example').focus();
}

function renderExample() {
  example = examples[picker.selectedIndex];
  roundIndex = 0;
  phase = 0;
  clearConfetti();
  form.hidden = false;
  $('#complete').hidden = true;
  $('#problem').textContent = `(${polynomialText(example.dividend)}) ÷ (${polynomialText(example.divisor)})`;
  renderBoard();
  renderQuestion();
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const round = example.rounds[roundIndex];
  const inputs = round ? [board.querySelector('.division-input')] : [...fields.querySelectorAll('input')];
  const expected = round
    ? [[round.term, round.product, round.subtraction, round.broughtDown][phase]]
    : [example.quotient, example.remainder];
  const matches = inputs.map((element, index) => checkAnswer(element.value, expected[index]));
  inputs.forEach((element, index) => {
    element.classList.toggle('invalid', !matches[index]);
    element.setAttribute('aria-invalid', String(!matches[index]));
  });
  if (!matches.every(Boolean)) {
    feedback.textContent = 'Check your signs, coefficients, and exponents, then try again.';
    feedback.className = 'feedback no';
    return;
  }
  if (!round) {
    showComplete();
    return;
  }
  phase++;
  if (phase === 4 || (phase === 3 && !round.bringsDown)) {
    phase = 0;
    roundIndex++;
  }
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
