import { CHECKS_SCRIPT_URL, getDeviceId } from './site-tracker.js?v=20261126school1';

const queuePrefix = 'wmr_practice_event_';

export function startPracticeTracking(skill) {
  if (!CHECKS_SCRIPT_URL) return;
  let currentSkill = skill;
  let syncing = false;
  let warning;

  function report(message) {
    if (!warning) {
      warning = document.createElement('p');
      warning.setAttribute('role', 'status');
      warning.className = 'instruction';
      document.querySelector('main')?.append(warning);
    }
    warning.textContent = message;
  }

  function exampleId() {
    const picker = document.querySelector('#example-picker, #problem-picker, #function-picker, #graph-picker');
    if (!picker || picker.value === 'custom') return null;
    if (currentSkill === 'P8') {
      const selected = id => [...document.querySelector(id).children]
        .findIndex(button => button.getAttribute('aria-pressed') === 'true');
      const track = selected('#tracks');
      const section = selected('#sections');
      if (track < 0 || section < 0) throw new Error('Could not identify the practice section.');
      return `t${track}-s${section}-${picker.value}`;
    }
    if (currentSkill === 'Q15') {
      const mode = document.querySelector('#non-monic-mode').getAttribute('aria-pressed') === 'true' ? 'nonmonic' : 'monic';
      return `${mode}-${picker.value}`;
    }
    return picker.value;
  }

  function queue(example) {
    const id = crypto.randomUUID();
    const record = {
      action: 'practice', id, userId: getDeviceId(), skill: currentSkill, completions: 1,
      exampleId: example, recordedAt: new Date().toISOString(),
    };
    localStorage.setItem(queuePrefix + id, JSON.stringify(record));
  }

  async function sync() {
    if (syncing) return;
    syncing = true;
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(queuePrefix));
      if (!keys.length) return;
      const statusUrl = new URL(CHECKS_SCRIPT_URL);
      statusUrl.searchParams.set('skill-check-status', '1');
      const statusResponse = await fetch(statusUrl);
      if (!statusResponse.ok) throw new Error(`Tracker unavailable (${statusResponse.status}).`);
      const status = await statusResponse.json();
      if (status.service !== 'wmr-skill-checks' || status.version !== 2 || status.error) {
        throw new Error(status.error || 'The tracker is not ready.');
      }
      let pending = keys;
      while (pending.length) {
        for (const key of pending) {
          const text = localStorage.getItem(key);
          if (text === null) continue;
          const record = JSON.parse(text);
          const response = await fetch(CHECKS_SCRIPT_URL, {
            method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: text, redirect: 'follow', keepalive: true,
          });
          if (!response.ok) throw new Error(`Tracker unavailable (${response.status}).`);
          const result = await response.json();
          if (!result.ok || result.eventId !== record.id) throw new Error(result.error || 'Tracker did not confirm the event.');
          localStorage.removeItem(key);
        }
        pending = Object.keys(localStorage).filter(key => key.startsWith(queuePrefix));
      }
      if (warning) warning.textContent = '';
    } catch (error) {
      report(`Practice activity is saved on this browser but is waiting to reach your teacher: ${error.message}`);
    } finally {
      syncing = false;
    }
  }

  if (['Q1', 'Q2', 'Q3'].includes(skill)) {
    document.addEventListener('click', event => {
      const form = event.target.closest('.form-choice')?.dataset.form;
      const next = { standard: 'Q1', factored: 'Q2', vertex: 'Q3' }[form];
      if (next) currentSkill = next;
    });
  }
  document.addEventListener('wmr-practice-complete', () => {
    try {
      const example = exampleId();
      if (example === null) return;
      if (!/^[a-z0-9-]{1,60}$/.test(example)) throw new Error('Could not identify the completed example.');
      queue(example);
      sync();
    } catch (error) {
      report(`Completed practice could not be saved on this browser: ${error.message}`);
    }
  });
  window.addEventListener('online', sync);
  setInterval(sync, 60000);
  sync();
}
