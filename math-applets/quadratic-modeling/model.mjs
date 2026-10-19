export const categories = [
  {
    id: 'vertex-point',
    label: 'Vertex and a point',
    primaryKind: 'vertex',
    form: 'vertex',
    examples: [
      {
        title: 'Wetland frog population',
        story: 'A conservation team models the frog population after restoring a wetland. The population reaches a maximum of 50 thousand frogs after 5 years. After 3 years, it is 42 thousand frogs.',
        symbol: 'P', variable: 't', functionInfo: 'P(t) is the frog population', inputInfo: 't is time in years', outputInfo: 'P(t) is measured in thousands of frogs', unitNote: 'Enter population values in thousands: 50 means 50,000 frogs.',
        primary: { kind: 'vertex', x: 5, y: 50 },
        other: { kind: 'point', x: 3, y: 42 },
      },
      {
        title: 'Workshop operating cost',
        story: 'A workshop models its monthly operating cost based on production. Its minimum cost is $10,000 when 3 hundred items are made. At 5 hundred items, the cost is $18,000.',
        symbol: 'C', variable: 'x', functionInfo: 'C(x) is monthly operating cost', inputInfo: 'x is the number of hundreds of items', outputInfo: 'C(x) is measured in thousands of dollars', unitNote: 'Enter cost values in thousands: 10 means $10,000.',
        primary: { kind: 'vertex', x: 3, y: 10 },
        other: { kind: 'point', x: 5, y: 18 },
      },
    ],
  },
  {
    id: 'vertex-x-intercept',
    label: 'Vertex and an x-intercept',
    primaryKind: 'vertex',
    form: 'vertex',
    examples: [
      {
        title: 'Wetland population reaches zero',
        story: 'A conservation team models the frog population after restoring a wetland. The population reaches a maximum of 72 hundred frogs after 4 years. The population reaches zero at year 10.',
        symbol: 'P', variable: 't', functionInfo: 'P(t) is the frog population', inputInfo: 't is time in years', outputInfo: 'P(t) is measured in hundreds of frogs', unitNote: 'Enter population values in hundreds: 72 means 7,200 frogs.',
        primary: { kind: 'vertex', x: 4, y: 72 },
        other: { kind: 'x-intercept', x: 10, y: 0 },
      },
      {
        title: 'Startup net revenue',
        story: 'A startup models its net revenue after selling app subscriptions. Its minimum net revenue is −$18,000 at 2 hundred subscriptions. It breaks even after 5 hundred subscriptions.',
        symbol: 'R', variable: 'x', functionInfo: 'R(x) is net revenue', inputInfo: 'x is the number of hundreds of subscriptions', outputInfo: 'R(x) is measured in thousands of dollars', unitNote: 'Enter revenue values in thousands: −18 means −$18,000.',
        primary: { kind: 'vertex', x: 2, y: -18 },
        other: { kind: 'x-intercept', x: 5, y: 0 },
      },
    ],
  },
  {
    id: 'vertex-y-intercept',
    label: 'Vertex and a y-intercept',
    primaryKind: 'vertex',
    form: 'vertex',
    examples: [
      {
        title: 'Ball height and initial height',
        story: 'A ball is launched upward. It reaches a maximum height of 30 feet after 3 seconds. Its initial height was 3 feet.',
        symbol: 'h', variable: 't', functionInfo: 'h(t) is the ball’s height', inputInfo: 't is time in seconds', outputInfo: 'h(t) is measured in feet', unitNote: 'Enter height values in feet.',
        primary: { kind: 'vertex', x: 3, y: 30 },
        other: { kind: 'y-intercept', x: 0, y: 3 },
      },
      {
        title: 'Factory operating cost',
        story: 'A factory models its monthly operating cost based on production. Its minimum cost is $20,000 when 4 hundred items are made. With no items produced, its fixed and setup costs total $100,000.',
        symbol: 'C', variable: 'x', functionInfo: 'C(x) is monthly operating cost', inputInfo: 'x is the number of hundreds of items', outputInfo: 'C(x) is measured in thousands of dollars', unitNote: 'Enter cost values in thousands: 20 means $20,000 and 100 means $100,000.',
        primary: { kind: 'vertex', x: 4, y: 20 },
        other: { kind: 'y-intercept', x: 0, y: 100 },
      },
    ],
  },
  {
    id: 'x-intercepts-y-intercept',
    label: 'Two x-intercepts and a y-intercept',
    primaryKind: 'roots',
    form: 'factored',
    examples: [
      {
        title: 'Startup net profit and fixed loss',
        story: 'A startup models its net profit based on subscriptions sold. It breaks even at 2 hundred and 8 hundred subscriptions. With no subscriptions sold, the company has a loss of $16,000.',
        symbol: 'R', variable: 'x', functionInfo: 'R(x) is net profit', inputInfo: 'x is the number of hundreds of subscriptions', outputInfo: 'R(x) is measured in thousands of dollars', unitNote: 'Enter profit values in thousands: −16 means −$16,000.',
        primary: { kind: 'roots', values: [2, 8] },
        other: { kind: 'y-intercept', x: 0, y: -16 },
      },
      {
        title: 'Greenhouse roof arch',
        story: 'An arched greenhouse roof is modeled by its height above the floor. The horizontal coordinate is measured from a marked point on the floor. The arch meets the floor at x = −4 and x = 6, and its height at x = 0 is 24 feet.',
        symbol: 'H', variable: 'x', functionInfo: 'H(x) is the roof height', inputInfo: 'x is horizontal distance from the marked point', outputInfo: 'H(x) is measured in feet', unitNote: 'Enter height and distance values in feet.',
        primary: { kind: 'roots', values: [-4, 6] },
        other: { kind: 'y-intercept', x: 0, y: 24 },
      },
    ],
  },
  {
    id: 'x-intercepts-point',
    label: 'Two x-intercepts and a point',
    primaryKind: 'roots',
    form: 'factored',
    examples: [
      {
        title: 'Garden arch height',
        story: 'A garden arch is modeled by its height above the ground. It touches the ground at horizontal distances x = 1 foot and x = 7 feet. At x = 4 feet, it is 18 feet high.',
        symbol: 'H', variable: 'x', functionInfo: 'H(x) is the arch height', inputInfo: 'x is horizontal distance in feet', outputInfo: 'H(x) is measured in feet', unitNote: 'Enter distance and height values in feet.',
        primary: { kind: 'roots', values: [1, 7] },
        other: { kind: 'point', x: 4, y: 18 },
      },
      {
        title: 'Company net profit',
        story: 'A small company models its net profit based on products sold. It breaks even at 2 hundred and 8 hundred products. At 5 hundred products, its profit is $18,000.',
        symbol: 'P', variable: 'x', functionInfo: 'P(x) is net profit', inputInfo: 'x is the number of hundreds of products', outputInfo: 'P(x) is measured in thousands of dollars', unitNote: 'Enter profit values in thousands: 18 means $18,000.',
        primary: { kind: 'roots', values: [2, 8] },
        other: { kind: 'point', x: 5, y: 18 },
      },
    ],
  },
];

const categorizedExamples = categories.flatMap(category => category.examples.map((item, index) => ({
  ...item,
  id: `${category.id}-${index + 1}`,
  categoryId: category.id,
  categoryLabel: category.label,
  primaryKind: category.primaryKind,
  form: category.form,
})));

const mixedExampleOrder = [
  'vertex-point-1',
  'x-intercepts-point-1',
  'vertex-y-intercept-1',
  'x-intercepts-y-intercept-1',
  'vertex-x-intercept-1',
  'x-intercepts-point-2',
  'vertex-point-2',
  'vertex-x-intercept-2',
  'x-intercepts-y-intercept-2',
  'vertex-y-intercept-2',
];

export const examples = mixedExampleOrder.map(id => categorizedExamples.find(item => item.id === id));

export function solveA(item) {
  if (item.primaryKind === 'vertex') {
    const { x: h, y: k } = item.primary;
    return (item.other.y - k) / ((item.other.x - h) ** 2);
  }
  const [r1, r2] = item.primary.values;
  return item.other.y / ((item.other.x - r1) * (item.other.x - r2));
}
