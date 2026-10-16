/*
  AUTOSAVE
  --------
  - Every change marks that question "dirty".
  - 1.2s after typing stops (or right away when a field loses focus),
    all dirty questions are saved in one request.
  - Unsaved changes are also copied to this browser as a safety net, so a
    dropped connection or closed tab doesn't lose work.
  - If a save fails, it retries (2s, 5s, 15s, 30s…) and says so.
  status: 'clean' | 'dirty' | 'saving' | 'saved' | 'error'
*/
import { saveRows, toRow, local } from './db.js';

const RETRY = [2000, 5000, 15000, 30000];

export function createStore({ user, answers, meta, onStatus, onChange }) {
  const dirty = new Map(); // qid -> version number at time of change
  let version = 0;
  let timer = null;
  let saving = false;
  let attempt = 0;
  let status = 'clean';
  let lastSavedAt = null;
  const backupKey = 'gb-unsaved-' + user.id;

  function setStatus(s, extra = {}) {
    status = s;
    onStatus?.({ status, lastSavedAt, ...extra });
  }

  function backup() {
    const pending = {};
    for (const qid of dirty.keys()) pending[qid] = answers[qid];
    local.set(backupKey, pending);
  }

  /** Merge a patch into a question's answer and schedule a save. */
  function update(qid, patch, { immediate = false } = {}) {
    answers[qid] = { ...(answers[qid] || {}), ...patch };
    version += 1;
    dirty.set(qid, version);
    backup();
    if (status !== 'saving') setStatus('dirty');
    onChange?.(qid);
    schedule(immediate ? 0 : 1200);
  }

  function schedule(ms) {
    clearTimeout(timer);
    timer = setTimeout(flush, ms);
  }

  async function flush() {
    clearTimeout(timer);
    if (saving || dirty.size === 0) {
      if (!saving && dirty.size === 0 && status !== 'saved' && status !== 'clean') setStatus('saved');
      return;
    }
    saving = true;
    const batch = [...dirty.entries()];
    setStatus('saving');
    try {
      const rows = batch.map(([qid]) => toRow(user.id, qid, answers[qid], meta[qid] || { section: '', label: qid }));
      await saveRows(user.id, rows);
      // Only clear entries that weren't edited again while saving.
      for (const [qid, ver] of batch) if (dirty.get(qid) === ver) dirty.delete(qid);
      attempt = 0;
      lastSavedAt = new Date();
      saving = false;
      if (dirty.size) { backup(); setStatus('dirty'); schedule(400); return; }
      local.remove(backupKey);
      setStatus('saved', { recovered: status === 'error' });
    } catch (err) {
      saving = false;
      const delay = RETRY[Math.min(attempt, RETRY.length - 1)];
      attempt += 1;
      setStatus('error', { error: err, retryIn: delay });
      schedule(delay);
    }
  }

  /** Bring back anything left unsaved last time (e.g., tab closed offline). */
  function recover() {
    const pending = local.get(backupKey, {});
    const ids = Object.keys(pending);
    for (const qid of ids) {
      answers[qid] = pending[qid];
      dirty.set(qid, ++version);
    }
    if (ids.length) { setStatus('dirty'); schedule(300); }
    return ids.length;
  }

  window.addEventListener('beforeunload', (e) => {
    if (dirty.size || saving) { backup(); e.preventDefault(); e.returnValue = ''; }
  });
  window.addEventListener('online', () => { if (dirty.size) schedule(0); });

  return {
    answers,
    get: (qid) => answers[qid] || {},
    update,
    saveNow: () => { attempt = 0; return flush(); },
    recover,
    get status() { return status; },
    get lastSavedAt() { return lastSavedAt; },
  };
}
