import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';
import { examples, solveA } from './model.mjs?v=20261019a';

const $ = selector => document.querySelector(selector);
let index = 0;
let chosenForm = '';
let promptPinned = false;
const example = () => examples[index];
const promptSlot = $('#prompt-slot');
const promptCard = $('#prompt-card');

function updatePromptPin() {
  const slotRect = promptSlot.getBoundingClientRect();
  const pinAt = slotRect.top + window.scrollY - 10;
  const shouldPin = window.scrollY >= pinAt;

  if (shouldPin && !promptPinned) {
    promptSlot.style.height = `${promptCard.offsetHeight}px`;
    promptCard.classList.add('is-pinned');
    promptPinned = true;
  } else if (!shouldPin && promptPinned) {
    promptCard.classList.remove('is-pinned');
    promptCard.style.left = '';
    promptCard.style.width = '';
    promptSlot.style.height = '';
    promptPinned = false;
  }

  if (promptPinned) {
    const slotBounds = promptSlot.getBoundingClientRect();
    promptCard.style.left = `${slotBounds.left}px`;
    promptCard.style.width = `${slotBounds.width}px`;
    promptSlot.style.height = `${promptCard.offsetHeight}px`;
  }
}

function numberValue(value) {
  const text = String(value).trim().replace(/[−–]/g, '-').replace(/\s/g, '');
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return Number(text);
  const fraction = text.match(/^([+-]?\d+)\/([+-]?\d+)$/);
  if (!fraction || Number(fraction[2]) === 0) return NaN;
  return Number(fraction[1]) / Number(fraction[2]);
}

function equal(actual, expected) {
  return Number.isFinite(actual) && Math.abs(actual - expected) < 1e-9;
}

function formatNumber(value) {
  if (Number.isInteger(value)) return String(value).replace('-', '−');
  return String(Number(value.toFixed(6))).replace('-', '−');
}

function formatCoefficient(value) {
  if (value === 1) return '';
  if (value === -1) return '−';
  return formatNumber(value);
}

function formatShift(variable, value) {
  return value < 0 ? `${variable} + ${formatNumber(Math.abs(value))}` : `${variable} − ${formatNumber(value)}`;
}

function formatFactor(variable, root) {
  return `(${formatShift(variable, root)})`;
}

function signedConstant(value) {
  return value < 0 ? ` − ${formatNumber(Math.abs(value))}` : ` + ${formatNumber(value)}`;
}

function setFeedback(selector, message) {
  const element = $(selector);
  element.textContent = message;
  element.className = `feedback ${message ? 'no' : ''}`;
}

function mark(field, correct) {
  field.classList.toggle('invalid', !correct);
  field.classList.toggle('valid', correct);
  field.setAttribute('aria-invalid', String(!correct));
}

function markRootPair(fields, values, roots) {
  const normal = equal(values[0], roots[0]) && equal(values[1], roots[1]);
  const reversed = equal(values[0], roots[1]) && equal(values[1], roots[0]);
  if (normal || reversed) {
    fields.forEach(field => mark(field, true));
    return normal || reversed;
  }

  const positionalMatches = values.map((value, i) => equal(value, roots[i]));
  const validRootMatches = values.map(value => roots.some(root => equal(value, root)));
  const matches = positionalMatches.some(Boolean)
    ? positionalMatches
    : validRootMatches.filter(Boolean).length === 1 ? validRootMatches : [false, false];
  fields.forEach((field, i) => mark(field, matches[i]));
  return false;
}

function lockFields(container) {
  container.querySelectorAll('input,select,button.q18-choice').forEach(field => {
    field.disabled = true;
    if (field.matches('input')) field.readOnly = true;
  });
}

function finishStep(form, feedbackSelector, nextSection) {
  const submit = form.querySelector('button[type="submit"]');
  if (submit) submit.hidden = true;
  $(feedbackSelector).textContent = '';
  $(feedbackSelector).className = 'feedback';
  if (nextSection) nextSection.hidden = false;
}

function fieldMarkup(id, label, className = '') {
  return `<input id="${id}" class="q18-math-input ${className}" inputmode="text" autocomplete="off" aria-label="${label}" />`;
}

function selectMarkup(id, label) {
  return `<select id="${id}" aria-label="${label}"><option value="">±</option><option value="+">+</option><option value="-">−</option></select>`;
}

function renderPrompt() {
  const current = example();
  $('#scenario').textContent = current.story;
  $('#function-info').textContent = current.functionInfo;
  $('#input-info').textContent = current.inputInfo;
  $('#output-info').textContent = current.outputInfo;
  $('#unit-note').textContent = current.unitNote;
}

function populatePicker() {
  const picker = $('#example-picker');
  picker.replaceChildren(...examples.map((_, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `Example ${index + 1}`;
    return option;
  }));
}

function renderPrimaryFields() {
  const current = example();
  const container = $('#primary-values');
  if (current.primaryKind === 'vertex') {
    $('#primary-values-title').textContent = 'Enter the vertex as (h, k).';
    container.innerHTML = `
      <label>h, the vertex x-coordinate
        <input id="primary-h" inputmode="text" autocomplete="off" aria-label="h, the vertex x-coordinate" />
      </label>
      <label>k, the vertex y-coordinate
        <input id="primary-k" inputmode="text" autocomplete="off" aria-label="k, the vertex y-coordinate" />
      </label>`;
  } else {
    $('#primary-values-title').textContent = 'Enter both x-intercepts as x-values.';
    container.innerHTML = `
      <label>First x-intercept
        <input id="primary-r1" inputmode="text" autocomplete="off" aria-label="First x-intercept" />
      </label>
      <label>Second x-intercept
        <input id="primary-r2" inputmode="text" autocomplete="off" aria-label="Second x-intercept" />
      </label>`;
  }
}

function renderFormChoices() {
  const choices = [
    { id: 'vertex', title: 'Vertex form', expression: 'f(x) = a(x − h)² + k' },
    { id: 'factored', title: 'Factored form', expression: 'f(x) = a(x − r₁)(x − r₂)' },
  ];
  $('#form-choices').replaceChildren(...choices.map(choice => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'q18-choice';
    button.setAttribute('aria-pressed', 'false');
    button.dataset.form = choice.id;
    button.innerHTML = `<strong>${choice.title}</strong><span>${choice.expression}</span>`;
    button.addEventListener('click', () => {
      chosenForm = choice.id;
      $('#form-choices').querySelectorAll('.q18-choice').forEach(item => {
        item.setAttribute('aria-pressed', String(item === button));
        item.classList.remove('invalid', 'valid');
      });
    });
    return button;
  }));
}

function renderStructureForm() {
  const current = example();
  if (current.form === 'vertex') {
    $('#structure-directions').textContent = 'Substitute h and k from the vertex into vertex form.';
    $('#structure-equation').innerHTML = `<span>${current.symbol}(${current.variable}) = a(${current.variable} − </span>${fieldMarkup('structure-h', 'h, the vertex x-coordinate')}<span>)² + </span>${fieldMarkup('structure-k', 'k, the vertex y-coordinate')}`;
  } else {
    $('#structure-directions').textContent = 'Substitute both x-intercepts as roots in factored form.';
    $('#structure-equation').innerHTML = `<span>${current.symbol}(${current.variable}) = a(${current.variable} − </span>${fieldMarkup('structure-r1', 'First x-intercept')}<span>)(${current.variable} − </span>${fieldMarkup('structure-r2', 'Second x-intercept')}<span>)</span>`;
  }
}

function renderPointSubstitution() {
  const current = example();
  const point = current.other;
  const label = point.kind === 'point' ? 'point' : point.kind;
  $('#point-substitution-directions').textContent = `Use the ${label} from Step 3 to substitute into the form. Enter its y-coordinate and x-coordinate.`;
  if (current.form === 'vertex') {
    const { x: h, y: k } = current.primary;
    const hTerm = h < 0 ? `+ ${formatNumber(Math.abs(h))}` : `− ${formatNumber(h)}`;
    $('#point-substitution-equation').innerHTML = `${fieldMarkup('sub-y', 'y-coordinate of the additional point')}<span> = a(</span>${fieldMarkup('sub-x', 'x-coordinate of the additional point')}<span> ${hTerm})²${signedConstant(k)}`;
  } else {
    const [r1, r2] = current.primary.values;
    const factorTerm = root => root < 0 ? `+ ${formatNumber(Math.abs(root))}` : `− ${formatNumber(root)}`;
    $('#point-substitution-equation').innerHTML = `${fieldMarkup('sub-y', 'y-coordinate of the additional point')}<span> = a(</span>${fieldMarkup('sub-x', 'x-coordinate of the additional point')}<span> ${factorTerm(r1)})(</span>${fieldMarkup('sub-x-copy', 'Repeat the x-coordinate of the additional point')}<span> ${factorTerm(r2)})</span>`;
  }
}

function renderFinalForm() {
  const current = example();
  $('#final-directions').textContent = `Write ${current.symbol}(${current.variable}) in ${current.form} form. Enter a and each sign and value.`;
  if (current.form === 'vertex') {
    $('#final-equation').innerHTML = `<span>${current.symbol}(${current.variable}) = </span>${fieldMarkup('final-a', 'a-value')}<span>(${current.variable} </span>${selectMarkup('final-h-sign', 'Sign before the vertex x-coordinate')}${fieldMarkup('final-h', 'Magnitude of the vertex x-coordinate')}<span>)² </span>${selectMarkup('final-k-sign', 'Sign before the vertex y-coordinate')}${fieldMarkup('final-k', 'Magnitude of the vertex y-coordinate')}`;
  } else {
    $('#final-equation').innerHTML = `<span>${current.symbol}(${current.variable}) = </span>${fieldMarkup('final-a', 'a-value')}<span>(${current.variable} </span>${selectMarkup('final-r1-sign', 'Sign inside the first factor')}${fieldMarkup('final-r1', 'Magnitude of the first root')}<span>)(${current.variable} </span>${selectMarkup('final-r2-sign', 'Sign inside the second factor')}${fieldMarkup('final-r2', 'Magnitude of the second root')}<span>)</span>`;
  }
}

function showSubstitutionWork() {
  const current = example();
  const { x, y } = current.other;
  let expression;
  if (current.form === 'vertex') {
    const { x: h, y: k } = current.primary;
    expression = `${formatNumber(y)} = a(${formatShift(formatNumber(x), h)})²${signedConstant(k)}`;
  } else {
    const [r1, r2] = current.primary.values;
    expression = `${formatNumber(y)} = a${formatFactor(formatNumber(x), r1)}${formatFactor(formatNumber(x), r2)}`;
  }
  $('#substitution-work').textContent = expression;
  $('#substitution-work').hidden = false;
}

function finalText() {
  const current = example();
  const a = solveA(current);
  if (current.form === 'vertex') {
    const { x: h, y: k } = current.primary;
    return `${current.symbol}(${current.variable}) = ${formatCoefficient(a)}(${formatShift(current.variable, h)})²${signedConstant(k)}`;
  }
  const [r1, r2] = current.primary.values;
  return `${current.symbol}(${current.variable}) = ${formatCoefficient(a)}${formatFactor(current.variable, r1)}${formatFactor(current.variable, r2)}`;
}

function resetSteps() {
  chosenForm = '';
  clearConfetti();
  document.querySelectorAll('.q18-work input,.q18-work select').forEach(field => {
    field.disabled = false;
    field.readOnly = false;
  });
  document.querySelectorAll('.q18-work button[type="submit"]').forEach(button => { button.hidden = false; });
  document.querySelectorAll('.q18-work .feedback').forEach(item => {
    item.textContent = '';
    item.className = 'feedback';
  });
  document.querySelectorAll('.q18-work .invalid,.q18-work .valid').forEach(field => field.classList.remove('invalid', 'valid'));
  document.querySelectorAll('.q18-work [aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
  $('#primary-step').hidden = false;
  ['#form-step', '#primary-values-step', '#structure-step', '#other-info-step', '#point-substitution-step', '#a-step', '#final-step', '#complete'].forEach(id => { $(id).hidden = true; });
  ['#primary-kind-form', '#primary-values-form', '#form-choice-form', '#other-info-form', '#structure-form', '#point-substitution-form', '#a-form', '#final-form'].forEach(id => $(id).reset());
  $('#primary-values').replaceChildren();
  $('#form-choices').replaceChildren();
  $('#structure-equation').replaceChildren();
  $('#point-substitution-equation').replaceChildren();
  $('#final-equation').replaceChildren();
  $('#substitution-work').hidden = true;
  $('#substitution-work').textContent = '';
  $('#a-value').readOnly = false;
  $('#a-value').disabled = false;
  renderPrompt();
  updatePromptPin();
}

$('#primary-kind').addEventListener('change', () => {
  $('#primary-kind').classList.remove('invalid', 'valid');
  $('#primary-kind-feedback').textContent = '';
  $('#primary-kind-feedback').className = 'feedback';
});

$('#primary-kind-form').addEventListener('submit', event => {
  event.preventDefault();
  const select = $('#primary-kind');
  const correct = select.value === example().primaryKind;
  mark(select, correct);
  if (!correct) {
    setFeedback('#primary-kind-feedback', 'Identify whether the scenario gives a vertex or all x-intercepts.');
    return;
  }
  lockFields(event.currentTarget);
  finishStep(event.currentTarget, '#primary-kind-feedback', $('#form-step'));
  renderFormChoices();
});

$('#primary-values-form').addEventListener('submit', event => {
  event.preventDefault();
  const primary = example().primary;
  if (primary.kind === 'vertex') {
    const fields = [$('#primary-h'), $('#primary-k')];
    const expected = [primary.x, primary.y];
    const results = fields.map((field, i) => {
      const correct = equal(numberValue(field.value), expected[i]);
      mark(field, correct);
      return correct;
    });
    if (!results.every(Boolean)) {
      setFeedback('#primary-values-feedback', 'Check the h- and k-coordinates of the vertex.');
      return;
    }
  } else {
    const fields = [$('#primary-r1'), $('#primary-r2')];
    const roots = primary.values;
    const values = fields.map(field => numberValue(field.value));
    if (!markRootPair(fields, values, roots)) {
      setFeedback('#primary-values-feedback', 'Enter both x-values where the graph crosses the x-axis.');
      return;
    }
  }
  lockFields($('#primary-values'));
  finishStep(event.currentTarget, '#primary-values-feedback', $('#structure-step'));
  renderStructureForm();
});

$('#form-choice-form').addEventListener('submit', event => {
  event.preventDefault();
  const expectedForm = example().primaryKind === 'vertex' ? 'vertex' : 'factored';
  const correct = chosenForm === expectedForm;
  $('#form-choices').querySelectorAll('.q18-choice').forEach(button => {
    button.classList.toggle('invalid', button.dataset.form === chosenForm && !correct);
    button.classList.toggle('valid', button.dataset.form === chosenForm && correct);
  });
  if (!correct) {
    setFeedback('#form-feedback', 'Use vertex form when a vertex is given and factored form when both x-intercepts are given.');
    return;
  }
  $('#form-choices').querySelectorAll('.q18-choice').forEach(button => { button.disabled = true; });
  finishStep(event.currentTarget, '#form-feedback', $('#primary-values-step'));
  renderPrimaryFields();
});

$('#other-info-form').addEventListener('submit', event => {
  event.preventDefault();
  const expected = example().other;
  const fields = [$('#other-kind'), $('#other-x'), $('#other-y')];
  const results = [
    fields[0].value === expected.kind,
    equal(numberValue(fields[1].value), expected.x),
    equal(numberValue(fields[2].value), expected.y),
  ];
  fields.forEach((field, i) => mark(field, results[i]));
  if (!results.every(Boolean)) {
    setFeedback('#other-info-feedback', 'Check the information type and each coordinate.');
    return;
  }
  lockFields(event.currentTarget);
  finishStep(event.currentTarget, '#other-info-feedback', $('#point-substitution-step'));
  renderPointSubstitution();
});

$('#structure-form').addEventListener('submit', event => {
  event.preventDefault();
  const primary = example().primary;
  if (primary.kind === 'vertex') {
    const fields = [$('#structure-h'), $('#structure-k')];
    const results = fields.map((field, i) => {
      const correct = equal(numberValue(field.value), [primary.x, primary.y][i]);
      mark(field, correct);
      return correct;
    });
    if (!results.every(Boolean)) {
      setFeedback('#structure-feedback', 'Check that h is the vertex x-coordinate and k is its y-coordinate.');
      return;
    }
  } else {
    const fields = [$('#structure-r1'), $('#structure-r2')];
    const roots = primary.values;
    const values = fields.map(field => numberValue(field.value));
    if (!markRootPair(fields, values, roots)) {
      setFeedback('#structure-feedback', 'Use both x-intercepts as the roots in factored form.');
      return;
    }
  }
  lockFields($('#structure-equation'));
  finishStep(event.currentTarget, '#structure-feedback', $('#other-info-step'));
});

$('#point-substitution-form').addEventListener('submit', event => {
  event.preventDefault();
  const other = example().other;
  const fields = [$('#sub-y'), $('#sub-x')];
  const expected = [other.y, other.x];
  const results = fields.map((field, i) => {
    const correct = equal(numberValue(field.value), expected[i]);
    mark(field, correct);
    return correct;
  });
  if (!results.every(Boolean)) {
    setFeedback('#point-substitution-feedback', 'Enter the y- and x-coordinates of the other information in the matching blanks.');
    return;
  }
  lockFields($('#point-substitution-equation'));
  finishStep(event.currentTarget, '#point-substitution-feedback', $('#a-step'));
  showSubstitutionWork();
});

$('#a-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = $('#a-value');
  const correct = equal(numberValue(input.value), solveA(example()));
  mark(input, correct);
  if (!correct) {
    setFeedback('#a-feedback', 'Use the substituted equation to isolate a.');
    return;
  }
  input.readOnly = true;
  finishStep(event.currentTarget, '#a-feedback', $('#final-step'));
  renderFinalForm();
});

$('#final-form').addEventListener('submit', event => {
  event.preventDefault();
  const current = example();
  const aField = $('#final-a');
  const aCorrect = equal(numberValue(aField.value), solveA(current));
  mark(aField, aCorrect);
  let remainingCorrect = true;
  if (current.form === 'vertex') {
    const { x: h, y: k } = current.primary;
    const fields = [$('#final-h-sign'), $('#final-h'), $('#final-k-sign'), $('#final-k')];
    const expected = [h < 0 ? '+' : '-', Math.abs(h), k < 0 ? '-' : '+', Math.abs(k)];
    remainingCorrect = fields.map((field, i) => {
      const actual = field.tagName === 'SELECT' ? field.value : numberValue(field.value);
      const correct = typeof expected[i] === 'string' ? actual === expected[i] : equal(actual, expected[i]);
      mark(field, correct);
      return correct;
    }).every(Boolean);
  } else {
    const roots = current.primary.values;
    const signs = roots.map(root => root < 0 ? '+' : '-');
    const fields = [$('#final-r1-sign'), $('#final-r1'), $('#final-r2-sign'), $('#final-r2')];
    const expected = [signs[0], Math.abs(roots[0]), signs[1], Math.abs(roots[1])];
    const reversed = [signs[1], Math.abs(roots[1]), signs[0], Math.abs(roots[0])];
    const matches = values => fields.every((field, i) => {
      const actual = field.tagName === 'SELECT' ? field.value : numberValue(field.value);
      return typeof values[i] === 'string' ? actual === values[i] : equal(actual, values[i]);
    });
    const normalCorrect = matches(expected);
    const reversedCorrect = matches(reversed);
    remainingCorrect = normalCorrect || reversedCorrect;
    if (remainingCorrect) {
      fields.forEach(field => mark(field, true));
    } else {
      fields.forEach((field, i) => {
        const actual = field.tagName === 'SELECT' ? field.value : numberValue(field.value);
        const correct = [expected, reversed].some(values => typeof values[i] === 'string'
          ? actual === values[i]
          : equal(actual, values[i]));
        mark(field, correct);
      });
    }
  }
  if (!aCorrect || !remainingCorrect) {
    setFeedback('#final-feedback', 'Check a and each sign and value in the function.');
    return;
  }
  lockFields($('#final-equation'));
  finishStep(event.currentTarget, '#final-feedback', $('#complete'));
  $('#final-result').textContent = finalText();
  fireConfetti();
});

function loadExample(nextIndex) {
  index = (nextIndex + examples.length) % examples.length;
  $('#example-picker').value = String(index);
  resetSteps();
}

$('#example-picker').addEventListener('change', event => loadExample(Number(event.target.value)));
$('#reset-example').addEventListener('click', () => resetSteps());
$('#next-example').addEventListener('click', () => loadExample(index + 1));
window.addEventListener('scroll', updatePromptPin, { passive: true });
window.addEventListener('resize', updatePromptPin);

populatePicker();
loadExample(0);
