import { createCubicExample } from '../polynomial-from-graph/model.mjs?v=20261120p7';

const configurations = [
  { a: -2, roots: [-2, 0, 3], pointX: 1 },
  { a: 1 / 3, roots: [-3, 1, 2], pointX: 0 },
  { a: 1, roots: [-3, 2], multiplicities: { 2: 2 }, pointX: 0 },
  { a: -3 / 2, roots: [-1, 2], multiplicities: { '-1': 2 }, pointX: 1 },
  { a: 2, roots: [2], multiplicities: { 2: 3 }, pointX: 3 },
];

export const examples = configurations.map((configuration, index) => ({
  ...createCubicExample(configuration),
  term: index % 2 === 0 ? 'zero' : 'root',
}));

const naturalList = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
const format = value => String(value).replace('-', '−');

export function problemStatement({ roots, multiplicities, labeledPoint, term }) {
  const conditions = [];
  for (const [power, name] of [[1, 'single'], [2, 'double'], [3, 'triple']]) {
    const values = roots.filter(root => (multiplicities[root] ?? 1) === power).map(format);
    if (values.length === 1) conditions.push(`a ${name} ${term} at x = ${values[0]}`);
    else if (values.length > 1) conditions.push(`${name} ${term}s at x = ${naturalList.format(values)}`);
  }
  const { x, y } = labeledPoint;
  const point = `(${format(x)}, ${format(y)})`;
  conditions.push(x === 0 ? `a y-intercept at ${point}` : `a point at ${point}`);
  return `Write a polynomial function in factored and standard form with ${naturalList.format(conditions)}.`;
}
