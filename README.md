# Where We Gern? 🏝️

A Bahamas island quiz with an animated beach theme and a global leaderboard.

## Structure

```
index.html                     the whole quiz (home, game, end, scores)
questions.json                 the original questions (reference/backup)
netlify.toml                   Netlify config (static publish + functions)
package.json                   declares the @netlify/blobs dependency
netlify/functions/scores.mjs   leaderboard endpoint (GET + POST) using Netlify Blobs
```

The quiz reads its questions from the array inlined in `index.html`. `questions.json`
is kept as a backup/source of truth if you ever want to fetch it instead.

## How the leaderboard works

- **GET `/api/scores`** returns the top scores as JSON.
- **POST `/api/scores`** with `{ "name": "...", "score": 80 }` validates the entry
  (name required, score must be 0–100 and a multiple of 10) and saves it to a
  single Netlify Blobs entry, then returns the updated board.

The browser calls these in `index.html` (`loadScores` / `saveScore`). No database
to provision — Netlify Blobs is enabled automatically on deploy.

## Deploy

1. Push this folder to a GitHub repo.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Leave the build command empty; set **publish directory** to the repo root
   (already set in `netlify.toml`). Deploy.

That's it — the function and Blobs store come online with the deploy.

## Run locally

```bash
npm install
npx netlify dev
```

`netlify dev` serves the site and the function together, with a local Blobs
sandbox, at http://localhost:8888.

> Opening `index.html` directly (file://) runs the quiz, but the High Scores
> screen will show a connection message because there's no function to call.
> Use `netlify dev` (or the deployed site) to see the leaderboard.

## Notes

- Concurrent saves use last-write-wins on a single Blobs entry. For a quiz that's
  fine; if this ever gets heavy traffic, move to one blob per score or Netlify DB.
- Validation deters casual score-faking but isn't bulletproof (anyone can POST a
  valid-looking score). Good enough for a fun public board.
