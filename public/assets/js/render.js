/*
  RENDERING
  ---------
  Builds the HTML for questions. Uses a tiny helper, h(), instead of
  template strings so anything people type is always treated as text
  (never as HTML).

    h('p', { class: 'hint' }, 'Some text')  →  <p class="hint">Some text</p>

  Each question type has one function below. They all receive
  (q, ctx) where ctx = { store, onAnyChange } and return a DOM element.
*/
import { WHY_PROMPTS, ROOT_TYPES, CERTAINTY } from './questions/index.js';
import { GAMES, RATINGS } from './questions/naming.js';
import { isAnswered } from './logic.js';

// h() ----------------------------------------------------------------------
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'text') el.textContent = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const slug = (s) => String(s).replace(/[^a-z0-9]+/gi, '-');
const fid = (qid, ...parts) => ['f', slug(qid), ...parts.map(slug)].join('-');

// Icons (decorative; meaning is always also in text) -----------------------
export function icon(name) {
  const paths = {
    check: 'M5 12.5l4.5 4.5L19 7.5',
    cloud: 'M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 9.1 4.5 4.5 0 0 0 7 18z',
    alert: 'M12 8v5M12 16.5v.5M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    dot: 'M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
    plus: 'M12 5v14M5 12h14',
    x: 'M6 6l12 12M18 6 6 18',
    up: 'M12 19V5M5 12l7-7 7 7',
    down: 'M12 5v14M19 12l-7 7-7-7',
    arrow: 'M5 12h14M13 5l7 7-7 7',
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('icon', `icon-${name}`);
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', paths[name]);
  svg.append(p);
  return svg;
}

// Shared bits --------------------------------------------------------------

function hint(q, id) {
  return q.help ? h('p', { class: 'hint', id }, q.help) : null;
}

/** Textarea that saves while typing and immediately on blur. */
function textarea({ id, value, describedby, onInput, onBlur, rows = 3, label }) {
  const t = h('textarea', { id, rows, 'aria-describedby': describedby, 'aria-label': label });
  t.value = value || '';
  t.addEventListener('input', () => onInput(t.value));
  t.addEventListener('blur', () => onBlur?.(t.value));
  return t;
}

function input({ id, value, describedby, onInput, onBlur, label, type = 'text', autocomplete = 'off' }) {
  const i = h('input', { id, type, autocomplete, 'aria-describedby': describedby, 'aria-label': label });
  i.value = value || '';
  i.addEventListener('input', () => onInput(i.value));
  i.addEventListener('blur', () => onBlur?.(i.value));
  return i;
}

function radioRow({ name, legend, legendClass = '', options, value, onChange, small = false }) {
  return h('fieldset', { class: `radio-row${small ? ' small' : ''}` },
    h('legend', { class: legendClass }, legend),
    h('div', { class: 'radio-row-options' },
      options.map((o) => {
        const id = `${name}-${slug(o.value)}`;
        const r = h('input', { type: 'radio', id, name, value: o.value, checked: value === o.value });
        r.addEventListener('change', () => onChange(o.value));
        return h('label', { class: 'pill', for: id }, r, h('span', {}, o.label));
      })),
  );
}

// Certainty ("How settled is this?") ----------------------------------------
function certaintyBlock(q, ctx) {
  const a = ctx.store.get(q.id);
  const wrap = h('div', { class: 'certainty' });
  const whoId = fid(q.id, 'who');
  const who = h('div', { class: 'field certainty-who', hidden: a.certainty !== 'ask' },
    h('label', { for: whoId }, 'Who decides?'),
    input({ id: whoId, value: a.certainty_who, onInput: (v) => ctx.store.update(q.id, { certainty_who: v }), onBlur: () => ctx.store.saveNow() }));
  wrap.append(
    radioRow({
      name: fid(q.id, 'certainty'), legend: 'How settled is this?', small: true,
      options: CERTAINTY, value: a.certainty,
      onChange: (v) => {
        ctx.store.update(q.id, { certainty: v }, { immediate: true });
        who.hidden = v !== 'ask';
      },
    }),
    who,
  );
  return wrap;
}

// Why ladder ----------------------------------------------------------------
function whyLadder(q, ctx) {
  const box = h('div', { class: 'why', 'data-why': q.id });
  const headingId = fid(q.id, 'why-h');
  box.append(
    h('p', { class: 'why-title', id: headingId }, 'Dig deeper'),
    h('p', { class: 'hint why-hint' }, 'Keep asking why until you hit the real reason. Two or three levels is usually where it gets interesting.'),
  );
  const steps = h('ol', { class: 'why-steps', 'aria-labelledby': headingId });
  const actions = h('div', { class: 'why-actions' });
  const rootBox = h('div', { class: 'why-root' });
  box.append(steps, actions, rootBox);

  let rootOpen = !!ctx.store.get(q.id).root;

  function chain() { return [...(ctx.store.get(q.id).why || [])]; }

  function draw(focusIndex = null) {
    const why = chain();
    const count = Math.max(1, why.length);
    steps.replaceChildren();
    for (let i = 0; i < count; i++) {
      const id = fid(q.id, 'why', i);
      const t = textarea({
        id, value: why[i], rows: 2,
        onInput: (v) => {
          const c = chain(); c[i] = v;
          ctx.store.update(q.id, { why: c });
          drawActions();
        },
        onBlur: () => ctx.store.saveNow(),
      });
      steps.append(h('li', { class: 'why-step' }, h('label', { for: id }, WHY_PROMPTS[i] || 'Why?'), t));
      if (focusIndex === i) requestAnimationFrame(() => t.focus());
    }
    drawActions();
    drawRoot();
  }

  function drawActions() {
    const why = chain();
    const last = (why[why.length - 1] || '').trim();
    actions.replaceChildren();
    if (why.length < WHY_PROMPTS.length) {
      actions.append(h('button', {
        type: 'button', class: 'btn btn-quiet', disabled: !last,
        onclick: () => {
          const c = chain(); if (!c.length) c.push('');
          c.push('');
          ctx.store.update(q.id, { why: c });
          draw(c.length - 1);
        },
      }, 'Ask why again'));
    }
    if (!rootOpen) {
      actions.append(h('button', {
        type: 'button', class: 'btn btn-quiet', disabled: !why.some((s) => (s || '').trim()),
        onclick: () => { rootOpen = true; drawActions(); drawRoot(true); },
      }, 'That’s the root reason'));
    }
  }

  function drawRoot(focus = false) {
    rootBox.replaceChildren();
    if (!rootOpen) return;
    const a = ctx.store.get(q.id);
    const noteId = fid(q.id, 'root-note');
    const fs = radioRow({
      name: fid(q.id, 'root'), legend: 'What kind of reason is it, at the bottom?',
      options: ROOT_TYPES, value: a.root,
      onChange: (v) => ctx.store.update(q.id, { root: v }, { immediate: true }),
    });
    fs.classList.add('stack');
    rootBox.append(fs,
      h('div', { class: 'field' },
        h('label', { for: noteId }, 'Anything to add? (optional)'),
        input({ id: noteId, value: a.root_note, onInput: (v) => ctx.store.update(q.id, { root_note: v }), onBlur: () => ctx.store.saveNow() })));
    if (focus) requestAnimationFrame(() => fs.querySelector('input')?.focus());
  }

  draw();
  return box;
}

// Question wrapper ----------------------------------------------------------
function frame(q, ctx, { control, isFieldset, labelFor }) {
  const helpId = fid(q.id, 'help');
  const wrap = h(isFieldset ? 'fieldset' : 'div', { class: `q q-${q.type}`, 'data-qid': q.id, id: `q-${slug(q.id)}` });
  const labelEl = isFieldset
    ? h('legend', { class: 'q-label' }, q.label)
    : h('label', { class: 'q-label', for: labelFor }, q.label);
  const status = h('span', { class: 'q-done', 'data-done': q.id }, icon('check'), h('span', { class: 'sr-only' }, 'Answered'));
  wrap.append(...[h('div', { class: 'q-head' }, labelEl, status), hint(q, helpId), control].filter(Boolean));
  const usesCertainty = q.certainty ?? ['text', 'short', 'choice', 'multi', 'cardsort'].includes(q.type);
  if (q.why) wrap.append(whyLadder(q, ctx));
  if (usesCertainty) wrap.append(certaintyBlock(q, ctx));
  return wrap;
}

// Types ---------------------------------------------------------------------

const TYPES = {
  text(q, ctx) {
    const id = fid(q.id);
    const a = ctx.store.get(q.id);
    const control = textarea({
      id, value: a.value, describedby: q.help ? fid(q.id, 'help') : null, rows: 3,
      onInput: (v) => ctx.store.update(q.id, { value: v }),
      onBlur: () => ctx.store.saveNow(),
    });
    return frame(q, ctx, { control, labelFor: id });
  },

  short(q, ctx) {
    const id = fid(q.id);
    const a = ctx.store.get(q.id);
    const control = input({
      id, value: a.value, describedby: q.help ? fid(q.id, 'help') : null,
      onInput: (v) => ctx.store.update(q.id, { value: v }),
      onBlur: () => ctx.store.saveNow(),
    });
    return frame(q, ctx, { control, labelFor: id });
  },

  choice(q, ctx) { return choiceLike(q, ctx, 'radio'); },
  multi(q, ctx) { return choiceLike(q, ctx, 'checkbox'); },

  list(q, ctx) {
    const box = h('div', { class: 'repeater' });
    const ol = h('ol', { class: 'repeater-list' });
    const get = () => [...(ctx.store.get(q.id).value || [])];
    const draw = (focusIndex = null) => {
      let items = get();
      const min = Math.max(1, q.min || 1);
      while (items.length < min) items.push('');
      ol.replaceChildren();
      items.forEach((val, i) => {
        const id = fid(q.id, i);
        const label = `${q.itemLabel || 'Item'} ${i + 1}`;
        const t = textarea({
          id, value: val, rows: 1,
          onInput: (v) => { const c = padded(); c[i] = v; ctx.store.update(q.id, { value: c }); },
          onBlur: () => ctx.store.saveNow(),
        });
        const li = h('li', { class: 'repeater-row' },
          h('label', { for: id, class: 'repeater-label' }, label),
          h('div', { class: 'repeater-field' }, t,
            rowTools(i, items.length, label, {
              up: () => move(i, -1), down: () => move(i, 1),
              remove: items.length > 1 ? () => { const c = padded(); c.splice(i, 1); ctx.store.update(q.id, { value: c }, { immediate: true }); draw(Math.max(0, i - 1)); } : null,
            })));
        ol.append(li);
        if (focusIndex === i) requestAnimationFrame(() => t.focus());
      });
      function padded() { const c = get(); while (c.length < items.length) c.push(''); return c; }
      function move(i2, d) {
        const c = padded(); const j = i2 + d; if (j < 0 || j >= c.length) return;
        [c[i2], c[j]] = [c[j], c[i2]];
        ctx.store.update(q.id, { value: c }, { immediate: true }); draw(j);
      }
    };
    box.append(ol, h('button', {
      type: 'button', class: 'btn btn-quiet',
      onclick: () => { const c = get(); const min = Math.max(1, q.min || 1); while (c.length < min) c.push(''); c.push(''); ctx.store.update(q.id, { value: c }); draw(c.length - 1); },
    }, icon('plus'), `Add ${(q.itemLabel || 'item').toLowerCase()}`));
    draw();
    return frame(q, ctx, { control: box, isFieldset: true });
  },

  records(q, ctx) {
    const box = h('div', { class: 'records' });
    const list = h('div', { class: 'records-list' });
    const get = () => (ctx.store.get(q.id).value || []).map((r) => ({ ...r }));
    const draw = (focusIndex = null) => {
      let recs = get();
      const min = Math.max(1, q.min || 1);
      while (recs.length < min) recs.push({});
      list.replaceChildren();
      recs.forEach((rec, i) => {
        const legend = `${q.itemLabel || 'Entry'} ${i + 1}`;
        const fs = h('fieldset', { class: 'record' }, h('legend', {}, legend));
        q.fields.forEach((f, fi) => {
          const id = fid(q.id, i, f.id);
          const make = f.type === 'text' ? textarea : input;
          const ctl = make({
            id, value: rec[f.id], rows: 2,
            onInput: (v) => { const c = padded(); c[i] = { ...c[i], [f.id]: v }; ctx.store.update(q.id, { value: c }); },
            onBlur: () => ctx.store.saveNow(),
          });
          fs.append(h('div', { class: 'field' }, h('label', { for: id }, f.label), ctl));
          if (focusIndex === i && fi === 0) requestAnimationFrame(() => ctl.focus());
        });
        if (recs.length > min) {
          fs.append(h('button', {
            type: 'button', class: 'btn btn-quiet btn-danger',
            onclick: () => { const c = padded(); c.splice(i, 1); ctx.store.update(q.id, { value: c }, { immediate: true }); draw(Math.max(0, i - 1)); },
          }, icon('x'), `Remove ${legend.toLowerCase()}`));
        }
        list.append(fs);
      });
      function padded() { const c = get(); while (c.length < recs.length) c.push({}); return c; }
    };
    box.append(list, h('button', {
      type: 'button', class: 'btn btn-quiet',
      onclick: () => { const c = get(); const min = Math.max(1, q.min || 1); while (c.length < min) c.push({}); c.push({}); ctx.store.update(q.id, { value: c }); draw(c.length - 1); },
    }, icon('plus'), `Add ${(q.itemLabel || 'entry').toLowerCase()}`));
    draw();
    return frame(q, ctx, { control: box, isFieldset: true });
  },

  matrix(q, ctx) {
    const box = h('div', { class: 'matrix' });
    const get = () => ({ ...(ctx.store.get(q.id).value || {}) });
    q.rows.forEach((row) => {
      const cur = get()[row.id] || {};
      const noteId = fid(q.id, row.id, 'note');
      const fs = h('fieldset', { class: 'matrix-row' },
        h('legend', {}, row.label),
        radioRow({
          name: fid(q.id, row.id), legend: 'Status', legendClass: 'sr-only', small: true,
          options: q.statuses, value: cur.status,
          onChange: (v) => { const c = get(); c[row.id] = { ...(c[row.id] || {}), status: v }; ctx.store.update(q.id, { value: c }, { immediate: true }); fs.dataset.status = v; },
        }),
        h('div', { class: 'field' },
          h('label', { for: noteId }, 'How do they play fully?'),
          textarea({
            id: noteId, value: cur.note, rows: 2,
            onInput: (v) => { const c = get(); c[row.id] = { ...(c[row.id] || {}), note: v }; ctx.store.update(q.id, { value: c }); },
            onBlur: () => ctx.store.saveNow(),
          })));
      if (cur.status) fs.dataset.status = cur.status;
      box.append(fs);
    });
    return frame(q, ctx, { control: box, isFieldset: true });
  },

  cardsort(q, ctx) {
    const lvl = q.level;
    const box = h('div', { class: 'cardsort' });
    const get = () => {
      const v = ctx.store.get(q.id).value || {};
      return { ratings: { ...(v.ratings || {}) }, added: [...(v.added || [])], pick: v.pick || '', proof: { ...(v.proof || {}) } };
    };
    const save = (v, opts) => ctx.store.update(q.id, { value: v }, opts);

    const cards = h('ul', { class: 'cards', role: 'list' });
    const addRow = h('div', { class: 'card-add' });
    const pickBox = h('div', { class: 'card-pick' });
    const proofBox = h('div', { class: 'card-proof' });

    function terms() { const v = get(); return [...lvl.terms, ...v.added]; }

    function drawCards(focusTerm = null) {
      const v = get();
      cards.replaceChildren();
      for (const term of terms()) {
        const name = fid(q.id, 'rate', term);
        const li = h('li', { class: 'card', 'data-rating': v.ratings[term] || '' },
          h('fieldset', {},
            h('legend', { class: 'card-term' }, term, v.added.includes(term) ? h('span', { class: 'tag' }, 'added') : null),
            h('div', { class: 'card-options' },
              RATINGS.map((r) => {
                const id = `${name}-${r.value}`;
                const radio = h('input', { type: 'radio', name, id, value: r.value, checked: v.ratings[term] === r.value });
                radio.addEventListener('change', () => {
                  const c = get(); c.ratings[term] = r.value; save(c, { immediate: true });
                  li.dataset.rating = r.value; drawPick();
                });
                return h('label', { class: 'pill', for: id }, radio, h('span', {}, r.label));
              }))));
        if (v.added.includes(term)) {
          li.append(h('button', {
            type: 'button', class: 'btn btn-quiet btn-small',
            onclick: () => {
              const c = get(); c.added = c.added.filter((t) => t !== term); delete c.ratings[term];
              if (c.pick === term) c.pick = '';
              save(c, { immediate: true }); drawCards(); drawPick(); drawProof();
              addInput.focus();
            },
          }, icon('x'), h('span', {}, 'Remove ', h('span', { class: 'sr-only' }, term))));
        }
        cards.append(li);
        if (focusTerm === term) requestAnimationFrame(() => li.querySelector('input')?.focus());
      }
    }

    const addId = fid(q.id, 'add');
    const addInput = h('input', { id: addId, type: 'text', autocomplete: 'off' });
    const addBtn = h('button', { type: 'submit', class: 'btn btn-quiet' }, icon('plus'), 'Add word');
    const addForm = h('form', { class: 'inline-form', onsubmit: (e) => {
      e.preventDefault();
      const t = addInput.value.trim().replace(/\s+/g, ' ');
      if (!t) return;
      const c = get();
      const exists = terms().find((x) => x.toLowerCase() === t.toLowerCase());
      addInput.value = '';
      if (exists) { drawCards(exists); return; }
      c.added.push(t); save(c, { immediate: true });
      drawCards(t); drawPick();
    } },
    h('label', { for: addId }, 'Missing a better word? Add it'),
    h('div', { class: 'inline-form-row' }, addInput, addBtn));
    addRow.append(addForm);

    function drawPick() {
      const v = get();
      const pickId = fid(q.id, 'pick');
      const fits = terms().filter((t) => v.ratings[t] === 'all');
      const sel = h('select', { id: pickId, 'aria-describedby': fid(q.id, 'pick-help') },
        h('option', { value: '' }, '— Choose one —'),
        fits.length ? h('optgroup', { label: 'You said these fit every game' }, fits.map((t) => h('option', { value: t, selected: v.pick === t }, t))) : null,
        h('optgroup', { label: fits.length ? 'Everything else' : 'All words' },
          terms().filter((t) => !fits.includes(t)).map((t) => h('option', { value: t, selected: v.pick === t }, t))));
      sel.addEventListener('change', () => { const c = get(); c.pick = sel.value; save(c, { immediate: true }); drawProof(); });
      pickBox.replaceChildren(
        h('label', { for: pickId, class: 'pick-label' }, 'Your ONE pick'),
        h('p', { class: 'hint', id: fid(q.id, 'pick-help') }, 'If you had to choose a single word for every game, which is it?'),
        sel);
    }

    function drawProof() {
      const v = get();
      proofBox.replaceChildren();
      if (!v.pick) return;
      const fs = h('fieldset', { class: 'proof' },
        h('legend', {}, `Prove it: use “${v.pick}” for every game`),
        h('p', { class: 'hint' }, 'If a sentence sounds wrong, that’s the answer — pick a different word.'));
      for (const g of GAMES) {
        const id = fid(q.id, 'proof', g.id);
        const sentence = lvl.proof.replace('{game}', g.name).replace('___', v.pick.toLowerCase());
        fs.append(h('div', { class: 'field' },
          h('label', { for: id }, sentence),
          input({
            id, value: v.proof[g.id],
            onInput: (val) => { const c = get(); c.proof[g.id] = val; save(c); },
            onBlur: () => ctx.store.saveNow(),
          })));
      }
      proofBox.append(fs);
    }

    box.append(
      h('p', { class: 'hint' }, 'Sort every word. There are no wrong answers — “doesn’t fit” is as useful as “fits.”'),
      cards, addRow, pickBox, proofBox,
    );
    drawCards(); drawPick(); drawProof();
    return frame({ ...q, label: `Sort the words: ${lvl.title.toLowerCase()}` }, ctx, { control: box, isFieldset: true });
  },

  info(q) {
    return h('div', { class: 'q q-info callout' }, h('p', {}, q.label));
  },
};

function choiceLike(q, ctx, kind) {
  const a = ctx.store.get(q.id);
  const name = fid(q.id);
  const cur = a.value;
  const isOn = (v) => (kind === 'radio' ? cur === v : Array.isArray(cur) && cur.includes(v));
  const opts = [...q.options];
  if (q.other) opts.push({ value: '__other', label: 'Other' });
  const otherId = fid(q.id, 'other');
  const otherField = h('div', { class: 'field other-field', hidden: !isOn('__other') },
    h('label', { for: otherId }, 'Other — please describe'),
    input({ id: otherId, value: a.other, onInput: (v) => ctx.store.update(q.id, { other: v }), onBlur: () => ctx.store.saveNow() }));

  const list = h('div', { class: `options options-${kind}` });
  for (const o of opts) {
    const id = `${name}-${slug(o.value)}`;
    const el = h('input', { type: kind, id, name, value: o.value, checked: isOn(o.value), 'aria-controls': o.value === '__other' ? otherId : null });
    el.addEventListener('change', () => {
      let v;
      if (kind === 'radio') v = o.value;
      else {
        v = [...list.querySelectorAll('input:checked')].map((x) => x.value);
      }
      const otherOn = kind === 'radio' ? v === '__other' : v.includes('__other');
      otherField.hidden = !otherOn;
      ctx.store.update(q.id, { value: v }, { immediate: true });
      if (otherOn && o.value === '__other' && el.checked) requestAnimationFrame(() => otherField.querySelector('input').focus());
    });
    list.append(h('label', { class: 'option', for: id }, el, h('span', {}, o.label)));
  }
  const control = h('div', {}, list, otherField);
  const node = frame(q, ctx, { control, isFieldset: true });
  if (q.help) node.setAttribute('aria-describedby', fid(q.id, 'help'));
  return node;
}

function rowTools(i, count, label, { up, down, remove }) {
  return h('div', { class: 'row-tools' },
    h('button', { type: 'button', class: 'icon-btn', disabled: i === 0, onclick: up }, icon('up'), h('span', { class: 'sr-only' }, `Move ${label} up`)),
    h('button', { type: 'button', class: 'icon-btn', disabled: i === count - 1, onclick: down }, icon('down'), h('span', { class: 'sr-only' }, `Move ${label} down`)),
    remove ? h('button', { type: 'button', class: 'icon-btn', onclick: remove }, icon('x'), h('span', { class: 'sr-only' }, `Remove ${label}`)) : null,
  );
}

export function renderQuestion(q, ctx) {
  const fn = TYPES[q.type];
  if (!fn) return h('p', {}, `Unknown question type: ${q.type}`);
  return fn(q, ctx);
}

/** Toggle the little ✓ next to answered questions. */
export function markDone(root, qid, q, a) {
  const el = root.querySelector(`[data-done="${CSS.escape(qid)}"]`);
  if (el) el.classList.toggle('is-done', isAnswered(q, a));
}
