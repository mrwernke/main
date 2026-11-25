import { examples, fractionText, factoredText, checkList, candidateFromInput, hasRemainingRationalRoot, syntheticTrial, successfulFactorization, advanceKnownFactors, checkSolutions } from './model.mjs?v=20261125i';
import { algebraicText, checkAlgebraic, continuedTrial, isZero } from './algebraic.mjs?v=20261125c';
import { polynomialText, checkAnswer, checkInteger, checkRoot } from '../polynomial-synthetic-division/model.mjs?v=20261123n';
import { numberText, input, renderSyntheticBoard } from '../polynomial-synthetic-division/board.mjs?v=20261123a';
import { parseRationalNumber } from '../quadratic-convert/model.mjs';
import { checkStep } from '../polynomial-factoring/model.mjs?v=20261123h';
import { parsePolynomial } from '../quadratic-systems/model.mjs';
import { showGroups, groupedDivision, factoringBox } from '../polynomial-factoring/factoring-aids.mjs?v=20261123a';
import { addSquareRootHelp } from '../polynomial-given-factor/square-root-help.mjs?v=20261125a';
import { clearConfetti, fireConfetti } from '../quadratic-graphing/confetti.js';

const $ = selector => document.querySelector(selector);
const picker = $('#example-picker');
const form = $('#question');
const board = $('#division');
const setup = $('#root-setup');
const rootChoice = $('#root-choice');
const fields = $('#answer-fields');
const workFields = $('#work-fields');
const history = $('#work-history');
const help = $('#factoring-help');
const formulaHelp = $('#formula-help');
const feedback = $('#feedback');
let example;
let phase;
let pDone;
let qDone;
let candidatesDone;
let root;
let trial;
let column;
let factorization;
let steps;
let stepIndex;
let continued;
let currentDividend;
let initialFactorization;
let knownFactors;
let continuedFactorStep;

function workInput(label) {
  const element = input(label);
  element.setAttribute('form', 'question');
  element.setAttribute('aria-describedby', 'question-title question-note feedback');
  return element;
}

function renderSetup() {
  setup.replaceChildren();
  const row = document.createElement('div');
  row.className = 'root-list math';
  row.append('± ');
  const p = pDone ? example.constantFactors.join(', ') : workInput('Factors of the constant');
  if (example.dividend[0] === 1) {
    row.append(p);
  } else {
    const fraction = document.createElement('span');
    fraction.className = 'fraction root-fraction';
    const numerator = document.createElement('span');
    numerator.className = 'numerator';
    numerator.append(p);
    const denominator = document.createElement('span');
    denominator.className = 'denominator';
    denominator.append(qDone ? example.leadingFactors.join(', ') : phase === 'q'
      ? workInput('Factors of the leading coefficient') : '?');
    fraction.append(numerator, denominator);
    row.append(fraction);
  }
  setup.append(row);
  if (candidatesDone) {
    const possibilities = document.createElement('p');
    possibilities.className = 'math';
    possibilities.textContent = `Possible rational roots: ${example.candidates.map(candidate => `± ${fractionText(candidate)}`).join(', ')}`;
    setup.append(possibilities);
  }
}

function addEquation(equation, labels, container = workFields) {
  const row = document.createElement('div');
  row.className = 'equation-row math';
  const pieces = equation.split('□');
  pieces.forEach((text, index) => {
    if (text) row.append(document.createTextNode(text));
    if (index < pieces.length - 1) row.append(workInput(labels[index]));
  });
  container.append(row);
}

function addResult(text) {
  const result = document.createElement('p');
  result.className = 'math';
  result.textContent = text;
  history.append(result);
}

function repeatedRootNote() {
  return example.repeatedRoots.map(([root, count]) =>
    `x = ${numberText(root)} is a ${count === 2 ? 'double root' : `root of multiplicity ${count}`}; count it once as a distinct real solution.`).join(' ');
}

function makePracticeSteps() {
  const { divisor, quotient, remaining, grouped, quadraticFactors, distinctFactors, factored, factorEquations } = factorization;
  const outside = polynomialText(divisor);
  const quotientText = polynomialText(quotient);
  const list = [{
    title: 'Write the factored form after synthetic division.',
    note: 'Enter the divisor first and the quotient second.',
    equation: '(□)(□) = 0',
    labels: ['Divisor', 'Quotient'],
    result: `${factoredText([divisor, quotient])} = 0`,
    check: values => [checkAnswer(values[0], [0, ...divisor]), checkAnswer(values[1], quotient)],
  }, {
    title: `Will (${quotientText}) factor more?`,
    options: ['Yes', 'No'],
    answer: remaining.length > 1 ? 'Yes' : 'No',
  }];
  if (remaining.length > 1) {
    const grouping = quotient.length === 4;
    const linear = grouping ? grouped.find(factor => factor.length === 2) : null;
    const quadratic = grouping ? grouped.find(factor => factor.length === 3) : null;
    const canGroup = grouping && quadratic[1] === 0;
    list.push({
      title: 'Which method should you use next?',
      note: `Choose a method for ${quotientText}.`,
      options: ['Factorable quadratic', 'GCF', 'Grouping', 'Special quadratic form', 'Synthetic division'],
      answer: grouping ? (canGroup ? 'Grouping' : 'Synthetic division') : 'Factorable quadratic',
    });
    if (canGroup) {
      const [a, b] = linear;
      const constant = quadratic[2];
      const firstGroup = polynomialText([a, b, 0, 0]);
      const secondGroup = polynomialText([a * constant, b * constant]);
      const groupData = { firstGroup, secondGroup, groupGcf: numberText(constant) };
      const linearText = polynomialText(linear);
      const connector = constant < 0 ? ` − ${-constant}` : ` + ${constant}`;
      list.push({
        title: 'Identify the GCF of each group.',
        note: `Group the quotient as (${firstGroup}) + (${secondGroup}). Include the negative sign when needed.`,
        labels: ['First group GCF', 'Second group GCF'],
        groupData,
        result: `Group GCFs: x², ${numberText(constant)}`,
        check: values => [checkAnswer(values[0], [1, 0, 0]), checkInteger(values[1], constant)],
      }, {
        title: 'Divide each group by its GCF.',
        note: 'Enter the expression remaining inside each pair of parentheses.',
        equation: `(${outside})[x²(□)${connector}(□)] = 0`,
        labels: ['First group expression', 'Second group expression'],
        groupData,
        showDivision: true,
        result: `(${outside})[x²(${linearText})${connector}(${linearText})] = 0`,
        check: values => values.map(value => checkAnswer(value, [0, ...linear])),
      });
    }
    const nextFactors = grouping ? grouped : remaining;
    const polynomialAnswers = nextFactors.map(factor => parsePolynomial(polynomialText(factor).replaceAll('²', '^2').replaceAll('−', '-')));
    const factorStep = { polynomialAnswers, unordered: true };
    list.push({
      title: canGroup ? 'Factor out the matching expression.' : grouping ? 'Factor the cubic quotient.' : 'Factor the quadratic quotient.',
      note: grouping && !canGroup ? 'Find a linear factor and its quadratic quotient. Keep the divisor outside.'
        : 'Enter both complete factors. Keep the divisor outside.',
      equation: `(${outside})(□)(□) = 0`,
      labels: ['Factor 1', 'Factor 2'],
      box: grouping ? null : { a: quotient[0], b: quotient[1], c: quotient[2] },
      result: `${factoredText([divisor, ...nextFactors])} = 0`,
      check: values => checkStep(factorStep, values),
    });
    if (quadraticFactors) {
      const linearText = polynomialText(linear);
      const answers = quadraticFactors.map(factor => parsePolynomial(polynomialText(factor).replaceAll('−', '-')));
      list.push({
        title: 'Factor the remaining quadratic.',
        note: 'Enter both complete factors, including repeated factors.',
        equation: `(${outside})(${linearText})(□)(□) = 0`,
        labels: ['Factor 1', 'Factor 2'],
        box: { a: quadratic[0], b: quadratic[1], c: quadratic[2] },
        result: `${factored} = 0`,
        check: values => checkStep({ polynomialAnswers: answers, unordered: true }, values),
      });
    }
  }
  list.push({
    title: 'Set each factor equal to zero.',
    note: `Enter each complete factor. Factors may be entered in any order. ${repeatedRootNote()}`.trim(),
    equation: distinctFactors.map(() => '□ = 0').join(', '),
    labels: distinctFactors.map((factor, index) => `Zero factor ${index + 1}`),
    result: distinctFactors.map(factor => `${factor} = 0`).join(', '),
    check: values => checkStep(factorEquations, values),
  });
  const quadratic = remaining.find(factor => factor.length === 3);
  const squareRootHelp = quadratic && quadratic[0] === 1 && quadratic[1] === 0 ? [{
    factor: polynomialText(quadratic),
    value: -quadratic[2],
    solutions: example.solutions.filter(solution => solution.includes('i') || solution.includes('sqrt')),
  }] : [];
  const quadraticHint = quadratic && quadratic[1] !== 0
    ? ` Use the quadratic formula or complete the square for ${polynomialText(quadratic)} = 0.` : '';
  list.push({
    title: 'Find all roots/zeros/solutions.',
    note: `Enter each distinct solution once, in any order. Use sqrt(7) for radicals and i for imaginary solutions.${quadraticHint} ${repeatedRootNote()}`.trim(),
    equation: `x = ${example.solutions.map(() => '□').join(', ')}`,
    labels: example.solutions.map((solution, index) => `Solution ${index + 1}`),
    result: `x = ${example.solutions.map(numberText).join(', ')}`,
    squareRootHelp,
    quadraticFormulaHelp: quadratic && quadratic[1] !== 0 ? quadratic : null,
    check: values => checkSolutions(values, example.solutions, example.basis),
  }, {
    title: 'How many solutions are real and how many are complex?',
    note: `Count distinct solutions; count a repeated root once. Irrational real solutions are real. ${repeatedRootNote()}`.trim(),
    labels: ['Number of Real Solutions', 'Number of Imaginary Complex Solutions'],
    result: `${example.realCount} real, ${example.complexCount} imaginary complex`,
    check: values => [checkInteger(values[0], example.realCount), checkInteger(values[1], example.complexCount)],
  });
  return list;
}

function polynomialAnswer(factor) {
  return parsePolynomial(polynomialText(factor).replaceAll('²', '^2').replaceAll('−', '-'));
}

function makeContinuedFactorStep() {
  const factors = knownFactors.written;
  const scale = knownFactors.divided.reduce((product, factor) => product * factor[0], 1);
  const adjustment = knownFactors.quotient && scale !== 1
    ? ` Divide the latest unboxed numbers by ${scale} to get the remaining quotient.` : '';
  return {
    title: 'Write the new factored form after synthetic division.',
    note: `Enter all factors separately, including repeats and the remaining quotient, in any order.${adjustment}`,
    equation: `${factors.map(() => '(□)').join('')} = 0`,
    labels: factors.map((_, index) => `Factor ${index + 1}`),
    result: `${factoredText(factors)} = 0`,
    check: values => checkStep({ polynomialAnswers: factors.map(polynomialAnswer), unordered: true }, values),
  };
}

function prepareContinuedFactoring() {
  const zeroIndex = steps.findIndex(step => step.title === 'Set each factor equal to zero.');
  if (zeroIndex < 0) throw new Error('The zero-equation step is missing.');
  steps = steps.slice(zeroIndex);
  if (knownFactors.remaining.length > 1) {
    const factors = knownFactors.remaining;
    const quotient = knownFactors.quotient;
    const outside = factoredText(knownFactors.divided);
    steps.unshift({
      title: 'Factor the remaining quadratic.',
      note: 'Enter both complete factors. Keep the factors already found outside.',
      equation: `${outside}(□)(□) = 0`,
      labels: ['Factor 1', 'Factor 2'],
      box: { a: quotient[0], b: quotient[1], c: quotient[2] },
      result: `${factoredText([...knownFactors.divided, ...factors])} = 0`,
      check: values => checkStep({ polynomialAnswers: factors.map(polynomialAnswer), unordered: true }, values),
    });
  }
  stepIndex = 0;
  phase = 'practice';
}

function updateWorkWidth() {
  $('.practice-layout').classList.toggle('wide-work',
    ['practice', 'continued-factors'].includes(phase)
      && !help.querySelector('aside:not([hidden])') && !formulaHelp.querySelector('aside:not([hidden])'));
}

function addHelpToggle(label, panel, open, container = help) {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'p8-box-toggle';
  toggle.setAttribute('aria-controls', panel.id);
  const update = () => {
    panel.hidden = !open;
    toggle.textContent = `Need Help: ${open ? 'Hide' : 'Show'} ${label}`;
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => { open = !open; update(); updateWorkWidth(); });
  update();
  container.append(toggle, panel);
  return toggle;
}

function renderHelp(step) {
  if (step.groupData) {
    const panel = document.createElement('aside');
    panel.id = 'grouping-help';
    panel.setAttribute('aria-label', 'Grouping help');
    const grouped = document.createElement('p');
    grouped.className = 'math';
    showGroups([step.groupData.firstGroup, step.groupData.secondGroup], grouped, false);
    panel.append(grouped);
    if (step.showDivision) {
      const division = groupedDivision(step.groupData);
      division.insertBefore(document.createTextNode(' + '), division.lastElementChild);
      panel.append(division);
    }
    addHelpToggle('Grouping', panel, false);
  }
  if (step.box) {
    const panel = document.createElement('aside');
    panel.id = 'box-help';
    panel.className = 'p8-box-panel';
    panel.setAttribute('aria-label', 'Factoring box help');
    panel.append(factoringBox(step.box, true));
    addHelpToggle('Factoring Box', panel, false);
  }
  if (step.squareRootHelp) {
    step.squareRootHelp.forEach((item, index) => addSquareRootHelp(item, index, addHelpToggle, workFields,
      (values, answers) => checkSolutions(values, answers, example.basis)));
  }
  if (step.quadraticFormulaHelp) {
    const [a, b, c] = step.quadraticFormulaHelp;
    const panel = document.createElement('aside');
    panel.id = 'quadratic-formula-help';
    panel.setAttribute('aria-label', 'Quadratic formula help');
    const frame = document.createElement('iframe');
    frame.title = 'Quadratic formula practice';
    frame.src = `../quadratic-formula/?embedded=true&a=${a}&b=${b}&c=${c}`;
    frame.addEventListener('load', () => {
      const content = frame.contentDocument.querySelector('main');
      const resize = () => { frame.style.height = `${Math.ceil(content.getBoundingClientRect().height)}px`; };
      new ResizeObserver(resize).observe(content);
      resize();
    });
    const back = document.createElement('button');
    back.type = 'button';
    back.textContent = 'Return to all solutions';
    panel.append(frame, back);
    const toggle = addHelpToggle('Quadratic Formula', panel, true, formulaHelp);
    back.addEventListener('click', () => {
      toggle.click();
      workFields.querySelector('input').focus();
    });
  }
}

function yesNoQuestion() {
  return ['trial-result', 'continue-choice', 'continued-factor-choice'].includes(phase)
    || (phase === 'practice' && steps[stepIndex].options?.join(',') === 'Yes,No');
}

function renderQuestion() {
  fields.replaceChildren();
  rootChoice.replaceChildren();
  workFields.replaceChildren();
  help.replaceChildren();
  formulaHelp.replaceChildren();
  fields.removeAttribute('role');
  fields.removeAttribute('aria-labelledby');
  fields.removeAttribute('aria-describedby');
  feedback.textContent = '';
  feedback.className = 'feedback';
  renderSetup();
  const title = $('#question-title');
  const note = $('#question-note');
  if (phase === 'p') {
    title.textContent = `List the positive factors of the constant, ${numberText(example.dividend.at(-1))}.`;
    note.textContent = 'Separate the factors with commas. The ± is already provided.';
  } else if (phase === 'q') {
    title.textContent = `List the positive factors of the leading coefficient, ${example.dividend[0]}.`;
    note.textContent = 'Enter them in the denominator, separated by commas.';
  } else if (phase === 'candidates') {
    title.textContent = 'List all possible rational roots.';
    note.textContent = 'Combine each numerator factor with each denominator factor. List all distinct positive values; ± is provided.';
    addEquation('± □', ['Possible rational roots']);
    workFields.querySelector('input').classList.add('list-entry');
  } else if (phase === 'choose') {
    title.textContent = continued ? 'Choose another possible rational root to test.' : 'Choose a possible rational root to test.';
    note.textContent = 'Enter one positive or negative value from your list. Use a fraction when needed.';
    addEquation("I'll test x = □", ['Rational root to test'], rootChoice);
  } else if (phase === 'coefficients') {
    title.textContent = 'Enter the coefficients of the polynomial.';
    note.textContent = 'Use descending powers of x. Enter 0 for each missing term.';
  } else if (phase === 'bring') {
    title.textContent = 'Bring down the first coefficient.';
    note.textContent = 'Copy the leading coefficient below the line.';
  } else if (phase === 'multiply') {
    title.textContent = 'Multiply.';
    note.textContent = `Multiply ${numberText(trial.rootText)} by ${numberText(trial.results[column - 1])}. Enter the product under the next coefficient. Fractions are allowed.`;
  } else if (phase === 'add') {
    title.textContent = 'Add the column.';
    note.textContent = `Add ${numberText(trial.dividend[column])} and ${numberText(trial.products[column - 1])}. Enter the sum below the line.`;
  } else if (phase === 'trial-result') {
    title.textContent = `Based on the remainder, is ${numberText(trial.rootText)} a root?`;
    note.textContent = 'A remainder of 0 means the number is a root.';
  } else if (phase === 'continue-choice') {
    title.textContent = 'Continue using synthetic division?';
    note.textContent = 'Continue with the unboxed bottom row, or move on to factoring and solving.';
  } else if (phase === 'continued-factor-choice') {
    title.textContent = `Will (${polynomialText(knownFactors.quotient)}) factor more?`;
    note.textContent = '';
  } else {
    const step = phase === 'continued-factors' ? continuedFactorStep : steps[stepIndex];
    title.textContent = step.title;
    note.textContent = step.note || '';
    renderHelp(step);
    if (step.options) {
      if (!yesNoQuestion()) renderChoices(step.options);
    } else if (step.equation) addEquation(step.equation, step.labels);
    else {
      step.labels.forEach(labelText => {
        const label = document.createElement('label');
        label.append(document.createTextNode(`${labelText}:`), workInput(labelText));
        workFields.append(label);
      });
    }
  }
  const check = $('#check-button');
  const skip = $('#skip-trial');
  const divisionPhase = ['coefficients', 'bring', 'multiply', 'add'].includes(phase);
  const divisionActions = $('#division-actions');
  divisionActions.hidden = !divisionPhase;
  (divisionPhase ? divisionActions : $('#question-actions')).prepend(check);
  check.hidden = yesNoQuestion();
  skip.hidden = !['bring', 'multiply', 'add'].includes(phase);
  if (!skip.hidden) skip.textContent = `x = ${numberText(trial.rootText)} is not a factor; try another number`;
  $('#decision-yes').hidden = !yesNoQuestion();
  $('#decision-no').hidden = !yesNoQuestion();
  updateWorkWidth();
  const active = setup.querySelector('input') || rootChoice.querySelector('input') || board.querySelector('.division-input')
    || workFields.querySelector('input') || fields.querySelector('input')
    || (yesNoQuestion() ? $('#decision-yes') : null);
  if (active) active.focus();
}

function renderChoices(options) {
  fields.setAttribute('role', 'radiogroup');
  fields.setAttribute('aria-labelledby', 'question-title');
  fields.setAttribute('aria-describedby', 'question-note feedback');
  const row = document.createElement('div');
  row.className = 'choice-row';
  options.forEach(option => {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'choice';
    radio.value = option;
    label.append(radio, document.createTextNode(option));
    row.append(label);
  });
  fields.append(row);
}

function startCoefficientSetup() {
  phase = 'coefficients';
  $('#division-area').hidden = false;
  renderSyntheticBoard(board, example, phase, 0);
}

function renderExample() {
  example = examples[picker.selectedIndex];
  phase = 'p';
  pDone = false;
  qDone = false;
  candidatesDone = false;
  trial = null;
  continued = false;
  currentDividend = null;
  initialFactorization = null;
  knownFactors = null;
  continuedFactorStep = null;
  factorization = null;
  stepIndex = 0;
  clearConfetti();
  history.replaceChildren();
  $('#failed-trials').replaceChildren();
  $('#attempt-history').hidden = true;
  board.replaceChildren();
  board.hidden = false;
  $('#previous-divisions').replaceChildren();
  $('#division-area').hidden = true;
  $('#quotient-adjustment').hidden = true;
  form.hidden = false;
  $('#complete').hidden = true;
  $('#problem').textContent = `${polynomialText(example.dividend)} = 0`;
  renderQuestion();
}

function complete() {
  workFields.replaceChildren();
  help.replaceChildren();
  formulaHelp.replaceChildren();
  updateWorkWidth();
  $('#final-factored').textContent = factorization.factored;
  $('#final-roots').textContent = example.solutions.map(numberText).join(', ');
  $('#final-repeated-root').textContent = repeatedRootNote();
  $('#final-repeated-root').hidden = !example.repeatedRoots.length;
  $('#final-real').textContent = example.realCount;
  $('#final-complex').textContent = example.complexCount;
  form.hidden = true;
  $('#complete').hidden = false;
  fireConfetti(180);
  $('#next-example').focus();
}

function markInputs(inputs, matches) {
  inputs.forEach((element, index) => {
    element.classList.toggle('invalid', !matches[index]);
    element.setAttribute('aria-invalid', String(!matches[index]));
  });
  if (matches.every(Boolean)) return true;
  feedback.textContent = 'Check your signs and answers, then try again.';
  feedback.className = 'feedback no';
  return false;
}

function trialFailed() {
  return continued ? !isZero(trial.remainder) : trial.remainder.numerator !== 0;
}

function recordFailedTrial() {
  const attempt = document.createElement('li');
  attempt.className = 'math';
  const remainder = continued ? algebraicText(trial.remainder, example.basis) : fractionText(trial.remainder);
  attempt.textContent = `${numberText(trial.rootText)}: remainder ${numberText(remainder)}; not a root.`;
  $('#failed-trials').append(attempt);
  $('#attempt-history').hidden = false;
  phase = 'choose';
}

function startFactoring() {
  phase = 'practice';
}

function answerTrial(isRoot) {
  if (isRoot === trialFailed()) {
    feedback.textContent = 'Use the remainder to decide whether this is a root.';
    feedback.className = 'feedback no';
    return;
  }
  if (trialFailed()) {
    recordFailedTrial();
  } else if (!continued) {
    initialFactorization = successfulFactorization(example, root);
    if (!initialFactorization) throw new Error('The zero remainder did not match a factor.');
    const adjustment = $('#quotient-adjustment');
    adjustment.hidden = root.denominator === 1;
    adjustment.textContent = adjustment.hidden ? '' : `For divisor ${polynomialText(initialFactorization.divisor)}, divide each unboxed number by ${root.denominator} to get the quotient coefficients. For continued synthetic division, use the unadjusted bottom row.`;
    factorization = initialFactorization;
    knownFactors = { divided: [factorization.divisor], remaining: factorization.remaining };
    steps = makePracticeSteps();
    stepIndex = 0;
    phase = 'practice';
  } else {
    knownFactors = advanceKnownFactors(knownFactors.divided, knownFactors.remaining, root);
    if (!knownFactors) throw new Error('The zero remainder did not match a remaining factor.');
    if (trial.results.length === 2) addResult(`Final constant after synthetic division: ${numberText(trial.results[0])}`);
    continuedFactorStep = makeContinuedFactorStep();
    phase = 'continued-factors';
  }
  renderQuestion();
}

function answerDecision(yes) {
  if (phase === 'trial-result') {
    answerTrial(yes);
    return;
  }
  if (phase === 'continue-choice') {
    if (!yes) {
      if (continued) phase = 'continued-factor-choice';
      else startFactoring();
    } else {
      const nextDividend = trial.results.slice(0, -1);
      if (!hasRemainingRationalRoot(example, nextDividend)) {
        feedback.textContent = 'No rational roots remain. Use a different method, such as factoring or the square root method.';
        feedback.className = 'feedback no';
        return;
      }
      currentDividend = nextDividend;
      const copy = board.cloneNode(true);
      copy.removeAttribute('id');
      copy.setAttribute('aria-label', 'Completed synthetic division');
      copy.lastElementChild.firstElementChild.classList.add('root-cell');
      $('#previous-divisions').append(copy);
      continued = true;
      phase = 'choose';
      renderSyntheticBoard(board, { dividend: currentDividend, rootText: null }, phase, 0);
      board.hidden = true;
    }
  } else {
    const correct = phase === 'continued-factor-choice'
      ? knownFactors.remaining.length > 1 : steps[stepIndex].answer === 'Yes';
    if (yes !== correct) {
      feedback.textContent = 'That is not quite right. Look at the quotient and try again.';
      feedback.className = 'feedback no';
      return;
    }
    if (phase === 'continued-factor-choice') prepareContinuedFactoring();
    else stepIndex++;
  }
  renderQuestion();
}

$('#decision-yes').addEventListener('click', () => answerDecision(true));
$('#decision-no').addEventListener('click', () => answerDecision(false));

$('#skip-trial').addEventListener('click', () => {
  if (!trialFailed()) {
    feedback.textContent = 'This number is a root. Continue the synthetic division.';
    feedback.className = 'feedback no';
    return;
  }
  recordFailedTrial();
  renderQuestion();
});

form.addEventListener('submit', event => {
  event.preventDefault();
  if (yesNoQuestion()) return;
  if (phase === 'p' || phase === 'q' || phase === 'candidates') {
    const element = phase === 'candidates' ? workFields.querySelector('input') : setup.querySelector('input');
    const expected = phase === 'p' ? example.constantFactors : phase === 'q' ? example.leadingFactors : example.candidates;
    if (!markInputs([element], [checkList(element.value, expected, phase === 'candidates')])) return;
    if (phase === 'p') {
      pDone = true;
      if (example.dividend[0] === 1) { candidatesDone = true; startCoefficientSetup(); }
      else phase = 'q';
    } else if (phase === 'q') { qDone = true; phase = 'candidates'; }
    else { candidatesDone = true; startCoefficientSetup(); }
  } else if (phase === 'choose') {
    const element = rootChoice.querySelector('input');
    root = candidateFromInput(element.value, example);
    if (!markInputs([element], [Boolean(root)])) {
      feedback.textContent = 'Enter one positive or negative rational value from the possible rational roots.';
      return;
    }
    trial = continued ? continuedTrial(currentDividend, fractionText(root), example.basis) : syntheticTrial(example, root);
    if (!trial) throw new Error('Unable to start synthetic division for this rational root.');
    column = 0;
    phase = 'bring';
    if (continued) {
      $('#previous-divisions').lastElementChild.lastElementChild.firstElementChild.textContent = numberText(trial.rootText);
      board.hidden = false;
    } else $('#quotient-adjustment').hidden = true;
    renderSyntheticBoard(board, trial, phase, column);
    if (continued) board.firstElementChild.hidden = true;
  } else if (phase === 'continued-factors') {
    const inputs = [...workFields.querySelectorAll('input')];
    if (!markInputs(inputs, continuedFactorStep.check(inputs.map(element => element.value)))) return;
    addResult(continuedFactorStep.result);
    if (!knownFactors.quotient || knownFactors.quotient.length === 2) prepareContinuedFactoring();
    else phase = 'continue-choice';
  } else if (phase === 'practice') {
    const step = steps[stepIndex];
    if (step.options) {
      const selected = fields.querySelector('input:checked');
      if (!selected || selected.value !== step.answer) {
        feedback.textContent = selected ? 'That is not quite right. Look at the quotient and try again.' : 'Choose an answer.';
        feedback.className = 'feedback no';
        return;
      }
    } else {
      const inputs = [...workFields.querySelectorAll('input')];
      if (!markInputs(inputs, step.check(inputs.map(element => element.value)))) return;
      if (step.result) addResult(step.result);
    }
    stepIndex++;
    if (stepIndex === steps.length) { complete(); return; }
    if (stepIndex === 1 && !continued) phase = 'continue-choice';
  } else {
    const inputs = [...board.querySelectorAll('.division-input')];
    let matches;
    if (phase === 'coefficients') matches = inputs.map((element, index) => checkInteger(element.value, example.dividend[index]));
    else {
      const expected = phase === 'bring' ? trial.results[0] : phase === 'multiply'
        ? trial.products[column - 1] : trial.results[column];
      matches = [continued ? checkAlgebraic(inputs[0].value, expected, example.basis)
        : checkRoot(inputs[0].value, parseRationalNumber(expected).value)];
    }
    if (!markInputs(inputs, matches)) return;
    if (phase === 'coefficients') {
      phase = 'choose';
      renderSyntheticBoard(board, { dividend: example.dividend, rootText: null }, phase, 0);
    }
    else if (phase === 'bring') { column = 1; phase = 'multiply'; }
    else if (phase === 'multiply') phase = 'add';
    else if (column === trial.dividend.length - 1) phase = 'trial-result';
    else { column++; phase = 'multiply'; }
    if (phase !== 'choose') {
      renderSyntheticBoard(board, trial, phase === 'trial-result' ? 'final' : phase, column);
      if (continued) board.firstElementChild.hidden = true;
    }
  }
  renderQuestion();
});

picker.replaceChildren(...examples.map((item, index) =>
  new Option(`${index + 1}: ${polynomialText(item.dividend)} = 0`, index)));
picker.addEventListener('change', renderExample);
$('#try-again').addEventListener('click', renderExample);
$('#next-example').addEventListener('click', () => {
  picker.selectedIndex = (picker.selectedIndex + 1) % examples.length;
  renderExample();
});
renderExample();
