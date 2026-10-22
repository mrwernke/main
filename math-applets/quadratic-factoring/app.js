import { exercises, nonMonicExercises, parseInteger, parseCompleteFactor, linearTerm, expressionText, factoredText, assess } from './model.mjs';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';

const $ = selector => document.querySelector(selector);
let index = 0, submitted = false, nonMonic = false, confirmedFactors = null, repeated = false;
let customProblem = null;
const bank = () => nonMonic ? nonMonicExercises : exercises;
const item = () => customProblem || bank()[index];
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
  confirmedFactors = null;
  repeated = false;
  $('#complete').hidden = true;
  $('#zero-product').hidden = true;
  $('#solutions').hidden = true;
  $('#next').hidden = true;
  $('#factored-result').textContent = '';
  $('#factor-feedback').textContent = '';
  $('#factor-feedback').className = 'feedback';
  $('#factor-feedback').hidden = false;
  $('#submit-factors').disabled = false;
  $('#submit-factors').hidden = false;
  ['#first-factor', '#second-factor', '#zero-first', '#zero-second', '#solution-first', '#solution-second'].forEach(id => {
    $(id).value = '';
    $(id).readOnly = false;
    $(id).classList.remove('invalid');
    $(id).setAttribute('aria-invalid', 'false');
  });
  ['#zero-feedback', '#solution-feedback'].forEach(id => { $(id).textContent = ''; $(id).className = 'feedback'; $(id).hidden = false; });
  $('#zero-submit').hidden = false;
  $('#first-factor').hidden = false; $('#second-factor').hidden = false;
  $('#factor-middle').hidden = false; $('#factor-close').hidden = false; $('#factor-square').hidden = true;
  $('#zero-second').hidden = false; $('#zero-middle').hidden = false; $('#zero-close').hidden = false;
  $('#solution-second').hidden = false; $('#solution-divider').hidden = false;
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
  $('#checks-heading').hidden = result.complete;
  const boxRepeated = result.complete && values[0] === values[1] && values[2] === values[3];
  if (result.complete) $('#factor-instructions').textContent = boxRepeated
    ? 'The box shows a repeated factor. Type it once inside the parentheses; the squared factor equals zero.'
    : nonMonic
      ? 'All three conditions match. Type each complete factor inside its parentheses, such as 2x+3 or x-4. Include each x-coefficient.'
      : 'Both conditions match. Type each complete factor inside its parentheses, such as x+3 or x-4.';
  $('#second-factor').hidden = boxRepeated;
  $('#factor-middle').hidden = boxRepeated;
  $('#factor-square').hidden = !boxRepeated;
  $('#top-product').textContent = Number.isSafeInteger(result.topRight) ? linearTerm(result.topRight) : '?';
  $('#side-product').textContent = Number.isSafeInteger(result.bottomLeft) ? linearTerm(result.bottomLeft) : '?';
  const tooLarge = values.every(Number.isSafeInteger) && !result.ready;
  $('#input-feedback').textContent = invalid.some(Boolean)
    ? 'Enter signed integers for the constants and positive whole numbers for the x-coefficients.'
    : tooLarge ? 'These numbers are too large to check accurately. Try smaller integers.' : '';
  $('#input-feedback').className = `feedback${invalid.some(Boolean) || tooLarge ? ' no' : ''}`;
  state($('#constant-cell'), result.productCorrect, result.ready);
  state($('#product-check'), result.productCorrect, result.ready);
  $('#product-check').hidden = result.ready && result.productCorrect;
  state($('#middle-circle'), result.sumCorrect, result.ready);
  state($('#sum-check'), result.sumCorrect, result.ready);
  $('#sum-check').hidden = result.ready && result.sumCorrect;
  const leadingReady = values.slice(2).every(value => Number.isSafeInteger(value) && value > 0)
    && Number.isSafeInteger(result.leading);
  state($('#leading-cell'), result.leadingCorrect, nonMonic && leadingReady);
  state($('#leading-check'), result.leadingCorrect, leadingReady);
  $('#leading-check').hidden = !nonMonic || (leadingReady && result.leadingCorrect);
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
  $('#expression').textContent = `${expressionText(item())} = 0`;
  $('#constant').textContent = String(item().c);
  $('#middle-term').textContent = linearTerm(item().b);
  $('#leading-term').textContent = `${nonMonic ? item().a : ''}x²`;
  $('#top-coefficient').hidden = !nonMonic;
  $('#side-coefficient').hidden = !nonMonic;
  $('#top-coefficient').value = '';
  $('#side-coefficient').value = '';
  $('#leading-check').hidden = !nonMonic;
  $('#product-check').hidden = false;
  $('#sum-check').hidden = false;
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
  const anticipatedRepeated = boxValues()[0] === boxValues()[1] && boxValues()[2] === boxValues()[3];
  const inputs = anticipatedRepeated ? [$('#first-factor')] : [$('#first-factor'), $('#second-factor')];
  let factors = inputs.map(input => parseCompleteFactor(input.value));
  if (anticipatedRepeated && factors[0]) factors.push(factors[0]);
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
  confirmedFactors = factors;
  repeated = factors[0].coefficient === factors[1].coefficient && factors[0].constant === factors[1].constant;
  inputs.forEach(input => { input.readOnly = true; });
  if (repeated) {
    $('#second-factor').hidden = true; $('#factor-middle').hidden = true; $('#factor-square').hidden = false;
  }
  $('#submit-factors').disabled = true;
  $('#factor-feedback').textContent = 'Correct! Both complete factors match the expression.';
  $('#factor-feedback').className = 'feedback ok';
  $('#submit-factors').hidden = true;
  $('#factor-feedback').hidden = true;
  $('#zero-product').hidden = false;
  $('#zero-first').focus();
};

function factorMatch(a, b) { return a && b && a.coefficient === b.coefficient && a.constant === b.constant; }
$('#zero-product').onsubmit = event => {
  event.preventDefault();
  if (!confirmedFactors || $('#solutions').hidden === false) return;
  const entries = [parseCompleteFactor($('#zero-first').value)];
  if (!repeated) entries.push(parseCompleteFactor($('#zero-second').value));
  const expected = repeated ? [confirmedFactors[0]] : confirmedFactors;
  const matches = repeated ? factorMatch(entries[0], expected[0])
    : (factorMatch(entries[0], expected[0]) && factorMatch(entries[1], expected[1])) || (factorMatch(entries[0], expected[1]) && factorMatch(entries[1], expected[0]));
  if (!matches) {
    $('#zero-feedback').textContent = 'Not yet. Enter the factor or factors from above, in either order.';
    $('#zero-feedback').className = 'feedback no'; return;
  }
  $('#zero-feedback').textContent = 'Correct! Now solve each equation for x.';
  $('#zero-feedback').className = 'feedback ok';
  $('#zero-submit').hidden = true;
  $('#zero-feedback').hidden = true;
  if (repeated) { $('#zero-second').hidden = true; $('#zero-middle').hidden = true; }
  $('#solutions').hidden = false; $('#solution-second').hidden = repeated; $('#solution-divider').hidden = repeated;
  $('#zero-first').readOnly = true; $('#zero-second').readOnly = true;
  $('#solution-first').focus();
};
function parseSolution(value) {
  const text = String(value).trim().replace('−', '-');
  if (/^[+-]?\d+\s*\/\s*\d+$/.test(text)) { const [a,b] = text.split('/').map(Number); return b === 0 ? NaN : a / b; }
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) ? Number(text) : NaN;
}
$('#solutions').onsubmit = event => {
  event.preventDefault();
  if (!confirmedFactors) return;
  const roots = confirmedFactors.map(factor => -factor.constant / factor.coefficient);
  const values = [parseSolution($('#solution-first').value)];
  if (!repeated) values.push(parseSolution($('#solution-second').value));
  const close = (a,b) => Number.isFinite(a) && Math.abs(a-b) < 1e-9;
  const correct = repeated ? close(values[0], roots[0])
    : (close(values[0], roots[0]) && close(values[1], roots[1])) || (close(values[0], roots[1]) && close(values[1], roots[0]));
  if (!correct) { $('#solution-feedback').textContent = 'Not yet. Solve each factor equation for x.'; $('#solution-feedback').className = 'feedback no'; return; }
  $('#solution-feedback').textContent = 'Correct! You solved the quadratic by factoring.';
  $('#solution-feedback').className = 'feedback ok';
  const factored = repeated ? `${factoredText(confirmedFactors[0].constant, confirmedFactors[0].constant, confirmedFactors[0].coefficient, confirmedFactors[0].coefficient).replace(/\([^)]*\)$/, '')}²` : factoredText(confirmedFactors[0].constant, confirmedFactors[1].constant, confirmedFactors[0].coefficient, confirmedFactors[1].coefficient);
  $('#factored-result').textContent = `${expressionText(item())} = 0\n${factored} = 0\n${repeated ? `x = ${roots[0]}` : `x = ${roots[0]} or x = ${roots[1]}`}`;
  $('#complete').hidden = false; $('#next').hidden = false;
  $('#solution-first').readOnly = true; $('#solution-second').readOnly = true;
  fireConfetti(180);
};

function selectMode(value) {
  nonMonic = value;
  index = 0;
  $('#monic-mode').setAttribute('aria-pressed', String(!nonMonic));
  $('#non-monic-mode').setAttribute('aria-pressed', String(nonMonic));
  $('#example-picker').replaceChildren();
  if (customProblem) {
    $('#example-picker').add(new Option(`My Problem: ${expressionText(customProblem)} = 0`, 'custom'));
  }
  bank().forEach((exercise, i) => {
    $('#example-picker').add(new Option(`${i + 1}. ${expressionText(exercise)} = 0`, i));
  });
  if (customProblem) {
    $('#example-picker').value = 'custom';
  }
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

function formatCustomEquation(aText, bText, cText) {
  const aTrim = aText.trim();
  const bTrim = bText.trim();
  const cTrim = cText.trim();
  if (!aTrim && !bTrim && !cTrim) return 'ax² + bx + c = 0';

  const aVal = aTrim ? parseInteger(aTrim) : NaN;
  const bVal = bTrim ? parseInteger(bTrim) : NaN;
  const cVal = cTrim ? parseInteger(cTrim) : NaN;

  if (Number.isFinite(aVal) && Number.isFinite(bVal) && Number.isFinite(cVal) && aVal > 0) {
    return `${expressionText({ a: aVal, b: bVal, c: cVal })} = 0`;
  }

  let aPart = 'ax²';
  if (Number.isFinite(aVal)) {
    if (aVal === 1) aPart = 'x²';
    else aPart = `${aVal}x²`;
  } else if (aTrim) aPart = `${aTrim}x²`;

  let bPart = '+ bx';
  if (Number.isFinite(bVal)) {
    if (bVal === 0) bPart = '';
    else if (bVal === 1) bPart = '+ x';
    else if (bVal === -1) bPart = '− x';
    else bPart = `${bVal < 0 ? '−' : '+'} ${Math.abs(bVal)}x`;
  } else if (bTrim) {
    const sign = bTrim.startsWith('-') || bTrim.startsWith('−') ? '−' : '+';
    bPart = `${sign} ${bTrim.replace(/^[+−-]/, '')}x`;
  }

  let cPart = '+ c';
  if (Number.isFinite(cVal)) {
    if (cVal === 0) cPart = '';
    else cPart = `${cVal < 0 ? '−' : '+'} ${Math.abs(cVal)}`;
  } else if (cTrim) {
    const sign = cTrim.startsWith('-') || cTrim.startsWith('−') ? '−' : '+';
    cPart = `${sign} ${cTrim.replace(/^[+−-]/, '')}`;
  }

  return `${[aPart, bPart, cPart].filter(Boolean).join(' ')} = 0`;
}

function updateCustomPreview() {
  $('#expression').textContent = formatCustomEquation($('#custom-a').value, $('#custom-b').value, $('#custom-c').value);
}

$('#make-own-btn').onclick = () => {
  const form = $('#custom-problem-form');
  const isHidden = form.hidden;
  form.hidden = !isHidden;
  if (!form.hidden) {
    $('#custom-a').value = '';
    $('#custom-b').value = '';
    $('#custom-c').value = '';
    $('#expression').textContent = 'ax² + bx + c = 0';
    $('.factoring-work').hidden = true;
    $('#custom-feedback').textContent = '';
    $('#custom-feedback').className = 'feedback';
    $('#custom-a').focus();
  } else {
    $('.factoring-work').hidden = false;
    reset();
  }
};

$('#custom-cancel-btn').onclick = () => {
  $('#custom-problem-form').hidden = true;
  $('.factoring-work').hidden = false;
  reset();
};

$('#custom-problem-form').oninput = updateCustomPreview;

$('#custom-problem-form').onsubmit = event => {
  event.preventDefault();
  const aVal = parseInteger($('#custom-a').value);
  const bVal = parseInteger($('#custom-b').value);
  const cVal = parseInteger($('#custom-c').value);

  if (!Number.isFinite(aVal) || aVal <= 0) {
    $('#custom-feedback').textContent = "Please enter a positive integer (at least 1) for 'a'.";
    $('#custom-feedback').className = 'feedback no';
    $('#custom-a').focus();
    return;
  }
  if (!Number.isFinite(bVal)) {
    $('#custom-feedback').textContent = "Please enter a valid integer for 'b'.";
    $('#custom-feedback').className = 'feedback no';
    $('#custom-b').focus();
    return;
  }
  if (!Number.isFinite(cVal)) {
    $('#custom-feedback').textContent = "Please enter a valid integer for 'c'.";
    $('#custom-feedback').className = 'feedback no';
    $('#custom-c').focus();
    return;
  }

  const disc = bVal * bVal - 4 * aVal * cVal;
  if (disc < 0) {
    $('#custom-feedback').textContent = 'This expression has no real factors (discriminant is negative). Choose values where b² − 4ac is a non-negative perfect square.';
    $('#custom-feedback').className = 'feedback no';
    return;
  }
  const rootDisc = Math.round(Math.sqrt(disc));
  if (rootDisc * rootDisc !== disc) {
    $('#custom-feedback').textContent = 'This expression cannot be factored over integers. Choose values where b² − 4ac is a perfect square.';
    $('#custom-feedback').className = 'feedback no';
    return;
  }

  customProblem = { a: aVal, b: bVal, c: cVal };
  nonMonic = aVal > 1;
  $('#monic-mode').setAttribute('aria-pressed', String(!nonMonic));
  $('#non-monic-mode').setAttribute('aria-pressed', String(nonMonic));
  $('#custom-problem-form').hidden = true;
  $('.factoring-work').hidden = false;
  selectMode(nonMonic);
};

const originalPickerChange = $('#example-picker').onchange;
$('#example-picker').onchange = () => {
  $('#custom-problem-form').hidden = true;
  $('.factoring-work').hidden = false;
  if ($('#example-picker').value === 'custom') {
    // keep custom problem
  } else {
    customProblem = null;
    index = Number($('#example-picker').value);
  }
  reset();
};
