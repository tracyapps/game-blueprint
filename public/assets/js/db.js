/*
  DATA LAYER
  ----------
  Everything that talks to the database lives here, so the rest of the
  code never cares whether we're live (Supabase) or in preview mode
  (this browser's localStorage).
*/
import { CONFIG, DEMO } from './config.js';

const SUPABASE_ESM = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
let client = null;

async function sb() {
  if (DEMO) return null;
  if (!client) {
    const { createClient } = await import(SUPABASE_ESM);
    client = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
      // "implicit" lets a link requested on a laptop open on a phone.
      auth: { flowType: 'implicit', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return client;
}

// Safe localStorage (private windows can throw) ----------------------------
export const local = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  },
  remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Auth ---------------------------------------------------------------------

/** Returns { id, email, name } or null. */
export async function getUser() {
  if (DEMO) return local.get('gb-demo-user');
  const c = await sb();
  const { data } = await c.auth.getSession();
  const u = data.session?.user;
  if (!u) return null;
  return { id: u.id, email: u.email, name: u.user_metadata?.name || '' };
}

export async function sendSignIn(name, email) {
  local.set('gb-pending-name', name);
  if (DEMO) {
    const id = 'demo-' + email.toLowerCase();
    local.set('gb-demo-user', { id, email, name });
    return { demo: true };
  }
  const c = await sb();
  const { error } = await c.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: { name },
      emailRedirectTo: new URL('survey.html', location.href).href,
    },
  });
  if (error) throw error;
  return { demo: false };
}

export async function verifyCode(email, code) {
  const c = await sb();
  const { error } = await c.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) throw error;
}

export async function signOut() {
  if (DEMO) { local.remove('gb-demo-user'); return; }
  const c = await sb();
  await c.auth.signOut();
}

/** Make sure there's a respondents row; keeps their name current. */
export async function ensureRespondent(user) {
  const pending = local.get('gb-pending-name');
  const name = (pending || user.name || user.email.split('@')[0]).trim();
  if (DEMO) {
    const u = { ...user, name };
    local.set('gb-demo-user', u);
    return u;
  }
  const c = await sb();
  const { error } = await c.from('respondents').upsert(
    { id: user.id, email: user.email, name, last_seen_at: new Date().toISOString() },
    { onConflict: 'id' },
  );
  if (error) throw error;
  local.remove('gb-pending-name');
  return { ...user, name };
}

// Answers ------------------------------------------------------------------

// The client keeps answers as { value, other, certainty, certainty_who,
// why, root, root_note, updated_at }. These two functions translate to
// and from the database columns.
export function toRow(userId, qid, a, meta) {
  return {
    respondent_id: userId,
    question_id: qid,
    section_id: meta.section,
    question_text: meta.label,
    value: a.value ?? null,
    other_text: a.other || null,
    certainty: a.certainty || null,
    certainty_who: a.certainty_who || null,
    why_chain: a.why || [],
    why_root: a.root || null,
    why_root_note: a.root_note || null,
    updated_at: new Date().toISOString(),
  };
}

export function fromRow(r) {
  return {
    value: r.value,
    other: r.other_text || '',
    certainty: r.certainty || '',
    certainty_who: r.certainty_who || '',
    why: r.why_chain || [],
    root: r.why_root || '',
    root_note: r.why_root_note || '',
    updated_at: r.updated_at,
  };
}

export async function loadMyAnswers(userId) {
  if (DEMO) {
    await wait(150);
    return local.get('gb-demo-answers-' + userId, {});
  }
  const c = await sb();
  const { data, error } = await c.from('answers').select('*').eq('respondent_id', userId);
  if (error) throw error;
  const out = {};
  for (const r of data) out[r.question_id] = fromRow(r);
  return out;
}

/** rows: array from toRow(). Upserts all of them in one request. */
export async function saveRows(userId, rows) {
  if (DEMO) {
    await wait(350); // feel like a network
    if (local.get('gb-demo-fail')) throw new Error('Preview mode: simulated save failure');
    const all = local.get('gb-demo-answers-' + userId, {});
    for (const r of rows) all[r.question_id] = fromRow(r);
    local.set('gb-demo-answers-' + userId, all);
    return;
  }
  const c = await sb();
  const { error } = await c.from('answers').upsert(rows, { onConflict: 'respondent_id,question_id' });
  if (error) throw error;
}

// Results (admins only — the database enforces this, not the page) --------

export async function amIAdmin() {
  if (DEMO) return true;
  const c = await sb();
  const { data, error } = await c.rpc('is_admin');
  if (error) return false;
  return data === true;
}

export async function loadEverything() {
  if (DEMO) {
    const me = local.get('gb-demo-user');
    const people = me ? [{ id: me.id, name: me.name, email: me.email, created_at: null, last_seen_at: null }] : [];
    const answers = me
      ? Object.entries(local.get('gb-demo-answers-' + me.id, {})).map(([qid, a]) => ({ respondent_id: me.id, question_id: qid, ...a }))
      : [];
    return { people, answers, historyCount: null };
  }
  const c = await sb();
  const [p, a, h] = await Promise.all([
    c.from('respondents').select('*').order('name'),
    c.from('answers').select('*'),
    c.from('answer_history').select('id', { count: 'exact', head: true }),
  ]);
  if (p.error) throw p.error;
  if (a.error) throw a.error;
  return {
    people: p.data,
    answers: a.data.map((r) => ({ respondent_id: r.respondent_id, question_id: r.question_id, ...fromRow(r) })),
    historyCount: h.count ?? null,
  };
}

export async function loadHistoryCsvRows() {
  if (DEMO) return [];
  const c = await sb();
  const { data, error } = await c.from('answer_history_sheet').select('*').order('changed_at');
  if (error) throw error;
  return data;
}
