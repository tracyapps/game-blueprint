import { basics, item, inclusion, script } from './templates.js';

const P = 'll';
const GAME = 'Lipsync League';

export default {
  id: 'lipsync-league',
  title: GAME,
  kind: 'game',
  intro: 'Performance games have more moving parts than trivia: music rights, stages, judging, and people being on display. Take it slow.',
  groups: [
    {
      id: 'll.kind',
      title: 'What does a night look like?',
      questions: [
        {
          id: 'll.kind', type: 'choice', why: true,
          label: 'Which is closest to a Lipsync League night?',
          options: [
            { value: 'openmic', label: 'Open-mic style: people sign up for a slot and perform' },
            { value: 'battle', label: 'Team battles: teams go head-to-head' },
            { value: 'bracket', label: 'A bracket / tournament that narrows to a winner' },
          ],
          other: true,
        },
        {
          id: 'll.kind.explain', type: 'text',
          label: 'Explain exactly what a Lipsync League night looks like, start to finish.',
          showIf: { q: 'll.kind', is: '__other' },
        },
        {
          id: 'll.who', type: 'choice', why: true,
          label: 'Who performs?',
          options: [
            { value: 'solo', label: 'Solo only' },
            { value: 'teams', label: 'Teams only' },
            { value: 'either', label: 'Solo or team — performer’s choice' },
          ],
        },
        {
          id: 'll.signup', type: 'text',
          label: 'How and when do people sign up? Can they sign up in the app before the night?',
        },
        {
          id: 'll.no_signups', type: 'text',
          label: 'Nobody signs up — or only one person does. What happens?',
        },
        {
          id: 'll.limit', type: 'short', why: true,
          label: 'How many performances can one person or team do in a night?',
        },
        {
          id: 'll.capacity', type: 'short',
          label: 'What’s the most people performing at once?',
        },
        {
          id: 'll.crowd', type: 'choice', why: true,
          label: 'Do audience members (the hype crew) count as players?',
          options: [
            { value: 'players', label: 'Yes — they earn points or standings too' },
            { value: 'voters', label: 'They vote, but don’t earn points' },
            { value: 'spectators', label: 'Spectators only' },
          ],
        },
        {
          id: 'll.cutoff', type: 'short',
          label: 'Is there a hard end time, or does the night run as long as there are performers?',
        },
      ],
    },
    {
      id: 'll.music',
      title: 'Songs and licensing',
      intro: 'This group needs real answers before launch, not guesses.',
      questions: [
        {
          id: 'll.songs.choice', type: 'choice', why: true,
          label: 'How are songs chosen?',
          options: [
            { value: 'list', label: 'From a fixed song list' },
            { value: 'theme', label: 'From a list that changes with each theme' },
            { value: 'any', label: 'Performers pick any song' },
          ],
        },
        {
          id: 'll.songs.count', type: 'short',
          label: 'How many songs are on the list, and who curates it?',
          showIf: { q: 'll.songs.choice', in: ['list', 'theme'] },
        },
        {
          id: 'll.songs.list', type: 'list', certainty: false,
          label: 'Paste in the song list (or a starter list).',
          itemLabel: 'Song — Artist', min: 0,
          showIf: { q: 'll.songs.choice', in: ['list', 'theme'] },
        },
        {
          id: 'll.license', type: 'text', why: true,
          label: 'How is the music licensed for public performance at the venue, and who pays?',
          help: 'Playing recorded music in public generally needs a public-performance license (ASCAP, BMI, SESAC, GMR). Does the venue already hold one? Does it cover this use? Who checks?',
        },
        {
          id: 'll.video', type: 'text', why: true,
          label: 'Can performances be filmed and posted online?',
          help: 'Posting a video with a song in it is a different license from playing it in the room — and every performer has to agree to be filmed. How will you handle both?',
        },
        {
          id: 'll.playback', type: 'short',
          label: 'Who plays the music, and from what (venue speakers, host laptop, the app)?',
        },
        {
          id: 'll.explicit', type: 'choice', why: true,
          label: 'Explicit lyrics?',
          options: [
            { value: 'clean', label: 'Clean versions only' },
            { value: 'adult', label: 'Allowed at 21+ nights' },
            { value: 'venue', label: 'The venue decides' },
          ],
        },
        {
          id: 'll.songs.range', type: 'text',
          label: 'Who’s on the song list — and who’s missing?',
          help: 'Check genres, decades, languages, artists of color, women, LGBTQ+ artists, non-US artists. Also: songs with slurs or lyrics that mock a group.',
        },
      ],
    },
    {
      id: 'll.stage',
      title: 'Stage, props and costumes',
      questions: [
        {
          id: 'll.where', type: 'choice',
          label: 'Where do people perform?',
          options: [
            { value: 'stage', label: 'On a stage' },
            { value: 'floor', label: 'An open floor space' },
            { value: 'table', label: 'At their table' },
            { value: 'anywhere', label: 'Anywhere in the room' },
          ],
        },
        {
          id: 'll.props', type: 'choice', why: true,
          label: 'Props and costumes?',
          help: 'Bring-your-own favors people with spare money and time. Is there a free option that’s just as good?',
          options: [
            { value: 'provided', label: 'Provided by the venue or host' },
            { value: 'byo', label: 'Bring your own' },
            { value: 'both', label: 'Some provided, BYO welcome' },
            { value: 'none', label: 'None' },
          ],
        },
        {
          id: 'll.costume_line', type: 'text', why: true,
          label: 'Where’s the line on costumes and performances?',
          help: 'For example: blackface or “brownface”, religious or Indigenous dress worn as a costume, mocking disability, fake accents, or drag used to mock rather than celebrate. Who enforces it, and how, in the moment?',
        },
        {
          id: 'll.venue_needs', type: 'multi',
          label: 'What must a venue have for performances to be accessible?',
          options: [
            { value: 'ramp', label: 'Step-free stage access or a ramp' },
            { value: 'support', label: 'Railings, a stool, or sturdy furniture for balance' },
            { value: 'floor', label: 'Room to perform at floor level' },
            { value: 'no_strobe', label: 'No strobe or flashing lights (or a clear warning)' },
            { value: 'lyrics', label: 'Lyrics or captions on screen' },
            { value: 'quiet', label: 'A quiet space to take a break' },
            { value: 'volume', label: 'Sound kept at a safe level' },
          ],
          other: true,
        },
        {
          id: 'll.venue_check', type: 'text',
          label: 'Who checks a venue has these before it signs up — and what happens if it doesn’t?',
        },
      ],
    },
    {
      id: 'll.judging',
      title: 'Judging and scoring',
      questions: [
        {
          id: 'll.judges', type: 'choice', why: true,
          label: 'Who decides the scores?',
          help: 'Audience voting can turn into a popularity contest: people who bring friends win; newcomers, shy people and disabled performers lose. How will you balance that?',
          options: [
            { value: 'judges', label: 'Official judges' },
            { value: 'app', label: 'Audience votes in the app' },
            { value: 'noise', label: 'Audience applause / reactions' },
            { value: 'mix', label: 'A mix of judges and audience' },
          ],
          other: true,
        },
        {
          id: 'll.criteria', type: 'records', certainty: false,
          label: 'List each scoring factor and its range.',
          itemLabel: 'Factor', min: 2,
          fields: [
            { id: 'name', label: 'Factor (e.g., lip accuracy, energy, creativity)', type: 'short' },
            { id: 'range', label: 'Range (e.g., 1–10)', type: 'short' },
            { id: 'top', label: 'What a top score looks like', type: 'text' },
          ],
        },
        {
          id: 'll.criteria_bias', type: 'text',
          label: 'Could any factor reward looks, body type, or how “conventional” a performance is? How would a judge score a wheelchair user, a Deaf performer signing the song, or someone who can’t dance?',
        },
        {
          id: 'll.reactions', type: 'choice', why: true,
          label: 'Do in-app reactions (cheers, likes) affect scores?',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'fun', label: 'No — just for fun' },
          ],
        },
        {
          id: 'll.score_unit', type: 'choice',
          label: 'Do scores belong to individuals, teams, or both?',
          options: [
            { value: 'people', label: 'Individuals' },
            { value: 'teams', label: 'Teams' },
            { value: 'both', label: 'Both' },
          ],
        },
      ],
    },
    {
      id: 'll.league',
      title: 'The league season',
      questions: [
        {
          id: 'll.weeks', type: 'short',
          label: 'How many weeks is a season?',
        },
        {
          id: 'll.same_people', type: 'choice', why: true,
          label: 'Must teams be the same people every week?',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'subs', label: 'Mostly — subs allowed' },
            { value: 'no', label: 'No' },
          ],
        },
        {
          id: 'll.carry', type: 'text',
          label: 'How do scores add up over the season? If team members change, do the points stay with the team or the people?',
        },
        {
          id: 'll.missed', type: 'choice', why: true,
          label: 'A team misses a week. What happens?',
          options: [
            { value: 'zero', label: 'No points that week' },
            { value: 'penalty', label: 'A penalty' },
            { value: 'makeup', label: 'They can make it up' },
            { value: 'drop', label: 'Everyone’s lowest week is dropped' },
          ],
          other: true,
        },
        {
          id: 'll.arc', type: 'choice',
          label: 'Is each week stand-alone, or does the season build like a story toward a finale?',
          options: [
            { value: 'standalone', label: 'Each week stands alone' },
            { value: 'arc', label: 'The season has an arc' },
          ],
        },
      ],
    },
    {
      id: 'll.people',
      title: 'Performers are people',
      questions: [
        {
          id: 'll.safety', type: 'text',
          label: 'Performers are exposed. How do you handle heckling, harassment, unwanted touching, or someone filming without consent?',
        },
        {
          id: 'll.deaf', type: 'text',
          label: 'How can a Deaf performer take part (e.g., ASL song interpretation, visual beat cues)? How do Deaf audience members follow along?',
        },
      ],
    },

    ...basics(P, GAME),
    ...item(P, GAME, 'Is it a song? A song plus its theme? A performance slot? A judging card?'),
    ...inclusion(P, GAME),
    ...script(P, GAME, 2),
  ],
};
