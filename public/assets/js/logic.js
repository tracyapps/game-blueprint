/*
  CONDITIONAL LOGIC
  -----------------
  showIf forms (all read another question's answer by id):
    { q: 'pt.kind', is: 'hunt' }            choice equals
    { q: 'pt.kind', in: ['hunt','other'] }   choice is one of
    { q: 'pt.id.subjects', includes: 'people' }  checkbox list contains
    { q: 'incl.defaults', answered: true }  anything answered
    { any: [ ...conditions ] }              at least one is true
    { all: [ ...conditions ] }              every one is true
  "Other" in a choice/multi is stored as the value '__other'.
*/

export function matches(cond, answers) {
  if (!cond) return true;
  if (cond.any) return cond.any.some((c) => matches(c, answers));
  if (cond.all) return cond.all.every((c) => matches(c, answers));
  const v = answers[cond.q]?.value;
  if ('is' in cond) return v === cond.is;
  if ('in' in cond) return cond.in.includes(v);
  if ('includes' in cond) return Array.isArray(v) && v.includes(cond.includes);
  if ('answered' in cond) return hasValue(v) === cond.answered;
  return true;
}

export function hasValue(v) {
  if (v == null) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.some((x) => (typeof x === 'string' ? x.trim() : x && Object.values(x).some((y) => String(y || '').trim())));
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return true;
}

export function groupVisible(group, answers) {
  return matches(group.showIf, answers);
}

export function questionVisible(group, q, answers) {
  return groupVisible(group, answers) && matches(q.showIf, answers);
}

/** Does this question count as answered? */
export function isAnswered(q, a) {
  if (!a) return false;
  const v = a.value;
  switch (q.type) {
    case 'info': return true;
    case 'choice': return v === '__other' ? !!(a.other || '').trim() : hasValue(v);
    case 'multi': return Array.isArray(v) && v.length > 0 && (!v.includes('__other') || v.length > 1 || !!(a.other || '').trim());
    case 'list': return Array.isArray(v) && v.filter((s) => s && s.trim()).length >= Math.max(1, q.min || 1);
    case 'records': return Array.isArray(v) && v.filter((r) => r && Object.values(r).some((x) => String(x || '').trim())).length >= Math.max(1, q.min || 1);
    case 'matrix': return !!v && q.rows.every((r) => v[r.id]?.status);
    case 'cardsort': return !!v?.pick;
    default: return hasValue(v);
  }
}

export function countable(q) { return q.type !== 'info'; }

/** { answered, total } for visible questions in a section. */
export function sectionProgress(section, answers) {
  let answered = 0; let total = 0;
  for (const g of section.groups) {
    for (const q of g.questions) {
      if (!countable(q) || !questionVisible(g, q, answers)) continue;
      total += 1;
      if (isAnswered(q, answers[q.id])) answered += 1;
    }
  }
  return { answered, total };
}

/** Plain-text version of any answer (for tables, CSV, review). */
export function formatAnswer(q, a) {
  if (!a) return '';
  const v = a.value;
  const label = (val) => {
    if (val === '__other') return `Other: ${a.other || ''}`;
    return q.options?.find((o) => o.value === val)?.label ?? val;
  };
  switch (q?.type) {
    case 'choice': return v ? label(v) : '';
    case 'multi': return Array.isArray(v) ? v.map(label).join('; ') : '';
    case 'list': return Array.isArray(v) ? v.filter(Boolean).map((s, i) => `${i + 1}. ${s}`).join('\n') : '';
    case 'records': return Array.isArray(v) ? v.map((r, i) => `#${i + 1} ` + (q.fields || []).map((f) => r?.[f.id] ? `${f.label}: ${r[f.id]}` : '').filter(Boolean).join(' | ')).join('\n') : '';
    case 'matrix': return v ? q.rows.map((r) => v[r.id] ? `${r.label} — ${v[r.id].status || '?'}${v[r.id].note ? ': ' + v[r.id].note : ''}` : '').filter(Boolean).join('\n') : '';
    case 'cardsort': {
      if (!v) return '';
      const proof = Object.entries(v.proof || {}).filter(([, s]) => s).map(([g, s]) => `${g}: ${s}`).join('; ');
      return `Pick: ${v.pick || '—'}${v.added?.length ? ` | Added: ${v.added.join(', ')}` : ''}${proof ? ` | Proof: ${proof}` : ''}`;
    }
    default: return typeof v === 'string' ? v : (v == null ? '' : JSON.stringify(v));
  }
}
