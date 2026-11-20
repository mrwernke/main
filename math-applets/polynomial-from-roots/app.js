import { mountPolynomialPractice } from '../polynomial-from-graph/workflow.js?v=20261120p7a';
import { examples, problemStatement } from './model.mjs?v=20261120p7b';

const statement = document.querySelector('#problem-statement');
mountPolynomialPractice({
  examples,
  source: 'statement',
  renderExample(example) {
    statement.textContent = problemStatement(example);
  },
});
