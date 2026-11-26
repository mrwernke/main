import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function tracker() {
  const sheets = new Map();
  function makeSheet(name) {
    const sheet = {
      rows: [],
      appendRow(row) { this.rows.push(row); },
      getLastRow() { return this.rows.length; },
      getRange(row, column) {
        if (row === 1 && column === 6) {
          return {
            getValue: () => sheet.rows[0][5] || '',
            setValue: value => { sheet.rows[0][5] = value; },
          };
        }
        return { createTextFinder: id => ({ matchEntireCell: () => ({
          findNext: () => sheet.rows.slice(1).some(row => row[0] === id) ? {} : null,
        }) }) };
      },
    };
    sheets.set(name, sheet);
    return sheet;
  }
  makeSheet('Visits');
  const context = {
    SpreadsheetApp: { openById: () => ({
      getSheetByName: name => sheets.get(name),
      insertSheet: name => makeSheet(name),
    }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: {
      MimeType: { JSON: 'json', TEXT: 'text' },
      createTextOutput: text => ({ text, setMimeType() { return this; } }),
    },
  };
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL('./tracker-apps-script.gs', import.meta.url), 'utf8'), context);
  context.VISITS_SHEET_NAME = 'Visits';
  return { context, sheets };
}

test('tracker preserves visit rows and appends skill checks once per attempt', () => {
  const { context, sheets } = tracker();
  const post = data => context.doPost({ postData: { contents: JSON.stringify(data) } }).text;
  const status = JSON.parse(context.doGet({ parameter: { 'skill-check-status': '1' } }).text);
  assert.equal(status.service, 'wmr-skill-checks');
  assert.equal(post({ userId: 'u_abc', page: 'Practice', visitCount: 2 }), 'ok');
  assert.equal(sheets.get('Visits').rows[0][1], 'u_abc');
  const attempt = {
    action: 'skill-check', id: 'abc-123', userId: 'u_abc', firstName: 'Ana', lastName: "O'Brien",
    period: 'B2', skill: 'P9', problem: '(x² + 1) ÷ (x + 1)', submittedAt: '2026-01-01T12:00:00.000Z',
    elapsedSeconds: 30, score: 0.75, processCorrect: 5, processTotal: 10, finalCorrect: 2, finalTotal: 2,
  };
  assert.deepEqual(JSON.parse(post(attempt)), { ok: true, attemptId: attempt.id });
  assert.deepEqual(JSON.parse(post(attempt)), { ok: true, attemptId: attempt.id });
  assert.equal(sheets.get('Skill Checks').rows.length, 2);
  assert.equal(sheets.get('Skill Checks').rows[1][2], 'u_abc');
  assert.equal(sheets.get('Skill Checks').rows[1][9], 0.75);
  assert.equal(sheets.get('Visits').rows.length, 1);
});

test('tracker rejects invalid check records and reports missing visits tab', () => {
  const { context, sheets } = tracker();
  const response = context.doPost({ postData: { contents: JSON.stringify({
    action: 'skill-check', firstName: '=malicious',
  }) } }).text;
  assert.equal(JSON.parse(response).ok, false);
  assert.equal(sheets.has('Skill Checks'), false);
  context.VISITS_SHEET_NAME = 'missing';
  assert.match(JSON.parse(context.doGet({ parameter: { 'skill-check-status': '1' } }).text).error, /VISITS_SHEET_NAME/);
});

test('tracker records practice events idempotently and rejects malformed events', () => {
  const { context, sheets } = tracker();
  const post = data => JSON.parse(context.doPost({ postData: { contents: JSON.stringify(data) } }).text);
  const event = {
    action: 'practice', id: 'event-1', userId: 'u_abc', skill: 'P13–P16',
    completions: 1, exampleId: '4', recordedAt: '2026-01-01T12:00:00.000Z',
  };
  assert.deepEqual(post(event), { ok: true, eventId: event.id });
  assert.deepEqual(post(event), { ok: true, eventId: event.id });
  assert.equal(sheets.get('Practice Activity').rows.length, 2);
  assert.deepEqual(Array.from(sheets.get('Practice Activity').rows[1]).slice(2), ['u_abc', 'P13–P16', 1, '4']);
  assert.equal(post({ ...event, id: 'bad', skill: '=1+1' }).ok, false);
  assert.equal(post({ ...event, id: 'bad', completions: -1 }).ok, false);
  assert.equal(post({ ...event, id: 'bad', exampleId: '' }).ok, false);
  sheets.get('Practice Activity').rows[0].pop();
  assert.deepEqual(post({ ...event, id: 'new-event' }), { ok: true, eventId: 'new-event' });
  assert.equal(sheets.get('Practice Activity').rows[0][5], 'Example ID');
});
