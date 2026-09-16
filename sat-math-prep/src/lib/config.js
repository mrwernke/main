export const ADMIN_USERNAME = "NPP";
export const ADMIN_PASSWORD = "6SigmaStats";

export const TEST_LABELS = {
  1: "Test 1",
  2: "Test 2",
  3: "Test 3",
};

export const SAT_DOMAINS = [
  {
    name: "Algebra",
    topics: [
      "Linear equations in 1 variable",
      "Linear equations in 2 variables",
      "Linear functions",
      "Systems of 2 linear equations in 2 variables",
      "Linear inequalities in 1 or 2 variables",
    ],
  },
  {
    name: "Advanced Math",
    topics: [
      "Equivalent expressions",
      "Nonlinear equations in 1 variable",
      "Systems of equations in 2 variables",
      "Nonlinear functions",
    ],
  },
  {
    name: "Problem Solving & Data Analysis",
    topics: [
      "Ratios, rates, proportional relationships, and units",
      "Percentages",
      "One-variable data: distributions and measures of center and spread",
      "Two-variable data: models and scatterplots",
      "Probability and conditional probability",
      "Inference from sample statistics and margin of error",
      "Evaluating statistical claims: observational studies and experiments",
    ],
  },
  {
    name: "Geometry & Trigonometry",
    topics: [
      "Area and volume formulas",
      "Lines, angles, and triangles",
      "Right triangles and trigonometry",
      "Circles",
    ],
  },
];

export const SAT_TOPICS = SAT_DOMAINS.flatMap((d) => d.topics);

export const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export const QUESTION_USAGES = [
  { value: "practice", label: "Practice Questions" }
];

export const NOTIFY_EMAIL = "mwernke17@gmail.com";

