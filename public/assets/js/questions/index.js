/*
  The order sections appear in. To add a new game, copy one of the game
  files, change its prefix (two letters, unique) and add it here.
*/
import { about, everyNight, review } from './shared.js';
import pictureThis from './picture-this.js';
import lipsync from './lipsync-league.js';
import gradeSchool from './grade-school.js';
import escapeTable from './escape-table.js';
import antiTrivia from './anti-trivia.js';
import { naming } from './naming.js';

export const SECTIONS = [
  about,
  everyNight,
  pictureThis,
  lipsync,
  gradeSchool,
  escapeTable,
  antiTrivia,
  naming,
  review,
];

// The "why ladder": the prompts asked in order, toddler-style.
export const WHY_PROMPTS = [
  'Why?',
  'And why does that matter?',
  'What would go wrong if it weren’t that way?',
  'Who is that good for — and is anyone left out by it?',
  'So what’s the real goal underneath all of that?',
];

// When someone reaches the bottom of a ladder, they label what kind of
// reason it turned out to be. This is where patterns show up.
export const ROOT_TYPES = [
  { value: 'fun', label: 'Player experience — it’s more fun or engaging' },
  { value: 'fair', label: 'Fairness — it keeps the game honest' },
  { value: 'venue', label: 'Venue or business need — time, sales, staffing' },
  { value: 'inclusion', label: 'Safety, accessibility or inclusion' },
  { value: 'legal', label: 'Legal, licensing or money' },
  { value: 'tech', label: 'Technology — what the app or venue can do' },
  { value: 'tradition', label: 'It’s how it’s usually done' },
  { value: 'unknown', label: 'Honestly, not sure yet' },
];

export const CERTAINTY = [
  { value: 'decided', label: 'Decided' },
  { value: 'leaning', label: 'Leaning' },
  { value: 'guess', label: 'Just a guess' },
  { value: 'ask', label: 'Someone else decides' },
];

// Walk every question (used by the survey, the review, and results page).
export function allQuestions() {
  const out = [];
  for (const s of SECTIONS) {
    for (const g of s.groups) {
      for (const q of g.questions) out.push({ section: s, group: g, q });
    }
  }
  return out;
}
