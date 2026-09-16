const STORAGE_PREFIX = 'satmathprep_local';
let memoryStore = {};

const PRACTICE_TOPICS = [
  'Linear equations in 1 variable',
  'Linear equations in 2 variables',
  'Linear functions',
  'Systems of 2 linear equations in 2 variables',
  'Linear inequalities in 1 or 2 variables',
  'Equivalent expressions',
  'Nonlinear equations in 1 variable',
  'Systems of equations in 2 variables',
  'Nonlinear functions',
  'Ratios, rates, proportional relationships, and units',
  'Percentages',
  'One-variable data: distributions and measures of center and spread',
  'Two-variable data: models and scatterplots',
  'Probability and conditional probability',
  'Inference from sample statistics and margin of error',
  'Evaluating statistical claims: observational studies and experiments',
  'Area and volume formulas',
  'Lines, angles, and triangles',
  'Right triangles and trigonometry',
  'Circles',
];

const PRACTICE_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const buildChoices = (answer) => {
  const choices = [answer, answer + 2, answer - 1, answer + 4];
  const unique = Array.from(new Set(choices));
  while (unique.length < 4) {
    unique.push(unique[unique.length - 1] + 1);
  }
  return unique.slice(0, 4);
};

const createMCQuestion = ({ id, topic, difficulty, prompt, answer, explanation }) => {
  const choices = buildChoices(answer);
  const correctIndex = choices.indexOf(answer);
  return {
    id,
    question_text: prompt,
    question_type: 'multiple_choice',
    choice_a: String(choices[0]),
    choice_b: String(choices[1]),
    choice_c: String(choices[2]),
    choice_d: String(choices[3]),
    correct_answer: ['A', 'B', 'C', 'D'][correctIndex],
    topic,
    difficulty,
    explanation,
    usage: 'practice',
    points: 1,
  };
};

const createGridInQuestion = ({ id, topic, difficulty, prompt, answer, explanation }) => ({
  id,
  question_text: prompt,
  question_type: 'grid_in',
  numeric_answer: answer,
  correct_answer: String(answer),
  topic,
  difficulty,
  explanation,
  usage: 'practice',
  points: 1,
});

const buildPracticeQuestionBank = () => {
  const questions = [];
  let counter = 1;

  const addQuestion = (question) => {
    questions.push({ ...question, id: `seed-practice-${counter++}` });
  };

  PRACTICE_TOPICS.forEach((topic) => {
    PRACTICE_DIFFICULTIES.forEach((difficulty) => {
      const base = difficulty === 'Easy' ? 2 : difficulty === 'Medium' ? 4 : 6;
      const variantOffset = base;

      if (topic === 'Linear equations in 1 variable') {
        const coeff = 2 + variantOffset;
        const constant = 5 + variantOffset;
        const answer = 3 + variantOffset;
        const target = coeff * answer + constant;
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `Solve ${coeff}x + ${constant} = ${target} for x.`,
          answer,
          explanation: 'Isolate x by subtracting the constant and dividing by the coefficient.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `If ${coeff}x - ${constant} = ${coeff * answer - constant}, what is x?`,
          answer,
          explanation: 'Add the constant to both sides and divide by the coefficient.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `What value of x makes ${coeff}x + ${constant} = ${target + coeff} true?`,
          answer: answer + 1,
          explanation: 'Use inverse operations to undo the constant term and the coefficient.',
        }));
      } else if (topic === 'Linear equations in 2 variables') {
        const x = 2 + variantOffset;
        const y = 1 + variantOffset;
        const answer = x + y;
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `If x = ${x} and y = ${y}, what is x + y?`,
          answer,
          explanation: 'Substitute the values and add.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `If 2x + y = ${2 * x + y}, what is x + y?`,
          answer,
          explanation: 'Use the equation directly to find the sum.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `If x = ${x} and y = ${y}, what is 3x - y?`,
          answer: 3 * x - y,
          explanation: 'Substitute and simplify carefully.',
        }));
      } else if (topic === 'Linear functions') {
        const slope = 2 + variantOffset;
        const intercept = 1 + variantOffset;
        const xValue = 3 + variantOffset;
        const answer = slope * xValue + intercept;
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `For f(x) = ${slope}x + ${intercept}, what is f(${xValue})?`,
          answer,
          explanation: 'Substitute the input into the function.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `Which value is the slope of f(x) = ${slope}x + ${intercept}?`,
          answer: slope,
          explanation: 'The slope is the coefficient of x.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `For f(x) = ${slope}x + ${intercept}, what is f(0)?`,
          answer: intercept,
          explanation: 'Evaluate the function at x = 0.',
        }));
      } else if (topic === 'Systems of 2 linear equations in 2 variables') {
        const x = 2 + variantOffset;
        const y = 1 + variantOffset;
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `Solve the system: x + y = ${x + y}; x - y = ${x - y}. What is x?`,
          answer: x,
          explanation: 'Add the equations to eliminate y.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `Solve the system: x + y = ${x + y}; x - y = ${x - y}. What is y?`,
          answer: y,
          explanation: 'Subtract the equations to solve for y.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `Solve the system: x + y = ${x + y}; x - y = ${x - y}. What is x + y?`,
          answer: x + y,
          explanation: 'The sum is directly given by the first equation.',
        }));
      } else if (topic === 'Linear inequalities in 1 or 2 variables') {
        const x = 3 + variantOffset;
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `Which inequality is true when x = ${x}?`,
          answer: x + 2,
          explanation: 'Substitute the value and test the statement.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `If x > ${x - 1}, which of the following could be x?`,
          answer: x,
          explanation: 'Choose a value that satisfies the inequality.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `What is the smallest integer that satisfies x > ${x - 1}?`,
          answer: x,
          explanation: 'The smallest integer greater than the lower bound is the next integer.',
        }));
      } else if (topic === 'Equivalent expressions') {
        const value = 3 + variantOffset;
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `Which expression is equivalent to ${value}(x + 2)?`,
          answer: value * 2,
          explanation: 'Distribute the factor across the sum.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `Which expression is equivalent to ${value}x + ${value * 2}?`,
          answer: value,
          explanation: 'Factor out the common term.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `If x = 2, what is the value of ${value}(x + 1)?`,
          answer: value * 3,
          explanation: 'Substitute x = 2 and evaluate.',
        }));
      } else if (topic === 'Nonlinear equations in 1 variable') {
        const x = 2 + variantOffset;
        const answer = x * x;
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `Solve x^2 = ${answer} for x.`,
          answer,
          explanation: 'Take the square root of both sides.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `What is the value of x if x^2 = ${x * x + 1}?`,
          answer: x + 1,
          explanation: 'Find the positive value that satisfies the equation.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `What is the value of x if x^2 = ${answer}?`,
          answer: x,
          explanation: 'The square root gives the solution.',
        }));
      } else if (topic === 'Systems of equations in 2 variables') {
        const x = 3 + variantOffset;
        const y = 2 + variantOffset;
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `If x + y = ${x + y} and x - y = ${x - y}, what is x?`,
          answer: x,
          explanation: 'Add the equations to eliminate y.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `If x + y = ${x + y} and x - y = ${x - y}, what is y?`,
          answer: y,
          explanation: 'Subtract the equations to solve for y.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `If x + y = ${x + y}, what is x + y?`,
          answer: x + y,
          explanation: 'The sum is given directly.',
        }));
      } else if (topic === 'Nonlinear functions') {
        const x = 2 + variantOffset;
        const answer = x * x + 1;
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `For f(x) = x^2 + 1, what is f(${x})?`,
          answer,
          explanation: 'Substitute the input into the quadratic expression.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `For f(x) = x^2 + 1, what is f(0)?`,
          answer: 1,
          explanation: 'Any square term becomes 0 at x = 0.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `For f(x) = x^2 + 1, what is f(1)?`,
          answer: 2,
          explanation: 'Evaluate the function at x = 1.',
        }));
      } else if (topic === 'Ratios, rates, proportional relationships, and units') {
        const ratio = 3 + variantOffset;
        const total = 12 + variantOffset;
        const answer = total / ratio;
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `A recipe uses a ratio of ${ratio}:1. If the total is ${total}, what is the smaller part?`,
          answer,
          explanation: 'Divide the total into the ratio parts.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `If ${ratio} pencils cost $${total}, what is the cost of 1 pencil?`,
          answer: total / ratio,
          explanation: 'Divide the total cost by the number of pencils.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `If 4 notebooks cost $${total}, what is the cost of 1 notebook?`,
          answer: total / 4,
          explanation: 'Use unit rate to find the price per notebook.',
        }));
      } else if (topic === 'Percentages') {
        const percent = 20 + variantOffset * 5;
        const base = 40 + variantOffset * 5;
        const answer = (percent / 100) * base;
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `What is ${percent}% of ${base}?`,
          answer,
          explanation: 'Convert the percent to a decimal and multiply.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `A price increased from ${base} to ${base + 10}. What is the percent increase?`,
          answer: 25,
          explanation: 'Compute the increase and divide by the original amount.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `What is 25% of ${base}?`,
          answer: base / 4,
          explanation: 'One quarter of the base is the percent value.',
        }));
      } else if (topic === 'One-variable data: distributions and measures of center and spread') {
        const values = [2, 4, 6, 8, 10].map((value, index) => value + variantOffset + index);
        const mean = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `What is the mean of ${values.join(', ')}?`,
          answer: mean,
          explanation: 'Add the values and divide by the number of values.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `Which value is the median of ${values.join(', ')}?`,
          answer: values[2],
          explanation: 'Sort the values and choose the middle entry.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `What is the range of ${values.join(', ')}?`,
          answer: values[values.length - 1] - values[0],
          explanation: 'Subtract the smallest value from the largest value.',
        }));
      } else if (topic === 'Two-variable data: models and scatterplots') {
        const slope = 1 + variantOffset;
        const intercept = 2 + variantOffset;
        const xValue = 4 + variantOffset;
        const answer = slope * xValue + intercept;
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `A line model is y = ${slope}x + ${intercept}. What is y when x = ${xValue}?`,
          answer,
          explanation: 'Substitute the x-value into the linear model.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `In the model y = ${slope}x + ${intercept}, what does the slope represent?`,
          answer: slope,
          explanation: 'The slope shows the rate of change in y for each unit increase in x.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `A line model is y = ${slope}x + ${intercept}. What is y when x = 0?`,
          answer: intercept,
          explanation: 'The y-intercept is the value at x = 0.',
        }));
      } else if (topic === 'Probability and conditional probability') {
        const favorable = 2 + variantOffset;
        const total = 6 + variantOffset;
        const answer = favorable / total;
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `A bag contains ${total} marbles, ${favorable} of which are blue. What is the probability of drawing a blue marble?`,
          answer: answer,
          explanation: 'Probability is favorable outcomes over total outcomes.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `If the probability of rain is ${favorable}/${total}, what is the probability of no rain?`,
          answer: (total - favorable) / total,
          explanation: 'The complement of an event has probability 1 minus the event probability.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `If a spinner has ${total} equal sections and ${favorable} are red, what is the probability of landing on red as a fraction?`,
          answer: favorable / total,
          explanation: 'Use favorable outcomes over total outcomes.',
        }));
      } else if (topic === 'Inference from sample statistics and margin of error') {
        const sample = 50 + variantOffset * 10;
        const margin = 5 + variantOffset;
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `A poll estimates a value with a margin of error of ${margin}%. If the estimate is ${sample}, what is the upper bound?`,
          answer: sample + margin,
          explanation: 'Add the margin of error to the estimate for the upper bound.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `A survey of ${sample} people has a margin of error of ${margin}%. What is the lower bound if the estimate is ${sample}?`,
          answer: sample - margin,
          explanation: 'Subtract the margin of error for the lower bound.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `If a statistic estimate is ${sample} and the margin of error is ${margin}, what is the midpoint of the interval?`,
          answer: sample,
          explanation: 'The estimate is the center of the interval.',
        }));
      } else if (topic === 'Evaluating statistical claims: observational studies and experiments') {
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: 'Which study design best allows a researcher to establish a cause-and-effect relationship?',
          answer: 1,
          explanation: 'Randomized experiments are best for cause-and-effect claims.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: 'Which type of study observes subjects without assigning treatments?',
          answer: 2,
          explanation: 'Observational studies do not assign treatments.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: 'How many variables should be changed in a fair experiment to test one cause?',
          answer: 1,
          explanation: 'Changing one variable at a time keeps the experiment controlled.',
        }));
      } else if (topic === 'Area and volume formulas') {
        const length = 4 + variantOffset;
        const width = 3 + variantOffset;
        const answer = length * width;
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `What is the area of a rectangle with length ${length} and width ${width}?`,
          answer,
          explanation: 'Area of a rectangle is length times width.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `What is the volume of a rectangular prism with dimensions ${length}, ${width}, and 2?`,
          answer: length * width * 2,
          explanation: 'Volume is length times width times height.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `What is the area of a square with side length ${length}?`,
          answer: length * length,
          explanation: 'A squareâ€™s area is side squared.',
        }));
      } else if (topic === 'Lines, angles, and triangles') {
        const angle = 30 + variantOffset * 10;
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `Two angles in a triangle are ${angle}Â° and ${angle + 20}Â°. What is the third angle?`,
          answer: 180 - angle - (angle + 20),
          explanation: 'The interior angles of a triangle sum to 180Â°.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `What is the sum of angles in a triangle?`,
          answer: 180,
          explanation: 'Triangle interior angles always add to 180Â°.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `If one acute angle in a right triangle is ${angle}Â°, what is the other acute angle?`,
          answer: 90 - angle,
          explanation: 'The acute angles in a right triangle sum to 90Â°.',
        }));
      } else if (topic === 'Right triangles and trigonometry') {
        const opposite = 3 + variantOffset;
        const adjacent = 4 + variantOffset;
        const hypotenuse = Math.sqrt(opposite * opposite + adjacent * adjacent);
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `In a right triangle, the legs are ${opposite} and ${adjacent}. What is the hypotenuse?`,
          answer: Math.round(hypotenuse),
          explanation: 'Use the Pythagorean theorem.',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `In a 3-4-5 triangle, what is the hypotenuse?`,
          answer: 5,
          explanation: 'The side lengths of a 3-4-5 triangle follow the Pythagorean theorem.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `In a right triangle, the legs are 3 and 4. What is the hypotenuse?`,
          answer: 5,
          explanation: 'The classic 3-4-5 right triangle has hypotenuse 5.',
        }));
      } else if (topic === 'Circles') {
        const radius = 2 + variantOffset;
        const answer = Math.PI * radius * radius;
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `What is the area of a circle with radius ${radius}?`,
          answer: Math.round(answer),
          explanation: 'Area of a circle is Ï€rÂ².',
        }));
        addQuestion(createMCQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `What is the circumference of a circle with radius ${radius}?`,
          answer: Math.round(2 * Math.PI * radius),
          explanation: 'Circumference is 2Ï€r.',
        }));
        addQuestion(createGridInQuestion({
          id: `seed-practice-${counter}`,
          topic,
          difficulty,
          prompt: `What is the diameter of a circle with radius ${radius}?`,
          answer: radius * 2,
          explanation: 'The diameter is twice the radius.',
        }));
      }
    });
  });

  return questions;
};

const buildPracticeTestBank = () => {
  const tests = [];
  const prompts = [
    'Solve for x: 3x + 7 = 22.',
    'If f(x) = 2x + 5, what is f(4)?',
    'A rectangle has length 8 and width 5. What is its area?',
    'What is 25% of 120?',
    'A bag contains 4 red marbles and 6 blue marbles. What is the probability of drawing a red marble?',
    'If the slope of a line is 3 and it passes through (1, 2), what is the y-intercept?',
    'Simplify: 3(2x + 4) - 5x.',
    'In a right triangle with legs 3 and 4, what is the hypotenuse?',
    'What is the mean of 4, 8, 10, 12?',
    'Solve the system: x + y = 10 and x - y = 2.',
    'What is the value of 2^5?',
    'A circle has radius 6. What is its circumference?',
    'If 5y = 35, what is y?',
    'A car travels 60 miles in 2 hours. What is its speed in miles per hour?',
    'What is 10% of 250?',
  ];

  prompts.forEach((prompt, index) => {
    tests.push({
      id: `seed-test-${index + 1}`,
      question_text: prompt,
      question_type: index % 2 === 0 ? 'multiple_choice' : 'grid_in',
      choice_a: index % 2 === 0 ? 'A' : '1',
      choice_b: index % 2 === 0 ? 'B' : '2',
      choice_c: index % 2 === 0 ? 'C' : '3',
      choice_d: index % 2 === 0 ? 'D' : '4',
      correct_answer: index % 2 === 0 ? 'A' : String(index + 2),
      topic: index < 4 ? 'Algebra' : index < 8 ? 'Geometry & Trigonometry' : 'Problem Solving & Data Analysis',
      difficulty: index < 3 ? 'Easy' : index < 7 ? 'Medium' : 'Hard',
      explanation: 'This is a seeded practice-test question.',
      points: 1,
    });
  });

  return [
    tests.slice(0, 5).map((q) => ({ ...q, usage: 'test_1' })),
    tests.slice(5, 10).map((q) => ({ ...q, usage: 'test_2' })),
    tests.slice(10, 15).map((q) => ({ ...q, usage: 'test_3' })),
  ];
};

const seedDefaultData = (store) => {
  if (!Array.isArray(store.settings)) {
    store.settings = [];
  }
  if (!store.settings.length) {
    store.settings.push({
      id: 'default-settings',
      tutor_email: 'tutor@example.com',
      zoom_link: 'https://zoom.us/j/0000000000',
      admin_username: 'a',
      admin_password: 'b',
    });
  }

  const existingQuestions = Array.isArray(store.question) ? store.question : [];
  const hasLegacyQuestions = existingQuestions.some((q) => {
    return q.id === 'demo-question-1' || q.id === 'demo-question-2' || q.question_text === 'If 3x + 5 = 20, what is x?';
  });
  const hasCustomPracticeQuestions = existingQuestions.some((q) => {
    return q && q.usage === 'practice' && !String(q.id || '').startsWith('seed-practice-') && !String(q.id || '').startsWith('seed-test-');
  });

  let baseQuestions = existingQuestions;
  if (!existingQuestions.length || hasLegacyQuestions || (!hasCustomPracticeQuestions && existingQuestions.length !== 180)) {
    baseQuestions = buildPracticeQuestionBank();
  }

  const practiceTestBank = buildPracticeTestBank();
  const testUsage = ['test_1', 'test_2', 'test_3'];
  const mergedQuestions = [...baseQuestions];
  testUsage.forEach((usage, index) => {
    const desired = practiceTestBank[index];
    const others = mergedQuestions.filter((q) => q.usage !== usage);
    const existing = mergedQuestions.filter((q) => q.usage === usage);
    if (existing.length !== desired.length || existing.some((q) => q.id.startsWith('seed-test-'))) {
      mergedQuestions.splice(0, mergedQuestions.length, ...others, ...desired);
    }
  });
  if (!Array.isArray(store.question)) {
    store.question = [];
  }
  store.question = mergedQuestions.map((q) => ({
    ...q,
    difficulty: q.difficulty === 'Challenge' ? 'Hard' : q.difficulty,
  }));

  if (!Array.isArray(store.student)) {
    store.student = [];
  }
  if (!store.student.length) {
    store.student.push({
      id: 'demo-student',
      first_name: 'Demo',
      last_name: 'Student',
      username: 'demo',
      password: 'demo123',
      email: 'demo@satmathprep.local',
      approval_status: 'approved',
      test1_unlocked: true,
      test2_unlocked: true,
      test3_unlocked: true,
    });
  }

  return store;
};

const readStore = () => {
  if (typeof window === 'undefined') {
    return seedDefaultData(memoryStore);
  }

  const stored = window.localStorage.getItem(STORAGE_PREFIX);
  if (!stored) {
    return seedDefaultData(memoryStore);
  }

  try {
    const parsed = JSON.parse(stored);
    const normalized = seedDefaultData(parsed);
    memoryStore = normalized;
    return normalized;
  } catch {
    const normalized = seedDefaultData({});
    memoryStore = normalized;
    return normalized;
  }
};

const writeStore = (store) => {
  const normalized = seedDefaultData(store);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_PREFIX, JSON.stringify(normalized));
  }
  memoryStore = normalized;
};

const fileToDataUrl = async (file) => {
  if (!file || !file.type?.startsWith('image/')) return '';

  if (typeof Buffer !== 'undefined') {
    const bytes = Buffer.isBuffer(file)
      ? file
      : Buffer.from(await file.arrayBuffer());
    return `data:${file.type};base64,${bytes.toString('base64')}`;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:${file.type};base64,${typeof window !== 'undefined' && window.btoa ? window.btoa(binary) : ''}`;
};

const createEntityCollection = (entityName) => {
  const collectionName = entityName.toLowerCase();

  return {
    async list() {
      const store = readStore();
      return (store[collectionName] || []).slice();
    },

    async filter(filters = {}, sortBy, limit) {
      const store = readStore();
      let rows = (store[collectionName] || []).slice();
      rows = rows.filter((row) => {
        return Object.entries(filters).every(([key, value]) => row[key] === value);
      });

      if (sortBy === '-created_date') {
        rows.sort((a, b) => (b.created_date || 0) - (a.created_date || 0));
      }

      if (typeof limit === 'number') {
        rows = rows.slice(0, limit);
      }

      return rows;
    },

    async get(id) {
      const store = readStore();
      return (store[collectionName] || []).find((row) => row.id === id);
    },

    async create(data) {
      const store = readStore();
      const rows = store[collectionName] || [];
      const item = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        created_date: Date.now(),
        ...data,
      };
      rows.push(item);
      store[collectionName] = rows;
      writeStore(store);
      return item;
    },

    async bulkCreate(items = []) {
      const store = readStore();
      const rows = store[collectionName] || [];
      const created = [];
      for (const data of items) {
        const item = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          created_date: Date.now(),
          ...data,
        };
        rows.push(item);
        created.push(item);
      }
      store[collectionName] = rows;
      writeStore(store);
      return created;
    },

    async update(id, updates) {
      const store = readStore();
      const rows = store[collectionName] || [];
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) {
        throw new Error(`No ${entityName} found with id ${id}`);
      }
      rows[index] = { ...rows[index], ...updates };
      store[collectionName] = rows;
      writeStore(store);
      return rows[index];
    },

    async delete(id) {
      const store = readStore();
      const rows = store[collectionName] || [];
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) {
        throw new Error(`No ${entityName} found with id ${id}`);
      }
      const [removed] = rows.splice(index, 1);
      store[collectionName] = rows;
      writeStore(store);
      return removed;
    },
  };
};

export const createLocalBase44Client = () => ({
  entities: {
    Student: createEntityCollection('Student'),
    Question: createEntityCollection('Question'),
    Settings: createEntityCollection('Settings'),
    CalendarSlot: createEntityCollection('CalendarSlot'),
    PracticeAttempt: createEntityCollection('PracticeAttempt'),
    TestResult: createEntityCollection('TestResult'),
  },
  integrations: {
    Core: {
      UploadFile: async (file) => {
        const file_url = await fileToDataUrl(file);
        return { file_url };
      },
      SendEmail: async () => ({ ok: true }),
    },
  },
  auth: {
    me: async () => ({ id: 'local-user', role: 'local' }),
    logout: () => {},
    redirectToLogin: () => {},
  },
});

export const localBase44 = createLocalBase44Client();


