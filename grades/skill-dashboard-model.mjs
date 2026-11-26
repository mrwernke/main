import { skillExampleIds } from './skill-example-ids.mjs';

export const unitSkills = {
  '2': ['FT3', 'FT4A', 'FT9', 'FT10', 'FT12', 'FT13'],
  '3': Array.from({ length: 19 }, (_, index) => `Q${index + 1}`),
  '4': Array.from({ length: 16 }, (_, index) => `P${index + 1}`),
};

export function summarize(records, period) {
  const profiles = new Map((records.profiles || []).map(profile => [profile.userId, profile]));
  const students = new Map();
  function getStudent(userId) {
    if (!userId) return null;
    const profile = profiles.get(userId);
    const groupId = profile?.groupId || userId;
    if (!students.has(groupId)) {
      students.set(groupId, { groupId, userId, userIds: [], firstName: '', lastName: '',
        period: '', skills: {}, profileTime: '', override: null });
    }
    const student = students.get(groupId);
    if (!student.userIds.includes(userId)) student.userIds.push(userId);
    if (profile?.firstName && profile?.lastName && profile?.period) student.override = profile;
    return student;
  }
  for (const profile of profiles.values()) getStudent(profile.userId);
  for (const check of records.checks) {
    const student = getStudent(check.userId);
    if (!student) continue;
    if (check.firstName && check.lastName && check.period && check.submittedAt >= student.profileTime) {
      Object.assign(student, { firstName: check.firstName, lastName: check.lastName,
        period: check.period, profileTime: check.submittedAt });
    }
    if (!Number.isFinite(check.score) || check.score < 0 || check.score > 1
        || !Number.isFinite(check.elapsedSeconds) || check.elapsedSeconds < 0) continue;
    const skill = student.skills[check.skill] ||= { examples: new Set(), attempts: 0, checkSeconds: 0, best: null };
    skill.attempts++;
    skill.checkSeconds += check.elapsedSeconds;
    skill.best = skill.best === null ? check.score : Math.max(skill.best, check.score);
  }
  for (const event of records.practice) {
    const student = getStudent(event.userId);
    if (!student || event.completions !== 1) continue;
    const codes = event.skill === 'P13–P16' ? ['P13', 'P14', 'P15', 'P16'] : [event.skill];
    for (const code of codes) {
      if (!skillExampleIds[code]?.includes(event.exampleId)) continue;
      const skill = student.skills[code] ||= { examples: new Set(), attempts: 0, checkSeconds: 0, best: null };
      skill.examples.add(event.exampleId);
    }
  }
  for (const student of students.values()) {
    if (student.override) {
      const { firstName, lastName, period: correctedPeriod } = student.override;
      Object.assign(student, { firstName, lastName, period: correctedPeriod });
    }
    student.userIds.sort();
    student.userId = student.userIds[0];
  }
  return [...students.values()].filter(student => period === 'ALL' || student.period === period)
    .sort((a, b) => Number(!a.lastName) - Number(!b.lastName)
      || a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName) || a.userId.localeCompare(b.userId));
}
