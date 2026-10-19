export const examples = [
  {
    title: 'Water rocket',
    scenario: 'A student launches a water rocket. Its height above the launch pad changes over time according to the model below.',
    xMeaning: 'time after launch, in seconds',
    yMeaning: 'height above the launch pad, in feet',
    form: 'standard', a: -16, b: 96, c: 0,
  },
  {
    title: 'Workshop production costs',
    scenario: 'A workshop models its daily operating cost based on the number of items it makes. The function is written in vertex form.',
    xMeaning: 'hundreds of items made per day',
    yMeaning: 'daily cost, in thousands of dollars',
    form: 'vertex', a: 0.5, h: 8, k: 18,
  },
  {
    title: 'Community theater tickets',
    scenario: 'A community theater models its weekly profit based on ticket sales. The function is written in factored form.',
    xMeaning: 'hundreds of tickets sold',
    yMeaning: 'weekly profit, in thousands of dollars',
    form: 'factored', a: -2, r1: 1, r2: 9,
  },
  {
    title: 'Ball tossed from a balcony',
    scenario: 'A ball is tossed upward from a balcony. Its height above the ground is modeled as a function of time.',
    xMeaning: 'time after the toss, in seconds',
    yMeaning: 'height above the ground, in feet',
    form: 'standard', a: -16, b: 64, c: 5,
  },
  {
    title: 'Furniture manufacturing costs',
    scenario: 'A furniture company models its daily production cost as its output changes. The function is given in standard form.',
    xMeaning: 'hundreds of items made per day',
    yMeaning: 'daily cost, in thousands of dollars',
    form: 'standard', a: 3, b: -18, c: 32,
  },
  {
    title: 'Ticket revenue',
    scenario: 'An event venue models ticket revenue based on ticket price. Its model predicts the weekly revenue in thousands of dollars.',
    xMeaning: 'ticket price, in tens of dollars',
    yMeaning: 'weekly revenue, in thousands of dollars',
    form: 'standard', a: -2, b: 20, c: 4,
  },
  {
    title: 'Stunt jump',
    scenario: 'A stunt performer jumps from a platform and lands at ground level. The height during the jump is modeled in factored form.',
    xMeaning: 'time after takeoff, in seconds',
    yMeaning: 'height above the ground, in feet',
    form: 'factored', a: -16, r1: 0, r2: 5,
  },
  {
    title: 'Small-batch production',
    scenario: 'A small business models its production cost as the size of each batch changes. The cost function is in standard form.',
    xMeaning: 'hundreds of items in each batch',
    yMeaning: 'cost per batch, in thousands of dollars',
    form: 'standard', a: 2, b: -20, c: 70,
  },
  {
    title: 'Greenhouse heating use',
    scenario: 'A greenhouse models its heating-energy use across a six-month growing season with a quadratic function.',
    xMeaning: 'months after the season begins',
    yMeaning: 'heating energy, in thousands of kilowatt-hours',
    form: 'standard', a: 1, b: -6, c: 20,
  },
  {
    title: 'Practice jump',
    scenario: 'A volleyball player practices a jump. The ball’s height above the gym floor follows the vertex-form model below.',
    xMeaning: 'time after takeoff, in seconds',
    yMeaning: 'height above the floor, in feet',
    form: 'vertex', a: -16, h: 0.5, k: 8,
  },
];

const minus = '\u2212';
const square = '\u00b2';

export function formatNumber(value) {
  const rounded = Math.round(value * 1e10) / 1e10;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

function signedCoefficient(value) {
  if (value === 1) return '';
  if (value === -1) return minus;
  return value < 0 ? `${minus}${formatNumber(Math.abs(value))}` : formatNumber(value);
}

function constantTerm(value) {
  if (value === 0) return '';
  return ` ${value < 0 ? minus : '+'} ${formatNumber(Math.abs(value))}`;
}

function factor(root) {
  if (root === 0) return 'x';
  return `(x ${root > 0 ? minus : '+'} ${formatNumber(Math.abs(root))})`;
}

export function functionText(item) {
  const lead = signedCoefficient(item.a);
  if (item.form === 'standard') {
    const middle = item.b === 0 ? '' : ` ${item.b < 0 ? minus : '+'} ${Math.abs(item.b) === 1 ? '' : formatNumber(Math.abs(item.b))}x`;
    return `f(x) = ${lead}x${square}${middle}${constantTerm(item.c)}`;
  }
  if (item.form === 'factored') {
    return `f(x) = ${lead}${factor(item.r1)}${factor(item.r2)}`;
  }
  const inside = item.h === 0 ? `x${square}` : `(x ${item.h > 0 ? minus : '+'} ${formatNumber(Math.abs(item.h))})${square}`;
  return `f(x) = ${lead}${inside}${constantTerm(item.k)}`;
}

export function evaluate(item, x) {
  if (item.form === 'standard') return item.a * x ** 2 + item.b * x + item.c;
  if (item.form === 'factored') return item.a * (x - item.r1) * (x - item.r2);
  return item.a * (x - item.h) ** 2 + item.k;
}

export function vertex(item) {
  if (item.form === 'vertex') return { x: item.h, y: item.k };
  const x = item.form === 'standard' ? -item.b / (2 * item.a) : (item.r1 + item.r2) / 2;
  return { x, y: evaluate(item, x) };
}

export function extremumType(item) {
  return item.a > 0 ? 'minimum' : 'maximum';
}

export function standardAxisWork(item) {
  const signed = value => value < 0 ? `${minus}${formatNumber(Math.abs(value))}` : formatNumber(value);
  return `${minus}(${signed(item.b)}) / (2(${signed(item.a)}))`;
}

function signedTerm(coefficient, body, isFirst = false) {
  if (coefficient === 0) return '';
  const sign = coefficient < 0 ? minus : '+';
  const magnitude = Math.abs(coefficient);
  const coefficientText = magnitude === 1 ? '' : formatNumber(magnitude);
  const prefix = isFirst ? (coefficient < 0 ? minus : '') : ` ${sign} `;
  return `${prefix}${coefficientText}${body}`;
}

function substitutedFactor(x, root) {
  if (root === 0) return `(${formatNumber(x)})`;
  return `(${formatNumber(x)} ${root > 0 ? minus : '+'} ${formatNumber(Math.abs(root))})`;
}

export function vertexSubstitution(item, x) {
  if (item.form === 'factored') {
    const lead = Math.abs(item.a) === 1 ? '' : formatNumber(Math.abs(item.a));
    const sign = item.a < 0 ? minus : '';
    return `f(${formatNumber(x)}) = ${sign}${lead}${substitutedFactor(x, item.r1)}${substitutedFactor(x, item.r2)}`;
  }
  if (item.form === 'standard') {
    const terms = [signedTerm(item.a, `(${formatNumber(x)})${square}`, true), signedTerm(item.b, `(${formatNumber(x)})`), signedTerm(item.c, '')].filter(Boolean);
    return `f(${formatNumber(x)}) = ${terms.join('')}`;
  }
  return `f(${formatNumber(x)}) = ${formatNumber(item.a)}(${formatNumber(x)} ${item.h > 0 ? minus : '+'} ${formatNumber(Math.abs(item.h))})${square} ${item.k < 0 ? minus : '+'} ${formatNumber(Math.abs(item.k))}`;
}

export function parseNumber(text) {
  const cleaned = String(text ?? '').trim().replace(/\u2212/g, '-');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleaned)) return NaN;
  return Number(cleaned);
}
