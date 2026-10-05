import { parseNumber } from '../quadratic-graphing/model.mjs';

export const exercises = [
  { b: -5, c: -14 },
  { b: 7, c: 12 },
  { b: -8, c: 15 },
  { b: 2, c: -24 },
  { b: -1, c: -20 },
  { b: -9, c: 20 },
  { b: 0, c: -16 },
  { b: 6, c: 9 },
  { b: 5, c: 0 },
  { b: -3, c: -18 },
  { b: 0, c: -9 },
  { b: 15, c: 56 },
  { b: 0, c: -25 },
  { b: -6, c: 0 },
  { b: 0, c: -36 },
  { b: -7, c: -60 },
  { b: 0, c: -49 },
  { b: -16, c: 63 },
  { b: 20, c: 100 },
  { b: 0, c: -100 },
];

export const nonMonicExercises = [
  { a: 2, b: 11, c: 12 },
  { a: 2, b: 7, c: -15 },
  { a: 3, b: 14, c: 8 },
  { a: 3, b: 1, c: -10 },
  { a: 4, b: 16, c: 15 },
  { a: 4, b: 5, c: -6 },
  { a: 5, b: 31, c: 6 },
  { a: 5, b: 11, c: -12 },
  { a: 6, b: -7, c: -20 },
  { a: 6, b: -42, c: 0 },
  { a: 7, b: 37, c: 10 },
  { a: 7, b: 25, c: -12 },
  { a: 8, b: 2, c: -15 },
  { a: 8, b: 11, c: -10 },
  { a: 9, b: 0, c: -49 },
  { a: 9, b: -56, c: 12 },
];

export function parseInteger(value) {
  const number = parseNumber(value);
  return Number.isSafeInteger(number) ? number === 0 ? 0 : number : NaN;
}

export function parseFactor(value) {
  const factor = parseCompleteFactor(value);
  return factor?.coefficient === 1 ? factor.constant : NaN;
}

export function parseCompleteFactor(value) {
  const text = String(value).trim().replaceAll('−', '-').replace(/\s/g, '');
  const match = /^(\d*)x([+-]\d+)?$/.exec(text);
  if (!match) return null;
  const coefficient = match[1] === '' ? 1 : parseInteger(match[1]);
  const constant = match[2] === undefined ? 0 : parseInteger(match[2]);
  return coefficient > 0 && Number.isSafeInteger(coefficient) && Number.isSafeInteger(constant)
    ? { coefficient, constant } : null;
}

export function signedTerm(value, variable = '') {
  const magnitude = Math.abs(value);
  const coefficient = variable && magnitude === 1 ? '' : String(magnitude);
  return `${value < 0 ? '−' : '+'} ${coefficient}${variable}`;
}

export function linearTerm(value) {
  if (value === 0) return '0x';
  return `${value < 0 ? '−' : ''}${Math.abs(value) === 1 ? '' : Math.abs(value)}x`;
}

export function expressionText({ a = 1, b, c }) {
  return `${a === 1 ? '' : a}x²${b ? ` ${signedTerm(b, 'x')}` : ''}${c ? ` ${signedTerm(c)}` : ''}`;
}

export function factoredText(first, second, topA = 1, sideA = 1) {
  const factor = (value, coefficient) => `(${linearTerm(coefficient)}${value === 0 ? '' : ` ${signedTerm(value)}`})`;
  return `${factor(first, topA)}${factor(second, sideA)}`;
}

export function assess(item, first, second, topA = 1, sideA = 1) {
  const product = first * second, leading = topA * sideA;
  const topRight = sideA * first, bottomLeft = topA * second;
  const sum = topRight + bottomLeft;
  const ready = Number.isSafeInteger(first) && Number.isSafeInteger(second)
    && Number.isSafeInteger(topA) && topA > 0 && Number.isSafeInteger(sideA) && sideA > 0
    && [product, leading, topRight, bottomLeft, sum].every(Number.isSafeInteger);
  const leadingReady = Number.isSafeInteger(topA) && topA > 0
    && Number.isSafeInteger(sideA) && sideA > 0 && Number.isSafeInteger(leading);
  const leadingCorrect = leadingReady && leading === (item.a ?? 1);
  return {
    ready, product, sum, leading, topRight, bottomLeft, leadingCorrect,
    productCorrect: ready && product === item.c,
    sumCorrect: ready && sum === item.b,
    complete: ready && leadingCorrect && product === item.c && sum === item.b,
  };
}
