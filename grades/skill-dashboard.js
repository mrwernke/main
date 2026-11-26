import { summarize, unitSkills } from './skill-dashboard-model.mjs';
import { skillExampleIds } from './skill-example-ids.mjs';

const $ = selector => document.querySelector(selector);
let popup;
let nonce;
let records = null;
let bridge;
let bridgeOrigin;
let pending;

function cell(tag, text, parent) {
  const element = document.createElement(tag);
  element.textContent = text;
  parent.append(element);
  return element;
}

function time(seconds) {
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

function render() {
  const table = $('#results');
  table.replaceChildren();
  if (!records) return;
  const skills = unitSkills[$('#unit').value];
  const students = summarize(records, $('#period').value);
  const head = table.createTHead();
  const top = head.insertRow();
  const name = cell('th', 'Student', top);
  name.rowSpan = 2;
  for (const code of skills) cell('th', code, top).colSpan = 2;
  const labels = head.insertRow();
  for (const code of skills) {
    cell('th', 'Practice', labels);
    cell('th', 'Checks', labels);
  }
  const body = table.createTBody();
  for (const student of students) {
    const row = body.insertRow();
    const nameCell = cell('td', student.lastName ? `${student.lastName}, ${student.firstName}` : 'Unnamed browser', row);
    cell('small', `${student.period || 'No period'} · ${student.userIds.join(', ')}`, nameCell);
    for (const code of skills) {
      const data = student.skills[code];
      cell('td', code === 'FT3' ? 'Examples: N/A' : `Examples: ${data?.examples.size || 0}/${skillExampleIds[code].length}`, row);
      const checks = cell('td', `Attempts: ${data?.attempts || 0}`, row);
      cell('small', `Best: ${data?.best == null ? '—' : data.best.toFixed(2)} / 1`, checks);
      cell('small', `Time: ${time(data?.checkSeconds || 0)}`, checks);
    }
  }
  if (!students.length) {
    const row = body.insertRow();
    cell('td', 'No users in this period.', row).colSpan = 1 + skills.length * 2;
  }
}

function studentLabel(student) {
  const name = student.lastName ? `${student.lastName}, ${student.firstName}` : 'Unnamed browser';
  return `${name} (${student.period || 'no period'}) — ${student.userIds.join(', ')}`;
}

function updateEditFields() {
  const student = summarize(records, 'ALL').find(item => item.userId === $('#edit-id').value);
  $('#first-name').value = student?.firstName || '';
  $('#last-name').value = student?.lastName || '';
  $('#edit-period').value = student?.period || '';
}

function renderRoster() {
  if (!records || !Array.isArray(records.profiles)) {
    $('#roster').hidden = true;
    return;
  }
  $('#roster').hidden = false;
  const students = summarize(records, 'ALL');
  for (const selector of ['#edit-id', '#merge-target', '#merge-source']) {
    const select = $(selector);
    const previous = select.value;
    select.replaceChildren(new Option('Choose a student or browser', ''),
      ...students.map(student => new Option(studentLabel(student), student.userId)));
    if (students.some(student => student.userId === previous)) select.value = previous;
  }
  const unmerge = $('#unmerge-id');
  const previous = unmerge.value;
  const options = students.filter(student => student.userIds.length > 1)
    .flatMap(student => student.userIds.map(id => new Option(`${id} — ${studentLabel(student)}`, id)));
  unmerge.replaceChildren(new Option('Choose a browser', ''), ...options);
  if (options.some(option => option.value === previous)) unmerge.value = previous;
  updateEditFields();
}

function sendOperation(operation) {
  if (!bridge || !popup || popup.closed || !nonce) {
    $('#status').textContent = 'The private window is closed. Sign in again before making changes.';
    return;
  }
  if (pending) {
    $('#status').textContent = 'Wait for the current change to finish.';
    return;
  }
  const requestId = crypto.randomUUID();
  const timeout = setTimeout(() => {
    if (pending?.requestId !== requestId) return;
    pending = null;
    $('#status').textContent = 'No confirmation received. Sign in again to refresh before retrying.';
  }, 30000);
  pending = { requestId, timeout };
  bridge.postMessage({ type: 'wmr-roster-command', nonce, requestId, operation }, bridgeOrigin);
  $('#status').textContent = 'Saving the roster change…';
}

$('#edit-id').addEventListener('change', updateEditFields);
$('#edit-student').addEventListener('submit', event => {
  event.preventDefault();
  sendOperation({ action: 'edit', userId: $('#edit-id').value,
    firstName: $('#first-name').value, lastName: $('#last-name').value, period: $('#edit-period').value });
});
$('#merge-student').addEventListener('submit', event => {
  event.preventDefault();
  const students = summarize(records, 'ALL');
  const target = students.find(student => student.userId === $('#merge-target').value);
  const source = students.find(student => student.userId === $('#merge-source').value);
  if (!target || !source || target.groupId === source.groupId) {
    $('#status').textContent = 'Choose two different students to merge.';
    return;
  }
  if (!target.firstName || !target.lastName || !target.period) {
    $('#status').textContent = 'Give the student to keep a name and period before merging.';
    return;
  }
  if (!window.confirm(`Merge ${studentLabel(source)} into ${studentLabel(target)}?`)) return;
  sendOperation({ action: 'merge', userId: target.userId, sourceUserId: source.userId,
    firstName: target.firstName, lastName: target.lastName, period: target.period });
});
$('#unmerge-student').addEventListener('submit', event => {
  event.preventDefault();
  if (!window.confirm(`Separate browser ${$('#unmerge-id').value} from this student?`)) return;
  sendOperation({ action: 'unmerge', userId: $('#unmerge-id').value });
});

$('#connect').addEventListener('submit', event => {
  event.preventDefault();
  let url;
  try { url = new URL($('#url').value.trim()); } catch {
    $('#status').textContent = 'Enter a valid Apps Script web-app URL.';
    return;
  }
  if (url.protocol !== 'https:' || url.hostname !== 'script.google.com'
      || !/^\/(?:a\/macros\/[A-Za-z0-9.-]+|macros)\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname)) {
    $('#status').textContent = 'Enter the private HTTPS Apps Script deployment URL ending in /exec.';
    return;
  }
  nonce = crypto.randomUUID();
  bridge = null;
  bridgeOrigin = null;
  if (pending) clearTimeout(pending.timeout);
  pending = null;
  records = null;
  $('#results').replaceChildren();
  $('#roster').hidden = true;
  url.searchParams.set('origin', location.origin);
  url.searchParams.set('nonce', nonce);
  popup = window.open(url.href, 'school-skill-dashboard', 'popup,width=700,height=700');
  $('#status').textContent = popup ? 'Complete school sign-in in the new window.' : 'Allow popups for this page and try again.';
});

window.addEventListener('message', event => {
  if (!popup || !nonce || !/^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/i.test(event.origin)
      || event.source?.top !== popup || event.data?.type !== 'wmr-school-dashboard' || event.data.nonce !== nonce) return;
  if (bridge && event.source !== bridge) return;
  const requestId = event.data.requestId || null;
  if (requestId && (!pending || requestId !== pending.requestId)) return;
  if (!requestId && bridge) return;
  if (requestId) {
    clearTimeout(pending.timeout);
    pending = null;
  } else {
    bridge = event.source;
    bridgeOrigin = event.origin;
  }
  if (!event.data.data?.ok) {
    $('#status').textContent = `Unable to load records: ${event.data.data?.error || 'Unknown error'}`;
    return;
  }
  const loaded = event.data.data.records;
  if (!Array.isArray(loaded?.checks) || !Array.isArray(loaded?.practice)) {
    $('#status').textContent = 'The dashboard returned an invalid response.';
    return;
  }
  records = loaded;
  $('#status').textContent = Array.isArray(loaded.profiles)
    ? 'Records loaded. Keep the private window open to edit students.'
    : 'Records loaded, but the private script must be updated before editing students.';
  render();
  renderRoster();
});

$('#period').addEventListener('change', render);
$('#unit').addEventListener('change', render);
