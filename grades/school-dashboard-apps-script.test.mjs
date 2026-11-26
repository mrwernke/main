import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function dashboard(sheets) {
  function sheet(name) {
    if (!sheets[name]) return null;
    return {
      getDataRange: () => ({ getValues: () => sheets[name] }),
      appendRow: row => sheets[name].push(row),
      getRange: (row, column) => ({ setValues: values => {
        values.forEach((value, index) => { sheets[name][row - 1 + index] = Array.from(value); });
      } }),
    };
  }
  const context = {
    SpreadsheetApp: { openById: () => ({
      getSheetByName: sheet,
      insertSheet: name => { sheets[name] = []; return sheet(name); },
    }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { getUuid: () => 'separated' },
    HtmlService: { createHtmlOutput: text => ({ text, setTitle() { return this; } }) },
  };
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL('./school-dashboard-apps-script.gs', import.meta.url), 'utf8'), context);
  return context;
}

test('private dashboard only accepts allowed origins and a valid nonce', () => {
  const script = dashboard({});
  assert.match(script.doGet({ parameter: { origin: 'https://evil.example', nonce: '0'.repeat(36) } }).text, /Invalid/);
  assert.match(script.doGet({ parameter: { origin: 'http://127.0.0.1:8000', nonce: 'bad' } }).text, /Invalid/);
  assert.match(script.doGet({ parameter: { origin: 'http://127.0.0.1:8000', nonce: '0'.repeat(36) } }).text, /getDashboardData/);
});

test('roster edits, merges and separates browsers without changing check records', () => {
  const sheets = {
    'Skill Checks': [
      ['Attempt ID', 'Submitted At', 'User ID', 'First Name', 'Last Name', 'Period', 'Skill', 'Problem',
        'Elapsed Seconds', 'Score out of 1', 'Process Correct', 'Process Total', 'Final Correct', 'Final Total'],
      ['a', '2026-01-01', 'u_1', 'Ana', 'Wrong', 'B2', 'P9', 'problem', 30, 0.5, 1, 2, 1, 2],
      ['b', '2026-01-02', 'u_2', 'Ana', 'Adams', 'G3', 'P10', 'problem', 40, 1, 2, 2, 2, 2],
    ],
  };
  const script = dashboard(sheets);
  const edit = { action: 'edit', userId: 'u_1', firstName: 'Ana', lastName: 'Adams', period: 'B3' };
  let result = script.saveRosterOperation(edit);
  assert.equal(result.profiles[0].period, 'B3');
  assert.equal(sheets['Skill Checks'][1][4], 'Wrong');
  script.saveRosterOperation({ action: 'edit', userId: 'u_2', firstName: 'Ann', lastName: 'Adams', period: 'G4' });
  result = script.saveRosterOperation({ ...edit, action: 'merge', sourceUserId: 'u_2' });
  assert.equal(result.profiles.length, 2);
  assert.equal(result.profiles[0].groupId, result.profiles[1].groupId);
  assert.equal(result.profiles[1].period, 'B3');
  assert.throws(() => script.saveRosterOperation({ ...edit, action: 'merge', sourceUserId: 'u_2' }), /already merged/);
  assert.throws(() => script.saveRosterOperation({ ...edit, lastName: '=malicious' }), /valid/);
  result = script.saveRosterOperation({ action: 'unmerge', userId: 'u_2' });
  assert.notEqual(result.profiles[0].groupId, result.profiles[1].groupId);
  assert.equal(result.profiles[1].firstName, 'Ann');
  assert.equal(result.profiles[1].period, 'G4');
  assert.equal(result.checks[1].period, 'G3');
  script.saveRosterOperation({ ...edit, action: 'merge', sourceUserId: 'u_2' });
  result = script.saveRosterOperation({ action: 'unmerge', userId: 'u_1' });
  assert.equal(result.profiles[0].firstName, 'Ana');
  assert.equal(result.profiles[0].period, 'B3');
  assert.equal(result.profiles[1].period, 'B3');
});

test('private dashboard reads only expected sheet columns and rejects wrong headers', () => {
  const sheets = {
    'Skill Checks': [
      ['Attempt ID', 'Submitted At', 'User ID', 'First Name', 'Last Name', 'Period', 'Skill', 'Problem',
        'Elapsed Seconds', 'Score out of 1', 'Process Correct', 'Process Total', 'Final Correct', 'Final Total'],
      ['id', '2026-01-01', 'u_1', 'Ana', 'Adams', 'B2', 'P9', 'problem', 30, 0.75, 1, 2, 2, 2],
    ],
    'Practice Activity': [
      ['Event ID', 'Recorded At', 'User ID', 'Skill', 'Examples Completed', 'Example ID'],
      ['event', '2026-01-01', 'u_1', 'P9', 1, '2'],
    ],
  };
  const script = dashboard(sheets);
  const result = script.getDashboardData();
  assert.equal(result.checks[0].firstName, 'Ana');
  assert.equal(result.practice[0].completions, 1);
  assert.equal(result.practice[0].exampleId, '2');
  sheets['Practice Activity'][0][3] = 'Wrong column';
  assert.throws(() => script.getDashboardData(), /Unexpected columns/);
});
