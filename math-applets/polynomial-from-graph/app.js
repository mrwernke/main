import { drawCurve, drawGrid, horizontalScale, svgElement, verticalScale } from '../absolute-value-features/graph.js?v=20261120p6g';
import { polynomialTails } from '../polynomial-features/graph.js?v=20261120p6';
import { examples } from './model.mjs?v=20261120p7';
import { mountPolynomialPractice } from './workflow.js?v=20261120p7';

const graph = document.querySelector('#plane');

function drawGraph(example) {
  const { labeledPoint, roots, evaluate, bounds, multiplicities } = example;
  const projectX = horizontalScale(bounds.xMin, bounds.xMax);
  const projectY = verticalScale(bounds.yLimit);
  const crossings = roots.filter(root => (multiplicities[root] ?? 1) === 1);
  const touches = roots.filter(root => multiplicities[root] === 2);
  const flattened = roots.filter(root => multiplicities[root] === 3);
  const graphDescription = [
    crossings.length ? `The curve crosses the x-axis at ${crossings.join(', ')}.` : '',
    touches.length ? `The curve touches the x-axis and turns at ${touches.join(', ')}.` : '',
    flattened.length ? `The curve flattens as it crosses the x-axis at ${flattened.join(', ')}.` : '',
    `The labeled point is (${labeledPoint.x}, ${labeledPoint.y}).`,
  ].filter(Boolean).join(' ');
  graph.replaceChildren(
    svgElement('title', { id: 'graph-title' }, 'Polynomial on a coordinate plane'),
    svgElement('desc', { id: 'graph-description' }, graphDescription),
  );
  drawGrid(graph, bounds);
  const [left, right] = polynomialTails(example, bounds);
  drawCurve(graph, evaluate, left, right, { projectX, projectY, leftArrow: true, rightArrow: true });
  const x = projectX(labeledPoint.x), y = projectY(labeledPoint.y);
  graph.append(
    svgElement('circle', { cx: x, cy: y, r: 5, class: 'p6-point' }),
    svgElement('text', { x: x + 10, y: y - 8, class: 'p6-point-label' }, `(${labeledPoint.x}, ${labeledPoint.y})`),
  );
}

mountPolynomialPractice({ examples, renderExample: drawGraph });
