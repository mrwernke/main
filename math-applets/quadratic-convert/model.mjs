import { assess, parseInteger, parseCompleteFactor, factoredText } from '../quadratic-factoring/model.mjs';
import { parseNumber } from '../quadratic-graphing/model.mjs';

export const practice = [
  { a: 1, b: 4, c: -5 },
  { a: 1, b: 2, c: -8 },
  { a: 1, b: 6, c: 5 },
  { a: 1, b: -8, c: 12 },
  { a: 1, b: 2, c: -3 },
  { a: 1, b: -8, c: 7 },
  { a: 1, b: 4, c: -12 },
  { a: 1, b: 10, c: 21 },
  { a: 1, b: 0, c: -64 },
  { a: 1, b: 0, c: -121 },
  { a: 1, b: 0, c: -144 },
  { a: 1, b: 1, c: -12 },
  { a: 1, b: 9, c: 14 },
  { a: 1, b: -5, c: 4 },
  { a: 1, b: -5, c: -6 },
  { a: 2, b: 9, c: 10 },
  { a: 3, b: 16, c: 5 },
  { a: 2, b: 1, c: -15 },
  { a: 3, b: 5, c: -12 },
  { a: 4, b: 11, c: 6 },
];

export function formatValue(value) {
  if (!Number.isFinite(value)) return '';
  const rounded = Number(value.toFixed(6));
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

function signed(value, variable = '') {
  const magnitude = Math.abs(value);
  const coefficient = variable && magnitude === 1 ? '' : String(magnitude);
  return `${value < 0 ? ' − ' : ' + '}${coefficient}${variable}`;
}

export function standardText({ a, b, c }) {
  return `f(x) = ${a === 1 ? '' : a === -1 ? '−' : a}x²${b ? signed(b, 'x') : ''}${c ? signed(c) : ''}`;
}

export function vertexData(item) {
  const h = -item.b / (2 * item.a);
  const k = item.a * h ** 2 + item.b * h + item.c;
  return { h, k };
}

function insideShift(value) {
  if (value === 0) return 'x';
  return value > 0 ? `(x − ${formatValue(value)})` : `(x + ${formatValue(-value)})`;
}

export function vertexText(item) {
  const { h, k } = vertexData(item);
  const lead = item.a === 1 ? '' : item.a === -1 ? '−' : formatValue(item.a);
  const constant = k === 0 ? '' : k < 0 ? ` − ${formatValue(-k)}` : ` + ${formatValue(k)}`;
  return `f(x) = ${lead}${insideShift(h)}²${constant}`;
}

export function substitutionText(item, enteredX) {
  const { h } = vertexData(item);
  const x = enteredX ?? formatValue(h);
  const aPart = item.a === 1 ? '' : item.a === -1 ? '−' : formatValue(item.a);
  const bPart = item.b ? signed(item.b, `(${x})`) : '';
  const cPart = item.c ? signed(item.c) : '';
  return `f(${x}) = ${aPart}(${x})²${bPart}${cPart} =`;
}

export function linearFactorText({ coefficient, constant }) {
  const xTerm = coefficient === 1 ? 'x' : `${formatValue(coefficient)}x`;
  if (constant === 0) return xTerm;
  return `${xTerm}${constant < 0 ? ' − ' : ' + '}${formatValue(Math.abs(constant))}`;
}

export function parseNormalizedFactor(value) {
  const text = String(value).trim().replace(/\u2212/g, '-').replace(/\s/g, '');
  const match = /^x(?:([+-])((?:\d+\/\d+)|(?:\d+(?:\.\d*)?|\.\d+)))?$/.exec(text);
  if (!match) return null;
  if (match[1] === undefined) return { coefficient: 1, constant: 0, isFraction: false, simplified: true };
  const sign = match[1] === '-' ? -1 : 1;
  const amount = match[2];
  if (amount.includes('/')) {
    const [numeratorText, denominatorText] = amount.split('/');
    const numerator = Number(numeratorText) * sign;
    const denominator = Number(denominatorText);
    if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator === 0) return null;
    return { coefficient: 1, constant: numerator / denominator, numerator, denominator, isFraction: true, simplified: gcd(Math.abs(numerator), denominator) === 1 };
  }
  const constant = sign * Number(amount);
  return Number.isFinite(constant) ? { coefficient: 1, constant, isFraction: false, simplified: true } : null;
}

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function simplifyFraction(numerator, denominator) {
  const sign = denominator < 0 ? -1 : 1;
  const divisor = gcd(Math.abs(numerator), Math.abs(denominator));
  return { numerator: sign * numerator / divisor, denominator: Math.abs(denominator) / divisor };
}

export function parseRationalNumber(value) {
  const text = String(value).trim().replace(/\u2212/g, '-').replace(/\s/g, '');
  const fraction = /^([+-]?\d+)\/(\d+)$/.exec(text);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator === 0) return null;
    return { value: numerator / denominator, numerator, denominator, isFraction: true, simplified: gcd(Math.abs(numerator), denominator) === 1 };
  }
  const number = parseNumber(text);
  return Number.isFinite(number) ? { value: number, isFraction: false, simplified: true } : null;
}

export function hasTerminatingDecimal(numerator, denominator) {
  let reducedDenominator = simplifyFraction(numerator, denominator).denominator;
  while (reducedDenominator % 2 === 0) reducedDenominator /= 2;
  while (reducedDenominator % 5 === 0) reducedDenominator /= 5;
  return reducedDenominator === 1;
}

export { assess, parseInteger, parseCompleteFactor, parseNumber, factoredText };
