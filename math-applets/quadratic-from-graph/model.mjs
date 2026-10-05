import { factoredPractice, evaluate, roots } from '../quadratic-graphing/model.mjs';

export const exercises = factoredPractice;

export function markedPoints(item) {
  const [r1, r2] = roots(item);
  const entries = [
    { x: item.h, y: item.k, role: 'Vertex' },
    { x: item.h - 1, y: evaluate(item, item.h - 1), role: 'One unit left' },
    { x: item.h + 1, y: evaluate(item, item.h + 1), role: 'One unit right' },
    { x: 0, y: evaluate(item, 0), role: 'y-intercept' },
    { x: r1, y: 0, role: 'x-intercept' },
    { x: r2, y: 0, role: 'x-intercept' },
  ];
  const points = [];
  entries.forEach(({ x, y, role }) => {
    const existing = points.find(point => point.x === x && point.y === y);
    if (existing) existing.roles.push(role);
    else points.push({ x, y, roles: [role] });
  });
  return points;
}

export function aValueMovement(item) {
  return {
    start: { x: item.h, y: item.k },
    corner: { x: item.h, y: item.k + item.a },
    end: { x: item.h + 1, y: item.k + item.a },
    verticalLabel: `${Math.abs(item.a)} ${Math.abs(item.a) === 1 ? 'unit' : 'units'} ${item.a > 0 ? 'up' : 'down'}`,
    horizontalLabel: '1 unit right',
  };
}

export function factorProduct(r1, r2) {
  const factor = root => root === 0 ? '(x)' : `(x ${root > 0 ? '−' : '+'} ${Math.abs(root)})`;
  return `${factor(r1)}${factor(r2)}`;
}

export function expansion(r1, r2, a) {
  const linear = -(r1 + r2), constant = r1 * r2;
  return {
    topRight: -r1, bottomLeft: -r2, bottomRight: constant,
    linear, constant, a, b: a * linear, c: a * constant,
  };
}

export function parseLinearTerm(value) {
  const text = String(value).trim().replaceAll('−', '-').replace(/\s/g, '');
  if (text === '0') return 0;
  if (!/^[+-]?(?:\d+)?x$/i.test(text)) return NaN;
  const coefficient = text.slice(0, -1);
  if (coefficient === '' || coefficient === '+') return 1;
  if (coefficient === '-') return -1;
  return Number(coefficient);
}

export function signedConstant(value) {
  return `${value < 0 ? '−' : '+'}${Math.abs(value)}`;
}
