export const examples = [
  {
    title: 'A neighborhood food stand',
    story: 'A neighborhood food stand tracks its profit compared with breaking even as the number of hours it is open changes. At the start, it is already making a profit. The profit drops to its lowest point exactly at break-even, then rises again.',
    equation: 'y = x² − 4x + 4', a: 1, h: 2, k: 0,
    xMeaning: 'hours the stand is open',
    yMeaning: 'profit relative to breaking even, in dollars',
    zeroMeaning: 'the stand is breaking even',
    yIntercept: 'positive', opening: 'up', vertex: 'on',
  },
  {
    title: 'A practice soccer kick',
    story: 'A player kicks a soccer ball from ground level. The ball rises, reaches its highest point above the ground, and then comes back down.',
    equation: 'y = −x² + 4x', a: -1, h: 2, k: 4,
    xMeaning: 'time after the kick, in seconds',
    yMeaning: 'height relative to the ground, in feet',
    zeroMeaning: 'the ball is at ground level',
    yIntercept: 'zero', opening: 'down', vertex: 'above',
  },
  {
    title: 'Temperature during a cold snap',
    story: 'A town records temperature relative to freezing. At the beginning of the time period, it is below freezing. It gets colder until it reaches its lowest temperature, which is still below freezing, and then it warms up.',
    equation: 'y = x² − 2x − 3', a: 1, h: 1, k: -4,
    xMeaning: 'hours after the forecast begins',
    yMeaning: 'temperature relative to freezing, in degrees',
    zeroMeaning: 'the temperature is at freezing',
    yIntercept: 'negative', opening: 'up', vertex: 'below',
  },
  {
    title: 'A skateboarder in a half-pipe',
    story: 'A skateboarder moves through a half-pipe. The rider starts above the rim-level reference line, drops to a lowest point below that line, and then rises again.',
    equation: 'y = ½x² − 2x + 1', a: 0.5, h: 2, k: -1,
    xMeaning: 'horizontal distance from the start, in meters',
    yMeaning: 'height relative to the half-pipe rim, in meters',
    zeroMeaning: 'the rider is level with the rim',
    yIntercept: 'positive', opening: 'up', vertex: 'below',
  },
  {
    title: 'A cart on a test track',
    story: 'A small cart starts at the track’s reference elevation, rolls down into a dip below that level, and then climbs back up.',
    equation: 'y = x² − 4x', a: 1, h: 2, k: -4,
    xMeaning: 'distance along the track, in meters',
    yMeaning: 'height relative to the reference elevation, in meters',
    zeroMeaning: 'the cart is level with the reference elevation',
    yIntercept: 'zero', opening: 'up', vertex: 'below',
  },
  {
    title: 'An equipment calibration',
    story: 'A machine measures its performance difference from an ideal setting. At the ideal setting (x = 0), the difference is zero. Moving the control either way makes the result lower, so the highest value is zero.',
    equation: 'y = −x²', a: -1, h: 0, k: 0,
    xMeaning: 'control adjustment from the ideal setting',
    yMeaning: 'performance difference from the ideal setting, in points',
    zeroMeaning: 'the machine is performing exactly at its ideal setting',
    yIntercept: 'zero', opening: 'down', vertex: 'on',
  },
  {
    title: 'A summer festival',
    story: 'A festival tracks attendance above its usual level. At the beginning, attendance is already above usual. It grows to a highest point that remains above usual, then declines.',
    equation: 'y = −x² + 2x + 3', a: -1, h: 1, k: 4,
    xMeaning: 'hours after the festival opens',
    yMeaning: 'attendance relative to the usual level, in people',
    zeroMeaning: 'attendance is at its usual level',
    yIntercept: 'positive', opening: 'down', vertex: 'above',
  },
  {
    title: 'A machine setting',
    story: 'A machine measures the size of its error from a target setting. At the target setting, the error is zero. Moving the control either way makes the error grow, so its smallest value is zero.',
    equation: 'y = x²', a: 1, h: 0, k: 0,
    xMeaning: 'control adjustment from the target setting',
    yMeaning: 'size of the machine’s error, in millimeters',
    zeroMeaning: 'the machine is exactly on target',
    yIntercept: 'zero', opening: 'up', vertex: 'on',
  },
  {
    title: 'A pond level',
    story: 'A pond tracks its water level relative to a painted marker. It begins below the marker, rises to its highest level exactly at the marker, and then falls below it again.',
    equation: 'y = −x² + 4x − 4', a: -1, h: 2, k: 0,
    xMeaning: 'hours after the observation begins',
    yMeaning: 'water level relative to the marker, in inches',
    zeroMeaning: 'the water is level with the marker',
    yIntercept: 'negative', opening: 'down', vertex: 'on',
  },
  {
    title: 'A temperature shift',
    story: 'A weather station tracks temperature relative to its usual value. It begins below usual, warms to its highest point above usual, and then cools.',
    equation: 'y = −x² + 4x − 1', a: -1, h: 2, k: 3,
    xMeaning: 'hours after the reading begins',
    yMeaning: 'temperature relative to its usual value, in degrees',
    zeroMeaning: 'the temperature is at its usual value',
    yIntercept: 'negative', opening: 'down', vertex: 'above',
  },
  {
    title: 'A delivery service',
    story: 'A delivery service tracks its weekly result relative to breaking even. It starts below break-even, improves to its best result, but even that highest point is still below break-even. Afterward, the result falls again.',
    equation: 'y = −x² + 2x − 2', a: -1, h: 1, k: -1,
    xMeaning: 'weeks since the service began',
    yMeaning: 'weekly result relative to breaking even, in dollars',
    zeroMeaning: 'the service is breaking even',
    yIntercept: 'negative', opening: 'down', vertex: 'below',
  },
  {
    title: 'A greenhouse sensor',
    story: 'A greenhouse measures its temperature above a minimum safety level. At the beginning, it is above that level. The temperature falls to a lowest point that remains above the safety level, then rises again.',
    equation: 'y = x² − 4x + 6', a: 1, h: 2, k: 2,
    xMeaning: 'hours after the sensor starts recording',
    yMeaning: 'temperature relative to the safety level, in degrees',
    zeroMeaning: 'the temperature is exactly at the safety level',
    yIntercept: 'positive', opening: 'up', vertex: 'above',
  },
];

export const yInterceptChoices = [
  { value: 'positive', label: '+#', description: 'positive y-intercept' },
  { value: 'zero', label: '0', description: 'zero y-intercept' },
  { value: 'negative', label: '−#', description: 'negative y-intercept' },
];

export const openingChoices = [
  { value: 'up', label: 'Opens up' },
  { value: 'down', label: 'Opens down' },
];

export const vertexChoices = [
  { value: 'above', label: 'Above the x-axis' },
  { value: 'on', label: 'On the x-axis' },
  { value: 'below', label: 'Below the x-axis' },
];

const verticalValue = { above: 1, on: 0, below: -1 };
const sign = value => value > 1e-9 ? 'positive' : value < -1e-9 ? 'negative' : 'zero';

export function sketchParameters(spec) {
  if ([spec.a, spec.h, spec.k].every(Number.isFinite)) {
    return { a: spec.a, h: spec.h, k: spec.k };
  }

  const k = verticalValue[spec.vertex];
  const direction = spec.opening === 'up' ? 1 : -1;
  const magnitudes = [0.25, 0.5, 0.75, 1];
  const positions = [0, 1, -1, 1.5, -1.5, 2, -2];
  const candidates = [];

  for (const magnitude of magnitudes) {
    for (const h of positions) {
      const a = direction * magnitude;
      const intercept = a * h ** 2 + k;
      if (sign(intercept) !== spec.yIntercept) continue;
      const edgeValues = [-3, 3].map(x => a * (x - h) ** 2 + k);
      const overflow = edgeValues.reduce((total, value) => total + Math.max(0, Math.abs(value) - 2.8), 0);
      const smallInterceptPenalty = spec.yIntercept !== 'zero' && Math.abs(intercept) < 0.55 ? 2 : 0;
      const centerPenalty = h === 0 && !(spec.vertex === 'on' && spec.yIntercept === 'zero') ? 1 : 0;
      const score = Math.abs(magnitude - 0.4) + Math.abs(Math.abs(h) - 1.4) * 0.08
        + overflow * 0.4 + smallInterceptPenalty + centerPenalty;
      candidates.push({ a, h, k, score });
    }
  }

  candidates.sort((left, right) => left.score - right.score);
  return candidates[0] ?? { a: direction * 0.5, h: 0, k };
}

export function validSketches() {
  return [
    { opening: 'up', vertex: 'above', yIntercept: 'positive' },
    { opening: 'up', vertex: 'on', yIntercept: 'positive' },
    { opening: 'up', vertex: 'on', yIntercept: 'zero' },
    { opening: 'up', vertex: 'below', yIntercept: 'positive' },
    { opening: 'up', vertex: 'below', yIntercept: 'zero' },
    { opening: 'up', vertex: 'below', yIntercept: 'negative' },
    { opening: 'down', vertex: 'above', yIntercept: 'positive' },
    { opening: 'down', vertex: 'above', yIntercept: 'zero' },
    { opening: 'down', vertex: 'above', yIntercept: 'negative' },
    { opening: 'down', vertex: 'on', yIntercept: 'zero' },
    { opening: 'down', vertex: 'on', yIntercept: 'negative' },
    { opening: 'down', vertex: 'below', yIntercept: 'negative' },
  ];
}

export function sameSketch(left, right) {
  return left.yIntercept === right.yIntercept
    && left.opening === right.opening
    && left.vertex === right.vertex;
}
