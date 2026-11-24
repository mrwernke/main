import { checkInteger } from '../polynomial-synthetic-division/model.mjs?v=20261123n';
import { input } from '../polynomial-synthetic-division/board.mjs?v=20261123a';
import { checkStep } from '../polynomial-factoring/model.mjs?v=20261123h';

export function addSquareRootHelp({ factor, value, solutions }, index, addHelpToggle, workFields) {
  const panel = document.createElement('aside');
  panel.id = `square-root-help-${index}`;
  panel.setAttribute('aria-label', `Square root help for ${factor}`);
  const equation = document.createElement('p');
  equation.className = 'math';
  equation.textContent = `${factor} = 0`;
  const isolate = document.createElement('div');
  isolate.className = 'square-root-row math';
  const squareInput = input(`Value of x squared for ${factor}`);
  const isolateCheck = document.createElement('button');
  isolateCheck.type = 'button';
  isolateCheck.textContent = 'Check';
  isolate.append('x² = ', squareInput, isolateCheck);
  const roots = document.createElement('div');
  roots.hidden = true;
  const rootsRow = document.createElement('div');
  rootsRow.className = 'square-root-row math';
  const first = input(`First square root for ${factor}`);
  const second = input(`Second square root for ${factor}`);
  const rootsCheck = document.createElement('button');
  rootsCheck.type = 'button';
  rootsCheck.textContent = 'Check';
  rootsRow.append('x = ', first, ', ', second, rootsCheck);
  const message = document.createElement('p');
  message.className = 'feedback';
  message.setAttribute('role', 'status');
  const back = document.createElement('button');
  back.type = 'button';
  back.textContent = 'Return to all solutions';
  back.hidden = true;
  roots.append(rootsRow);
  panel.append(equation, isolate, roots, message, back);
  const toggle = addHelpToggle(`Square Root Method (${factor})`, panel, false);

  function mark(element, correct) {
    element.classList.toggle('invalid', !correct);
    element.setAttribute('aria-invalid', String(!correct));
  }
  isolateCheck.addEventListener('click', () => {
    const correct = checkInteger(squareInput.value, value);
    mark(squareInput, correct);
    message.textContent = correct ? '' : 'Check the sign and value, then try again.';
    message.className = `feedback${correct ? '' : ' no'}`;
    if (!correct) return;
    squareInput.readOnly = true;
    isolateCheck.hidden = true;
    roots.hidden = false;
    first.focus();
  });
  rootsCheck.addEventListener('click', () => {
    const matches = checkStep({ answers: solutions, roots: true, unordered: true }, [first.value, second.value]);
    [first, second].forEach((element, i) => mark(element, matches[i]));
    const correct = matches.every(Boolean);
    message.textContent = correct ? 'Both solutions are correct.' : 'Enter both square roots, including their signs.';
    message.className = `feedback ${correct ? 'ok' : 'no'}`;
    if (!correct) return;
    first.readOnly = true;
    second.readOnly = true;
    rootsCheck.hidden = true;
    back.hidden = false;
    back.focus();
  });
  [[squareInput, isolateCheck], [first, rootsCheck], [second, rootsCheck]].forEach(([element, button]) => {
    element.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        button.click();
      }
    });
  });
  back.addEventListener('click', () => {
    toggle.click();
    workFields.querySelector('input').focus();
  });
}
