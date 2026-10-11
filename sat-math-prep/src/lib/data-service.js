import { apiClient } from '@/api/apiClient';

export const dataService = {
  async getSettings() {
    return apiClient.entities.Settings.list().then((list) => list[0]);
  },

  async loginStudent(username, password) {
    return apiClient.entities.Student.filter({ username, password });
  },

  async getStudentById(id) {
    return apiClient.entities.Student.get(id);
  },

  async createStudent(data) {
    return apiClient.entities.Student.create(data);
  },

  async listQuestions(filter = {}) {
    return apiClient.entities.Question.filter(filter);
  },

  async createPracticeAttempt(data) {
    return apiClient.entities.PracticeAttempt.create(data);
  },

  async listTestResults(filter = {}) {
    return apiClient.entities.TestResult.filter(filter);
  },

  async createTestResult(data) {
    return apiClient.entities.TestResult.create(data);
  },

  async listCalendarSlots(filter = {}) {
    return apiClient.entities.CalendarSlot.filter(filter);
  },

  async updateCalendarSlot(id, updates) {
    return apiClient.entities.CalendarSlot.update(id, updates);
  },

  async sendEmail(payload) {
    return apiClient.integrations.Core.SendEmail(payload);
  },
};

