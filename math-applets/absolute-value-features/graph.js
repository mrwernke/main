export const graphLimit = 10;

const half = 260;
const plotStart = 20;
const plotEnd = 500;
export const horizontalScale = (min, max) => x => plotStart + (x - min) * (plotEnd - plotStart) / (max - min);
export const verticalScale = limit => y => half - y * (half - plotStart) / limit;
export const xPixel = horizontalScale(-graphLimit, graphLimit);
export const yPixel = verticalScale(graphLimit);

export function svgElement(tag, attributes, content = '') {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = content;
  return element;
}

export function drawGrid(svg, {
  xMin = -graphLimit, xMax = graphLimit, xStep = 2, xGridStep = 1,
  yLimit = graphLimit, yStep = 2, yGridStep = 1,
} = {}) {
  const projectX = horizontalScale(xMin, xMax);
  const projectY = verticalScale(yLimit);
  let grid = '';
  for (let x = xMin; x <= xMax; x += xGridStep) {
    grid += `M ${projectX(x)} ${plotStart} V ${plotEnd} `;
  }
  for (let y = -yLimit; y <= yLimit; y += yGridStep) {
    grid += `M ${plotStart} ${projectY(y)} H ${plotEnd} `;
  }
  svg.append(
    svgElement('path', { d: grid, class: 'grid' }),
    svgElement('path', {
      d: `M ${plotStart} ${half} H ${plotEnd} M ${projectX(0)} ${plotStart} V ${plotEnd}`,
      class: 'axes',
    }),
  );
  for (let x = xMin; x <= xMax; x += xStep) {
    if (x === 0) continue;
    svg.append(
      svgElement('text', {
        x: projectX(x), y: projectY(0) + 16, 'text-anchor': 'middle', class: 'tick',
      }, String(x)),
    );
  }
  for (let y = -yLimit; y <= yLimit; y += yStep) {
    if (y === 0) continue;
    svg.append(
      svgElement('text', {
        x: projectX(0) - 7, y: projectY(y) + 4, 'text-anchor': 'end', class: 'tick',
      }, String(y)),
    );
  }
}

function curveArrow(tip, neighbor) {
  const angle = Math.atan2(tip[1] - neighbor[1], tip[0] - neighbor[0]) * 180 / Math.PI;
  return svgElement('path', {
    d: 'M 1 0 L -11 -6 L -9 0 L -11 6 Z',
    transform: `translate(${tip.join(' ')}) rotate(${angle})`,
    class: 'curve-arrow',
  });
}

export function drawCurve(svg, evaluate, left, right, {
  leftArrow = false, rightArrow = false, projectX = xPixel, projectY = yPixel,
} = {}) {
  const count = Math.max(1, Math.ceil((right - left) / 0.025));
  const points = Array.from({ length: count + 1 }, (_, index) => {
    const x = left + (right - left) * index / count;
    return [projectX(x), projectY(evaluate(x))];
  });
  svg.append(svgElement('polyline', { points: points.map(point => point.join(',')).join(' '), class: 'curve' }));
  if (leftArrow) svg.append(curveArrow(points[0], points[1]));
  if (rightArrow) svg.append(curveArrow(points.at(-1), points.at(-2)));
}

export function drawCurveWithArrows(svg, evaluate, left, right) {
  drawCurve(svg, evaluate, left, right, { leftArrow: true, rightArrow: true });
}
