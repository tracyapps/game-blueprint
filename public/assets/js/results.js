/*
  RESULTS PAGE (admins only)
  --------------------------
  The database only returns everyone's answers to emails listed in the
  `admins` table, so this page can't leak anything to a non-admin even if
  they find the URL. Everything below is just counting and grouping.
*/
import { SECTIONS, allQuestions, ROOT_TYPES, CERTAINTY } from './questions/index.js';
import { LEVELS, RATINGS } from './questions/naming.js';
import { A11Y_STATUS } from './questions/templates.js';
import { getUser, amIAdmin, loadEverything, loadHistoryCsvRows } from './db.js';
import { h } from './render.js';
import { formatAnswer, isAnswered, questionVisible, sectionProgress } from './logic.js';
import { initTheme, initDemoBanner, announce } from './ui.js';

initTheme();
initDemoBanner();

const out = document.getElementById('results');
const statusEl = document.getElementById('results-status');
const Q = {};
for (const x of allQuestions()) Q[x.q.id] = x;

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

(async () => {
  const user = await getUser();
  if (!user) { location.replace('index.html'); return; }
  if (!(await amIAdmin())) {
    statusEl.textContent = 'This page is only for the project lead. Your own answers are on the survey page.';
    return;
  }
  const data = await loadEverything();
  draw(data);
})().catch((err) => {
  console.error(err);
  statusEl.textContent = `Couldn’t load results: ${err.message || err}`;
});

function draw({ people, answers, historyCount }) {
  // answers grouped by person
  const byPerson = {};
  for (const p of people) byPerson[p.id] = {};
  for (const a of answers) (byPerson[a.respondent_id] ||= {})[a.question_id] = a;
  const name = (id) => people.find((p) => p.id === id)?.name || 'Unknown';

  statusEl.textContent = `${people.length} ${people.length === 1 ? 'person' : 'people'} · ${answers.length} answers saved${historyCount != null ? ` · ${historyCount} changes logged` : ''}.`;
  document.querySelector('.results-toc').hidden = false;

  out.replaceChildren(
    peopleSection(people, byPerson),
    disagreeSection(people, byPerson),
    settledSection(answers),
    rootsSection(answers),
    namingSection(answers, name),
    accessSection(answers),
    allSection(people, answers, name),
  );
}

// helpers ---------------------------------------------------------------------
function block(id, title, intro, ...content) {
  return h('section', { class: 'results-block', id, 'aria-labelledby': `${id}-h` },
    h('h2', { id: `${id}-h` }, title), intro ? h('p', { class: 'group-intro' }, intro) : null, ...content);
}
function table(caption, head, rows, { numericFrom = 1 } = {}) {
  return h('div', { class: 'table-wrap', role: 'region', 'aria-label': caption, tabindex: '0' },
    h('table', {},
      h('caption', { class: 'sr-only' }, caption),
      h('thead', {}, h('tr', {}, head.map((c, i) => h('th', { scope: 'col', class: i >= numericFrom ? 'num' : null }, c)))),
      h('tbody', {}, rows.length ? rows : h('tr', {}, h('td', { colspan: head.length, class: 'empty-cell' }, 'Nothing yet.')))));
}
/** A number with a small bar behind it. The number is the real content. */
function barCell(n, max) {
  const pct = max ? Math.round((n / max) * 100) : 0;
  return h('td', { class: 'num bar-cell' }, h('span', { class: 'bar', style: `inline-size:${pct}%`, 'aria-hidden': 'true' }), h('span', { class: 'bar-num' }, String(n)));
}
const optLabel = (q, v) => (v === '__other' ? 'Other' : q.options?.find((o) => o.value === v)?.label || v);

// 1. People -----------------------------------------------------------------------
function peopleSection(people, byPerson) {
  const head = ['Person', 'Overall', ...SECTIONS.filter((s) => s.kind !== 'review').map((s) => s.title), 'Last saved'];
  const rows = people.map((p) => {
    const ans = byPerson[p.id] || {};
    let a = 0; let t = 0;
    const cells = SECTIONS.filter((s) => s.kind !== 'review').map((s) => {
      const pr = sectionProgress(s, ans); a += pr.answered; t += pr.total;
      return h('td', { class: 'num' }, `${pr.answered}/${pr.total}`);
    });
    const last = Object.values(ans).map((x) => x.updated_at).filter(Boolean).sort().pop();
    return h('tr', {},
      h('th', { scope: 'row' }, p.name, h('br'), h('span', { class: 'muted small' }, p.email)),
      h('td', { class: 'num' }, t ? `${Math.round((a / t) * 100)}%` : '—'),
      ...cells,
      h('td', { class: 'num small' }, last ? dateFmt.format(new Date(last)) : '—'));
  });
  return block('people', 'People and progress', 'Counts only include questions that apply to each person’s earlier answers.', table('Progress by person and section', head, rows));
}

// 2. Disagreement ---------------------------------------------------------------------
function disagreeSection(people, byPerson) {
  const items = [];
  for (const { section, group, q } of allQuestions()) {
    if (q.type !== 'choice') continue;
    const counts = {};
    let n = 0;
    for (const p of people) {
      const a = byPerson[p.id]?.[q.id];
      if (!a || !questionVisible(group, q, byPerson[p.id]) || !isAnswered(q, a)) continue;
      counts[a.value] = (counts[a.value] || 0) + 1; n += 1;
    }
    const distinct = Object.keys(counts).length;
    if (n >= 2 && distinct > 1) items.push({ section, q, counts, n, split: 1 - Math.max(...Object.values(counts)) / n });
  }
  items.sort((a, b) => b.split - a.split);
  const content = items.length
    ? h('ul', { class: 'disagree-list' }, items.map(({ section, q, counts, n }) => h('li', {},
      h('p', { class: 'small muted' }, section.title),
      h('p', { class: 'strong' }, q.label),
      h('ul', { class: 'split' }, Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([v, c]) =>
        h('li', {}, h('span', { class: 'split-bar', style: `inline-size:${Math.round((c / n) * 100)}%`, 'aria-hidden': 'true' }), h('span', {}, `${optLabel(q, v)} — ${c} of ${n}`)))))))
    : h('p', { class: 'empty' }, people.length < 2 ? 'Needs at least two people’s answers.' : 'No disagreements on multiple-choice questions yet.');
  return block('disagree', 'Where the team disagrees', 'Multiple-choice questions where people picked different answers, most split first. These are the conversations to have in a meeting.', content);
}

// 3. Certainty -------------------------------------------------------------------------
function settledSection(answers) {
  const max = Math.max(1, ...SECTIONS.map((s) => answers.filter((a) => Q[a.question_id]?.section.id === s.id && a.certainty).length));
  const rows = SECTIONS.filter((s) => s.kind !== 'review').map((s) => {
    const mine = answers.filter((a) => Q[a.question_id]?.section.id === s.id);
    return h('tr', {}, h('th', { scope: 'row' }, s.title),
      ...CERTAINTY.map((c) => barCell(mine.filter((a) => a.certainty === c.value).length, max)));
  });
  return block('settled', 'How settled is the thinking?', 'Every answer can be marked decided, leaning, a guess, or someone else’s call. Lots of guesses in a game = not ready to build.',
    table('Certainty by section', ['Section', ...CERTAINTY.map((c) => c.label)], rows));
}

// 4. Why roots ---------------------------------------------------------------------------
function rootsSection(answers) {
  const withRoot = answers.filter((a) => a.root);
  const max = Math.max(1, ...SECTIONS.flatMap((s) => ROOT_TYPES.map((r) => withRoot.filter((a) => Q[a.question_id]?.section.id === s.id && a.root === r.value).length)));
  const rows = SECTIONS.filter((s) => s.kind !== 'review').map((s) => {
    const mine = withRoot.filter((a) => Q[a.question_id]?.section.id === s.id);
    return h('tr', {}, h('th', { scope: 'row' }, s.title), ...ROOT_TYPES.map((r) => barCell(mine.filter((a) => a.root === r.value).length, max)));
  });
  const depth = answers.filter((a) => (a.why || []).some((x) => x && x.trim()));
  const avg = depth.length ? (depth.reduce((n, a) => n + a.why.filter((x) => x && x.trim()).length, 0) / depth.length).toFixed(1) : '—';
  const tradition = withRoot.filter((a) => a.root === 'tradition');
  return block('roots', 'What the decisions are really based on', `When someone hits the bottom of a why ladder, they label the reason. Average ladder depth: ${avg} whys.`,
    table('Root reasons by section', ['Section', ...ROOT_TYPES.map((r) => r.label.split(' — ')[0])], rows),
    tradition.length ? h('div', { class: 'callout' }, h('p', { class: 'strong' }, `${tradition.length} decisions rest on “that’s how it’s usually done.”`),
      h('p', {}, 'Worth questioning first — tradition is a fine reason, but it’s the one most likely to hide an assumption.')) : null);
}

// 5. Naming --------------------------------------------------------------------------------
function namingSection(answers, name) {
  const blocks = LEVELS.map((lvl) => {
    const mine = answers.filter((a) => a.question_id === lvl.id && a.value);
    const terms = new Set(lvl.terms);
    mine.forEach((a) => (a.value.added || []).forEach((t) => terms.add(t)));
    const n = mine.length;
    const rows = [...terms].map((t) => {
      const c = { all: 0, some: 0, none: 0 };
      mine.forEach((a) => { const r = a.value.ratings?.[t]; if (r) c[r] += 1; });
      const picks = mine.filter((a) => a.value.pick === t).length;
      const score = c.all * 2 + c.some - c.none * 2 + picks * 3;
      return { t, c, picks, score, added: !lvl.terms.includes(t) };
    }).sort((a, b) => b.score - a.score);
    const max = Math.max(1, n);
    const top = rows[0];
    return h('div', { class: 'naming-level' },
      h('h3', {}, lvl.title),
      n ? h('p', {}, `Leading: `, h('strong', {}, top?.t || '—'), ` · ${n} ${n === 1 ? 'person' : 'people'} sorted this.`) : h('p', { class: 'muted' }, 'No one has sorted this yet.'),
      n ? table(`${lvl.title}: word ratings`, ['Word', ...RATINGS.map((r) => r.label), 'Picked as the ONE'],
        rows.map((r) => h('tr', {}, h('th', { scope: 'row' }, r.t, r.added ? h('span', { class: 'tag' }, 'added') : null),
          barCell(r.c.all, max), barCell(r.c.some, max), barCell(r.c.none, max), barCell(r.picks, max)))) : null,
      n ? h('details', {}, h('summary', {}, 'See each person’s proof sentences'),
        h('ul', {}, mine.map((a) => h('li', {}, h('strong', {}, `${name(a.respondent_id)} → ${a.value.pick || 'no pick'}: `),
          Object.entries(a.value.proof || {}).filter(([, s]) => s).map(([g, s]) => `${g}: ${s}`).join(' · ') || 'no sentences')))) : null);
  });
  return block('naming', 'Name it: consensus', 'Score = fits every game ×2, fits some ×1, doesn’t fit −2, picked ×3. A high score with no “doesn’t fit” votes is a safe word.', ...blocks);
}

// 6. Accessibility ------------------------------------------------------------------------
function accessSection(answers) {
  const games = SECTIONS.filter((s) => s.kind === 'game');
  const parts = games.map((g) => {
    const qid = g.groups.flatMap((x) => x.questions).find((q) => q.type === 'matrix')?.id;
    if (!qid) return null;
    const { q } = Q[qid];
    const mine = answers.filter((a) => a.question_id === qid && a.value);
    const max = Math.max(1, mine.length);
    return h('div', {}, h('h3', {}, g.title),
      table(`${g.title}: accessibility status`, ['Player', ...A11Y_STATUS.map((s) => s.label)],
        q.rows.map((r) => h('tr', {}, h('th', { scope: 'row' }, r.label),
          ...A11Y_STATUS.map((s) => barCell(mine.filter((a) => a.value[r.id]?.status === s.value).length, max))))));
  });
  return block('access', 'Accessibility gaps by game', 'How many people said each kind of player is fully included. “Not yet” is the build list.', ...parts.filter(Boolean));
}

// 7. All answers + CSV -----------------------------------------------------------------------
function allSection(people, answers, name) {
  const personSel = h('select', { id: 'f-person' }, h('option', { value: '' }, 'Everyone'), people.map((p) => h('option', { value: p.id }, p.name)));
  const sectionSel = h('select', { id: 'f-section' }, h('option', { value: '' }, 'All sections'), SECTIONS.map((s) => h('option', { value: s.id }, s.title)));
  const search = h('input', { id: 'f-search', type: 'search', autocomplete: 'off' });
  const tbody = h('tbody');
  const count = h('p', { class: 'muted', role: 'status' });

  const rowsFor = () => {
    const term = search.value.trim().toLowerCase();
    return answers.filter((a) => Q[a.question_id])
      .filter((a) => !personSel.value || a.respondent_id === personSel.value)
      .filter((a) => !sectionSel.value || Q[a.question_id].section.id === sectionSel.value)
      .map((a) => {
        const { q, section } = Q[a.question_id];
        return {
          person: name(a.respondent_id), section: section.title, question: q.label, qid: q.id,
          answer: formatAnswer(q, a), certainty: CERTAINTY.find((c) => c.value === a.certainty)?.label || '',
          who: a.certainty_who || '',
          why: (a.why || []).filter((x) => x && x.trim()).join(' → '),
          root: ROOT_TYPES.find((r) => r.value === a.root)?.label || '', root_note: a.root_note || '',
          updated: a.updated_at || '',
        };
      })
      .filter((r) => !term || Object.values(r).some((v) => String(v).toLowerCase().includes(term)));
  };

  const redraw = () => {
    const rows = rowsFor();
    count.textContent = `${rows.length} answers shown.`;
    tbody.replaceChildren(...rows.slice(0, 500).map((r) => h('tr', {},
      h('td', {}, r.person), h('td', {}, r.section), h('td', {}, r.question),
      h('td', { class: 'pre' }, r.answer), h('td', {}, r.certainty, r.who ? ` (${r.who})` : ''),
      h('td', {}, r.why), h('td', {}, r.root))));
  };
  [personSel, sectionSel].forEach((el) => el.addEventListener('change', redraw));
  search.addEventListener('input', () => { clearTimeout(search._t); search._t = setTimeout(redraw, 200); });

  const csvBtn = h('button', { type: 'button', class: 'btn btn-primary', onclick: () => {
    const rows = rowsFor();
    download('game-blueprint-answers.csv', toCsv(rows, ['person', 'section', 'qid', 'question', 'answer', 'certainty', 'who', 'why', 'root', 'root_note', 'updated']));
    announce(`Downloaded ${rows.length} answers.`);
  } }, 'Download these as CSV');
  const histBtn = h('button', { type: 'button', class: 'btn btn-secondary', onclick: async () => {
    const rows = await loadHistoryCsvRows();
    download('game-blueprint-history.csv', toCsv(rows.map((r) => ({ ...r, value: JSON.stringify(r.value), why_chain: (r.why_chain || []).join(' → ') })),
      ['changed_at', 'name', 'email', 'section_id', 'question_id', 'value', 'other_text', 'certainty', 'certainty_who', 'why_chain', 'why_root', 'why_root_note']));
    announce(`Downloaded ${rows.length} history rows.`);
  } }, 'Download full change history (CSV)');

  const content = h('div', {},
    h('div', { class: 'filters' },
      h('div', { class: 'field' }, h('label', { for: 'f-person' }, 'Person'), personSel),
      h('div', { class: 'field' }, h('label', { for: 'f-section' }, 'Section'), sectionSel),
      h('div', { class: 'field' }, h('label', { for: 'f-search' }, 'Search'), search)),
    h('div', { class: 'actions' }, csvBtn, histBtn),
    count,
    h('div', { class: 'table-wrap', role: 'region', 'aria-label': 'Answers table', tabindex: '0' },
      h('table', { class: 'answers-table' },
        h('caption', { class: 'sr-only' }, 'Every answer'),
        h('thead', {}, h('tr', {}, ['Person', 'Section', 'Question', 'Answer', 'How settled', 'Why ladder', 'Root'].map((c) => h('th', { scope: 'col' }, c)))),
        tbody)),
    h('p', { class: 'small muted' }, 'Shows the first 500 rows; the CSV always includes every matching row.'));
  redraw();
  return block('all', 'Every answer', 'Filter, search, or download. The CSV opens in Excel, Numbers or Google Sheets.', content);
}

function toCsv(rows, cols) {
  const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return '﻿' + [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\r\n');
}
function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = h('a', { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
