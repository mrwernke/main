import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize } from './skill-dashboard-model.mjs';
import { skillExampleIds } from './skill-example-ids.mjs';

test('joins anonymous practice to checks, sorts names, and aggregates shared context skills', () => {
  const checks = [
    { userId: 'u_1', firstName: 'Zoe', lastName: 'Allen', period: 'B2', skill: 'P9', submittedAt: '2026-01-01', score: 0.5, elapsedSeconds: 30 },
    { userId: 'u_1', firstName: 'Zoe', lastName: 'Allen', period: 'B2', skill: 'P9', submittedAt: '2026-01-02', score: 0.75, elapsedSeconds: 90 },
    { userId: 'u_2', firstName: 'Ana', lastName: 'Adams', period: 'B2', skill: 'P10', submittedAt: '2026-01-01', score: 1, elapsedSeconds: 10 },
    { userId: 'u_3', firstName: 'Bob', lastName: 'Young', period: 'G3', skill: 'P9', submittedAt: '2026-01-01', score: 1, elapsedSeconds: 10 },
  ];
  const practice = [
    { userId: 'u_1', skill: 'P9', exampleId: '0', completions: 1 },
    { userId: 'u_1', skill: 'P9', exampleId: '0', completions: 1 },
    { userId: 'u_1', skill: 'P9', exampleId: '99', completions: 1 },
    { userId: 'u_1', skill: 'P9', completions: 1 },
    { userId: 'u_1', skill: 'P13–P16', exampleId: '0', completions: 1 },
    { userId: 'u_1', skill: 'P13–P16', exampleId: '1', completions: 1 },
    { userId: 'u_unknown', skill: 'P9', exampleId: '0', completions: 1 },
  ];
  const students = summarize({ checks, practice }, 'B2');
  assert.deepEqual(students.map(student => student.lastName), ['Adams', 'Allen']);
  assert.deepEqual(students[1].skills.P9, { examples: new Set(['0']), attempts: 2, checkSeconds: 120, best: 0.75 });
  assert.equal(skillExampleIds.P9.length, 6);
  for (const code of ['P13', 'P14', 'P15', 'P16']) {
    assert.equal(students[1].skills[code].examples.size, 2);
    assert.equal(skillExampleIds[code].length, 9);
  }
  assert.equal(summarize({ checks: [], practice }, 'B2').length, 0);
});

test('all users includes anonymous browsers and manual merges preserve corrections and distinct practice', () => {
  const checks = [
    { userId: 'u_1', firstName: 'Ana', lastName: 'Wrong', period: 'B2', skill: 'P9', submittedAt: '2026-01-01', score: 0.5, elapsedSeconds: 30 },
    { userId: 'u_2', firstName: 'Ana', lastName: 'Adams', period: 'G3', skill: 'P9', submittedAt: '2026-01-03', score: 1, elapsedSeconds: 40 },
  ];
  const practice = [
    { userId: 'u_1', skill: 'P9', exampleId: '0', completions: 1 },
    { userId: 'u_2', skill: 'P9', exampleId: '0', completions: 1 },
    { userId: 'u_2', skill: 'P9', exampleId: '1', completions: 1 },
    { userId: 'u_3', skill: 'P9', exampleId: '0', completions: 1 },
  ];
  const profiles = ['u_1', 'u_2'].map(userId => ({
    userId, groupId: 'u_1', firstName: 'Ana', lastName: 'Adams', period: 'B3',
  }));
  const students = summarize({ checks, practice, profiles }, 'ALL');
  assert.equal(students.length, 2);
  assert.deepEqual(students[0].userIds, ['u_1', 'u_2']);
  assert.equal(students[0].period, 'B3');
  assert.equal(students[0].skills.P9.examples.size, 2);
  assert.equal(students[0].skills.P9.attempts, 2);
  assert.equal(students[0].skills.P9.best, 1);
  assert.equal(students[0].skills.P9.checkSeconds, 70);
  assert.equal(students[1].userId, 'u_3');
  assert.equal(students[1].lastName, '');
  assert.equal(summarize({ checks, practice, profiles }, 'B2').length, 0);
  const separated = summarize({ checks, practice, profiles: [{ ...profiles[0] },
    { userId: 'u_2', groupId: 'g_separated', firstName: '', lastName: '', period: '' }] }, 'ALL');
  assert.equal(separated.length, 3);
  assert.equal(separated.find(student => student.userId === 'u_2').period, 'G3');
});
