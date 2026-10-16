/*
  SURVEY PAGE
  -----------
  1. Make sure someone is signed in (otherwise send them to the start page).
  2. Load their answers.
  3. Draw the section list and the current section.
  4. Keep the save bar, progress, and show/hide logic up to date.
*/
import { SECTIONS, allQuestions } from './questions/index.js';
import { getUser, ensureRespondent, loadMyAnswers, signOut } from './db.js';
import { createStore } from './store.js';
import { renderQuestion, markDone, h, icon } from './render.js';
import { groupVisible, questionVisible, sectionProgress, isAnswered } from './logic.js';
import { initTheme, initDemoBanner, announce, timeFmt } from './ui.js';

initTheme();
initDemoBanner();

const $ = (s) => document.querySelector(s);
const main = $('#section');
const nav = $('#section-nav');

// Question lookup: id -> { q, group, section } and meta for saving.
const INDEX = {};
const META = {};
for (const { section, group, q } of allQuestions()) {
  INDEX[q.id] = { q, group, section };
  META[q.id] = { section: section.id, label: q.label };
}

let store;
let current = null;

start().catch((err) => {
  console.error(err);
  main.replaceChildren(h('div', { class: 'callout callout-error', role: 'alert' },
    h('h2', {}, 'Something went wrong loading your answers.'),
    h('p', {}, 'Your saved work is safe. Try reloading the page. If it keeps happening, send this to Tapps: ', h('code', {}, String(err.message || err)))));
});

async function start() {
  // Give the magic link a moment to finish signing in.
  let user = await getUser();
  if (!user && location.hash.includes('access_token')) {
    await new Promise((r) => setTimeout(r, 800));
    user = await getUser();
  }
  if (!user) { location.replace('index.html'); return; }
  user = await ensureRespondent(user);
  $('#who').textContent = user.name;
  $('#sign-out').addEventListener('click', async () => { await store?.saveNow(); await signOut(); location.href = 'index.html'; });

  const answers = await loadMyAnswers(user.id);
  store = createStore({ user, answers, meta: META, onStatus: renderSaveBar, onChange: changed });
  const recovered = store.recover();
  if (recovered) announce(`Recovered ${recovered} unsaved ${recovered === 1 ? 'answer' : 'answers'} from last time. Saving now.`);

  $('#save-now').addEventListener('click', async () => {
    await store.saveNow();
    if (store.status === 'saved') announce('All changes saved.');
  });
  renderSaveBar({ status: 'clean' });

  $('#nav-toggle').addEventListener('click', () => {
    const open = $('#nav-toggle').getAttribute('aria-expanded') !== 'true';
    $('#nav-toggle').setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });

  // Strip the login token from the URL so it isn't bookmarked/shared.
  if (location.hash.includes('access_token')) history.replaceState(null, '', location.pathname);

  window.addEventListener('hashchange', () => show(sectionFromHash(), { focus: true }));
  show(sectionFromHash() || SECTIONS[0].id, { focus: false });
}

function sectionFromHash() {
  const id = decodeURIComponent(location.hash.slice(1)).split('/')[0];
  return SECTIONS.find((s) => s.id === id)?.id;
}

// Navigation --------------------------------------------------------------------
function drawNav() {
  nav.replaceChildren(h('ol', { class: 'nav-list' }, SECTIONS.map((s, i) => {
    const p = sectionProgress(s, store.answers);
    const done = p.total > 0 && p.answered === p.total;
    const pct = p.total ? Math.round((p.answered / p.total) * 100) : 0;
    return h('li', {},
      h('a', {
        href: `#${s.id}`, class: `nav-link${done ? ' is-complete' : ''}`, 'aria-current': s.id === current ? 'step' : null,
        onclick: () => { nav.classList.remove('is-open'); $('#nav-toggle').setAttribute('aria-expanded', 'false'); },
      },
      h('span', { class: 'nav-num', 'aria-hidden': 'true' }, done ? icon('check') : String(i + 1)),
      h('span', { class: 'nav-text' },
        h('span', { class: 'nav-title' }, s.title),
        s.kind === 'review' ? null : h('span', { class: 'nav-count' }, `${p.answered} of ${p.total} answered`)),
      s.kind === 'review' ? null : h('span', { class: 'nav-meter', 'aria-hidden': 'true' }, h('span', { style: `inline-size:${pct}%` }))));
  })));
  // Overall
  let a = 0; let t = 0;
  for (const s of SECTIONS) { const p = sectionProgress(s, store.answers); a += p.answered; t += p.total; }
  const pct = t ? Math.round((a / t) * 100) : 0;
  $('#overall').replaceChildren(
    h('span', { class: 'overall-text' }, `${pct}% done`, h('span', { class: 'sr-only' }, ` — ${a} of ${t} questions answered`)),
    h('progress', { max: t || 1, value: a, 'aria-hidden': 'true' }));
  const cur = SECTIONS.find((s) => s.id === current);
  $('#nav-toggle-label').textContent = cur ? cur.title : 'Sections';
}

// Section -----------------------------------------------------------------------
function show(id, { focus }) {
  if (!id) return;
  current = id;
  const section = SECTIONS.find((s) => s.id === id);
  const idx = SECTIONS.indexOf(section);
  const ctx = { store };

  const body = h('div', { class: 'section-body' });
  if (section.kind === 'review') body.append(reviewSummary());

  for (const g of section.groups) {
    const gEl = h('section', { class: 'group', 'data-group': g.id, 'aria-labelledby': `g-${g.id.replace(/\W/g, '-')}` },
      h('h2', { id: `g-${g.id.replace(/\W/g, '-')}` }, g.title),
      g.intro ? h('p', { class: 'group-intro' }, g.intro) : null,
      g.questions.map((q) => renderQuestion(q, ctx)));
    body.append(gEl);
  }

  const prev = SECTIONS[idx - 1];
  const next = SECTIONS[idx + 1];
  const pager = h('nav', { class: 'pager', 'aria-label': 'Previous and next section' },
    prev ? h('a', { class: 'btn btn-secondary', href: `#${prev.id}` }, h('span', { class: 'sr-only' }, 'Previous section: '), `← ${prev.title}`) : h('span'),
    next ? h('a', { class: 'btn btn-primary', href: `#${next.id}` }, h('span', { class: 'sr-only' }, 'Next section: '), `${next.title} →`) : null);

  const heading = h('h1', { tabindex: '-1', id: 'section-title' }, section.title);
  main.replaceChildren(
    h('header', { class: 'section-head' },
      h('p', { class: 'eyebrow' }, `Section ${idx + 1} of ${SECTIONS.length}`),
      heading,
      section.intro ? h('p', { class: 'lede' }, section.intro) : null),
    body, pager);

  document.title = `${section.title} · Game Blueprint`;
  applyVisibility();
  refreshDone();
  drawNav();
  if (focus) { heading.focus(); window.scrollTo({ top: 0 }); }

  // Deep link to a specific question: #section/question-id
  const qid = decodeURIComponent(location.hash.slice(1)).split('/')[1];
  if (qid) {
    const el = document.getElementById(`q-${qid.replace(/[^a-z0-9]+/gi, '-')}`);
    if (el) { el.scrollIntoView({ block: 'start' }); el.querySelector('input, textarea, select')?.focus({ preventScroll: true }); }
  }
}

function applyVisibility() {
  main.querySelectorAll('[data-group]').forEach((gEl) => {
    const { section } = INDEX[gEl.querySelector('[data-qid]')?.dataset.qid] || {};
    const g = section?.groups.find((x) => x.id === gEl.dataset.group);
    if (g) gEl.hidden = !groupVisible(g, store.answers);
  });
  main.querySelectorAll('[data-qid]').forEach((qEl) => {
    const info = INDEX[qEl.dataset.qid];
    if (info) qEl.hidden = !questionVisible(info.group, info.q, store.answers);
  });
}

function refreshDone(onlyId) {
  const ids = onlyId ? [onlyId] : Object.keys(INDEX);
  for (const id of ids) markDone(main, id, INDEX[id].q, store.answers[id]);
}

let navTimer;
function changed(qid) {
  refreshDone(qid);
  applyVisibility();
  clearTimeout(navTimer);
  navTimer = setTimeout(drawNav, 300);
}

// Save bar ------------------------------------------------------------------------
let lastAnnounced = null;
function renderSaveBar({ status, lastSavedAt, retryIn, recovered }) {
  const btn = $('#save-now');
  const label = $('#save-now-label');
  const msg = $('#save-status');
  const bar = $('#save-bar');
  bar.dataset.status = status;
  const at = lastSavedAt ? ` at ${timeFmt.format(lastSavedAt)}` : '';
  btn.replaceChildren();

  switch (status) {
    case 'dirty':
      btn.disabled = false;
      btn.append(icon('cloud'), h('span', { id: 'save-now-label' }, 'Save progress'));
      msg.replaceChildren(icon('dot'), h('span', {}, 'Unsaved changes — saving automatically'));
      break;
    case 'saving':
      btn.disabled = true;
      btn.append(h('span', { class: 'spinner', 'aria-hidden': 'true' }), h('span', { id: 'save-now-label' }, 'Saving…'));
      msg.replaceChildren(h('span', { class: 'spinner', 'aria-hidden': 'true' }), h('span', {}, 'Saving…'));
      break;
    case 'error':
      btn.disabled = false;
      btn.append(icon('alert'), h('span', { id: 'save-now-label' }, 'Try saving again'));
      msg.replaceChildren(icon('alert'), h('span', {}, `Couldn’t reach the server. Your work is kept on this device; retrying in ${Math.round((retryIn || 2000) / 1000)}s.`));
      if (lastAnnounced !== 'error') announce('Saving failed. Your work is kept on this device and we will keep retrying.');
      break;
    case 'saved':
    case 'clean':
    default:
      btn.disabled = true;
      btn.append(icon('check'), h('span', { id: 'save-now-label' }, 'Saved'));
      msg.replaceChildren(icon('check'), h('span', {}, status === 'clean' ? 'Everything is saved' : `All changes saved${at}`));
      if (recovered) announce('Connection is back. All changes saved.');
  }
  lastAnnounced = status;
  void label;
}

// Review summary ----------------------------------------------------------------
function reviewSummary() {
  const wrap = h('div', { class: 'review' });
  const missing = []; const guesses = []; const shallow = []; const gaps = [];
  for (const { section, group, q } of allQuestions()) {
    if (section.kind === 'review' || q.type === 'info') continue;
    if (!questionVisible(group, q, store.answers)) continue;
    const a = store.answers[q.id];
    if (!isAnswered(q, a)) missing.push({ section, q });
    if (a?.certainty === 'guess' || a?.certainty === 'ask') guesses.push({ section, q, a });
    if (q.why && isAnswered(q, a) && (a.why || []).filter((s) => s && s.trim()).length < 2) shallow.push({ section, q });
    if (q.type === 'matrix' && a?.value) {
      for (const r of q.rows) if (['notyet', 'unsure'].includes(a.value[r.id]?.status)) gaps.push({ section, q, r });
    }
  }
  const link = (section, q, text) => h('a', { href: `#${section.id}/${q.id}` }, text || q.label);
  const block = (title, intro, items, render) => h('section', { class: 'review-block' },
    h('h2', {}, `${title} `, h('span', { class: 'count' }, `(${items.length})`)),
    h('p', { class: 'group-intro' }, intro),
    items.length
      ? h('ul', { class: 'review-list' })
      : h('p', { class: 'empty' }, icon('check'), ' Nothing here.'));

  const bySection = (items, render) => {
    const out = [];
    for (const s of SECTIONS) {
      const mine = items.filter((x) => x.section.id === s.id);
      if (mine.length) out.push(h('li', {}, h('strong', {}, s.title), h('ul', {}, mine.map(render))));
    }
    return out;
  };

  wrap.append(
    block('Not answered yet', 'Only questions that apply based on your other answers.', missing, null),
    block('Guesses and “someone else decides”', 'These need a real decision from someone.', guesses, null),
    block('Why ladders that stopped early', 'Answered, but only one “why.” One more level often finds the real reason.', shallow, null),
    block('Accessibility gaps', 'Rows marked “Not yet” or “Not sure.”', gaps, null),
  );
  // Fill lists grouped by section (replace the flat lists).
  const blocks = wrap.querySelectorAll('.review-block');
  const fill = (i, items, render) => {
    const ul = blocks[i].querySelector('.review-list');
    if (ul) ul.replaceChildren(...bySection(items, render));
  };
  fill(0, missing, ({ section, q }) => h('li', {}, link(section, q)));
  fill(1, guesses, ({ section, q, a }) => h('li', {}, link(section, q), h('span', { class: 'tag' }, a.certainty === 'ask' ? `Ask: ${a.certainty_who || 'someone'}` : 'Guess')));
  fill(2, shallow, ({ section, q }) => h('li', {}, link(section, q)));
  fill(3, gaps, ({ section, q, r }) => h('li', {}, link(section, q, r.label)));
  return wrap;
}
