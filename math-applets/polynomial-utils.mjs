import { parsePolynomial, samePolynomial } from './quadratic-systems/model.mjs';

export function parsePolynomialCoefficients(value, length) {
  const text = String(value).toLowerCase().trim().replace(/[−–]/g, '-').replace(/\s+/g, '')
    .replaceAll('²', '^2').replaceAll('³', '^3').replaceAll('⁴', '^4')
    .replaceAll('⁵', '^5').replaceAll('⁶', '^6').replace(/^\(([^()]+)\)$/, '$1');
  if (length <= 3) {
    const parsed = parsePolynomial(text);
    if (!parsed || parsed.slice(0, 3 - length).some(coefficient => coefficient !== 0)) return null;
    return parsed.slice(3 - length);
  }
  const terms = text.match(/[+-]?[^+-]+/g);
  if (!terms || terms.join('') !== text) return null;
  const coefficients = Array(length).fill(0);
  for (const term of terms) {
    const variable = /x(?:\^(\d+))?$/.exec(term);
    const degree = variable ? Number(variable[1] || 1) : 0;
    if (degree >= length || (variable && degree === 0)) return null;
    const quadraticTerm = degree > 2 ? term.replace(/x\^\d+$/, 'x^2') : term;
    const parsed = parsePolynomial(quadraticTerm);
    if (!parsed) return null;
    coefficients[length - 1 - degree] += parsed[2 - Math.min(degree, 2)];
  }
  return coefficients;
}

export function matchesPolynomial(value, expected) {
  return samePolynomial(parsePolynomialCoefficients(value, expected.length), expected);
}
