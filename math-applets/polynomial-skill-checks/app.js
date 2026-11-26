import { examples, gradeLong, gradeSynthetic, normalizeName, validName } from './model.mjs?v=20261125a';
import { polynomialText, termText } from '../polynomial-long-division/model.mjs';
import { CHECKS_SCRIPT_URL, getDeviceId } from '../site-tracker.js?v=20261126school1';

const $ = selector => document.querySelector(selector);
const skill = new URLSearchParams(location.search).get('skill');
const profileKey = 'wmr_check_profile';
const attemptsKey = 'wmr_check_attempts';
const draftKey = `wmr_check_draft_${skill}`;
const periods = ['B2', 'B3', 'G3', 'G4'];
const workForm = $('#work-form');
let profile;
let draft;
let timer;
let syncing = false;

function read(key, fallback) {
  const text = localStorage.getItem(key);
  return text === null ? fallback : JSON.parse(text);
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function showError(message) {
  $('#error').textContent = message;
}

function showSection(id) {
  ['identity', 'dashboard', 'attempt', 'result'].forEach(name => { $(`#${name}`).hidden = name !== id; });
}

function timeText(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function scoreText(score) {
  return score.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function elapsed() {
  return Math.max(0, Math.floor((Date.now() - draft.startedAt) / 1000));
}

function updateTimer() {
  $('#timer').textContent = `Elapsed: ${timeText(elapsed())}`;
}

function renderHistory() {
  const history = $('#history');
  history.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = `${skill} previous attempts`;
  history.append(heading);
  const attempts = read(attemptsKey, []).filter(item => item.skill === skill).reverse();
  if (!attempts.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No previous attempts on this browser.';
    history.append(empty);
    return;
  }
  const list = document.createElement('ul');
  attempts.forEach(attempt => {
    const item = document.createElement('li');
    item.textContent = `${new Date(attempt.submittedAt).toLocaleString()} — ${scoreText(attempt.score)} / 1 — ${timeText(attempt.elapsedSeconds)}${attempt.synced ? '' : ' — waiting to save to teacher'}`;
    list.append(item);
  });
  history.append(list);
}

function updateSyncMessage(message) {
  $('#sync-status').textContent = message;
  $('#result-sync').textContent = message;
}

async function syncPending() {
  if (syncing) return;
  let pending;
  try {
    pending = read(attemptsKey, []).filter(attempt => !attempt.synced);
  } catch (error) {
    showError(`Could not read saved attempts: ${error.message}`);
    return;
  }
  if (!pending.length) {
    updateSyncMessage('');
    $('#retry-sync').hidden = true;
    return;
  }
  syncing = true;
  $('#retry-sync').hidden = true;
  updateSyncMessage('Saving attempts to your teacher’s sheet…');
  try {
    if (!CHECKS_SCRIPT_URL) throw new Error('The school tracker has not been configured.');
    const statusUrl = new URL(CHECKS_SCRIPT_URL);
    statusUrl.searchParams.set('skill-check-status', '1');
    const statusResponse = await fetch(statusUrl);
    if (!statusResponse.ok) throw new Error(`Tracker status request failed (${statusResponse.status}).`);
    const status = await statusResponse.json();
    if (status.service !== 'wmr-skill-checks' || ![1, 2].includes(status.version) || status.error) {
      throw new Error(status.error || 'The teacher’s tracker is not ready for skill checks.');
    }
    while ((pending = read(attemptsKey, []).filter(attempt => !attempt.synced)).length) {
      const attempt = pending[0];
      const response = await fetch(CHECKS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'skill-check', ...attempt }),
        redirect: 'follow',
      });
      if (!response.ok) throw new Error(`Saving failed (${response.status}).`);
      const result = await response.json();
      if (!result.ok || result.attemptId !== attempt.id) throw new Error(result.error || 'The tracker did not confirm the attempt.');
      const all = read(attemptsKey, []);
      const saved = all.find(item => item.id === attempt.id);
      if (!saved) throw new Error('The saved attempt is missing from this browser.');
      saved.synced = true;
      write(attemptsKey, all);
    }
    updateSyncMessage('Attempts saved to your teacher’s sheet.');
  } catch (error) {
    updateSyncMessage(`Saved on this browser, but not yet sent to your teacher: ${error.message} Retry when the tracker is ready.`);
    $('#retry-sync').hidden = false;
  } finally {
    syncing = false;
    renderHistory();
  }
}

function dashboard() {
  clearInterval(timer);
  $('#student').textContent = `${profile.firstName} ${profile.lastName} — ${profile.period}`;
  renderHistory();
  showSection('dashboard');
  syncPending();
}

function cell(row, text = '', className = '') {
  const span = document.createElement('span');
  if (className) span.className = className;
  span.textContent = text;
  row.append(span);
  return span;
}

function field(name, label) {
  const input = document.createElement('input');
  input.type = 'text';
  input.name = name;
  input.autocomplete = 'off';
  input.className = 'division-input';
  input.setAttribute('aria-label', label);
  return input;
}

function row() {
  const element = document.createElement('div');
  element.className = 'division-row';
  return element;
}

function longBoard(example) {
  const board = $('#division');
  const length = example.dividend.length;
  const quotient = row();
  cell(quotient);
  example.dividend.forEach((_, position) => {
    const span = cell(quotient);
    const index = example.rounds.findIndex(round => round.term[position] !== 0);
    if (index !== -1) span.append(field(`term-${index}`, `Quotient term ${index + 1}`));
  });
  board.append(quotient);
  const dividend = row();
  cell(dividend, `(${polynomialText(example.divisor)})`, 'divisor');
  const firstNonzero = example.dividend.findIndex(value => value !== 0);
  example.dividend.forEach((value, position) => cell(dividend,
    value ? termText(value, length - 1 - position, position === firstNonzero) : '',
    `dividend-cell${position === 0 ? ' first' : ''}`));
  board.append(dividend);
  example.rounds.forEach((round, index) => {
    const product = row();
    cell(product);
    for (let position = 0; position < length; position++) {
      if (position === round.productStart) {
        const span = cell(product, '', 'product-cell');
        span.style.gridColumn = `span ${round.productEnd - round.productStart + 1}`;
        span.append('−(', field(`product-${index}`, `Product ${index + 1}`), ')');
        position = round.productEnd;
      } else cell(product);
    }
    board.append(product);
    const result = row();
    cell(result);
    for (let position = 0; position < length; position++) {
      if (position === round.productStart + 1) {
        const span = cell(result);
        span.style.gridColumn = `span ${round.productEnd - round.productStart}`;
        span.append(field(`subtraction-${index}`, `Subtraction result ${index + 1}`));
        position = round.productEnd;
      } else if (round.bringsDown && position === round.productEnd + 1) {
        cell(result).append(field(`broughtDown-${index}`, `Term brought down ${index + 1}`));
      } else cell(result);
    }
    board.append(result);
  });
}

function syntheticBoard(example) {
  const board = $('#division');
  const top = row();
  cell(top, '', 'root-cell').append(field('root', 'Synthetic number'));
  example.dividend.forEach((_, index) => cell(top).append(field(`coefficient-${index}`, `Coefficient ${index + 1}`)));
  const products = row();
  cell(products);
  example.dividend.forEach((_, index) => {
    const span = cell(products);
    if (index > 0) span.append(field(`product-${index - 1}`, `Product ${index}`));
  });
  const results = row();
  cell(results);
  example.dividend.forEach((_, index) => {
    const span = cell(results, '', `result-cell${index === example.dividend.length - 1 ? ' remainder-cell' : ''}`);
    span.append(field(`result-${index}`, index === 0 ? 'First coefficient brought down' : `Sum ${index}`));
  });
  board.append(top, products, results);
}

function answers() {
  const value = name => workForm.elements.namedItem(name)?.value ?? '';
  const example = examples[skill][draft.exampleIndex];
  if (skill === 'P9') {
    return {
      rounds: example.rounds.map((_, index) => ({
        term: value(`term-${index}`), product: value(`product-${index}`),
        subtraction: value(`subtraction-${index}`), broughtDown: value(`broughtDown-${index}`),
      })),
      quotient: value('quotient'), remainder: value('remainder'),
    };
  }
  return {
    coefficients: example.dividend.map((_, index) => value(`coefficient-${index}`)),
    root: value('root'),
    products: example.products.map((_, index) => value(`product-${index}`)),
    results: example.results.map((_, index) => value(`result-${index}`)),
    quotient: value('quotient'), remainder: value('remainder'),
  };
}

function showAttempt() {
  const example = examples[skill][draft.exampleIndex];
  if (!example || !Number.isFinite(draft.startedAt) || !draft.id) throw new Error('The saved check is invalid.');
  $('#problem').textContent = `(${polynomialText(example.dividend)}) ÷ (${polynomialText(example.divisor)})`;
  const board = $('#division');
  board.replaceChildren();
  board.style.setProperty('--columns', example.dividend.length);
  workForm.reset();
  if (skill === 'P9') longBoard(example);
  else syntheticBoard(example);
  Object.entries(draft.fields || {}).forEach(([name, value]) => {
    const control = workForm.elements.namedItem(name);
    if (control) control.value = value;
  });
  showSection('attempt');
  updateTimer();
  clearInterval(timer);
  timer = setInterval(updateTimer, 1000);
}

$('#identity-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const firstName = normalizeName(form.elements.firstName.value);
  const lastName = normalizeName(form.elements.lastName.value);
  const period = form.elements.period.value;
  if (!validName(firstName) || !validName(lastName) || !periods.includes(period)) {
    showError('Enter your first and last name using letters, spaces, apostrophes, or hyphens, and select a class period.');
    return;
  }
  try {
    profile = { firstName, lastName, period, userId: getDeviceId() };
    write(profileKey, profile);
    showError('');
    dashboard();
  } catch (error) {
    showError(`Could not save your information on this browser: ${error.message}`);
  }
});

$('#start').addEventListener('click', () => {
  try {
    const previous = read(attemptsKey, []).filter(item => item.skill === skill).at(-1);
    const choices = examples[skill].map((_, index) => index).filter(index => index !== previous?.exampleIndex);
    const exampleIndex = choices[Math.floor(Math.random() * choices.length)];
    draft = { id: crypto.randomUUID(), exampleIndex, startedAt: Date.now(), fields: {} };
    write(draftKey, draft);
    showError('');
    showAttempt();
  } catch (error) {
    showError(`Could not start the check: ${error.message}`);
  }
});

workForm.addEventListener('input', () => {
  try {
    draft.fields = Object.fromEntries(new FormData(workForm).entries());
    write(draftKey, draft);
    showError('');
  } catch (error) {
    showError(`Could not save your work on this browser: ${error.message}`);
  }
});

workForm.addEventListener('submit', event => {
  event.preventDefault();
  try {
    const example = examples[skill][draft.exampleIndex];
    const grade = skill === 'P9' ? gradeLong(example, answers()) : gradeSynthetic(example, answers());
    const attempt = {
      id: draft.id, userId: profile.userId, firstName: profile.firstName, lastName: profile.lastName,
      period: profile.period, skill, exampleIndex: draft.exampleIndex,
      problem: `(${polynomialText(example.dividend)}) ÷ (${polynomialText(example.divisor)})`,
      submittedAt: new Date().toISOString(), elapsedSeconds: elapsed(), ...grade, synced: false,
    };
    const all = read(attemptsKey, []);
    if (!all.some(item => item.id === attempt.id)) {
      all.push(attempt);
      write(attemptsKey, all);
    }
    localStorage.removeItem(draftKey);
    clearInterval(timer);
    $('#result-summary').textContent = `Score: ${scoreText(grade.score)} / 1. Process: ${grade.processCorrect} / ${grade.processTotal}; final answer: ${grade.finalCorrect} / ${grade.finalTotal}. Time: ${timeText(attempt.elapsedSeconds)}.`;
    showError('');
    showSection('result');
    syncPending();
  } catch (error) {
    showError(`Could not save your check. Your work is still on this screen: ${error.message}`);
  }
});

$('#continue').addEventListener('click', dashboard);
$('#retry-sync').addEventListener('click', syncPending);
window.addEventListener('online', syncPending);

try {
  if (!examples[skill]) throw new Error('Choose a P9 or P10 check from the homepage.');
  $('#title').textContent = `${skill}: ${skill === 'P9' ? 'Long' : 'Synthetic'} Division Skill Check`;
  document.title = $('#title').textContent;
  profile = read(profileKey, null);
  if (!profile) {
    showSection('identity');
  } else {
    if (!validName(profile.firstName) || !validName(profile.lastName) || !periods.includes(profile.period) || profile.userId !== getDeviceId()) {
      throw new Error('Saved student information does not match this browser. Ask your teacher for help.');
    }
    draft = read(draftKey, null);
    const recorded = draft && read(attemptsKey, []).some(item => item.id === draft.id);
    if (recorded) {
      localStorage.removeItem(draftKey);
      draft = null;
    }
    if (draft) {
      showAttempt();
      syncPending();
    } else dashboard();
  }
} catch (error) {
  showError(`Unable to open the skill check: ${error.message}`);
}
