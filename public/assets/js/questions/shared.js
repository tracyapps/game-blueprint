/*
  Sections that aren't a single game:
  - welcome / about you
  - "Every game night": questions that would otherwise repeat in every game
  - review (built automatically from answers, plus one last question)
*/

export const about = {
  id: 'about',
  title: 'About you',
  kind: 'intro',
  intro: 'A few quick questions so we can read your answers in context.',
  groups: [
    {
      id: 'me',
      title: 'You',
      questions: [
        { id: 'me.role', type: 'short', certainty: false, label: 'Your role or team' },
        {
          id: 'me.games', type: 'multi', certainty: false,
          label: 'Which games do you work on?',
          options: [
            { value: 'pt', label: 'Picture This' },
            { value: 'll', label: 'Lipsync League' },
            { value: 'gs', label: 'Grade School Challenge' },
            { value: 'et', label: 'Escape Table' },
            { value: 'at', label: 'Anti-Trivia / By Popular Opinion' },
          ],
        },
        {
          id: 'me.background', type: 'text', certainty: false,
          label: 'Before this job, what game nights have you run, written for, or played?',
          help: 'It helps us see where our assumptions come from.',
        },
        {
          id: 'me.who_served', type: 'text', certainty: false,
          label: 'Who do you think our game nights serve best right now — and who are we missing?',
        },
      ],
    },
  ],
};

export const everyNight = {
  id: 'every-night',
  title: 'Every game night',
  kind: 'shared',
  intro: 'These are true for every game, so we ask them once instead of five times. If a game breaks one of these rules, say so in that game’s section.',
  groups: [
    {
      id: 'night.room',
      title: 'The room',
      questions: [
        {
          id: 'night.play_with', type: 'choice', why: true,
          label: 'During a game, what do players play with?',
          options: [
            { value: 'paper', label: 'Paper only' },
            { value: 'app', label: 'The app only' },
            { value: 'choose', label: 'Either — each team chooses' },
            { value: 'mixed', label: 'Both — some parts on paper, some in the app' },
          ],
          other: true,
        },
        {
          id: 'night.no_phone', type: 'text',
          label: 'Someone has no smartphone, a dead battery, or no data. How do they still play the whole night?',
        },
        {
          id: 'night.venue_has', type: 'multi',
          label: 'What can you count on EVERY venue having?',
          help: 'Anything left unchecked is something no game can depend on.',
          options: [
            { value: 'screen', label: 'A TV or screen everyone can see' },
            { value: 'mic', label: 'A mic and speakers' },
            { value: 'stage', label: 'A stage or open floor' },
            { value: 'wifi', label: 'Reliable guest Wi-Fi' },
            { value: 'quiet', label: 'A room quiet enough to hear the host' },
            { value: 'stepfree', label: 'A step-free entrance' },
            { value: 'restroom', label: 'An accessible restroom' },
            { value: 'aisles', label: 'Room for a wheelchair between tables' },
            { value: 'lights', label: 'Lighting the host can adjust' },
          ],
          other: true,
        },
        {
          id: 'night.length', type: 'short',
          label: 'How long is a typical night, start to finish?',
        },
        {
          id: 'night.mix_games', type: 'choice', why: true,
          label: 'Does one night ever mix more than one game?',
          options: [
            { value: 'never', label: 'Never — one game per night' },
            { value: 'sometimes', label: 'Sometimes' },
            { value: 'often', label: 'Often' },
          ],
        },
      ],
    },
    {
      id: 'night.audience',
      title: 'Who it’s for',
      questions: [
        {
          id: 'night.ages', type: 'choice', why: true,
          label: 'Who can play?',
          options: [
            { value: '21', label: '21+ only' },
            { value: 'all', label: 'All ages' },
            { value: 'venue', label: 'Depends on the venue' },
          ],
        },
        {
          id: 'night.rating', type: 'choice', why: true,
          label: 'How spicy can content get?',
          options: [
            { value: 'family', label: 'Family-friendly, always' },
            { value: 'pg13', label: 'PG-13' },
            { value: 'adult', label: 'Adult content allowed at 21+ nights' },
            { value: 'venue', label: 'Each venue chooses a level' },
          ],
        },
        {
          id: 'night.sober', type: 'text',
          label: 'Do any games, prizes or rules assume people are drinking? How does a sober player, or someone who doesn’t drink for religious or health reasons, feel at home?',
        },
      ],
    },
    {
      id: 'night.hosts',
      title: 'Hosts',
      questions: [
        {
          id: 'night.host_who', type: 'choice', why: true,
          label: 'Who runs a game night?',
          options: [
            { value: 'ours', label: 'A host trained by us' },
            { value: 'venue', label: 'Venue staff' },
            { value: 'either', label: 'Either' },
          ],
          other: true,
        },
        {
          id: 'night.host_must_know', type: 'list', certainty: false,
          label: 'What must a brand-new host know before their first night?',
          itemLabel: 'Must-know', min: 3,
        },
        {
          id: 'night.final_say', type: 'text', why: true,
          label: 'When a player disputes a ruling, who has the final say?',
        },
      ],
    },
    {
      id: 'night.results',
      title: 'Prizes and seasons',
      questions: [
        {
          id: 'night.prizes', type: 'text', why: true,
          label: 'What do winners get, and who pays for it?',
        },
        {
          id: 'night.seasons', type: 'choice', why: true,
          label: 'Do scores carry over between weeks (leagues or seasons)?',
          options: [
            { value: 'never', label: 'Never' },
            { value: 'some', label: 'For some games' },
            { value: 'all', label: 'For every game' },
          ],
        },
      ],
    },
    {
      id: 'night.vault',
      title: 'The vault: where content comes from',
      intro: 'You plan to add content by the thousands. These answers decide how the vault checks, sorts and reuses it.',
      questions: [
        {
          id: 'vault.source', type: 'multi', why: true,
          label: 'Where will the content come from?',
          help: 'Each source needs a different level of checking.',
          options: [
            { value: 'staff', label: 'Written in-house' },
            { value: 'freelance', label: 'Freelance writers' },
            { value: 'packs', label: 'Purchased content packs' },
            { value: 'ai', label: 'Drafted with AI, then edited by people' },
            { value: 'players', label: 'Submitted by players' },
            { value: 'sheets', label: 'Our existing spreadsheets' },
          ],
          other: true,
        },
        {
          id: 'vault.ai', type: 'text',
          label: 'For AI-drafted content: who checks facts, bias and originality — and how will anyone know later which items were AI-drafted?',
          showIf: { q: 'vault.source', includes: 'ai' },
        },
        {
          id: 'vault.checks', type: 'multi', why: true,
          label: 'Which checks must an item pass before it can be used in a game?',
          options: [
            { value: 'facts', label: 'Fact-checked against sources' },
            { value: 'copy', label: 'Copy edit (grammar, voice, spelling)' },
            { value: 'bias', label: 'Bias and harm review' },
            { value: 'a11y', label: 'Accessibility (alt text, audio description, readable)' },
            { value: 'rights', label: 'Rights and licensing cleared' },
            { value: 'approval', label: 'Final approval' },
          ],
          other: true,
        },
        {
          id: 'vault.who_checks', type: 'text', why: true,
          label: 'Who does each check? Can the person who wrote an item also approve it?',
        },
        {
          id: 'vault.difficulty', type: 'choice', why: true,
          label: 'Difficulty: one scale for every game?',
          help: 'The current trivia spreadsheet uses Easy / Medium / Hard. Engineering proposed 1–5. Pick one so every game speaks the same language.',
          options: [
            { value: '3', label: 'Easy / Medium / Hard' },
            { value: '5', label: '1–5' },
            { value: 'pergame', label: 'Each game uses its own' },
            { value: 'none', label: 'No difficulty levels' },
          ],
          other: true,
        },
        {
          id: 'vault.hard_means', type: 'text',
          label: 'What makes something “hard”? Describe it so two different writers would rate the same item the same way.',
        },
        {
          id: 'vault.themes', type: 'choice', why: true,
          label: 'What is a theme (Halloween, ’90s, Taylor Swift)?',
          options: [
            { value: 'night', label: 'A whole night' },
            { value: 'round', label: 'One round' },
            { value: 'tag', label: 'A tag on individual items' },
            { value: 'all', label: 'Any of these' },
          ],
        },
        {
          id: 'vault.reuse', type: 'text', why: true,
          label: 'When can an item be used again?',
          help: 'The current plan: never on the same weekday at venues within a set distance of each other. Is that right? How far is “nearby”? How many months until an item is fresh again? Does the old “retire after 4 uses” rule still apply?',
        },
        {
          id: 'vault.colors', type: 'text',
          label: 'In the current trivia spreadsheet, some cells are blue or magenta — colors that aren’t in the key. What do they mean?',
        },
      ],
    },
    {
      id: 'night.inclusion',
      title: 'Inclusion, for every game',
      questions: [
        {
          id: 'incl.defaults', type: 'multi',
          label: 'Which of these “defaults” show up in our content today?',
          help: 'This is a check, not a test. Checking a box is good — it means we found it.',
          certainty: false,
          options: [
            { value: 'us', label: 'US-centric (US history, sports, holidays as “normal”)' },
            { value: 'english', label: 'English only' },
            { value: 'christian', label: 'Christian holidays as the default “holidays”' },
            { value: 'white', label: 'White celebrities and creators as the default' },
            { value: 'men', label: 'Men as the default (e.g., “famous scientists” all men)' },
            { value: 'straight', label: 'Straight couples and families as the default' },
            { value: 'cis', label: 'Assumes two genders' },
            { value: 'abled', label: 'Assumes everyone can stand, see, hear, move quickly' },
            { value: 'school', label: 'Assumes everyone went to US schools' },
            { value: 'money', label: 'Assumes money (travel, brands, costumes)' },
            { value: 'alcohol', label: 'Assumes everyone drinks' },
          ],
          other: true,
        },
        {
          id: 'incl.fix', type: 'text',
          label: 'Pick one you checked. What’s one concrete change that would fix it?',
          showIf: { q: 'incl.defaults', answered: true },
        },
        {
          id: 'incl.reviewers', type: 'text', why: true,
          label: 'Who reviews content for bias and harm? Is anyone on that review from the communities most likely to be harmed — and are they paid for that work?',
        },
        {
          id: 'incl.report', type: 'text',
          label: 'Mid-game, a player says a question was racist (or sexist, ableist, transphobic…). What happens next — that night, and afterward?',
        },
      ],
    },
  ],
};

export const review = {
  id: 'review',
  title: 'Review',
  kind: 'review',
  intro: 'A summary of what’s left, built from your answers. Nothing here is required — it just shows where the thinking is thin.',
  groups: [
    {
      id: 'rev',
      title: 'Last word',
      questions: [
        {
          id: 'rev.missing', type: 'text', certainty: false,
          label: 'What did we forget to ask? What question would you have asked?',
        },
      ],
    },
  ],
};
