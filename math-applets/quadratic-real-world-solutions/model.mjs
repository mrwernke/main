export const examples = [
  {
    title: 'Ball tossed from a platform',
    scenario: 'A ball is tossed upward from a platform 6.2 feet above the ground at 9.1 feet per second. When does it reach the ground?',
    model: 'h(x) = −16x² + 9.1x + 6.2',
    targetLabel: 'height', targetValue: 0,
    xMeaning: 'time after the toss, in seconds',
    answerLead: 'The ball reaches the ground after', answerUnit: 'seconds',
    a: -16, b: 9.1, c: 6.2, validBranches: ['minus'],
  },
  {
    title: 'Ticket revenue',
    scenario: 'A small venue estimates that it will sell 140 − 3.7x tickets when a ticket costs x dollars. Its revenue model is shown below. What ticket price(s) make the revenue $0?',
    model: 'R(x) = −3.7x² + 140x',
    targetLabel: 'revenue', targetValue: 0,
    xMeaning: 'the ticket price, in dollars',
    answerLead: 'The ticket prices that produce $0 revenue are', answerUnit: 'dollars',
    a: -3.7, b: 140, c: 0, validBranches: ['plus', 'minus'],
  },
  {
    title: 'A ball reaches a target height',
    scenario: 'A ball is hit upward from 1.8 meters above the ground. It reaches a height of 5.6 meters twice, once on the way up and once on the way down. At what times is it at that height?',
    model: 'h(x) = −4.9x² + 12.6x + 1.8',
    targetLabel: 'height', targetValue: 5.6,
    xMeaning: 'time after the ball is hit, in seconds',
    answerLead: 'The ball reaches 5.6 meters at', answerUnit: 'seconds',
    a: -4.9, b: 12.6, c: 1.8, validBranches: ['plus', 'minus'],
  },
  {
    title: 'Fundraiser break-even point',
    scenario: 'A community fundraiser received a sponsor grant before selling any tickets. Its net-profit model is shown below. At what sales level does it break even?',
    model: 'P(x) = −1.6x² + 27.3x + 13.2',
    targetLabel: 'profit', targetValue: 0,
    xMeaning: 'hundreds of tickets sold',
    answerLead: 'The fundraiser breaks even at', answerUnit: 'hundreds of tickets sold',
    a: -1.6, b: 27.3, c: 13.2, validBranches: ['minus'],
  },
  {
    title: 'A package dropped from a platform',
    scenario: 'A package is released from a platform 28 feet above the ground with a small downward push. When does it reach the ground?',
    model: 'h(x) = −16x² − 1.7x + 28',
    targetLabel: 'height', targetValue: 0,
    xMeaning: 'time after release, in seconds',
    answerLead: 'The package reaches the ground after', answerUnit: 'seconds',
    a: -16, b: -1.7, c: 28, validBranches: ['minus'],
  },
  {
    title: 'Pop-up venue break-even points',
    scenario: 'A pop-up venue models its net profit as ticket sales change. The venue breaks even when its profit is zero. At what sales levels does that happen?',
    model: 'P(x) = −0.9x² + 15.2x − 27.6',
    targetLabel: 'profit', targetValue: 0,
    xMeaning: 'hundreds of ticket bundles sold',
    answerLead: 'The venue breaks even at', answerUnit: 'hundreds of ticket bundles sold',
    a: -0.9, b: 15.2, c: -27.6, validBranches: ['plus', 'minus'],
  },
  {
    title: 'A firework passes a display height',
    scenario: 'A firework rises from a launch stand 2 meters above the ground. At what times is it 14 meters above the ground?',
    model: 'h(x) = −4.9x² + 22.4x + 2',
    targetLabel: 'height', targetValue: 14,
    xMeaning: 'time after launch, in seconds',
    answerLead: 'The firework reaches 14 meters at', answerUnit: 'seconds',
    a: -4.9, b: 22.4, c: 2, validBranches: ['plus', 'minus'],
  },
  {
    title: 'A rock thrown from a cliff',
    scenario: 'A rock is thrown downward from a 31-foot cliff. When does it reach the ground?',
    model: 'h(x) = −16x² − 3.6x + 31',
    targetLabel: 'height', targetValue: 0,
    xMeaning: 'time after the throw, in seconds',
    answerLead: 'The rock reaches the ground after', answerUnit: 'seconds',
    a: -16, b: -3.6, c: 31, validBranches: ['minus'],
  },
];

export function resultingConstant(problem) {
  return problem.c - problem.targetValue;
}

export function discriminant(problem) {
  return problem.b ** 2 - 4 * problem.a * resultingConstant(problem);
}

export function roundedSquareRoot(problem) {
  return Number(Math.sqrt(discriminant(problem)).toFixed(4));
}

export function roundedSolutions(problem) {
  const squareRoot = roundedSquareRoot(problem);
  const denominator = 2 * problem.a;
  return {
    plus: Number(((-problem.b + squareRoot) / denominator).toFixed(2)),
    minus: Number(((-problem.b - squareRoot) / denominator).toFixed(2)),
  };
}

export function formatDecimal(value, places) {
  return Number(value).toFixed(places);
}
