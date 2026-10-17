import { problems, methods, acceptableMethods, functionText, explanation, incorrectHint } from './model.mjs';

const $ = selector => document.querySelector(selector);
let index = 0;

function reset() {
  $('#progress').textContent = `Example ${index + 1} of ${problems.length}`;
  $('#equation').textContent = functionText(problems[index]);
  $('#problem-picker').value = String(index);
  $('#method-feedback').textContent = '';
  $('#method-feedback').className = 'feedback q13-feedback';
  $('#complete').hidden = true;
  $('#method-options').replaceChildren(...methods.map(method => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'q13-method-choice';
    button.textContent = method.label;
    button.addEventListener('click', () => chooseMethod(button, method.id));
    return button;
  }));
}

function setFeedback(message, correct = false) {
  $('#method-feedback').textContent = message;
  $('#method-feedback').className = `feedback q13-feedback ${correct ? 'ok' : 'no'}`;
}

function chooseMethod(button, method) {
  const expected = acceptableMethods(problems[index]);
  $('#method-options').querySelectorAll('button').forEach(option => option.classList.remove('invalid'));

  if (!expected.includes(method)) {
    button.classList.add('invalid');
    setFeedback(incorrectHint(problems[index], method));
    return;
  }

  button.classList.add('correct');
  $('#method-options').querySelectorAll('button').forEach(option => { option.disabled = true; });
  setFeedback(`Correct. ${explanation(problems[index], method)}`, true);
  $('#complete-text').textContent = `${functionText(problems[index])} can be solved efficiently by ${methods.find(option => option.id === method).label.toLowerCase()}.`;
  $('#complete').hidden = false;
}

function buildPicker() {
  const picker = $('#problem-picker');
  picker.replaceChildren(...problems.map((problem, problemIndex) =>
    new Option(`Example ${problemIndex + 1}: ${functionText(problem)}`, String(problemIndex))));
}

buildPicker();
$('#problem-picker').addEventListener('change', () => {
  index = Number($('#problem-picker').value);
  reset();
});
$('#reset').addEventListener('click', reset);
$('#next-problem').addEventListener('click', () => {
  index = (index + 1) % problems.length;
  reset();
});

reset();
