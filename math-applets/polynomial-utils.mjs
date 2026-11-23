import { parsePolynomial, samePolynomial } from './quadratic-systems/model.mjs';

export function matchesPolynomial(value, expected) {
  const text = String(value).toLowerCase().trim().replace(/[−–]/g, '-').replace(/\s+/g, '')
    .replaceAll('²', '^2').replaceAll('³', '^3').replaceAll('⁴', '^4')
    .replaceAll('⁵', '^5').replaceAll('⁶', '^6').replace(/^\(([^()]+)\)$/, '$1');
  if (expected.length <= 3) return samePolynomial(parsePolynomial(text), expected);
  const terms = text.match(/[+-]?[^+-]+/g);
  if (!terms || terms.join('') !== text) return false;
  const coefficients = Array(expected.length).fill(0);
  for (const term of terms) {
    const variable = /x(?:\^(\d+))?$/.exec(term);
    const degree = variable ? Number(variable[1] || 1) : 0;
    if (degree >= expected.length || (variable && degree === 0)) return false;
    const quadraticTerm = degree > 2 ? term.replace(/x\^\d+$/, 'x^2') : term;
    const parsed = parsePolynomial(quadraticTerm);
    if (!parsed) return false;
    coefficients[expected.length - 1 - degree] += parsed[2 - Math.min(degree, 2)];
  }
  return samePolynomial(coefficients, expected);
}
