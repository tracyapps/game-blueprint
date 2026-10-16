import { basics, item, inclusion, script } from './templates.js';

const P = 'pt';
const GAME = 'Picture This';

export default {
  id: 'picture-this',
  title: GAME,
  kind: 'game',
  intro: 'Start with what kind of game this is. Your answer opens the questions that fit it.',
  groups: [
    {
      id: 'pt.kind',
      title: 'What kind of game is it?',
      questions: [
        {
          id: 'pt.kind', type: 'choice', why: true,
          label: 'Which best describes Picture This?',
          options: [
            { value: 'identify', label: 'Identify it: players name who, what or where is in a photo' },
            { value: 'hunt', label: 'Photo scavenger hunt: players take and submit photos for points' },
            { value: 'realfake', label: 'Real or fake: players spot the real photo among edited or AI-made ones' },
          ],
          other: true,
          help: 'If it’s more than one of these, pick the main one and explain in the why.',
        },
      ],
    },

    // Branch: identify -----------------------------------------------------
    {
      id: 'pt.identify',
      title: 'Identify it',
      showIf: { q: 'pt.kind', is: 'identify' },
      questions: [
        {
          id: 'pt.id.subjects', type: 'multi',
          label: 'What are players identifying?',
          options: [
            { value: 'people', label: 'People' },
            { value: 'places', label: 'Places and landmarks' },
            { value: 'objects', label: 'Objects, products or logos' },
            { value: 'events', label: 'Events or moments in history' },
            { value: 'pop', label: 'Movies, TV, music, pop culture' },
            { value: 'closeups', label: 'Close-ups or zoomed-in details' },
          ],
          other: true,
        },
        {
          id: 'pt.id.people', type: 'text',
          label: 'Photos of real people: are they public figures only? Could an image embarrass, sexualize or mock someone? How do you get consent for anyone who isn’t a public figure?',
          showIf: { q: 'pt.id.subjects', includes: 'people' },
        },
        {
          id: 'pt.id.media', type: 'multi',
          label: 'What kinds of media?',
          options: [
            { value: 'still', label: 'Still photos' },
            { value: 'live', label: 'Live / moving photos' },
            { value: 'video', label: 'Short video clips' },
            { value: 'art', label: 'Illustrations or artwork' },
          ],
          other: true,
        },
        {
          id: 'pt.id.reveal', type: 'choice', why: true,
          label: 'Is the image shown all at once, or revealed bit by bit (zooming out, un-pixelating, tiles)?',
          options: [
            { value: 'all', label: 'All at once' },
            { value: 'gradual', label: 'Gradual reveal' },
            { value: 'both', label: 'Both, depending on the item' },
          ],
        },
        {
          id: 'pt.id.answers', type: 'text',
          label: 'Is there only one right answer? Write the rule for “close enough” (e.g., “Eiffel Tower” vs. “Paris”).',
        },
        {
          id: 'pt.id.describe', type: 'text', why: true,
          label: 'A blind player uses a screen reader. How do you describe the image without giving away the answer?',
          help: '“A tall iron lattice tower at dusk” gives it away. Does a blind player get a fair description, a different-but-equal item, an audio clue, or something else?',
        },
      ],
    },

    // Branch: scavenger hunt ----------------------------------------------
    {
      id: 'pt.hunt',
      title: 'Photo scavenger hunt',
      showIf: { q: 'pt.kind', is: 'hunt' },
      questions: [
        {
          id: 'pt.hunt.where', type: 'multi', why: true,
          label: 'Where can players go to get photos?',
          options: [
            { value: 'inside', label: 'Inside the venue only' },
            { value: 'patio', label: 'The venue’s patio or outdoor area' },
            { value: 'nearby', label: 'Anywhere nearby' },
            { value: 'roll', label: 'Their own camera roll (old photos count)' },
          ],
          other: true,
        },
        {
          id: 'pt.hunt.pace', type: 'choice',
          label: 'How do clues come out?',
          options: [
            { value: 'all', label: 'All at once; teams go at their own pace' },
            { value: 'host', label: 'One at a time, called by the host' },
            { value: 'unlock', label: 'Unlocked as each team finishes the last one' },
          ],
        },
        {
          id: 'pt.hunt.deadline', type: 'short',
          label: 'What’s the deadline for every team to submit, and what happens to late photos?',
        },
        {
          id: 'pt.hunt.judge', type: 'choice', why: true,
          label: 'Who decides if a photo counts?',
          options: [
            { value: 'host', label: 'The host' },
            { value: 'vote', label: 'Other teams vote' },
            { value: 'staff', label: 'Venue staff' },
            { value: 'mix', label: 'A mix' },
          ],
          other: true,
        },
        {
          id: 'pt.hunt.bonus', type: 'text', why: true,
          label: 'Can points stack (creativity, poses, everyone in the shot)? List every bonus and its value.',
          help: '“Everyone in the photo” or “best pose” bonuses can penalize disabled players, anxious players, and anyone who doesn’t want their face online. How will bonuses stay fair?',
        },
        {
          id: 'pt.hunt.safety', type: 'text',
          label: 'What keeps players safe and respectful? Think traffic, other diners, staff-only areas, and photographing strangers or kids without consent.',
        },
        {
          id: 'pt.hunt.photos', type: 'text',
          label: 'What happens to submitted photos? Who sees them, can they go on the big screen or online, and when are they deleted? How do you stop an inappropriate photo from appearing on screen?',
        },
      ],
    },

    // Branch: real or fake -------------------------------------------------
    {
      id: 'pt.realfake',
      title: 'Real or fake',
      showIf: { q: 'pt.kind', is: 'realfake' },
      questions: [
        {
          id: 'pt.rf.ratio', type: 'choice',
          label: 'How many images per item?',
          options: [
            { value: '1v1', label: 'One real, one fake' },
            { value: '1vmany', label: 'One real, several fakes' },
            { value: 'single', label: 'One image: real or fake?' },
            { value: 'any', label: 'Several images, any number could be real' },
          ],
          other: true,
        },
        {
          id: 'pt.rf.fakes', type: 'multi',
          label: 'What makes the fakes?',
          options: [
            { value: 'ai', label: 'AI-generated' },
            { value: 'edited', label: 'Edited / Photoshopped' },
            { value: 'staged', label: 'Staged photos' },
            { value: 'caption', label: 'Real photo with a false caption' },
          ],
          other: true,
        },
        {
          id: 'pt.rf.points', type: 'choice', why: true,
          label: 'How does scoring work?',
          options: [
            { value: 'all', label: 'All or nothing' },
            { value: 'partial', label: 'Partial points (e.g., for spotting what was changed)' },
            { value: 'bonus', label: 'Bonus for explaining the giveaway' },
          ],
          other: true,
        },
        {
          id: 'pt.rf.ethics', type: 'text', why: true,
          label: 'Fakes of real people and real events (disasters, wars, protests) can spread misinformation and hurt real people. What’s off-limits? How do you stop a fake from being screenshotted and shared as real?',
        },
        {
          id: 'pt.rf.access', type: 'text',
          label: 'The whole game is spotting visual details. How does a blind or low-vision player compete fairly?',
        },
      ],
    },

    // Branch: something else ----------------------------------------------
    {
      id: 'pt.other',
      title: 'Something else',
      showIf: { q: 'pt.kind', is: '__other' },
      questions: [
        {
          id: 'pt.other.rules', type: 'list', certainty: false,
          label: 'Write the rules, step by step.',
          itemLabel: 'Rule', min: 3,
        },
      ],
    },

    // Everyone: where images come from ------------------------------------
    {
      id: 'pt.images',
      title: 'Where the images come from',
      questions: [
        {
          id: 'pt.img.source', type: 'multi', why: true,
          label: 'Where will images come from?',
          help: '“Found online” is almost always copyrighted. Using it in a paid product is a legal risk the company would carry.',
          options: [
            { value: 'stock', label: 'Licensed stock photos' },
            { value: 'staff', label: 'Taken by staff' },
            { value: 'cc', label: 'Public domain or Creative Commons' },
            { value: 'players', label: 'Submitted by players' },
            { value: 'ai', label: 'AI-generated' },
            { value: 'found', label: 'Found online (no license yet)' },
          ],
          other: true,
        },
        {
          id: 'pt.img.display', type: 'choice', why: true,
          label: 'Where do players see the images?',
          options: [
            { value: 'screen', label: 'Big screen only' },
            { value: 'phones', label: 'Players’ phones only' },
            { value: 'both', label: 'Both' },
            { value: 'paper', label: 'Printed handouts' },
          ],
        },
        {
          id: 'pt.img.vetting', type: 'text', why: true,
          label: 'How is each image checked for stereotypes, dominant-culture bias, and sacred or sensitive material — like Indigenous ceremonies, religious objects, or real tragedies? Who checks?',
        },
      ],
    },

    ...basics(P, GAME),
    ...item(P, GAME, 'Is it one photo? One photo plus its answer? A set of real-and-fake photos? A scavenger-hunt clue?'),
    ...inclusion(P, GAME),
    ...script(P, GAME),
  ],
};
