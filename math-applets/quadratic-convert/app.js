import {
  practice, formatValue, standardText, vertexData, vertexText, substitutionText,
  linearFactorText, parseNormalizedFactor, assess, parseInteger, parseCompleteFactor, factoredText, parseNumber,
} from './model.mjs';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';

const $ = selector => document.querySelector(selector);
let form = 'factored', method = 'manual', index = 0, factorsSubmitted = false, confirmedFactors = null, scaledFactor = null, remainingFactor = null;
const item = () => practice[index];
const values = () => [
  parseInteger($('#top-factor').value), parseInteger($('#side-factor').value),
  item().a === 1 ? 1 : parseInteger($('#top-coefficient').value),
  item().a === 1 ? 1 : parseInteger($('#side-coefficient').value),
];
const boxResult = () => assess(item(), ...values());
const close = (value, expected) => Number.isFinite(value) && Math.abs(value - expected) < 1e-5;

function setPressed(buttons, active) {
  buttons.forEach(([selector, value]) => $(selector).setAttribute('aria-pressed', String(value === active)));
}

function clearFactorAnswer() {
  factorsSubmitted = false;
  confirmedFactors = null;
  scaledFactor = null;
  remainingFactor = null;
  $('#first-factor').value = '';
  $('#second-factor').value = '';
  $('#first-factor').readOnly = false;
  $('#second-factor').readOnly = false;
  $('#first-factor').classList.remove('invalid');
  $('#second-factor').classList.remove('invalid');
  $('#submit-factors').disabled = false;
  $('#submit-factors').hidden = false;
  $('#factor-feedback').textContent = '';
  $('#factor-feedback').className = 'feedback';
  $('#factor-entry').hidden = true;
  $('#normalization').hidden = true;
  $('#normalized-factor').value = '';
  $('#normalized-factor').readOnly = false;
  $('#normalized-factor').classList.remove('invalid');
  $('#check-normalization').disabled = false;
  $('#check-normalization').hidden = false;
  $('#normalization-feedback').textContent = '';
  $('#normalization-feedback').className = 'feedback';
  $('#normalization-feedback').hidden = false;
  $('#factored-complete').hidden = true;
  $('#next').hidden = true;
}

function resetVertex() {
  ['#vertex-x', '#vertex-y', '#form-a', '#form-h', '#form-k'].forEach(id => {
    $(id).value = '';
    $(id).readOnly = false;
    $(id).classList.remove('invalid');
    $(id).setAttribute('aria-invalid', 'false');
  });
  ['#form-h-sign', '#form-k-sign'].forEach(id => {
    $(id).value = '';
    $(id).disabled = false;
    $(id).classList.remove('invalid');
    $(id).setAttribute('aria-invalid', 'false');
  });
  $('#vertex-y-work').hidden = true;
  $('#vertex-form-entry').hidden = true;
  $('#vertex-complete').hidden = true;
  $('#check-vertex-form').hidden = false;
  ['#vertex-x-feedback', '#vertex-y-feedback', '#vertex-form-feedback'].forEach(id => {
    $(id).textContent = '';
    $(id).className = 'feedback';
    $(id).hidden = false;
  });
}

function fillPicker() {
  $('#example-picker').replaceChildren(...practice.map((example, i) => new Option(`${i + 1}. ${standardText(example)}`, i)));
  $('#example-picker').value = String(index);
}

function reset() {
  clearConfetti();
  fillPicker();
  $('#expression').textContent = standardText(item());
  $('#constant').textContent = String(item().c);
  $('#middle-term').textContent = item().b === 0 ? '0x' : `${item().b < 0 ? '−' : ''}${Math.abs(item().b) === 1 ? '' : Math.abs(item().b)}x`;
  $('#leading-term').textContent = `${item().a === 1 ? '' : item().a}x²`;
  $('#top-factor').value = '';
  $('#side-factor').value = '';
  $('#top-coefficient').value = '';
  $('#side-coefficient').value = '';
  const nonMonic = item().a > 1;
  $('#top-coefficient').hidden = !nonMonic;
  $('#side-coefficient').hidden = !nonMonic;
  $('#leading-check').hidden = !nonMonic;
  $('#product-check').hidden = false;
  $('#sum-check').hidden = false;
  $('#checks-heading').hidden = false;
  $('#checks-heading').textContent = nonMonic ? 'Check all three conditions' : 'Check both conditions';
  $('#box-instructions').textContent = nonMonic
    ? 'Enter positive whole-number x-coefficients and signed integer constants. Match the leading term, constant, and middle term.'
    : 'Enter signed integers in the two blanks. Match the constant and middle term.';
  $('#factor-instructions').textContent = 'Type each complete factor inside its parentheses, such as x+3 or 2x−5.';
  $('#input-feedback').textContent = '';
  $('#leading-mark').textContent = '';
  $('#product-mark').textContent = '';
  $('#sum-mark').textContent = '';
  ['#product-feedback', '#sum-feedback', '#leading-feedback'].forEach(id => { $(id).textContent = ''; });
  clearFactorAnswer();
  resetVertex();
  updateBox();
  $('#vertex-substitution').textContent = substitutionText(item());
  $('#factored-work').hidden = form !== 'factored';
  $('#vertex-work').hidden = form !== 'vertex';
  $('#manual-work').hidden = method !== 'manual';
  $('#square-not-ready').hidden = method !== 'square';
}

function state(element, correct, ready) {
  element.classList.toggle('correct', ready && correct);
  element.classList.toggle('incorrect', ready && !correct);
}

function updateBox() {
  clearFactorAnswer();
  const inputList = [$('#top-factor'), $('#side-factor'), $('#top-coefficient'), $('#side-coefficient')];
  const vals = values();
  const nonMonic = item().a > 1;
  const invalid = inputList.map((input, i) => input.value.trim() !== ''
    && (!Number.isSafeInteger(vals[i]) || (i >= 2 && vals[i] <= 0)));
  inputList.forEach((input, i) => {
    input.classList.toggle('invalid', invalid[i]);
    input.setAttribute('aria-invalid', String(invalid[i]));
  });
  const result = assess(item(), ...vals);
  const repeated = result.complete && vals[0] === vals[1] && vals[2] === vals[3];
  $('#second-factor').hidden = repeated;
  $('#factor-middle').hidden = repeated;
  $('#factor-square').hidden = !repeated;
  $('#top-product').textContent = Number.isSafeInteger(result.topRight) ? `${result.topRight}x` : '?';
  $('#side-product').textContent = Number.isSafeInteger(result.bottomLeft) ? `${result.bottomLeft}x` : '?';
  const tooLarge = vals.every(Number.isSafeInteger) && !result.ready;
  $('#input-feedback').textContent = invalid.some(Boolean)
    ? 'Use signed integers for constants and positive whole numbers for x-coefficients.'
    : tooLarge ? 'These values are too large to check accurately.' : '';
  $('#input-feedback').className = `feedback${invalid.some(Boolean) || tooLarge ? ' no' : ''}`;
  state($('#product-check'), result.productCorrect, result.ready);
  $('#product-check').hidden = result.ready && result.productCorrect;
  state($('#sum-check'), result.sumCorrect, result.ready);
  $('#sum-check').hidden = result.ready && result.sumCorrect;
  const leadingReady = vals[2] > 0 && vals[3] > 0 && Number.isSafeInteger(vals[2]) && Number.isSafeInteger(vals[3]);
  state($('#leading-check'), result.leadingCorrect, leadingReady);
  $('#leading-check').hidden = !nonMonic || (leadingReady && result.leadingCorrect);
  $('#leading-mark').textContent = nonMonic && leadingReady ? result.leadingCorrect ? '✓' : '✗' : '';
  $('#leading-feedback').textContent = leadingReady
    ? `${vals[2]} × ${vals[3]} = ${result.leading}. ${result.leadingCorrect ? 'Correct!' : `Target: ${item().a}.`}`
    : 'Enter both x-coefficients to check the leading coefficient.';
  $('#product-mark').textContent = result.ready ? result.productCorrect ? '✓' : '✗' : '';
  $('#sum-mark').textContent = result.ready ? result.sumCorrect ? '✓' : '✗' : '';
  $('#product-feedback').textContent = result.ready
    ? `${vals[0]} × ${vals[1]} = ${result.product}. ${result.productCorrect ? 'Correct!' : `Target: ${item().c}.`}`
    : `Enter ${nonMonic ? 'all four' : 'both'} integers to check the product.`;
  $('#sum-feedback').textContent = result.ready
    ? `${result.topRight}x + (${result.bottomLeft}x) = ${result.sum}x. ${result.sumCorrect ? 'Correct!' : `Target: ${item().b}x.`}`
    : `Enter ${nonMonic ? 'all four' : 'both'} integers to check the middle term.`;
  $('#checks-heading').hidden = result.complete;
  $('#factor-entry').hidden = !result.complete;
  return result;
}

function changeForm(next) {
  form = next;
  setPressed([['#factored-mode', 'factored'], ['#vertex-mode', 'vertex']], form);
  reset();
}

function changeMethod(next) {
  method = next;
  setPressed([['#manual-method', 'manual'], ['#square-method', 'square']], method);
  reset();
}

$('#factor-entry').onsubmit = event => {
  event.preventDefault();
  if (factorsSubmitted || !boxResult().complete) return;
  const vals = values();
  const repeated = vals[0] === vals[1] && vals[2] === vals[3];
  const inputs = repeated ? [$('#first-factor')] : [$('#first-factor'), $('#second-factor')];
  const factors = inputs.map(input => parseCompleteFactor(input.value));
  if (repeated && factors[0]) factors.push(factors[0]);
  const result = factors.every(Boolean)
    ? assess(item(), factors[0].constant, factors[1].constant, factors[0].coefficient, factors[1].coefficient)
    : null;
  inputs.forEach((input, i) => {
    const bad = !factors[i] || !result?.complete;
    input.classList.toggle('invalid', bad);
    input.setAttribute('aria-invalid', String(bad));
  });
  if (!result?.complete) {
    $('#factor-feedback').textContent = 'Not yet. Enter both complete factors and check that their product matches the quadratic.';
    $('#factor-feedback').className = 'feedback no';
    return;
  }
  factorsSubmitted = true;
  confirmedFactors = factors;
  inputs.forEach(input => { input.readOnly = true; });
  $('#submit-factors').hidden = true;
  $('#factor-feedback').hidden = true;
  if (item().a > 1) {
    const scaledIndex = factors.findIndex(factor => factor.coefficient > 1);
    if (scaledIndex < 0) return;
    scaledFactor = factors[scaledIndex];
    remainingFactor = factors[1 - scaledIndex];
    $('#scaled-original').textContent = linearFactorText(scaledFactor);
    $('#scale-value').textContent = String(scaledFactor.coefficient);
    $('#normalization').hidden = false;
    $('#normalized-factor').focus();
  } else {
    finishFactoredForm();
  }
};

function finishFactoredForm(normalized = null) {
  const repeated = confirmedFactors[0].coefficient === confirmedFactors[1].coefficient
    && confirmedFactors[0].constant === confirmedFactors[1].constant;
  let result;
  if (normalized) {
    result = `${scaledFactor.coefficient}(${linearFactorText(normalized)})(${linearFactorText(remainingFactor)})`;
  } else {
    result = repeated
      ? `${factoredText(confirmedFactors[0].constant, confirmedFactors[0].constant, confirmedFactors[0].coefficient, confirmedFactors[0].coefficient).replace(/\([^)]*\)$/, '')}²`
      : factoredText(confirmedFactors[0].constant, confirmedFactors[1].constant, confirmedFactors[0].coefficient, confirmedFactors[1].coefficient);
  }
  $('#factored-result').textContent = `f(x) = ${result}`;
  $('#factored-complete').hidden = false;
  $('#next').hidden = false;
  fireConfetti(180);
}

$('#normalization').onsubmit = event => {
  event.preventDefault();
  if (!scaledFactor || !remainingFactor) return;
  const parsed = parseNormalizedFactor($('#normalized-factor').value);
  const expected = scaledFactor.constant / scaledFactor.coefficient;
  const good = parsed && close(parsed.constant, expected);
  $('#normalized-factor').classList.toggle('invalid', !good);
  $('#normalized-factor').setAttribute('aria-invalid', String(!good));
  if (!good) {
    $('#normalization-feedback').textContent = `Divide ${formatValue(scaledFactor.constant)} by ${scaledFactor.coefficient}; write the result as x plus or minus that value.`;
    $('#normalization-feedback').className = 'feedback no';
    return;
  }
  $('#normalized-factor').readOnly = true;
  $('#check-normalization').hidden = true;
  $('#normalization-feedback').hidden = true;
  finishFactoredForm(parsed);
};

$('#check-vertex-x').onclick = () => {
  const { h } = vertexData(item());
  const input = $('#vertex-x');
  const value = parseNumber(input.value);
  const good = close(value, h);
  input.classList.toggle('invalid', !good);
  input.setAttribute('aria-invalid', String(!good));
  if (!good) {
    $('#vertex-x-feedback').textContent = 'Use x = −b/(2a) with the a- and b-values from standard form.';
    $('#vertex-x-feedback').className = 'feedback no';
    return;
  }
  input.readOnly = true;
  $('#vertex-x-feedback').textContent = `Correct. The vertex x-coordinate is h = ${formatValue(h)}.`;
  $('#vertex-x-feedback').className = 'feedback ok';
  $('#vertex-y-work').hidden = false;
  $('#vertex-y').focus();
};

$('#check-vertex-y').onclick = () => {
  const { h, k } = vertexData(item());
  const input = $('#vertex-y');
  const value = parseNumber(input.value);
  const good = close(value, k);
  input.classList.toggle('invalid', !good);
  input.setAttribute('aria-invalid', String(!good));
  if (!good) {
    $('#vertex-y-feedback').textContent = 'Substitute your h-value into f(x) and evaluate.';
    $('#vertex-y-feedback').className = 'feedback no';
    return;
  }
  input.readOnly = true;
  $('#vertex-y-feedback').textContent = `Correct. The vertex is (${formatValue(h)}, ${formatValue(k)}).`;
  $('#vertex-y-feedback').className = 'feedback ok';
  $('#vertex-form-entry').hidden = false;
  $('#form-a').focus();
};

$('#vertex-form-entry').onsubmit = event => {
  event.preventDefault();
  const { h, k } = vertexData(item());
  const fields = [$('#form-a'), $('#form-h'), $('#form-k')];
  const signs = [$('#form-h-sign'), $('#form-k-sign')];
  const expectedSigns = [h > 0 ? '−' : '+', k < 0 ? '−' : '+'];
  const expectedValues = [item().a, Math.abs(h), Math.abs(k)];
  const correct = fields.map((field, i) => close(parseNumber(field.value), expectedValues[i]));
  const signsCorrect = signs.map((sign, i) => expectedValues[i + 1] === 0
    ? sign.value === '+' || sign.value === '−'
    : sign.value === expectedSigns[i]);
  fields.forEach((field, i) => {
    field.classList.toggle('invalid', !correct[i]);
    field.setAttribute('aria-invalid', String(!correct[i]));
  });
  signs.forEach((sign, i) => {
    sign.classList.toggle('invalid', !signsCorrect[i]);
    sign.setAttribute('aria-invalid', String(!signsCorrect[i]));
  });
  if (!correct.every(Boolean) || !signsCorrect.every(Boolean)) {
    const subtractNegative = h < 0 && $('#form-h-sign').value === '−';
    $('#vertex-form-feedback').textContent = subtractNegative
      ? 'The h-value is negative, so change “subtract a negative” to plus. Check the signs and magnitudes of h and k.'
      : 'Check the a-value and the signs and magnitudes of h and k. Use plus when subtracting a negative.';
    $('#vertex-form-feedback').className = 'feedback no';
    return;
  }
  fields.forEach(field => { field.readOnly = true; });
  signs.forEach(sign => { sign.disabled = true; });
  $('#check-vertex-form').hidden = true;
  $('#vertex-form-feedback').hidden = true;
  $('#vertex-result').textContent = vertexText(item());
  $('#vertex-complete').hidden = false;
  fireConfetti(180);
};

$('#factored-mode').onclick = () => changeForm('factored');
$('#vertex-mode').onclick = () => changeForm('vertex');
$('#manual-method').onclick = () => changeMethod('manual');
$('#square-method').onclick = () => changeMethod('square');
['#top-factor', '#side-factor', '#top-coefficient', '#side-coefficient'].forEach(id => $(id).addEventListener('input', updateBox));
$('#example-picker').onchange = () => { index = Number($('#example-picker').value); reset(); };
$('#reset').onclick = reset;
$('#vertex-reset').onclick = reset;
$('#next').onclick = () => { index = (index + 1) % practice.length; reset(); };

setPressed([['#factored-mode', 'factored'], ['#vertex-mode', 'vertex']], form);
setPressed([['#manual-method', 'manual'], ['#square-method', 'square']], method);
reset();
