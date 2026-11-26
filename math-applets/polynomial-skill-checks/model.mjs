import { examples as longExamples } from '../polynomial-long-division/model.mjs';
import { examples as syntheticExamples } from '../polynomial-synthetic-division/model.mjs';
import { parsePolynomialCoefficients } from '../polynomial-utils.mjs';
import { parseRationalNumber } from '../quadratic-convert/model.mjs';

export const examples = { P9: longExamples, P10: syntheticExamples };

const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1e-8;
const same = (a, b) => Boolean(a && b && a.length === b.length && a.every((value, i) => close(value, b[i])));
const number = value => {
  const parsed = parseRationalNumber(String(value ?? ''));
  return parsed === null ? null : parsed.value;
};
const poly = (value, length) => parsePolynomialCoefficients(value ?? '', length);
const matches = (actual, correct, follow) => same(actual, correct) || same(actual, follow);
const numberMatches = (actual, correct, follow) => close(actual, correct) || close(actual, follow);

function score(process, final) {
  const processCorrect = process.filter(Boolean).length;
  const finalCorrect = final.filter(Boolean).length;
  return {
    processCorrect, processTotal: process.length,
    finalCorrect, finalTotal: final.length,
    score: 0.5 * processCorrect / process.length + 0.5 * finalCorrect / final.length,
  };
}

export function gradeLong(example, answers) {
  const length = example.dividend.length;
  const process = [];
  let current = example.dividend.map((value, index) => index < example.divisor.length ? value : 0);
  const terms = [];
  let lastSubtraction = null;
  example.rounds.forEach((round, index) => {
    const entered = answers.rounds[index] || {};
    const term = poly(entered.term, length);
    const termIndex = round.term.findIndex(value => value !== 0);
    const followTerm = current && current.map((_, position) =>
      position === termIndex ? current[index] / example.divisor[0] : 0);
    process.push(matches(term, round.term, followTerm));
    const usableTerm = term && term.every((value, position) => position === termIndex || close(value, 0));
    terms.push(usableTerm ? term : null);

    const product = poly(entered.product, length);
    const followProduct = usableTerm ? Array(length).fill(0) : null;
    if (followProduct) {
      example.divisor.forEach((value, offset) => {
        followProduct[index + offset] = term[termIndex] * value;
      });
    }
    process.push(matches(product, round.product, followProduct));

    const subtraction = poly(entered.subtraction, length);
    const followSubtraction = current && product && current.map((value, position) => value - product[position]);
    process.push(matches(subtraction, round.subtraction, followSubtraction));
    lastSubtraction = subtraction;
    if (round.bringsDown) {
      const brought = poly(entered.broughtDown, length);
      process.push(matches(brought, round.broughtDown, null));
      current = subtraction && brought && subtraction.map((value, position) => value + brought[position]);
    }
  });
  const followQuotient = terms.every(Boolean)
    ? terms.reduce((sum, term) => sum.map((value, index) => value + term[index]), Array(length).fill(0))
    : null;
  return score(process, [
    matches(poly(answers.quotient, length), example.quotient, followQuotient),
    matches(poly(answers.remainder, length), example.remainder, lastSubtraction),
  ]);
}

export function gradeSynthetic(example, answers) {
  const coefficients = example.dividend.map((_, index) => number(answers.coefficients[index]));
  const root = number(answers.root);
  const products = example.products.map((_, index) => number(answers.products[index]));
  const results = example.results.map((_, index) => number(answers.results[index]));
  const process = [
    ...coefficients.map((value, index) => numberMatches(value, example.dividend[index], null)),
    numberMatches(root, example.root, null),
    numberMatches(results[0], example.results[0], coefficients[0]),
  ];
  products.forEach((value, index) => {
    const followProduct = root !== null && results[index] !== null ? root * results[index] : null;
    const followResult = coefficients[index + 1] !== null && value !== null ? coefficients[index + 1] + value : null;
    process.push(numberMatches(value, example.products[index], followProduct));
    process.push(numberMatches(results[index + 1], example.results[index + 1], followResult));
  });
  const followQuotient = results.slice(0, -1).every(value => value !== null)
    ? results.slice(0, -1).map(value => value / example.divisor[0]) : null;
  return score(process, [
    matches(poly(answers.quotient, example.quotient.length), example.quotient, followQuotient),
    numberMatches(number(answers.remainder), example.remainder, results.at(-1)),
  ]);
}

export function normalizeName(value) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
    .replace(/(^|[\s'’-])(\p{L})/gu, (_, separator, letter) => separator + letter.toLocaleUpperCase());
}

export function validName(value) {
  return value.length > 0 && value.length <= 60 && /^\p{L}+(?:[ '\u2019-]\p{L}+)*$/u.test(value);
}
