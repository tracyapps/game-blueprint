import { basics, item, inclusion, script } from './templates.js';

const P = 'gs';
const GAME = 'Grade School Challenge';

export default {
  id: 'grade-school',
  title: GAME,
  kind: 'game',
  intro: 'The name carries assumptions: about age, about country, about what everyone “should” know. Make them visible.',
  groups: [
    {
      id: 'gs.kind',
      title: 'What kind of game is it?',
      questions: [
        {
          id: 'gs.kind', type: 'choice', why: true,
          label: 'Which is closest?',
          options: [
            { value: 'trivia', label: 'Trivia — school-subject questions' },
            { value: 'stories', label: 'Storytelling — sharing school memories' },
            { value: 'acting', label: 'Acting it out — spelling bees, recess games, show-and-tell' },
            { value: 'mix', label: 'A mix of these' },
          ],
          other: true,
        },
        {
          id: 'gs.mix', type: 'list', certainty: false,
          label: 'List each type of round that can appear, and what happens in it.',
          itemLabel: 'Round type', min: 2,
          showIf: { q: 'gs.kind', in: ['mix', '__other'] },
        },
        {
          id: 'gs.basis', type: 'choice', why: true,
          label: 'Whose “grade school” is it about?',
          options: [
            { value: 'curriculum', label: 'A fixed curriculum (e.g., what kids learn in 1st–5th grade)' },
            { value: 'generation', label: 'A generation or decade theme (e.g., ’90s kids)' },
            { value: 'personal', label: 'Each player’s own school years' },
          ],
          other: true,
        },
        {
          id: 'gs.curriculum', type: 'text', why: true,
          label: 'Whose curriculum? “Grade school” and grade numbers are US terms. What about people schooled in another country, homeschooled, or whose schooling was interrupted?',
          showIf: { q: 'gs.basis', is: 'curriculum' },
        },
        {
          id: 'gs.ages', type: 'text', why: true,
          label: 'A team has a 24-year-old, a 45-year-old and a 70-year-old. Whose school years count? How does each of them feel included?',
          showIf: { q: 'gs.basis', in: ['generation', 'personal', '__other'] },
        },
        {
          id: 'gs.league', type: 'choice',
          label: 'Single nights, or a league over several weeks?',
          options: [
            { value: 'single', label: 'Single nights' },
            { value: 'league', label: 'A league' },
            { value: 'both', label: 'Venue’s choice' },
          ],
        },
      ],
    },
    {
      id: 'gs.care',
      title: 'Playful, not shaming',
      questions: [
        {
          id: 'gs.shame', type: 'text', why: true,
          label: 'An “are you smarter than a kid?” angle can embarrass people — including people with learning disabilities, people who left school early, or people schooled in another language. How does the game stay playful without making anyone feel stupid?',
        },
        {
          id: 'gs.history', type: 'text',
          label: 'School lessons often carried harmful versions of history (Indigenous peoples, slavery, colonization, “discovery” stories). How will items avoid repeating them as “correct answers”?',
        },
        {
          id: 'gs.memories', type: 'text',
          label: 'If players share school memories: school wasn’t safe or happy for everyone (bullying, racism, poverty, disability). How do you keep prompts light without forcing anyone to relive something?',
          showIf: { q: 'gs.kind', in: ['stories', 'mix', '__other'] },
        },
      ],
    },

    ...basics(P, GAME),
    ...item(P, GAME, 'Is it a school-subject question? A story prompt? An activity card?'),
    ...inclusion(P, GAME),
    ...script(P, GAME),
  ],
};
