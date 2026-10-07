// Absolute value equations of the form a|bx + c| + d = e with integer solutions.
const MINUS = '\u2212';

export const guidedProblems = [
  { a: 3, b: 1, c: -2, d: 4, e: 19 },
  { a: 2, b: 1, c: 5, d: -3, e: 11 },
  { a: 4, b: 2, c: -6, d: 5, e: 21 },
];

export const challengeProblems = [
  { a: 5, b: 1, c: 1, d: -2, e: 18 },
  { a: 2, b: 1, c: -7, d: 3, e: 13 },
  { a: 3, b: 2, c: 4, d: -1, e: 11 },
];

const signed = value => `${value < 0 ? MINUS : '+'} ${Math.abs(value)}`;
export const formatNumber = value => value < 0 ? `${MINUS}${Math.abs(value)}` : String(value);

export const insideText = ({ b, c }) => `${b === 1 ? '' : b}x ${signed(c)}`;
export const flippedInsideText = ({ b, c }) => `${b === 1 ? '' : b}x ${signed(-c)}`;
export const fullLeftText = problem => `${problem.a}|${insideText(problem)}| ${signed(problem.d)}`;
export const scaledAbsText = problem => `${problem.a}|${insideText(problem)}|`;
export const absText = problem => `|${insideText(problem)}|`;
export const equationText = problem => `${fullLeftText(problem)} = ${problem.e}`;

export const isolatedValue = problem => (problem.e - problem.d) / problem.a;
export const afterConstant = problem => problem.e - problem.d;
export const constantOpText = problem => problem.d > 0 ? `${MINUS}${problem.d}` : `+${Math.abs(problem.d)}`;
export const branchText = (problem, sign) => `${insideText(problem)} = ${sign > 0 ? '+' : MINUS}${isolatedValue(problem)}`;

// First solution comes from the +m branch, second from the -m branch.
export const solutions = problem => [
  (isolatedValue(problem) - problem.c) / problem.b,
  (-isolatedValue(problem) - problem.c) / problem.b,
];

export const constantStepLabel = problem => problem.d > 0 ? `Subtract ${problem.d}` : `Add ${Math.abs(problem.d)}`;
export const divideStepLabel = problem => `Divide by ${problem.a}`;

export function stepChoices(problem) {
  return [
    { id: 'distribute', label: `Distribute the ${problem.a}` },
    { id: 'divide', label: divideStepLabel(problem) },
    { id: 'inside', label: problem.c > 0 ? `Subtract ${problem.c}` : `Add ${Math.abs(problem.c)}` },
    { id: 'constant', label: constantStepLabel(problem) },
    { id: 'flip', label: `Make ${insideText(problem)} become ${flippedInsideText(problem)}` },
  ];
}

export function absChoices(problem) {
  const m = isolatedValue(problem);
  return [
    { id: 'ignore', label: 'Ignore it and solve' },
    { id: 'flip-inside', label: 'Change the signs inside the absolute value' },
    { id: 'negate-other', label: `Change the sign on the opposite side to ${MINUS}${m}` },
    { id: 'two-equations', label: `Write two equations equal to +${m} and ${MINUS}${m}` },
  ];
}

export function parseInteger(text) {
  const cleaned = String(text ?? '').trim().replace(/\u2212/g, '-');
  return /^[+-]?\d+$/.test(cleaned) ? Number(cleaned) : null;
}
