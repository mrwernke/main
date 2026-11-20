import { svgElement, xPixel, yPixel } from '../absolute-value-features/graph.js';

const cursorMoves = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] };

export function createPointPicker(plane, dialog, { projectX = xPixel } = {}) {
  const heading = dialog.querySelector('strong');
  const status = dialog.querySelector('.feedback');
  const markLayer = svgElement('g', { 'aria-hidden': 'true' });
  const cursor = svgElement('path', { d: 'M -8 0 H 8 M 0 -8 V 8', class: 'graph-point-cursor' });
  const markedPositions = new Set();
  let selection;
  let cursorX;
  let cursorY;

  function moveCursor(x, y) {
    cursorX = Math.min(500, Math.max(20, x));
    cursorY = Math.min(500, Math.max(20, y));
    cursor.setAttribute('transform', `translate(${cursorX} ${cursorY})`);
  }

  function stop() {
    selection = undefined;
    dialog.close();
    plane.removeAttribute('tabindex');
    plane.removeAttribute('aria-describedby');
    plane.classList.remove('picking-graph-point');
  }

  function rejectPoint(message) {
    status.textContent = message;
    status.className = 'feedback no';
  }

  function selectAt(x, y) {
    if (!selection) return false;
    const { remaining, accepts, wrongMessage, onComplete } = selection;
    if (accepts) {
      if (!accepts(x, y)) {
        rejectPoint(wrongMessage);
        return false;
      }
      stop();
      onComplete();
      return true;
    }
    let nearest;
    let distance = 14;
    for (const point of remaining) {
      const candidate = Math.hypot(projectX(point.x) - x, yPixel(point.y) - y);
      if (candidate <= distance) {
        nearest = point;
        distance = candidate;
      }
    }
    if (!nearest) {
      rejectPoint(wrongMessage);
      return false;
    }

    const { label, labelOffset } = nearest;
    const px = projectX(nearest.x);
    const py = yPixel(nearest.y);
    const position = `${px},${py}`;
    if (!markedPositions.has(position)) {
      markLayer.append(svgElement('circle', { cx: px, cy: py, r: 5, class: 'graph-point-marker' }));
      markedPositions.add(position);
    }
    if (label) {
      markLayer.append(svgElement('text', {
        x: px, y: py + labelOffset, 'text-anchor': 'middle', class: 'graph-point-label',
      }, label));
    }
    remaining.delete(nearest);
    if (remaining.size === 0) {
      stop();
      onComplete();
    } else {
      status.textContent = `${label || 'Point'} marked. Keep looking for the other matching points.`;
      status.className = 'feedback ok';
    }
    return true;
  }

  plane.addEventListener('click', event => {
    if (!selection) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(plane.getScreenCTM().inverse());
    selectAt(point.x, point.y);
  });

  plane.addEventListener('keydown', event => {
    if (!selection) return;
    const move = cursorMoves[event.key];
    if (move || event.key === 'Enter' || event.key === ' ') event.preventDefault();
    if (move) moveCursor(cursorX + move[0], cursorY + move[1]);
    if (event.key === 'Enter' || event.key === ' ') selectAt(cursorX, cursorY);
  });

  return {
    get active() { return Boolean(selection); },
    selectAt,
    reset() {
      stop();
      markLayer.replaceChildren();
      markedPositions.clear();
      plane.append(markLayer, cursor);
    },
    start({ title, targets, accepts, startX = 0, wrongMessage, onComplete }) {
      selection = { remaining: new Set(targets), accepts, wrongMessage, onComplete };
      heading.textContent = title;
      status.textContent = '';
      status.className = 'feedback';
      plane.tabIndex = 0;
      plane.classList.add('picking-graph-point');
      plane.setAttribute('aria-describedby', `${heading.id} ${status.id}`);
      moveCursor(projectX(startX), yPixel(0));
      dialog.show();
      plane.focus();
    },
  };
}
