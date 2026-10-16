/*
  TEMPLATES
  ---------
  Every game section asks the same core questions in the same order, so
  answers line up across games and patterns are easy to spot.
  Each template is a function: give it the game's short id (prefix) and
  name, and it hands back groups of questions with ids like "pt.core.goal".

  Question fields you'll see everywhere:
    id        unique, never change once people have answered (it's the DB key)
    type      text | short | choice | multi | list | records | matrix | cardsort | info
    label     the question
    help      smaller text under the question (optional)
    options   for choice / multi: [{ value, label }]
    other     true = adds an "Other" option with its own text box
    why       true = adds the "Why? → why? → why?" ladder under the answer
    certainty false = hide the "How settled is this?" row (it's on by default
              for text / short / choice / multi)
    showIf    only show when another answer matches (see survey.js → matches())
*/

// Shared option sets -------------------------------------------------------

export const YES_NO_DEPENDS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'depends', label: 'It depends (explain in the why)' },
];

// Rows for the accessibility matrix. Used by every game.
export const A11Y_ROWS = [
  { id: 'blind', label: 'Blind or low vision, including screen-reader users' },
  { id: 'vision', label: 'Color blindness, one eye / no depth perception, glasses that don’t fix everything' },
  { id: 'deaf', label: 'Deaf or hard of hearing, auditory processing differences — or just a very loud room' },
  { id: 'mobility', label: 'Wheelchair, crutches, cane, limb difference, injury, can’t stand for long' },
  { id: 'motor', label: 'Tremor, limited grip or fine-motor control (small tap targets, holding props, writing)' },
  { id: 'seizure', label: 'Seizures, photosensitivity, migraine, motion sickness / vestibular issues' },
  { id: 'cognitive', label: 'Dyslexia, memory, slower processing, ADHD, intellectual disability' },
  { id: 'sensory', label: 'Autistic or sensory-sensitive players: noise, lights, crowds, surprises, time pressure' },
  { id: 'speech', label: 'Speech differences, stutter, nonspeaking players' },
  { id: 'energy', label: 'Chronic illness, pain or fatigue' },
  { id: 'language', label: 'Still learning English, or more fluent in another language (including ASL)' },
  { id: 'tech', label: 'No smartphone, old phone, dead battery, no data plan' },
];

export const A11Y_STATUS = [
  { value: 'solved', label: 'Solved' },
  { value: 'partly', label: 'Partly' },
  { value: 'notyet', label: 'Not yet' },
  { value: 'unsure', label: 'Not sure' },
];

// 1. The basics ------------------------------------------------------------

export function basics(p, game) {
  return [
    {
      id: `${p}.basics`,
      title: 'The basics',
      intro: 'Explain it like the person reading has never been to a game night.',
      questions: [
        {
          id: `${p}.core.pitch`, type: 'short',
          label: `Describe ${game} in one sentence a first-time player would understand.`,
          help: 'No jargon. If it takes two sentences, the game isn’t clear yet — and that’s useful to know.',
        },
        {
          id: `${p}.core.goal`, type: 'text', why: true,
          label: 'What does a player or team do to win?',
          help: '“Have fun” isn’t a win condition. What earns the win?',
        },
        {
          id: `${p}.core.feel`, type: 'text', certainty: false,
          label: 'When it’s going well, what does the room feel like? What are people saying on the way out?',
        },
      ],
    },
    {
      id: `${p}.players`,
      title: 'Who plays',
      questions: [
        {
          id: `${p}.core.play_as`, type: 'choice', why: true,
          label: 'How do people play?',
          options: [
            { value: 'teams', label: 'Teams only' },
            { value: 'solo', label: 'Solo only' },
            { value: 'both', label: 'Teams or solo — player’s choice' },
            { value: 'room', label: 'The whole room plays as one group' },
          ],
          other: true,
        },
        {
          id: `${p}.core.team_size`, type: 'short',
          label: 'Smallest and largest team size?',
          help: 'For example: 2–6. Why those numbers?',
          showIf: { q: `${p}.core.play_as`, in: ['teams', 'both'] },
        },
        {
          id: `${p}.core.team_forming`, type: 'text',
          label: 'How do teams form? What happens to someone who shows up alone?',
          showIf: { q: `${p}.core.play_as`, in: ['teams', 'both'] },
        },
        {
          id: `${p}.core.min_max`, type: 'short',
          label: 'What’s the fewest players (or teams) this still works with — and the most?',
        },
        {
          id: `${p}.core.too_few`, type: 'text',
          label: 'Only a handful of people show up. What happens?',
        },
        {
          id: `${p}.core.late`, type: 'text',
          label: 'Someone arrives halfway through, or has to leave early. Can they join or drop out? How does that affect scores?',
        },
      ],
    },
    {
      id: `${p}.host`,
      title: 'The host (MC)',
      questions: [
        {
          id: `${p}.core.host_tasks`, type: 'multi',
          label: `What does the host do during ${game}?`,
          help: 'Check everything. This becomes the host’s screen in the app.',
          options: [
            { value: 'reads', label: 'Reads items out loud' },
            { value: 'rules', label: 'Explains the rules' },
            { value: 'media', label: 'Runs music, images or video' },
            { value: 'time', label: 'Keeps time' },
            { value: 'judges', label: 'Judges or scores' },
            { value: 'checks', label: 'Checks submissions' },
            { value: 'enters', label: 'Enters scores' },
            { value: 'disputes', label: 'Settles disputes' },
            { value: 'hype', label: 'Hypes the crowd' },
            { value: 'props', label: 'Hands out or resets props' },
          ],
          other: true,
        },
        {
          id: `${p}.core.host_judgment`, type: 'text', why: true,
          label: 'Which calls does the host make by personal judgment instead of a clear rule? How do you keep those calls fair between different hosts and venues?',
        },
      ],
    },
    {
      id: `${p}.flow`,
      title: 'Step by step',
      questions: [
        {
          id: `${p}.core.steps`, type: 'list', certainty: false,
          label: 'Walk through one game from the first minute to the final scores.',
          help: 'One action per step. “Host reads the item aloud and shows it on screen.” “Teams have 60 seconds to answer in the app.” Be boringly specific — the app has to do every one of these.',
          itemLabel: 'Step', min: 3,
        },
        {
          id: `${p}.core.rounds`, type: 'short',
          label: 'How many rounds (or parts), and how many items in each?',
        },
        {
          id: `${p}.core.length`, type: 'short',
          label: 'How long does one full game take?',
        },
        {
          id: `${p}.core.timed`, type: 'choice', why: true,
          label: 'Is there a clock?',
          options: [
            { value: 'no', label: 'No clock' },
            { value: 'item', label: 'A timer on each item' },
            { value: 'round', label: 'A timer on each round' },
            { value: 'game', label: 'One timer for the whole game' },
            { value: 'varies', label: 'It varies' },
          ],
        },
        {
          id: `${p}.core.time_detail`, type: 'short',
          label: 'How long is the timer, and what happens when it runs out?',
          showIf: { q: `${p}.core.timed`, in: ['item', 'round', 'game', 'varies'] },
        },
      ],
    },
    {
      id: `${p}.scoring`,
      title: 'Scoring and winning',
      questions: [
        {
          id: `${p}.core.scoring`, type: 'text', why: true,
          label: 'How are points earned? Write out a sample point scale.',
          help: 'For example: correct answer = 2, partly right = 1, bonus for X = 1.',
        },
        {
          id: `${p}.core.partial`, type: 'choice', why: true,
          label: 'Can someone earn partial points?',
          options: YES_NO_DEPENDS,
        },
        {
          id: `${p}.core.speed`, type: 'choice', why: true,
          label: 'Does being faster earn more points?',
          help: 'Speed bonuses quietly penalize screen-reader users, slower readers, people with motor or processing disabilities, and anyone on an old phone or bad Wi-Fi. If yes, how do you keep it fair?',
          options: YES_NO_DEPENDS,
        },
        {
          id: `${p}.core.ties`, type: 'text',
          label: 'How are ties broken?',
        },
        {
          id: `${p}.core.corrections`, type: 'text',
          label: 'A score was wrong and it’s already on the screen. How is it fixed, and who has the final say?',
        },
      ],
    },
    {
      id: `${p}.screens`,
      title: 'Screens, phones and paper',
      intro: 'The app has to know what to show where. Picture the room.',
      questions: [
        {
          id: `${p}.core.big_screen`, type: 'text',
          label: 'What’s on the venue’s big screen (if there is one) during play?',
        },
        {
          id: `${p}.core.phone`, type: 'text',
          label: 'What does a player see and do on their own phone?',
        },
        {
          id: `${p}.core.no_app`, type: 'text', why: true,
          label: 'The app or Wi-Fi fails mid-game. How does the game keep going?',
        },
      ],
    },
    {
      id: `${p}.variety`,
      title: 'Difficulty and themes',
      questions: [
        {
          id: `${p}.core.difficulty`, type: 'choice', why: true,
          label: `Does ${game} have difficulty levels?`,
          options: [
            { value: 'shared', label: 'Yes — the same scale every game uses' },
            { value: 'own', label: 'Yes — its own scale' },
            { value: 'no', label: 'No' },
          ],
        },
        {
          id: `${p}.core.difficulty_detail`, type: 'text',
          label: 'What makes an item in this game hard vs. easy?',
          showIf: { q: `${p}.core.difficulty`, in: ['shared', 'own'] },
        },
        {
          id: `${p}.core.themes`, type: 'choice',
          label: `Do ${game} nights have themes?`,
          options: [
            { value: 'always', label: 'Always' },
            { value: 'sometimes', label: 'Sometimes' },
            { value: 'never', label: 'Never' },
          ],
        },
        {
          id: `${p}.core.theme_examples`, type: 'short',
          label: 'List a few example themes.',
          showIf: { q: `${p}.core.themes`, in: ['always', 'sometimes'] },
        },
      ],
    },
  ];
}

// 2. The item: one piece of vault content ----------------------------------

export function item(p, game, hint) {
  return [
    {
      id: `${p}.item`,
      title: 'The vault item',
      intro: `“Item” is a placeholder word — you’ll help choose the real one in the Name it section. Here we need to know what ONE piece of ${game} content actually is, so it can be stored, searched, reviewed and reused.`,
      questions: [
        {
          id: `${p}.item.is`, type: 'text', why: true,
          label: `In ${game}, what is ONE item?`,
          help: `The smallest thing someone writes or finds, saves, and could reuse later. For trivia it’s one question and its answer. ${hint}`,
        },
        {
          id: `${p}.item.fields`, type: 'multi',
          label: 'What does one item need to contain?',
          help: 'Each checked box becomes a field in the vault. Missing one now means re-entering thousands later.',
          options: [
            { value: 'prompt', label: 'Text prompt / instructions' },
            { value: 'answer', label: 'The correct answer' },
            { value: 'alt_answers', label: 'Other accepted answers (spellings, synonyms)' },
            { value: 'wrong', label: 'Wrong answer choices' },
            { value: 'image', label: 'Image' },
            { value: 'audio', label: 'Audio' },
            { value: 'video', label: 'Video' },
            { value: 'hints', label: 'Hints' },
            { value: 'points', label: 'Point value' },
            { value: 'time', label: 'Time limit' },
            { value: 'difficulty', label: 'Difficulty' },
            { value: 'tags', label: 'Category / theme tags' },
            { value: 'sources', label: 'Source links (fact-check)' },
            { value: 'a11y', label: 'Alt text or audio description' },
            { value: 'warning', label: 'Content warning' },
            { value: 'rights', label: 'Rights / licensing info' },
            { value: 'host_notes', label: 'Host notes and pronunciation' },
            { value: 'fun_fact', label: 'Fun fact to read after the reveal' },
          ],
          other: true,
        },
        {
          id: `${p}.item.answers`, type: 'choice', why: true,
          label: 'Does every item have one right answer?',
          options: [
            { value: 'one', label: 'Exactly one' },
            { value: 'several', label: 'Several answers are accepted' },
            { value: 'judged', label: 'No right answer — it’s judged or voted on' },
            { value: 'depends', label: 'Depends on the item' },
          ],
        },
        {
          id: `${p}.item.grouping`, type: 'text',
          label: 'How do items get grouped into a game?',
          help: 'For example: 10 items = 1 round, 3 rounds = 1 night.',
        },
        {
          id: `${p}.item.counts`, type: 'short',
          label: 'How many items does one night use? How many do you need written before launch?',
        },
        {
          id: `${p}.item.process`, type: 'list', certainty: false,
          label: 'Walk through how one item gets made, from idea to approved.',
          help: 'Who writes or finds it, where it’s stored, who checks it, who approves it.',
          itemLabel: 'Step', min: 3,
        },
        {
          id: `${p}.item.samples`, type: 'records', certainty: false,
          label: 'Write 3 real sample items, exactly as they’d appear in the game.',
          itemLabel: 'Sample item', min: 3,
          fields: [
            { id: 'prompt', label: 'What players get (prompt, media, instructions)', type: 'text' },
            { id: 'answer', label: 'The answer — or what “correct” or “winning” means', type: 'text' },
            { id: 'media', label: 'Media needed (image, audio, props…)', type: 'short' },
            { id: 'host', label: 'Host notes', type: 'text' },
            { id: 'difficulty', label: 'Difficulty', type: 'short' },
          ],
        },
      ],
    },
  ];
}

// 3. Inclusion and accessibility -------------------------------------------

export function inclusion(p, game) {
  return [
    {
      id: `${p}.access`,
      title: 'Can everyone play?',
      intro: '“Their teammates can do it for them” doesn’t count. For each row, how does that person play fully — not just watch? “Not yet” is an honest answer and much better than skipping.',
      questions: [
        {
          id: `${p}.a11y.matrix`, type: 'matrix', certainty: false,
          label: `${game}: how does each of these players take part fully?`,
          rows: A11Y_ROWS,
          statuses: A11Y_STATUS,
        },
      ],
    },
    {
      id: `${p}.bias`,
      title: 'Bias and harm check',
      intro: 'Every game carries the assumptions of the people who made it. The goal here is to find yours before a player does.',
      questions: [
        {
          id: `${p}.bias.risks`, type: 'text',
          label: `Name at least two real ways ${game} could reinforce a stereotype, or leave someone out.`,
          help: 'Think about race, culture, gender, sexuality, disability, age, religion, money, language, and Indigenous peoples.',
        },
        {
          id: `${p}.bias.check`, type: 'text', why: true,
          label: 'What specific check catches those before they reach a venue? Who does that check?',
        },
        {
          id: `${p}.bias.reject`, type: 'text', certainty: false,
          label: 'Write one example item that should be rejected for bias or harm — and explain why.',
          help: 'Practicing on a bad example is the fastest way to learn the line.',
        },
      ],
    },
  ];
}

// 4. Sample script ---------------------------------------------------------

export function script(p, game, count = 1) {
  const label = count > 1
    ? `Write ${count} sample run-of-shows for ${game} — what the host says and does from welcome to winners.`
    : `Write a sample run-of-show for one ${game} night — what the host says and does from welcome to winners.`;
  return [
    {
      id: `${p}.script`,
      title: 'Sample script',
      questions: [
        {
          id: `${p}.script.sample`, type: 'records', certainty: false,
          label,
          help: 'Include the real words the host says, when the app does something, and when players do something. This is what the host screen gets built from.',
          itemLabel: 'Script', min: count,
          fields: [
            { id: 'title', label: 'Theme or title', type: 'short' },
            { id: 'body', label: 'Run-of-show', type: 'text' },
          ],
        },
      ],
    },
  ];
}
