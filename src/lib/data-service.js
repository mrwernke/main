import { base44 } from '@/api/base44Client';

export const dataService = {
  async getSettings() {
    return base44.entities.Settings.list().then((list) => list[0]);
  },

  async loginStudent(username, password) {
    return base44.entities.Student.filter({ username, password });
  },

  async getStudentById(id) {
    return base44.entities.Student.get(id);
  },

  async createStudent(data) {
    return base44.entities.Student.create(data);
  },

  async listQuestions(filter = {}) {
    return base44.entities.Question.filter(filter);
  },

  async createPracticeAttempt(data) {
    return base44.entities.PracticeAttempt.create(data);
  },

  async listTestResults(filter = {}) {
    return base44.entities.TestResult.filter(filter);
  },

  async createTestResult(data) {
    return base44.entities.TestResult.create(data);
  },

  async listCalendarSlots(filter = {}) {
    return base44.entities.CalendarSlot.filter(filter);
  },

  async updateCalendarSlot(id, updates) {
    return base44.entities.CalendarSlot.update(id, updates);
  },

  async sendEmail(payload) {
    return base44.integrations.Core.SendEmail(payload);
  },
};

