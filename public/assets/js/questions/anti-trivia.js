import { basics, item, inclusion, script } from './templates.js';

const P = 'at';
const GAME = 'Anti-Trivia';

export default {
  id: 'anti-trivia',
  title: 'Anti-Trivia / By Popular Opinion',
  kind: 'game',
  intro: 'If the “right” answer is whatever is most popular, then whoever you ask decides what’s right. That makes who you ask the most important design decision in this game.',
  groups: [
    {
      id: 'at.kind',
      title: 'What kind of game is it?',
      questions: [
        {
          id: 'at.name', type: 'choice', why: true,
          label: 'What is this game called?',
          options: [
            { value: 'anti', label: 'Anti-Trivia' },
            { value: 'popular', label: 'By Popular Opinion' },
            { value: 'both', label: 'Both — one is internal, one is what players see' },
          ],
          other: true,
        },
        {
          id: 'at.kind', type: 'choice', why: true,
          label: 'How does it work?',
          options: [
            { value: 'survey', label: 'Survey says: guess the most popular answers from a survey taken beforehand' },
            { value: 'live', label: 'Live poll: the room’s own answers become the answer key' },
            { value: 'opposite', label: 'Opposite trivia: the least common answer wins' },
          ],
          other: true,
        },
        {
          id: 'at.kind.explain', type: 'list', certainty: false,
          label: 'Explain the game step by step.',
          itemLabel: 'Step', min: 3,
          showIf: { q: 'at.kind', in: ['opposite', '__other'] },
        },
      ],
    },
    {
      id: 'at.survey',
      title: 'Survey says',
      showIf: { q: 'at.kind', is: 'survey' },
      questions: [
        {
          id: 'at.s.turns', type: 'choice',
          label: 'Who answers?',
          options: [
            { value: 'one', label: 'One person at a time' },
            { value: 'team', label: 'The whole team together' },
            { value: 'all', label: 'All teams at once' },
          ],
        },
        {
          id: 'at.s.points', type: 'choice', why: true,
          label: 'Points equal…',
          options: [
            { value: 'count', label: 'The number of survey people who gave that answer' },
            { value: 'rank', label: 'Fixed points by rank (#1 answer = most points)' },
          ],
          other: true,
        },
        {
          id: 'at.s.repeat', type: 'choice',
          label: 'Can a team give an answer another team already gave?',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
        },
        {
          id: 'at.s.run', type: 'text', why: true,
          label: 'How is the survey run? How many people answer each question, how are they reached, and how often is it refreshed?',
        },
        {
          id: 'at.s.who', type: 'text', why: true,
          label: 'Who are the survey people? How will you make sure they include different ages, races and ethnicities, genders, sexual orientations, disabilities, incomes, education levels, and regions — not just people like the team?',
        },
        {
          id: 'at.s.region', type: 'choice', why: true,
          label: 'Should answers differ by city (Milwaukee vs. Pittsburgh)?',
          options: [
            { value: 'national', label: 'One national survey' },
            { value: 'market', label: 'A survey per market' },
            { value: 'mix', label: 'A mix' },
          ],
        },
      ],
    },
    {
      id: 'at.live',
      title: 'Live room poll',
      showIf: { q: 'at.kind', is: 'live' },
      questions: [
        {
          id: 'at.l.flow', type: 'list', certainty: false,
          label: 'Walk through one item: question → the room answers → answers are grouped → scoring.',
          itemLabel: 'Step', min: 3,
        },
        {
          id: 'at.l.min', type: 'short', why: true,
          label: 'What’s the minimum number of answers for a fair result?',
        },
        {
          id: 'at.l.moderation', type: 'text',
          label: 'Players type answers that may show on the big screen. How do you keep slurs, cruel jokes, or someone’s name off the screen?',
        },
        {
          id: 'at.l.anon', type: 'choice', why: true,
          label: 'Are individual answers anonymous?',
          options: [
            { value: 'yes', label: 'Yes, to everyone' },
            { value: 'host', label: 'Only the host can see who said what' },
            { value: 'no', label: 'No' },
          ],
        },
      ],
    },
    {
      id: 'at.answers',
      title: 'Answers and stereotypes',
      questions: [
        {
          id: 'at.match', type: 'text',
          label: 'Who decides that “couch” and “sofa” are the same answer? Write the rule.',
        },
        {
          id: 'at.stereotypes', type: 'text', why: true,
          label: 'Popular-opinion questions can reward stereotypes — think “Name something women are bad at.” When the most popular answer wins, how do you avoid questions where the popular answer is a stereotype?',
        },
        {
          id: 'at.format', type: 'text',
          label: 'What exactly is saved for each question? (Question only? Question plus ranked answers and counts? Date surveyed and who was asked?)',
        },
      ],
    },

    ...basics(P, GAME),
    ...item(P, GAME, 'Is it a question alone? A question plus its ranked survey answers? A question that gets its answers live?'),
    ...inclusion(P, GAME),
    ...script(P, GAME),
  ],
};
