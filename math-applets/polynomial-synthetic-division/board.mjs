export function numberText(value) {
  return String(value).replace('-', '−');
}

export function input(label, inline = false) {
  const element = document.createElement('input');
  element.type = 'text';
  element.autocomplete = 'off';
  element.setAttribute('aria-label', label);
  if (inline) {
    element.className = 'division-input';
    element.setAttribute('form', 'question');
    element.setAttribute('aria-describedby', 'question-title question-note feedback');
  }
  return element;
}

function cell(row, value, options = {}) {
  const element = document.createElement('span');
  if (options.className) element.className = options.className;
  const content = options.remainder ? document.createElement('span') : element;
  if (options.remainder) {
    content.className = 'remainder-value';
    element.append(content);
  }
  if (options.input) content.append(input(options.input, true));
  else if (value !== null) content.textContent = numberText(value);
  row.append(element);
}

export function renderSyntheticBoard(board, example, phase, column) {
  board.replaceChildren();
  board.style.setProperty('--columns', example.dividend.length);
  const top = document.createElement('div');
  top.className = 'division-row';
  cell(top, phase === 'coefficients' || phase === 'root' ? null : example.rootText, {
    className: 'root-cell',
    input: phase === 'root' ? 'Synthetic number' : null,
  });
  example.dividend.forEach((value, index) => {
    const power = example.dividend.length - index - 1;
    const label = power === 0 ? 'Constant coefficient' : `Coefficient of x${power === 1 ? '' : `^${power}`}`;
    cell(top, phase === 'coefficients' ? null : value, {
      input: phase === 'coefficients' ? label : null,
    });
  });
  board.append(top);

  const products = document.createElement('div');
  products.className = 'division-row';
  cell(products, null);
  example.dividend.forEach((value, index) => {
    const show = index > 0 && (index < column || (index === column && phase !== 'multiply' && phase !== 'root' && phase !== 'bring'));
    cell(products, show ? example.products[index - 1] : null, {
      input: index === column && phase === 'multiply' ? 'Product' : null,
    });
  });
  board.append(products);

  const results = document.createElement('div');
  results.className = 'division-row';
  cell(results, null);
  example.dividend.forEach((value, index) => {
    const show = phase === 'final' || phase === 'factor' || (phase !== 'root' && phase !== 'bring' && index < column);
    const active = (phase === 'bring' && index === 0) || (phase === 'add' && index === column);
    cell(results, show ? example.results[index] : null, {
      className: 'result-cell',
      input: active ? (phase === 'bring' ? 'First coefficient brought down' : 'Sum') : null,
      remainder: index === example.dividend.length - 1,
    });
  });
  board.append(results);
}
