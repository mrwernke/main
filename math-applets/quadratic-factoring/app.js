import { exercises, nonMonicExercises, parseInteger, parseCompleteFactor, linearTerm, expressionText, factoredText, assess } from './model.mjs';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';

const $ = selector => document.querySelector(selector);
let index = 0, submitted = false, nonMonic = false;
const bank = () => nonMonic ? nonMonicExercises : exercises;
const item = () => bank()[index];
const boxValues = () => [
  parseInteger($('#top-factor').value), parseInteger($('#side-factor').value),
  nonMonic ? parseInteger($('#top-coefficient').value) : 1,
  nonMonic ? parseInteger($('#side-coefficient').value) : 1,
];
const boxResult = () => assess(item(), ...boxValues());

function state(element, correct, ready) {
  element.classList.toggle('correct', ready && correct);
  element.classList.toggle('incorrect', ready && !correct);
}

function clearAnswer() {
  clearConfetti();
  submitted = false;
  $('#complete').hidden = true;
  $('#next').hidden = true;
  $('#factored-result').textContent = '';
  $('#factor-feedback').textContent = '';
  $('#factor-feedback').className = 'feedback';
  $('#submit-factors').disabled = false;
  ['#first-factor', '#second-factor'].forEach(id => {
    $(id).value = '';
    $(id).readOnly = false;
    $(id).classList.remove('invalid');
    $(id).setAttribute('aria-invalid', 'false');
  });
}

function update() {
  clearAnswer();
  const inputs = [$('#top-factor'), $('#side-factor'), $('#top-coefficient'), $('#side-coefficient')];
  const values = boxValues();
  const invalid = inputs.map((input, i) => input.value.trim() !== ''
    && (!Number.isSafeInteger(values[i]) || (i >= 2 && values[i] <= 0)));
  inputs.forEach((input, i) => {
    input.classList.toggle('invalid', invalid[i]);
    input.setAttribute('aria-invalid', String(invalid[i]));
  });
  const result = assess(item(), ...values);
  $('#top-product').textContent = Number.isSafeInteger(result.topRight) ? linearTerm(result.topRight) : '?';
  $('#side-product').textContent = Number.isSafeInteger(result.bottomLeft) ? linearTerm(result.bottomLeft) : '?';
  const tooLarge = values.every(Number.isSafeInteger) && !result.ready;
  $('#input-feedback').textContent = invalid.some(Boolean)
    ? 'Enter signed integers for the constants and positive whole numbers for the x-coefficients.'
    : tooLarge ? 'These numbers are too large to check accurately. Try smaller integers.' : '';
  $('#input-feedback').className = `feedback${invalid.some(Boolean) || tooLarge ? ' no' : ''}`;
  state($('#constant-cell'), result.productCorrect, result.ready);
  state($('#product-check'), result.productCorrect, result.ready);
  state($('#middle-circle'), result.sumCorrect, result.ready);
  state($('#sum-check'), result.sumCorrect, result.ready);
  const leadingReady = values.slice(2).every(value => Number.isSafeInteger(value) && value > 0)
    && Number.isSafeInteger(result.leading);
  state($('#leading-cell'), result.leadingCorrect, nonMonic && leadingReady);
  state($('#leading-check'), result.leadingCorrect, leadingReady);
  $('#leading-mark').textContent = nonMonic && leadingReady ? result.leadingCorrect ? '✓' : '✗' : '';
  $('#leading-feedback').textContent = leadingReady
    ? `${values[2]} × ${values[3]} = ${result.leading}. ${result.leadingCorrect ? 'Correct!' : `Not yet: the target is ${item().a}.`}`
    : 'Enter both x-coefficients to check the leading coefficient.';
  $('#product-mark').textContent = result.ready ? result.productCorrect ? '✓' : '✗' : '';
  $('#sum-mark').textContent = result.ready ? result.sumCorrect ? '✓' : '✗' : '';
  $('#product-feedback').textContent = result.ready
    ? `${values[0]} × ${values[1]} = ${result.product}. ${result.productCorrect ? 'Correct!' : `Not yet: the target is ${item().c}.`}`
    : `Enter ${nonMonic ? 'all four' : 'both'} integers to check their product.`;
  $('#sum-feedback').textContent = result.ready
    ? `${linearTerm(result.topRight)} + (${linearTerm(result.bottomLeft)}) = ${linearTerm(result.sum)}. ${result.sumCorrect ? 'Correct!' : `Not yet: the target is ${linearTerm(item().b)}.`}`
    : `Enter ${nonMonic ? 'all four' : 'both'} integers to check the sum of the two x-terms.`;
  $('#factor-entry').hidden = !result.complete;
}

function reset() {
  $('#example-picker').value = String(index);
  $('#expression').textContent = expressionText(item());
  $('#constant').textContent = String(item().c);
  $('#middle-term').textContent = linearTerm(item().b);
  $('#leading-term').textContent = `${nonMonic ? item().a : ''}x²`;
  $('#top-coefficient').hidden = !nonMonic;
  $('#side-coefficient').hidden = !nonMonic;
  $('#top-coefficient').value = '';
  $('#side-coefficient').value = '';
  $('#leading-check').hidden = !nonMonic;
  $('#checks-heading').textContent = nonMonic ? 'Check all three conditions' : 'Check both conditions';
  $('#box-instructions').textContent = nonMonic
    ? 'Enter positive whole-number x-coefficients and signed integer constants. Each row label multiplies each column label. Match the leading term, constant, and middle term.'
    : 'Enter signed integers in the two blanks. Each row label multiplies each column label. The circle shows the target middle term.';
  $('#factor-instructions').textContent = nonMonic
    ? 'All three conditions match. Type each complete factor inside its parentheses, such as 2x+3 or x-4. Include each x-coefficient; for a zero constant, type x or 2x as appropriate.'
    : 'Both conditions match. Type each complete factor inside its parentheses, such as x+3 or x-4. For a zero constant, type x.';
  $('#top-factor').value = '';
  $('#side-factor').value = '';
  update();
}

$('#factor-entry').onsubmit = event => {
  event.preventDefault();
  if (submitted || !boxResult().complete) return;
  const inputs = [$('#first-factor'), $('#second-factor')];
  const factors = inputs.map(input => parseCompleteFactor(input.value));
  const result = factors.every(Boolean)
    ? assess(item(), factors[0].constant, factors[1].constant, factors[0].coefficient, factors[1].coefficient)
    : null;
  inputs.forEach((input, i) => {
    const invalid = !factors[i] || !result?.complete;
    input.classList.toggle('invalid', invalid);
    input.setAttribute('aria-invalid', String(invalid));
  });
  if (!result?.complete) {
    $('#factor-feedback').textContent = 'Not yet. Type each complete factor, including x, its coefficient, and the signed constant. Check that multiplying both factors gives every term of the expression.';
    $('#factor-feedback').className = 'feedback no';
    return;
  }
  submitted = true;
  inputs.forEach(input => { input.readOnly = true; });
  $('#submit-factors').disabled = true;
  $('#factor-feedback').textContent = 'Correct! Both complete factors match the expression.';
  $('#factor-feedback').className = 'feedback ok';
  $('#factored-result').textContent = `${expressionText(item())} = ${factoredText(factors[0].constant, factors[1].constant, factors[0].coefficient, factors[1].coefficient)}`;
  $('#complete').hidden = false;
  $('#next').hidden = false;
  fireConfetti(180);
};

function selectMode(value) {
  nonMonic = value;
  index = 0;
  $('#monic-mode').setAttribute('aria-pressed', String(!nonMonic));
  $('#non-monic-mode').setAttribute('aria-pressed', String(nonMonic));
  $('#example-picker').replaceChildren();
  bank().forEach((exercise, i) => {
    $('#example-picker').add(new Option(`${i + 1}. ${expressionText(exercise)}`, i));
  });
  reset();
}
$('#monic-mode').onclick = () => selectMode(false);
$('#non-monic-mode').onclick = () => selectMode(true);
['#top-factor', '#side-factor', '#top-coefficient', '#side-coefficient'].forEach(id => {
  $(id).addEventListener('input', update);
});
$('#example-picker').onchange = () => {
  index = Number($('#example-picker').value);
  reset();
};
$('#reset').onclick = () => { reset(); $('#top-factor').focus(); };
$('#next').onclick = () => {
  index = (index + 1) % bank().length;
  reset();
  $('#top-factor').focus();
};
selectMode(false);
