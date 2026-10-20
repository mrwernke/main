export const systems = [
  { left: [1, 0, -7], right: [0, 1, -1] },
  { left: [2, 0, -8], right: [1, -2, -5] },
  { left: [1, 0, -2], right: [0, 2, -3] },
  { left: [1, 2, -3], right: [0, 0, 0] },
  { left: [0.5, 1, -4], right: [-0.5, 1, 0] },
  { left: [0.5, 3, 4], right: [-0.5, -1, 0] },
  { left: [2, 0, -8], right: [1, 4, -12] },
  { left: [1, -2, -3], right: [0, -2, 1] },
];

function parseCoefficient(value) {
  const fraction = /^(\d+)\/(\d+)$/.exec(value);
  if (fraction) {
    const denominator = Number(fraction[2]);
    return denominator ? Number(fraction[1]) / denominator : NaN;
  }
  return /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value) ? Number(value) : NaN;
}

function coefficientText(value) {
  return value === 0.5 ? '1/2' : String(value);
}

export function parsePolynomial(value) {
  const text = String(value).toLowerCase().replace(/[\s−–]/g, character => character === '−' || character === '–' ? '-' : '');
  if (!text) return null;

  const coefficients = [0, 0, 0];
  let position = 0;
  let termCount = 0;
  while (position < text.length) {
    let sign = 1;
    if (text[position] === '+' || text[position] === '-') {
      sign = text[position] === '-' ? -1 : 1;
      position += 1;
    } else if (position > 0) {
      return null;
    }

    const start = position;
    while (position < text.length && text[position] !== '+' && text[position] !== '-') position += 1;
    const term = text.slice(start, position);
    if (!term) return null;

    if (term.includes('x')) {
      const match = /^((?:\d+\/\d+)|(?:\d+(?:\.\d+)?|\.\d+))?x(\^2)?$/.exec(term);
      if (!match) return null;
      const degree = match[2] ? 2 : 1;
      const coefficient = match[1] ? parseCoefficient(match[1]) : 1;
      if (!Number.isFinite(coefficient) || coefficient === 0) return null;
      coefficients[2 - degree] += sign * coefficient;
    } else {
      const constant = parseCoefficient(term);
      if (!Number.isFinite(constant)) return null;
      coefficients[2] += sign * constant;
    }
    termCount += 1;
  }
  return termCount ? coefficients : null;
}

export function parseInteger(value) {
  const text = String(value).trim().replace(/[−–]/g, '-');
  if (!/^[+-]?\d+$/.test(text)) return NaN;
  const number = Number(text);
  return Number.isSafeInteger(number) ? number : NaN;
}

export function parseFactor(value) {
  const text = String(value).trim().toLowerCase().replace(/[\s−–]/g, character => character === '−' || character === '–' ? '-' : '');
  const match = /^x(?:([+-])(\d+))?$/.exec(text);
  if (!match) return NaN;
  if (!match[1]) return 0;
  const constant = Number(match[2]);
  return Number.isSafeInteger(constant) ? (match[1] === '-' ? -constant : constant) : NaN;
}

export function samePolynomial(first, second) {
  return Boolean(first && second && first.every((coefficient, index) => coefficient === second[index]));
}

export function subtractPolynomials(first, second) {
  return first.map((coefficient, index) => coefficient - second[index]);
}

export function polynomialText([a, b, c]) {
  const terms = [];
  [[a, 'x²'], [b, 'x'], [c, '']].forEach(([coefficient, variable]) => {
    if (!coefficient) return;
    const magnitude = Math.abs(coefficient);
    const body = variable
      ? `${magnitude === 1 ? '' : coefficientText(magnitude)}${variable}`
      : coefficientText(magnitude);
    if (!terms.length) terms.push(coefficient < 0 ? `−${body}` : body);
    else terms.push(`${coefficient < 0 ? ' − ' : ' + '}${body}`);
  });
  return terms.length ? terms.join('') : '0';
}

export function formatInteger(value) {
  return String(value).replace('-', '−');
}

export function factorText(constant) {
  if (constant > 0) return `x + ${constant}`;
  if (constant < 0) return `x − ${Math.abs(constant)}`;
  return 'x';
}

export function evaluateQuadratic([a, b, c], x) {
  return a * x * x + b * x + c;
}

export function substitutionText([a, b, c], x) {
  const xText = x < 0 ? `(${formatInteger(x)})` : String(x);
  const terms = [];
  const parts = [
    [a, a === 1 ? `${xText}²` : `${coefficientText(Math.abs(a))}${xText}²`],
    [b, Math.abs(b) === 1 ? xText : `${coefficientText(Math.abs(b))}${xText}`],
    [c, coefficientText(Math.abs(c))],
  ];
  parts.forEach(([coefficient, body]) => {
    if (!coefficient) return;
    const signedBody = coefficient < 0 ? `−${body}` : body;
    if (!terms.length) terms.push(signedBody);
    else terms.push(`${coefficient < 0 ? ' − ' : ' + '}${body}`);
  });
  return terms.join('');
}

export function differenceFor(system) {
  return subtractPolynomials(system.left, system.right);
}

export function rootsFor(system) {
  const [a, b, c] = differenceFor(system);
  const roots = [];
  for (let x = -5; x <= 5; x += 1) {
    if (a * x * x + b * x + c === 0) roots.push(x);
  }
  return roots;
}

export function splitConstantsFor(system) {
  const [, b, c] = differenceFor(system);
  for (let first = -10; first <= 10; first += 1) {
    for (let second = -10; second <= 10; second += 1) {
      if (first + second === b && first * second === c) return [first, second];
    }
  }
  return [];
}
