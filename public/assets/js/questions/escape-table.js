import { basics, item, inclusion, script } from './templates.js';

const P = 'et';
const GAME = 'Escape Table';

export default {
  id: 'escape-table',
  title: GAME,
  kind: 'game',
  intro: 'An escape game is a chain: every puzzle needs an input, a check, and a “what unlocks next.” The app can only run chains that are written down exactly.',
  groups: [
    {
      id: 'et.kind',
      title: 'What kind of challenge is it?',
      questions: [
        {
          id: 'et.kind', type: 'multi', why: true,
          label: 'What kinds of puzzles are in it?',
          options: [
            { value: 'logic', label: 'Logic puzzles' },
            { value: 'riddles', label: 'Riddles and wordplay' },
            { value: 'physical', label: 'Physical puzzles with props' },
            { value: 'story', label: 'A story-driven mystery' },
            { value: 'math', label: 'Codes, ciphers, number puzzles' },
          ],
          other: true,
        },
        {
          id: 'et.steps', type: 'short',
          label: 'How many puzzles are in one chain (one game)?',
        },
        {
          id: 'et.order', type: 'choice', why: true,
          label: 'Do puzzles go in a fixed order, or can teams solve some in any order?',
          options: [
            { value: 'fixed', label: 'Fixed order' },
            { value: 'any', label: 'Any order' },
            { value: 'mix', label: 'Some of each' },
          ],
        },
        {
          id: 'et.props', type: 'choice', why: true,
          label: 'Physical props?',
          options: [
            { value: 'required', label: 'Required' },
            { value: 'extras', label: 'Optional extras' },
            { value: 'none', label: 'None — everything is in the app or on paper' },
          ],
        },
        {
          id: 'et.props_detail', type: 'text',
          label: 'Which props? Who makes them, resets them between tables, and cleans them? What does a set cost per table?',
          showIf: { q: 'et.props', in: ['required', 'extras'] },
        },
        {
          id: 'et.pace', type: 'choice', why: true,
          label: 'Do tables work at their own pace, or does the host move everyone together?',
          options: [
            { value: 'own', label: 'Own pace' },
            { value: 'host', label: 'Host-guided' },
            { value: 'mix', label: 'A mix' },
          ],
        },
        {
          id: 'et.host_tracking', type: 'text',
          label: 'Twelve tables are each on a different puzzle. How does the host know who is where and who needs help?',
        },
        {
          id: 'et.twists', type: 'choice', why: true,
          label: 'Does the host throw in surprise challenges or distractions?',
          help: 'Surprises are fun for some and overwhelming for others (anxiety, sensory and processing differences). If yes, how do players get a heads-up or opt out?',
          options: YES_NO(),
        },
        {
          id: 'et.solutions', type: 'choice', why: true,
          label: 'Can a puzzle have more than one valid solution?',
          options: [
            { value: 'one', label: 'Only one' },
            { value: 'some', label: 'Sometimes' },
            { value: 'often', label: 'Often' },
          ],
        },
      ],
    },
    {
      id: 'et.progress',
      title: 'Hints, progress and winning',
      questions: [
        {
          id: 'et.hints', type: 'text', why: true,
          label: 'How do hints work? How many, how does a team ask, and do they cost points?',
        },
        {
          id: 'et.where_am_i', type: 'text',
          label: 'How do teams know how far along they are and how much time is left?',
        },
        {
          id: 'et.stuck', type: 'text',
          label: 'A team is completely stuck and losing interest. What happens?',
        },
        {
          id: 'et.win', type: 'text',
          label: 'How do teams win? What’s the “you escaped!” moment, and who confirms it?',
        },
        {
          id: 'et.time_reason', type: 'text', why: true,
          label: 'Is there a time limit? How long — and how did you choose that number?',
        },
      ],
    },
    {
      id: 'et.puzzles',
      title: 'Sample puzzles',
      questions: [
        {
          id: 'et.samples', type: 'records', certainty: false,
          label: 'Write 5–10 sample puzzles as a chain.',
          help: 'Each one: how it’s presented, what players must enter or do, the correct response, and what that unlocks next.',
          itemLabel: 'Puzzle', min: 5,
          fields: [
            { id: 'presented', label: 'How it’s presented (screen, paper, prop, host)', type: 'text' },
            { id: 'input', label: 'What players enter or do', type: 'short' },
            { id: 'answer', label: 'Correct response', type: 'short' },
            { id: 'unlocks', label: 'What it unlocks next', type: 'text' },
            { id: 'hints', label: 'Hints, in order', type: 'text' },
          ],
        },
        {
          id: 'et.puzzle_access', type: 'text',
          label: 'Puzzles often rely on color coding, tiny print, sound cues, reading fast, or fiddly hands. Which of your sample puzzles do, and what’s the other path to the same answer?',
        },
      ],
    },

    ...basics(P, GAME),
    ...item(P, GAME, 'Is it one puzzle? A whole chain of puzzles? A puzzle plus its props?'),
    ...inclusion(P, GAME),
    ...script(P, GAME),
  ],
};

function YES_NO() {
  return [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'sometimes', label: 'Sometimes' },
  ];
}
