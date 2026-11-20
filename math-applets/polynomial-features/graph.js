import { drawCurveWithArrows, drawGrid, graphLimit, svgElement } from '../absolute-value-features/graph.js';

function tailEndpoint(evaluate, root, outer, direction, yLimit) {
  if (direction * evaluate(outer) <= yLimit) return outer;
  for (let step = 0; step < 32; step++) {
    const mid = (root + outer) / 2;
    if (direction * evaluate(mid) < yLimit) root = mid;
    else outer = mid;
  }
  return (root + outer) / 2;
}

export function polynomialTails({ roots, evaluate, leftEnd, rightEnd }, {
  xMin = -graphLimit, xMax = graphLimit, yLimit = graphLimit,
} = {}) {
  return [
    tailEndpoint(evaluate, roots[0], xMin, leftEnd, yLimit),
    tailEndpoint(evaluate, roots.at(-1), xMax, rightEnd, yLimit),
  ];
}

export function drawPolynomialGraph(plane, problem) {
  const { evaluate, leftEnd, rightEnd } = problem;
  const endWord = sign => sign > 0 ? 'rises' : 'falls';
  plane.replaceChildren(
    svgElement('title', { id: 'graph-title' }, 'Polynomial on a coordinate plane'),
    svgElement('desc', { id: 'graph-description' },
      `The left end ${endWord(leftEnd)} and the right end ${endWord(rightEnd)}.`),
  );
  drawGrid(plane);
  const [left, right] = polynomialTails(problem);
  drawCurveWithArrows(plane, evaluate, left, right);
}
