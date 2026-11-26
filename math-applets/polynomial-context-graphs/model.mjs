import { parseNumber } from '../quadratic-graphing/model.mjs';

export const problems = [
  {
    title: 'Diffuser reservoir',
    scenario: 'A scent diffuser is refilled and used during an 8-minute demonstration. The graph shows the amount of oil in its reservoir.',
    xLabel: 'Time (minutes)', xUnit: 'minutes',
    yLabel: 'Oil (fluid ounces)', yUnit: 'fluid ounces', ySubject: 'the amount of oil',
    xScale: 2, xOffset: 0.5, yScale: 8, yOffset: 0, shape: 'cubic', reflect: false,
    xMax: 8, yMin: 0, yMax: 90, xStep: 1, yStep: 10, labelPoints: true,
    xIntercepts: [5], yIntercept: 25,
    globalMax: { value: 81, times: [8] }, globalMin: { value: 0, times: [5] },
    localMax: [1], localMin: [5], directionTime: 3, trend: 'decreasing',
    degree: 3, leading: 1, leftEnd: -1, rightEnd: 1,
  },
  {
    title: 'Curing chamber',
    scenario: 'A curing chamber is warmed and cooled during a 12-hour process. The graph shows its temperature above room temperature.',
    xLabel: 'Time (hours)', xUnit: 'hours',
    yLabel: 'Temperature above room (°C)', yUnit: '°C', ySubject: 'the temperature above room temperature',
    xScale: 2, xOffset: -1, yScale: 3, yOffset: 0, shape: 'cubic', reflect: true,
    xMax: 12, yMin: 0, yMax: 120, xStep: 2, yStep: 12,
    xIntercepts: [12], yIntercept: 108,
    globalMax: { value: 108, times: [0] }, globalMin: { value: 0, times: [12] },
    localMax: [8], localMin: [4], directionTime: 6, trend: 'increasing',
    degree: 3, leading: -1, leftEnd: 1, rightEnd: -1,
  },
  {
    title: 'Market stall balance',
    scenario: 'A market stall tracks its cumulative profit or loss over 18 months. Negative values represent a loss.',
    xLabel: 'Time (months)', xUnit: 'months',
    yLabel: 'Profit or loss (dollars)', yUnit: 'dollars', ySubject: 'the cumulative profit or loss',
    xScale: 1, xOffset: 0, shape: 'market', rounded: true,
    xMax: 18, yMin: -1200, yMax: 600, xStep: 2, yStep: 200, labelPoints: true,
    xIntercepts: [1, 16], yIntercept: -1103.8,
    globalMax: { value: 511.2, times: [10] }, globalMin: { value: -1103.8, times: [0] },
    localMax: [3, 10], localMin: [6, 16], directionTime: 8, trend: 'increasing',
    degree: 7, leading: 1, leftEnd: -1, rightEnd: 1,
  },
  {
    title: 'Workshop motor',
    scenario: 'A workshop motor runs through a 25-minute test with changing power settings. The graph shows its power output.',
    xLabel: 'Time (minutes)', xUnit: 'minutes',
    yLabel: 'Power (kilowatts)', yUnit: 'kilowatts', ySubject: 'the motor’s power output',
    xScale: 5, xOffset: 0, yScale: 1, yOffset: 64, shape: 'quartic', reflect: false,
    xMax: 25, yMin: 0, yMax: 72, xStep: 5, yStep: 8, labelPoints: true,
    xIntercepts: [20], yIntercept: 64,
    globalMax: { value: 64, times: [0] }, globalMin: { value: 0, times: [20] },
    localMax: [10], localMin: [5, 20], directionTime: 2, trend: 'decreasing',
    degree: 4, leading: 1, leftEnd: 1, rightEnd: 1,
  },
  {
    title: 'Sound rehearsal',
    scenario: 'During an 18-minute rehearsal, a sensor records the sound level above the room’s background level. The graph shows that difference.',
    xLabel: 'Time (minutes)', xUnit: 'minutes',
    yLabel: 'Above background (decibels)', yUnit: 'decibels', ySubject: 'the sound level above background',
    xScale: 1, xOffset: 0, shape: 'sound', rounded: true,
    xMax: 18, yMin: 0, yMax: 50, xStep: 2, yStep: 5, labelPoints: true,
    xIntercepts: [18], yIntercept: 16.2,
    globalMax: { value: 45.7, times: [15] }, globalMin: { value: 0, times: [18] },
    localMax: [2, 15], localMin: [8], directionTime: 10, trend: 'increasing',
    degree: 4, leading: -1, leftEnd: -1, rightEnd: -1,
  },
  {
    title: 'Cold storage target',
    scenario: 'A cold storage room is monitored for 12 hours. The graph shows its temperature relative to a target; negative values mean it is below the target.',
    xLabel: 'Time (hours)', xUnit: 'hours',
    yLabel: 'Temperature relative to target (°C)', yUnit: '°C', ySubject: 'the temperature relative to the target',
    xScale: 2, xOffset: -1, yScale: 1, yOffset: 0, shape: 'cubic', reflect: false,
    xMax: 12, yMin: -16, yMax: 20, xStep: 2, yStep: 4,
    xIntercepts: [2, 8], yIntercept: -16,
    globalMax: { value: 20, times: [12] }, globalMin: { value: -16, times: [0] },
    localMax: [4], localMin: [8], directionTime: 6, trend: 'decreasing',
    degree: 3, leading: 1, leftEnd: -1, rightEnd: 1,
  },
  {
    title: 'Reservoir water level',
    scenario: 'A reservoir is monitored for 11 weeks. The graph shows water level relative to a reference level; negative values mean the water is below that level.',
    xLabel: 'Time (weeks)', xUnit: 'weeks',
    yLabel: 'Level relative to reference (mm)', yUnit: 'millimeters', ySubject: 'the water level relative to the reference',
    xScale: 1, xOffset: 0, shape: 'sextic', rounded: true,
    xMax: 11, yMin: -200, yMax: 1000, xStep: 1, yStep: 100, labelPoints: true,
    xIntercepts: [1, 5, 7], yIntercept: 777.3,
    globalMax: { value: 880.7, times: [9.71104328] }, globalMin: { value: -142.9, times: [6.03556034] },
    localMax: [3.03830816, 9.71104328], localMin: [1, 6.03556034], directionTime: 4, trend: 'decreasing',
    degree: 6, leading: 1, leftEnd: 1, rightEnd: 1,
  },
  {
    title: 'Weekly business profit',
    scenario: 'A business tracks its weekly profit over 12 weeks, in thousands of dollars. Negative values represent a weekly loss.',
    xLabel: 'Time (weeks)', xUnit: 'weeks',
    yLabel: 'Weekly profit (thousands of dollars)', yUnit: 'thousand dollars', ySubject: 'the weekly profit',
    xScale: 1, xOffset: 0, shape: 'business', rounded: true,
    xMax: 12, yMin: -200, yMax: 250, xStep: 1, yStep: 25, labelPoints: true,
    pointLabelOffsets: {
      2.5: [-7, 18, 'end'], 3.5: [7, 18, 'start'],
      7: [-7, 18, 'end'], 7.5: [0, -12, 'middle'], 8: [7, 18, 'start'],
      9.3: [0, 20, 'middle'], 11: [7, -10, 'start'],
    },
    xIntercepts: [0.5, 2.5, 3.5, 7, 8, 11], yIntercept: -163,
    globalMax: { value: 213.6, times: [12] }, globalMin: { value: -163, times: [0] },
    localMax: [0.5, 2.997048386999, 7.485534462711],
    localMin: [1.455254279025, 5.158409497049, 9.292642263104],
    directionTime: 4, trend: 'decreasing',
    degree: 9, leading: 1, leftEnd: -1, rightEnd: 1,
  },
  {
    title: 'Distance from home on a run',
    scenario: 'A runner starts about 2.1 kilometers from home and runs for 150 minutes. The graph shows the runner’s distance from home.',
    xLabel: 'Time (minutes)', xUnit: 'minutes',
    yLabel: 'Distance from home (kilometers)', yUnit: 'kilometers', ySubject: 'the distance from home',
    xScale: 10, xOffset: 0, shape: 'run', rounded: true,
    xMax: 150, yMin: 0, yMax: 2.5, xStep: 10, yStep: 0.5, labelPoints: true,
    xIntercepts: [140], yIntercept: 2.1,
    globalMax: { value: 2.1, times: [0] }, globalMin: { value: 0, times: [140] },
    localMax: [17.122072913434, 57.015306573931, 113.884870930094],
    localMin: [6.247125389053, 35.590382152323, 84.988277343058, 140],
    directionTime: 45, trend: 'increasing',
    degree: 10, leading: 1, leftEnd: 1, rightEnd: 1,
  },
];

export function evaluate(problem, x) {
  const t = x / problem.xScale + problem.xOffset;
  if (problem.shape === 'business') {
    return (t - 0.5) ** 2 * (t - 2.5) * (t - 3.5) * (t - 7) * (t - 8) * (t - 11) ** 3 / 1000;
  }
  if (problem.shape === 'run') {
    return (t - 14) ** 2 * ((t - 0.5) ** 2 + 0.2) * ((t - 3.5) ** 2 + 1) * ((t - 8.5) ** 2 + 0.2) * ((t - 15) ** 2 + 8) / 9523220.265;
  }
  if (problem.shape === 'market') {
    return (t - 1) * (t - 16) ** 2 * ((((70369 * t - 2923621) * t + 54899352) * t - 403839972) * t + 1211810976) / 281054880;
  }
  if (problem.shape === 'sound') {
    return (((-3 * t / 160 + 5 / 8) * t - 249 / 40) * t + 18) * t + 81 / 5;
  }
  if (problem.shape === 'sextic') {
    return (t - 1) ** 2 * (t - 5) * (t - 7) * (0.15 * (t - 11) ** 2 - 0.35 * (t - 11) + 5 / 24);
  }
  const base = problem.shape === 'cubic'
    ? t * (t - 3) ** 2
    : ((3 * t - 28) * t + 84) * t ** 2 - 96 * t;
  const value = problem.reflect ? 20 - base : base;
  return problem.yScale * value + problem.yOffset;
}

export function displayValue(problem, value) {
  return problem.rounded ? Math.round(value * 10) / 10 : value;
}

export function localExtrema(problem) {
  const turns = [...problem.localMax, ...problem.localMin].sort((a, b) => a - b);
  const maxima = [...problem.localMax];
  const minima = [...problem.localMin];
  const leftNeighbor = (turns[0] ?? problem.xMax) / 2;
  const rightNeighbor = ((turns[turns.length - 1] ?? 0) + problem.xMax) / 2;
  for (const [endpoint, neighbor] of [[0, leftNeighbor], [problem.xMax, rightNeighbor]]) {
    const difference = evaluate(problem, endpoint) - evaluate(problem, neighbor);
    if (difference > 0) maxima.push(endpoint);
    if (difference < 0) minima.push(endpoint);
  }
  const globalTimes = new Set([...problem.globalMax.times, ...problem.globalMin.times]);
  const nonGlobal = times => times.filter(x => !globalTimes.has(x)).sort((a, b) => a - b);
  return { maxima: nonGlobal(maxima), minima: nonGlobal(minima) };
}

export function minimumDegree(problem) {
  const degree = problem.localMax.length + problem.localMin.length + 1;
  const evenEnds = problem.leftEnd === problem.rightEnd;
  return degree + (degree % 2 === (evenEnds ? 0 : 1) ? 0 : 1);
}

export function checkList(entries, expected) {
  const values = entries.map(parseNumber);
  if (values.some(value => !Number.isFinite(value)) || values.length !== expected.length) return false;
  values.sort((a, b) => a - b);
  const sortedExpected = [...expected].sort((a, b) => a - b);
  return values.every((value, index) => value === sortedExpected[index]);
}

export function checkPoints(entries, expected) {
  if (entries.length !== expected.length) return false;
  const remaining = expected.map(point => [...point]);
  return entries.every(entry => {
    if (entry.length !== 2) return false;
    const [x, y] = entry.map(parseNumber);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    const index = remaining.findIndex(point => point[0] === x && point[1] === y);
    if (index < 0) return false;
    remaining.splice(index, 1);
    return true;
  });
}

export function formatList(values) {
  const items = values.map(String);
  if (items.length === 0) return 'none';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(' and ');
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}
