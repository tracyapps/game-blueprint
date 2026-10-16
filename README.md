# Game Blueprint

A small research site that walks the gaming team through every game, one at a time, until each one is explained like a system the app can run. It also runs a card sort so the team agrees on **one** word for each layer of content (item → group → night → game → season → vault).

Plain HTML + SCSS + vanilla JS. No framework. Supabase stores answers; Vercel hosts it.

---

## What's where

```
game-blueprint/
├── public/                    ← what Vercel serves
│   ├── index.html             sign in (name + email → link and 6-digit code)
│   ├── survey.html            the survey
│   ├── results.html           patterns + every answer + CSV (admins only)
│   └── assets/
│       ├── css/main.css       compiled — don't edit, edit src/scss
│       └── js/
│           ├── config.js      ← the ONLY file you edit to go live
│           ├── questions/     ← all the questions, one file per game
│           ├── render.js      draws each question type
│           ├── logic.js       show/hide rules, "is it answered", formatting
│           ├── store.js       autosave
│           ├── db.js          talks to Supabase (or the browser in preview mode)
│           ├── survey.js · signin.js · results.js · ui.js
├── src/scss/                  styles (tokens = OMG brand colors, light + dark)
└── supabase/schema.sql        tables, security rules, history log
```

## Try it right now (preview mode)

While `config.js` is blank, the site runs in **preview mode**: no email, answers live only in your browser. A yellow banner says so.

```bash
cd game-blueprint
npm install          # only needed for SCSS
npm run dev          # opens http://localhost:4321
```

(Or open the `public` folder with any local server, e.g. VS Code Live Server.)

To see the save-error state: in the browser console run `localStorage.setItem('gb-demo-fail','true')`, type something, then `localStorage.removeItem('gb-demo-fail')`.

## Go live

### 1. Supabase (≈10 min)
1. Create a **new** free project (keep it separate from the app's database).
2. **SQL Editor → New query** → paste all of `supabase/schema.sql` → **Run**.
3. Make yourself an admin (one line, your email, lowercase):
   ```sql
   insert into public.admins (email) values ('t@thisroad.org') on conflict do nothing;
   ```
4. **Authentication → URL Configuration**
   - Site URL: your Vercel URL, e.g. `https://game-blueprint.vercel.app`
   - Redirect URLs: add `https://game-blueprint.vercel.app/survey.html` (and `http://localhost:4321/survey.html` for testing)
5. **Authentication → Emails → SMTP** — turn on custom SMTP with **Resend**. Supabase's built-in email only sends to your own team members and a couple per hour, so this step is required.
   - Host `smtp.resend.com` · Port `465` · Username `resend` · Password: a Resend API key
   - Sender: an address on a domain you've verified in Resend
6. **Authentication → Emails → Templates → Magic Link** — make sure the email includes the code as well as the link, so people who open email on their phone can still sign in on their laptop:
   ```html
   <h2>Your Game Blueprint sign-in</h2>
   <p><a href="{{ .ConfirmationURL }}">Sign in</a></p>
   <p>Or enter this code: <strong>{{ .Token }}</strong></p>
   <p>Expires in 1 hour. If you didn't ask for this, ignore it.</p>
   ```
   Do the same for the **Confirm signup** template (first-timers get that one).
7. **Project Settings → API** → copy the Project URL and the `anon` / publishable key into `public/assets/js/config.js`.
   The anon key is meant to be public — the security rules in `schema.sql` are what protect the data.

### 2. Vercel
- **Easiest:** in this folder run `npx vercel` and follow the prompts (framework: **Other**). `vercel.json` already sets the build (`npm run build`) and output (`public`).
- **Or** push the folder to a Git repo and import it in Vercel. If it's inside a bigger repo, set Root Directory to `game-blueprint`.

The site sends `noindex` headers so it won't show up in search.

## Who sees what

| | Their own answers | Everyone's answers | Change history |
|---|---|---|---|
| A respondent | read + edit | — | — |
| An admin (email in `admins`) | read + edit | read | read |
| Not signed in | — | — | — |

Enforced by Postgres row-level security, not by the page. People never see each other's card sorts, so nobody gets anchored by the loudest opinion.

## Seeing the results

- **`/results.html`** (admins): progress per person, where the team disagrees, how settled each game is (decided / leaning / guess / someone else decides), what decisions are really based on (why-ladder roots), Name-it consensus, accessibility gaps per game, and a filterable table of every answer with CSV download (plus full change history CSV).
- **Supabase → Table Editor → `answers_sheet`** — the spreadsheet view: one row per person per question.
- **`answer_history_sheet`** — every change over time. Rapid autosaves within 2 minutes are merged, so it shows how thinking changed, not every keystroke.

## Editing questions

Each game is one file in `public/assets/js/questions/`. Shared question blocks (basics, the vault item, accessibility matrix, sample script) are in `templates.js`, so every game asks them the same way and answers line up across games.

**Never change a question's `id` after people have answered** — it's the database key. Change the `label` freely.

```js
{
  id: 'pt.hunt.where',           // unique, permanent
  type: 'multi',                 // see list below
  label: 'Where can players go to get photos?',
  help: 'Smaller text under the question.',      // optional
  options: [{ value: 'inside', label: 'Inside the venue only' }],
  other: true,                   // adds "Other" + a text box
  why: true,                     // adds the why → why → why ladder
  certainty: false,              // hide "How settled is this?" (on by default)
  showIf: { q: 'pt.kind', is: 'hunt' },   // conditional
}
```

**Types:** `text` (paragraph) · `short` (one line) · `choice` (pick one) · `multi` (pick many) · `list` (numbered steps; `itemLabel`, `min`) · `records` (repeating mini-form; `fields`) · `matrix` (the accessibility grid) · `cardsort` (Name it) · `info` (a note, no answer)

**`showIf`:**
`{ q, is: 'x' }` · `{ q, in: ['x','y'] }` · `{ q, includes: 'x' }` (for multi) · `{ q, answered: true }` · `{ any: [...] }` · `{ all: [...] }` — “Other” is the value `'__other'`. Works on a whole group or a single question.

**Add a game:** copy a game file, give it a new two-letter prefix, add it to `SECTIONS` in `questions/index.js`, and add it to `GAMES` in `naming.js`.

**Styles:** edit `src/scss/*`, then `npm run build:css` (or `npm run watch:css` while working).

## Accessibility notes

Built to WCAG 2.2 AA and checked with axe in light and dark mode (0 violations): real `<fieldset>`/`<legend>` groups, labels on every field, 44px targets, visible focus, Atkinson Hyperlegible, reduced-motion respected, and nothing relies on color alone. The save status updates visually all the time, but only **announces** to screen readers on errors, recoveries, and manual saves, so typing isn't interrupted every few seconds.
