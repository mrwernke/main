function fractionValue(numerator, denominator) {
  let a = numerator < 0n ? -numerator : numerator;
  let b = denominator;
  while (b !== 0n) [a, b] = [b, a % b];
  const divisor = a || 1n;
  return { numerator: numerator / divisor, denominator: denominator / divisor };
}

const zero = () => ({ numerator: 0n, denominator: 1n });
const add = (a, b) => fractionValue(a.numerator * b.denominator + b.numerator * a.denominator,
  a.denominator * b.denominator);
const multiply = (a, b) => fractionValue(a.numerator * b.numerator, a.denominator * b.denominator);

function rational(text) {
  if (!/^\d+(?:\/\d+|\.\d+)?$/.test(text)) return null;
  const [whole, fraction] = text.split('/');
  if (fraction !== undefined) {
    const numerator = BigInt(whole);
    const denominator = BigInt(fraction);
    return denominator !== 0n ? fractionValue(numerator, denominator) : null;
  }
  const [integer, decimal = ''] = text.split('.');
  const denominator = 10n ** BigInt(decimal.length);
  return fractionValue(BigInt(integer + decimal), denominator);
}

export function radicalBasis(value) {
  if (!value) return 0;
  const sign = Math.sign(value);
  let remainder = Math.abs(value);
  for (let i = 2; i * i <= remainder; i++) {
    while (remainder % (i * i) === 0) remainder /= i * i;
  }
  return sign * remainder;
}

export function parseAlgebraic(value, basis) {
  const text = String(value).toLowerCase().replaceAll('−', '-').replace(/\s+/g, '')
    .replace(/√(?:\((\d+)\)|(\d+))/g, (_, parenthesized, plain) => `sqrt(${parenthesized || plain})`)
    .replace(/(\d)\*(?=sqrt|i)/g, '$1').replace(/\)\*(?=i)/g, ')');
  if (!text) return null;
  const terms = text.match(/[+-]?[^+-]+/g);
  if (!terms || terms.join('') !== text) return null;
  let real = zero();
  let radical = zero();
  for (const term of terms) {
    const sign = term.startsWith('-') ? -1n : 1n;
    const unsigned = term.replace(/^[+-]/, '');
    const plain = rational(unsigned);
    if (plain) {
      real = add(real, multiply(plain, { numerator: sign, denominator: 1n }));
      continue;
    }
    const match = /^(\d+(?:\/\d+|\.\d+)?)?(?:sqrt\((\d+)\))?(i)?$/.exec(unsigned);
    if (!match || (!match[2] && !match[3])) return null;
    const coefficient = rational(match[1] || '1');
    const radicand = Number(match[2] || '1');
    if (!coefficient || !Number.isSafeInteger(radicand) || radicand < 1 || radicand > 1000000) return null;
    const signedRadicand = match[3] ? -radicand : radicand;
    if (radicalBasis(signedRadicand) !== basis) return null;
    const scale = Math.sqrt(Math.abs(signedRadicand / basis));
    if (!Number.isSafeInteger(scale)) return null;
    radical = add(radical, multiply(coefficient, { numerator: sign * BigInt(scale), denominator: 1n }));
  }
  return { real, radical };
}

function addValues(a, b) {
  return { real: add(a.real, b.real), radical: add(a.radical, b.radical) };
}

function multiplyValues(a, b, basis) {
  return {
    real: add(multiply(a.real, b.real), multiply(multiply(a.radical, b.radical), { numerator: BigInt(basis), denominator: 1n })),
    radical: add(multiply(a.real, b.radical), multiply(a.radical, b.real)),
  };
}

function fractionText(value) {
  return value.denominator === 1n ? String(value.numerator) : `${value.numerator}/${value.denominator}`;
}

export function algebraicText(value, basis) {
  const { real, radical } = value;
  if (!radical.numerator) return fractionText(real);
  const negative = radical.numerator < 0n;
  const magnitude = { ...radical, numerator: negative ? -radical.numerator : radical.numerator };
  const coefficient = magnitude.numerator === magnitude.denominator ? '' : fractionText(magnitude);
  const symbol = basis === -1 ? 'i' : `sqrt(${Math.abs(basis)})${basis < 0 ? 'i' : ''}`;
  const term = `${coefficient}${symbol}`;
  return real.numerator ? `${fractionText(real)}${negative ? '-' : '+'}${term}` : `${negative ? '-' : ''}${term}`;
}

export function checkAlgebraic(value, expected, basis) {
  const actual = parseAlgebraic(value, basis);
  const target = parseAlgebraic(expected, basis);
  return Boolean(actual && target && actual.real.numerator === target.real.numerator
    && actual.real.denominator === target.real.denominator
    && actual.radical.numerator === target.radical.numerator
    && actual.radical.denominator === target.radical.denominator);
}

export function continuedTrial(dividend, rootText, basis) {
  const coefficients = dividend.map(value => parseAlgebraic(value, basis));
  const root = parseAlgebraic(rootText, basis);
  if (!root || coefficients.some(value => !value)) return null;
  const results = [coefficients[0]];
  const products = [];
  for (let i = 1; i < coefficients.length; i++) {
    products.push(multiplyValues(results[i - 1], root, basis));
    results.push(addValues(coefficients[i], products[i - 1]));
  }
  return {
    dividend, rootText: algebraicText(root, basis),
    products: products.map(value => algebraicText(value, basis)),
    results: results.map(value => algebraicText(value, basis)),
    remainder: results.at(-1),
  };
}

export function isZero(value) {
  return value.real.numerator === 0n && value.radical.numerator === 0n;
}
