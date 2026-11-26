// Set these to the school spreadsheet ID and traffic-log tab name before deploying.
var SCHOOL_SHEET_ID = 'REPLACE WITH YOUR SCHOOL SPREADSHEET ID';
var VISITS_SHEET_NAME = 'REPLACE WITH YOUR VISITS TAB NAME';
var CHECKS_SHEET_NAME = 'Skill Checks';
var PRACTICE_SHEET_NAME = 'Practice Activity';

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function visitsSheet() {
  var sheet = SpreadsheetApp.openById(SCHOOL_SHEET_ID).getSheetByName(VISITS_SHEET_NAME);
  if (!sheet || VISITS_SHEET_NAME === CHECKS_SHEET_NAME) {
    throw new Error('Set VISITS_SHEET_NAME to the existing traffic-log tab name.');
  }
  return sheet;
}

function safeCell(value) {
  var text = String(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function saveSkillCheck(data) {
  var namePattern = /^\p{L}+(?:[ '\u2019-]\p{L}+)*$/u;
  var validCount = function(value) { return Number.isSafeInteger(value) && value >= 0; };
  if (typeof data.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(data.id)
      || typeof data.userId !== 'string' || !/^u_[a-z0-9]{1,40}$/.test(data.userId)
      || typeof data.firstName !== 'string' || data.firstName.length > 60 || !namePattern.test(data.firstName)
      || typeof data.lastName !== 'string' || data.lastName.length > 60 || !namePattern.test(data.lastName)
      || ['B2', 'B3', 'G3', 'G4'].indexOf(data.period) === -1
      || ['P9', 'P10'].indexOf(data.skill) === -1
      || typeof data.problem !== 'string' || data.problem.length > 300
      || !validCount(data.elapsedSeconds) || !validCount(data.processCorrect) || !validCount(data.processTotal)
      || !validCount(data.finalCorrect) || !validCount(data.finalTotal)
      || !data.processTotal || data.finalTotal !== 2
      || data.processCorrect > data.processTotal || data.finalCorrect > data.finalTotal
      || !Number.isFinite(data.score) || data.score < 0 || data.score > 1
      || Math.abs(data.score - (0.5 * data.processCorrect / data.processTotal + 0.5 * data.finalCorrect / data.finalTotal)) > 1e-8
      || typeof data.submittedAt !== 'string' || isNaN(Date.parse(data.submittedAt))) {
    throw new Error('Invalid skill-check record.');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var spreadsheet = SpreadsheetApp.openById(SCHOOL_SHEET_ID);
    var sheet = spreadsheet.getSheetByName(CHECKS_SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(CHECKS_SHEET_NAME);
      sheet.appendRow(['Attempt ID', 'Submitted At', 'User ID', 'First Name', 'Last Name', 'Period',
        'Skill', 'Problem', 'Elapsed Seconds', 'Score out of 1', 'Process Correct', 'Process Total',
        'Final Correct', 'Final Total']);
    }
    var existing = sheet.getLastRow() > 1
      ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(data.id).matchEntireCell(true).findNext()
      : null;
    if (!existing) {
      sheet.appendRow([
        safeCell(data.id), new Date(data.submittedAt), safeCell(data.userId), safeCell(data.firstName),
        safeCell(data.lastName), data.period, data.skill, safeCell(data.problem), data.elapsedSeconds,
        data.score, data.processCorrect, data.processTotal, data.finalCorrect, data.finalTotal,
      ]);
    }
    return { ok: true, attemptId: data.id };
  } finally {
    lock.releaseLock();
  }
}

function savePractice(data) {
  var skills = ['FT3', 'FT4A', 'FT9', 'FT10', 'FT12', 'FT13',
    'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11', 'Q12', 'Q13', 'Q14', 'Q15', 'Q16', 'Q17', 'Q18', 'Q19',
    'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13–P16'];
  if (typeof data.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(data.id)
      || typeof data.userId !== 'string' || !/^u_[a-z0-9]{1,40}$/.test(data.userId)
      || skills.indexOf(data.skill) === -1
      || data.completions !== 1
      || typeof data.exampleId !== 'string' || !/^[a-z0-9-]{1,60}$/.test(data.exampleId)
      || typeof data.recordedAt !== 'string' || isNaN(Date.parse(data.recordedAt))) {
    throw new Error('Invalid practice record.');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var spreadsheet = SpreadsheetApp.openById(SCHOOL_SHEET_ID);
    var sheet = spreadsheet.getSheetByName(PRACTICE_SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(PRACTICE_SHEET_NAME);
      sheet.appendRow(['Event ID', 'Recorded At', 'User ID', 'Skill', 'Examples Completed', 'Example ID']);
    } else {
      var header = sheet.getRange(1, 6);
      if (!header.getValue()) header.setValue('Example ID');
      else if (header.getValue() !== 'Example ID') throw new Error('Unexpected Practice Activity columns.');
    }
    var existing = sheet.getLastRow() > 1
      ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(data.id).matchEntireCell(true).findNext()
      : null;
    if (!existing) sheet.appendRow([safeCell(data.id), new Date(data.recordedAt), safeCell(data.userId),
      data.skill, data.completions, data.exampleId]);
    return { ok: true, eventId: data.id };
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
    if (data.action === 'skill-check') {
      visitsSheet();
      return jsonResponse(saveSkillCheck(data));
    }
    if (data.action === 'practice') {
      visitsSheet();
      return jsonResponse(savePractice(data));
    }
    visitsSheet().appendRow([
      new Date(),
      safeCell(data.userId || 'anonymous'),
      safeCell(data.canvasUsername || 'N/A'),
      safeCell(data.device || 'unknown'),
      safeCell(data.browser || 'unknown'),
      data.isCanvas ? 'Yes' : 'No',
      safeCell(data.page || 'unknown'),
      Number.isSafeInteger(data.visitCount) && data.visitCount > 0 ? data.visitCount : 1,
      safeCell(data.referrer || 'direct'),
    ]);
    return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    if (data && (data.action === 'skill-check' || data.action === 'practice')) return jsonResponse({ ok: false, error: err.toString() });
    return ContentService.createTextOutput('error: ' + err.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter['skill-check-status'] === '1') {
    try {
      visitsSheet();
      return jsonResponse({ service: 'wmr-skill-checks', version: 2 });
    } catch (err) {
      return jsonResponse({ service: 'wmr-skill-checks', version: 2, error: err.toString() });
    }
  }
  return ContentService.createTextOutput('Traffic logger is active!').setMimeType(ContentService.MimeType.TEXT);
}
