// Deploy this separate project as a web app accessible to Only myself.
var SCHOOL_SHEET_ID = 'REPLACE WITH YOUR SCHOOL SPREADSHEET ID';
var ALLOWED_ORIGINS = ['http://127.0.0.1:8000', 'http://localhost:8000', 'https://mrwernke.github.io'];

function doGet(e) {
  var origin = e && e.parameter && e.parameter.origin;
  var nonce = e && e.parameter && e.parameter.nonce;
  if (ALLOWED_ORIGINS.indexOf(origin) === -1 || !/^[a-f0-9-]{36}$/i.test(nonce || '')) {
    return HtmlService.createHtmlOutput('Invalid dashboard request.');
  }
  var html = '<!doctype html><html><body><p id="status">Loading your school spreadsheet…</p><script>'
    + 'const origin=' + JSON.stringify(origin) + ', nonce=' + JSON.stringify(nonce) + ';'
    + 'function send(data,requestId){window.top.opener.postMessage({type:"wmr-school-dashboard",nonce:nonce,data:data,requestId:requestId},origin);}'
    + 'window.addEventListener("message",function(event){'
    + 'if(event.origin!==origin||event.source!==window.top.opener||event.data?.type!=="wmr-roster-command"'
    + '||event.data.nonce!==nonce||typeof event.data.requestId!=="string")return;'
    + 'const id=event.data.requestId;'
    + 'google.script.run.withSuccessHandler(function(data){send({ok:true,records:data},id);})'
    + '.withFailureHandler(function(error){send({ok:false,error:error.message},id);})'
    + '.saveRosterOperation(event.data.operation);});'
    + 'google.script.run.withSuccessHandler(function(data){send({ok:true,records:data},null);'
    + 'document.getElementById("status").textContent="Dashboard connected. Keep this window open while editing students.";})'
    + '.withFailureHandler(function(error){send({ok:false,error:error.message},null);'
    + 'document.getElementById("status").textContent="Unable to load dashboard: "+error.message;})'
    + '.getDashboardData();<\/script></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle('School skill dashboard');
}

function getDashboardData() {
  var spreadsheet = SpreadsheetApp.openById(SCHOOL_SHEET_ID);
  function rows(name, headers) {
    var sheet = spreadsheet.getSheetByName(name);
    if (!sheet) return [];
    var values = sheet.getDataRange().getValues();
    if (headers.some(function(header, index) { return values[0][index] !== header; })) {
      throw new Error('Unexpected columns in the ' + name + ' sheet.');
    }
    return values.slice(1);
  }
  var checks = rows('Skill Checks', ['Attempt ID', 'Submitted At', 'User ID', 'First Name', 'Last Name', 'Period',
    'Skill', 'Problem', 'Elapsed Seconds', 'Score out of 1', 'Process Correct', 'Process Total', 'Final Correct', 'Final Total']);
  var practice = rows('Practice Activity', ['Event ID', 'Recorded At', 'User ID', 'Skill', 'Examples Completed']);
  var profiles = rows('Student Roster', ['Browser ID', 'Group ID', 'First Name', 'Last Name', 'Period']);
  return {
    checks: checks.map(function(row) { return { userId: String(row[2]), firstName: String(row[3]),
      lastName: String(row[4]), period: String(row[5]), skill: String(row[6]),
      elapsedSeconds: Number(row[8]), score: Number(row[9]),
      submittedAt: row[1] instanceof Date ? row[1].toISOString() : String(row[1]) }; }),
    practice: practice.map(function(row) { return { userId: String(row[2]), skill: String(row[3]),
      completions: Number(row[4]), exampleId: row[5] == null ? '' : String(row[5]) }; }),
    profiles: profiles.map(function(row) { return { userId: String(row[0]), groupId: String(row[1]),
      firstName: String(row[2]), lastName: String(row[3]), period: String(row[4]),
      previousFirstName: String(row[5] || ''), previousLastName: String(row[6] || ''),
      previousPeriod: String(row[7] || ''), backupCaptured: row[8] === true }; }),
  };
}

function saveRosterOperation(operation) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var data = getDashboardData();
    var known = Object.create(null);
    data.checks.concat(data.practice, data.profiles).forEach(function(record) {
      if (/^u_[a-z0-9]{1,40}$/.test(record.userId)) known[record.userId] = true;
    });
    var profiles = Object.create(null);
    data.profiles.forEach(function(profile) {
      if (!known[profile.userId] || profiles[profile.userId] || !profile.groupId) {
        throw new Error('Invalid or duplicate browser ID in Student Roster.');
      }
      profiles[profile.userId] = profile;
    });
    function current(id) {
      if (!known[id]) throw new Error('The selected browser is no longer available.');
      return profiles[id] || { userId: id, groupId: id, firstName: '', lastName: '', period: '',
        previousFirstName: '', previousLastName: '', previousPeriod: '', backupCaptured: false };
    }
    function members(groupId) {
      return Object.keys(known).filter(function(id) { return current(id).groupId === groupId; });
    }
    if (!operation || typeof operation !== 'object') throw new Error('Invalid roster operation.');
    var target = current(operation.userId);
    if (operation.action === 'edit') {
      var first = String(operation.firstName || '').trim();
      var last = String(operation.lastName || '').trim();
      var period = String(operation.period || '');
      var names = /^\p{L}+(?:[ '\u2019-]\p{L}+)*$/u;
      if (first.length > 60 || last.length > 60 || !names.test(first) || !names.test(last)
          || ['B2', 'B3', 'G3', 'G4'].indexOf(period) === -1) {
        throw new Error('Enter valid first and last names and a class period.');
      }
      members(target.groupId).forEach(function(id) {
        var profile = current(id);
        profile.firstName = first;
        profile.lastName = last;
        profile.period = period;
        profiles[id] = profile;
      });
    } else if (operation.action === 'merge') {
      var source = current(operation.sourceUserId);
      if (source.groupId === target.groupId) throw new Error('These browsers are already merged.');
      var firstName = String(operation.firstName || '').trim();
      var lastName = String(operation.lastName || '').trim();
      var selectedPeriod = String(operation.period || '');
      var validName = /^\p{L}+(?:[ '\u2019-]\p{L}+)*$/u;
      if (firstName.length > 60 || lastName.length > 60 || !validName.test(firstName)
          || !validName.test(lastName) || ['B2', 'B3', 'G3', 'G4'].indexOf(selectedPeriod) === -1) {
        throw new Error('The destination student needs a valid name and period before merging.');
      }
      members(target.groupId).concat(members(source.groupId)).forEach(function(id) {
        var profile = current(id);
        if (!profile.backupCaptured) {
          profile.previousFirstName = profile.firstName;
          profile.previousLastName = profile.lastName;
          profile.previousPeriod = profile.period;
          profile.backupCaptured = true;
        }
        profile.groupId = target.groupId;
        profile.firstName = firstName;
        profile.lastName = lastName;
        profile.period = selectedPeriod;
        profiles[id] = profile;
      });
    } else if (operation.action === 'unmerge') {
      if (members(target.groupId).length < 2) throw new Error('This browser is not merged.');
      var remaining = members(target.groupId).filter(function(id) { return id !== target.userId; });
      target.groupId = 'g_' + Utilities.getUuid();
      target.firstName = target.previousFirstName;
      target.lastName = target.previousLastName;
      target.period = target.previousPeriod;
      target.previousFirstName = target.previousLastName = target.previousPeriod = '';
      target.backupCaptured = false;
      profiles[target.userId] = target;
      if (remaining.length === 1) {
        var survivor = current(remaining[0]);
        survivor.previousFirstName = survivor.previousLastName = survivor.previousPeriod = '';
        survivor.backupCaptured = false;
        profiles[survivor.userId] = survivor;
      }
    } else {
      throw new Error('Unknown roster operation.');
    }
    var spreadsheet = SpreadsheetApp.openById(SCHOOL_SHEET_ID);
    var sheet = spreadsheet.getSheetByName('Student Roster');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Student Roster');
      sheet.appendRow(['Browser ID', 'Group ID', 'First Name', 'Last Name', 'Period',
        'Previous First Name', 'Previous Last Name', 'Previous Period', 'Backup Captured']);
    }
    var rows = Object.keys(profiles).sort().map(function(id) {
      var p = profiles[id];
      return [p.userId, p.groupId, p.firstName, p.lastName, p.period,
        p.previousFirstName, p.previousLastName, p.previousPeriod, p.backupCaptured];
    });
    sheet.getRange(2, 1, rows.length, 9).setValues(rows);
    return getDashboardData();
  } finally {
    lock.releaseLock();
  }
}
