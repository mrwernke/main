import { assess, linearTerm, parseInteger } from '../quadratic-factoring/model.mjs';

export function showGroups(groups, equation, includeZero) {
  const first = document.createElement('span');
  const second = document.createElement('span');
  first.className = 'p8-red-group';
  second.className = 'p8-green-group';
  first.textContent = `(${groups[0]})`;
  second.textContent = `(${groups[1]})`;
  equation.replaceChildren();
  equation.append(first, document.createTextNode(' + '), second);
  if (includeZero) equation.append(document.createTextNode(' = 0'));
}

export function field(label, wide = false) {
  const input = document.createElement('input');
  input.className = wide ? 'coord factor-input' : 'coord';
  input.autocomplete = 'off';
  input.setAttribute('aria-label', label);
  return input;
}

export function groupedDivision({ firstGroup, secondGroup, groupGcf }) {
  const display = document.createElement('div');
  display.className = 'p8-division math';
  const fraction = (numerator, denominator, groupClass) => {
    const element = document.createElement('span');
    element.className = `fraction ${groupClass}`;
    const top = document.createElement('span');
    top.className = 'numerator';
    top.textContent = `(${numerator})`;
    const bottom = document.createElement('span');
    bottom.className = 'denominator';
    bottom.textContent = denominator;
    element.append(top, bottom);
    display.append(element);
  };
  fraction(firstGroup, 'x²', 'p8-red-group');
  fraction(secondGroup, groupGcf, 'p8-green-group');
  return display;
}

export function factoringBox(item, showInstructions) {
  const nonMonic = (item.a ?? 1) > 1;
  const variable = item.power === 2 ? 'x²' : 'x';
  const leadingVariable = item.power === 2 ? 'x⁴' : 'x²';
  const term = value => linearTerm(value).replace('x', variable);
  const content = document.createElement('div');
  if (showInstructions) {
    const heading = document.createElement('h2');
    heading.textContent = 'Factoring box';
    const instructions = document.createElement('p');
    instructions.className = 'p8-note';
    instructions.textContent = nonMonic
      ? `Enter positive whole-number coefficients for ${variable} and signed integer constants. Match the leading term, constant, and middle term.`
      : 'Enter signed integers above and beside the box. Their product must match the constant, and their sum must match the middle term.';
    content.append(heading, instructions);
  }
  const box = document.createElement('div');
  box.className = `p8-box math${nonMonic ? ' p8-non-monic' : ''}`;
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', 'Multiplication box');
  const add = (className, text) => {
    const element = document.createElement('div');
    element.className = className;
    element.textContent = text;
    box.append(element);
    return element;
  };
  const column = add('p8-box-column', '');
  const row = add('p8-box-row', '');
  let columnCoefficient;
  let rowCoefficient;
  if (nonMonic) {
    columnCoefficient = field(`First column ${variable} coefficient`);
    rowCoefficient = field(`First row ${variable} coefficient`);
    column.append(columnCoefficient);
    row.append(rowCoefficient);
  }
  column.append(document.createTextNode(variable));
  row.append(document.createTextNode(variable));
  const top = field('Second column integer');
  top.className = 'p8-box-top';
  top.inputMode = 'text';
  const side = field('Second row integer');
  side.className = 'p8-box-side';
  side.inputMode = 'text';
  box.append(top, side);
  const leading = add('p8-box-cell p8-box-leading', `${item.a && item.a !== 1 ? item.a : ''}${leadingVariable}`);
  const topProduct = add('p8-box-cell p8-box-top-product', '?');
  const sideProduct = add('p8-box-cell p8-box-side-product', '?');
  const constant = add('p8-box-cell p8-box-constant', String(item.c).replace('-', '−'));
  const middle = add('p8-box-middle', term(item.b));
  const leadingMark = document.createElement('span');
  const productMark = document.createElement('span');
  const sumMark = document.createElement('span');
  [leadingMark, productMark, sumMark].forEach(mark => {
    mark.className = 'p8-box-mark';
    mark.setAttribute('aria-hidden', 'true');
  });
  leading.append(leadingMark);
  constant.append(productMark);
  middle.append(sumMark);
  const status = document.createElement('span');
  status.className = 'sr-only';
  status.setAttribute('aria-live', 'polite');
  const feedback = document.createElement('p');
  feedback.className = 'feedback';
  feedback.setAttribute('aria-live', 'polite');
  content.append(box, status, feedback);

  function update() {
    const inputs = nonMonic ? [top, side, columnCoefficient, rowCoefficient] : [top, side];
    const values = inputs.map(input => parseInteger(input.value));
    const result = assess(item, ...values);
    inputs.forEach((input, i) => {
      const invalid = input.value.trim() !== ''
        && (!Number.isSafeInteger(values[i]) || (i >= 2 && values[i] <= 0));
      input.classList.toggle('invalid', invalid);
      input.setAttribute('aria-invalid', String(invalid));
    });
    topProduct.textContent = Number.isSafeInteger(result.topRight) ? term(result.topRight) : '?';
    sideProduct.textContent = Number.isSafeInteger(result.bottomLeft) ? term(result.bottomLeft) : '?';
    const leadingReady = nonMonic && values.slice(2).every(value => Number.isSafeInteger(value) && value > 0)
      && Number.isSafeInteger(result.leading);
    leading.classList.toggle('p8-box-correct', leadingReady && result.leadingCorrect);
    leading.classList.toggle('p8-box-incorrect', leadingReady && !result.leadingCorrect);
    leadingMark.textContent = leadingReady ? result.leadingCorrect ? '✓' : '✗' : '';
    for (const [element, mark, correct] of [[constant, productMark, result.productCorrect], [middle, sumMark, result.sumCorrect]]) {
      element.classList.toggle('p8-box-correct', result.ready && correct);
      element.classList.toggle('p8-box-incorrect', result.ready && !correct);
      mark.textContent = result.ready ? correct ? '✓' : '✗' : '';
    }
    status.textContent = [
      leadingReady ? `Leading coefficient ${result.leadingCorrect ? 'correct' : 'incorrect'}.` : '',
      result.ready ? `Product ${result.productCorrect ? 'correct' : 'incorrect'}. Sum ${result.sumCorrect ? 'correct' : 'incorrect'}.` : '',
    ].filter(Boolean).join(' ');
    if (inputs.some(input => input.getAttribute('aria-invalid') === 'true')) {
      feedback.textContent = nonMonic
        ? `Enter signed integers for the constants and positive whole numbers for the ${variable} coefficients.`
        : 'Enter signed integers in both blanks.';
    } else if (!result.ready && values.every(Number.isSafeInteger)) {
      feedback.textContent = 'These numbers are too large to check accurately. Try smaller integers.';
    } else {
      feedback.textContent = '';
    }
    feedback.className = `feedback${feedback.textContent ? ' no' : ''}`;
  }
  (nonMonic ? [top, side, columnCoefficient, rowCoefficient] : [top, side]).forEach(input => {
    input.addEventListener('input', update);
    input.addEventListener('keydown', event => { if (event.key === 'Enter') event.preventDefault(); });
  });
  return content;
}
