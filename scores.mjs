import { getStore } from "@netlify/blobs";

// ---- rules (must match the quiz) ----
const MAX_QUESTIONS = 10;
const CORRECT_BONUS = 10;
const MAX_SCORE = MAX_QUESTIONS * CORRECT_BONUS; // 100
const NAME_MAX = 16;
const STORE_LIMIT = 50; // how many we keep on the board
const RETURN_LIMIT = 25; // how many we hand back to the client

const BOARD_KEY = "board";

function board() {
  // strong consistency avoids reading a stale board right after a write
  return getStore({ name: "highscores", consistency: "strong" });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function cleanName(raw) {
  if (typeof raw !== "string") return null;
  // strip control chars and angle brackets, collapse whitespace, trim
  const name = raw
    .replace(/[\u0000-\u001F<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NAME_MAX);
  return name.length ? name : null;
}

function validScore(raw) {
  return (
    Number.isInteger(raw) &&
    raw >= 0 &&
    raw <= MAX_SCORE &&
    raw % CORRECT_BONUS === 0
  );
}

export default async (req) => {
  const store = board();

  if (req.method === "GET") {
    const scores = (await store.get(BOARD_KEY, { type: "json" })) || [];
    return json(scores.slice(0, RETURN_LIMIT));
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON." }, 400);
    }

    const name = cleanName(body?.name);
    const score = body?.score;

    if (!name) return json({ error: "A name is required." }, 400);
    if (!validScore(score)) return json({ error: "Invalid score." }, 400);

    const scores = (await store.get(BOARD_KEY, { type: "json" })) || [];
    scores.push({ name, score, ts: Date.now() });
    scores.sort((a, b) => b.score - a.score || a.ts - b.ts); // higher first; ties: earlier first
    scores.splice(STORE_LIMIT);

    await store.setJSON(BOARD_KEY, scores);
    return json(scores.slice(0, RETURN_LIMIT));
  }

  return json({ error: "Method not allowed." }, 405);
};

// Clean public URL instead of /.netlify/functions/scores
export const config = { path: "/api/scores" };
