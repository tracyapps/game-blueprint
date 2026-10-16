/*
  NAME IT — a card sort.
  Each "level" is one thing that needs ONE word used by every game.
  For each level, people:
    1. sort every candidate word: fits every game / fits some / doesn't fit
    2. add words that are missing
    3. pick ONE
    4. prove it: use their pick in a sentence for each game
    5. explain why (the why ladder)
  Add or remove candidate words in `terms` below. Never change a level `id`.
*/

export const GAMES = [
  { id: 'pt', name: 'Picture This' },
  { id: 'll', name: 'Lipsync League' },
  { id: 'gs', name: 'Grade School Challenge' },
  { id: 'et', name: 'Escape Table' },
  { id: 'at', name: 'Anti-Trivia' },
];

export const LEVELS = [
  {
    id: 'name.item',
    title: 'The smallest piece of content',
    what: 'One thing stored in the vault and used in a game.',
    trivia: 'In trivia: one question and its answer.',
    proof: 'In {game}, one ___ is…',
    terms: ['Item', 'Prompt', 'Card', 'Challenge', 'Clue', 'Play', 'Cue', 'Entry', 'Piece', 'Task', 'Bit', 'Moment'],
  },
  {
    id: 'name.group',
    title: 'A group of those, played together',
    what: 'A chunk of the night with its own start and end.',
    trivia: 'In trivia: a round.',
    proof: 'In {game}, one ___ is…',
    terms: ['Round', 'Set', 'Segment', 'Block', 'Stage', 'Act', 'Chapter', 'Heat', 'Leg', 'Level'],
  },
  {
    id: 'name.night',
    title: 'The plan for one whole night',
    what: 'Everything that will be played, in order, plus host notes.',
    trivia: 'In trivia: the full question list for the night.',
    proof: 'For a {game} night, the ___ is…',
    terms: ['Script', 'Set list', 'Run of show', 'Rundown', 'Show', 'Game plan', 'Playbook', 'Lineup', 'Program', 'Episode'],
  },
  {
    id: 'name.game',
    title: 'The game type itself',
    what: 'Picture This, Lipsync League, and so on.',
    trivia: 'Inside the company these are called “magnets.”',
    proof: '{game} is a ___ that…',
    terms: ['Magnet', 'Game', 'Format', 'Show', 'Series', 'Title', 'Experience'],
  },
  {
    id: 'name.season',
    title: 'A run over several weeks',
    what: 'When scores carry over from week to week.',
    trivia: 'If trivia had standings across 8 weeks, what would that be?',
    proof: 'A {game} ___ lasts…',
    terms: ['Season', 'League', 'Series', 'Run', 'Circuit', 'Tour', 'Cup'],
  },
  {
    id: 'name.vault',
    title: 'The content library',
    what: 'Where every piece of content lives before it’s played.',
    trivia: 'Right now it’s called “the vault.”',
    proof: 'All {game} content lives in the ___.',
    terms: ['Vault', 'Library', 'Bank', 'Catalog', 'Archive', 'Pantry'],
  },
];

export const RATINGS = [
  { value: 'all', label: 'Fits every game' },
  { value: 'some', label: 'Fits some' },
  { value: 'none', label: 'Doesn’t fit' },
];

export const naming = {
  id: 'naming',
  title: 'Name it',
  kind: 'naming',
  intro: 'Each game needs to share the same words so the app can be built once. Sort the candidate words, add better ones, then pick ONE per row and prove it works for every game. Your sort is private — you won’t see anyone else’s until the results are in, so you aren’t nudged by them.',
  groups: [
    ...LEVELS.map((lvl) => ({
      id: `${lvl.id}.group`,
      title: lvl.title,
      intro: `${lvl.what} ${lvl.trivia}`,
      questions: [
        { id: lvl.id, type: 'cardsort', why: true, certainty: true, label: lvl.title, level: lvl },
      ],
    })),
    {
      id: 'name.rules',
      title: 'Ground rules',
      questions: [
        {
          id: 'name.public', type: 'choice', why: true,
          label: 'Should players see the same words staff use?',
          options: [
            { value: 'same', label: 'Yes — one word everywhere' },
            { value: 'split', label: 'No — staff words and player words can differ' },
          ],
        },
        {
          id: 'name.avoid', type: 'text',
          label: 'Any words we should never use? Why?',
          help: 'Words that mean something else in a bar or restaurant, are already a competitor’s brand, or exclude people.',
        },
      ],
    },
  ],
};
