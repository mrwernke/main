import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalBase44Client } from './localDataStore.js';

test('local base44 client stores and filters student records', async () => {
  const client = createLocalBase44Client();

  const student = await client.entities.Student.create({
    username: 'demo',
    password: 'demo123',
    first_name: 'Demo',
    last_name: 'Student',
    email: 'demo@example.com',
    approval_status: 'approved',
  });

  assert.equal(student.username, 'demo');

  const matches = await client.entities.Student.filter({ username: 'demo' });
  assert.ok(matches.length >= 1);

  const seeded = matches.find((entry) => entry.username === 'demo');
  assert.equal(seeded.password, 'demo123');

  const updated = await client.entities.Student.update(student.id, {
    approval_status: 'approved',
  });

  assert.equal(updated.approval_status, 'approved');

  const createdSlots = await client.entities.CalendarSlot.bulkCreate([
    { slot_date: '2026-07-04', start_time: '09:00', end_time: '09:30', status: 'open' },
    { slot_date: '2026-07-04', start_time: '09:30', end_time: '10:00', status: 'open' },
  ]);

  assert.equal(createdSlots.length, 2);
  const storedSlots = await client.entities.CalendarSlot.filter({ slot_date: '2026-07-04' });
  assert.equal(storedSlots.length, 2);

  const removed = await client.entities.CalendarSlot.delete(createdSlots[0].id);
  assert.equal(removed.id, createdSlots[0].id);

  const remainingSlots = await client.entities.CalendarSlot.filter({ slot_date: '2026-07-04' });
  assert.equal(remainingSlots.length, 1);
});

test('local seed data replaces the question bank with topic-based practice questions', async () => {
  const client = createLocalBase44Client();
  const questions = await client.entities.Question.filter({ usage: 'practice' });

  assert.equal(questions.length, 180);
  assert.ok(questions.some((q) => q.topic === 'Linear equations in 1 variable' && q.difficulty === 'Easy' && q.question_type === 'multiple_choice'));
  assert.ok(questions.some((q) => q.topic === 'Linear equations in 1 variable' && q.difficulty === 'Medium' && q.question_type === 'grid_in'));
  assert.ok(questions.some((q) => q.topic === 'Probability and conditional probability' && q.difficulty === 'Hard' && q.question_type === 'multiple_choice'));
});

test('local seed data adds practice questions for the three practice tests', async () => {
  const client = createLocalBase44Client();
  const test1 = await client.entities.Question.filter({ usage: 'test_1' });
  const test2 = await client.entities.Question.filter({ usage: 'test_2' });
  const test3 = await client.entities.Question.filter({ usage: 'test_3' });

  assert.equal(test1.length, 5);
  assert.equal(test2.length, 5);
  assert.equal(test3.length, 5);
  assert.ok(test1.every((q) => q.usage === 'test_1'));
  assert.ok(test2.every((q) => q.usage === 'test_2'));
  assert.ok(test3.every((q) => q.usage === 'test_3'));
});

test('local upload fallback turns image files into data URLs', async () => {
  const client = createLocalBase44Client();
  const image = {
    type: 'image/png',
    arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
  };

  const result = await client.integrations.Core.UploadFile(image);

  assert.match(result.file_url, /^data:image\/png;base64,/);
});

test('new practice questions persist after being created', async () => {
  const client = createLocalBase44Client();

  const created = await client.entities.Question.create({
    question_text: 'Persist me',
    question_type: 'multiple_choice',
    choice_a: 'A',
    choice_b: 'B',
    choice_c: 'C',
    choice_d: 'D',
    correct_answer: 'A',
    topic: 'Linear equations in 1 variable',
    difficulty: 'Easy',
    explanation: 'Test persistence',
    points: 1,
    usage: 'practice',
  });

  const stored = await client.entities.Question.filter({ usage: 'practice' });
  assert.ok(stored.some((q) => q.id === created.id));
});

