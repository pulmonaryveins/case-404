import { NIGEL_GREETING, nigelOffline } from "../../data/nigelFile";

/**
 * N.I.G.E.L.'s conversation: the transcript on the CRT, the line being typed,
 * and the trip to the Worker that asks Gemini (worker/nigel). Module state,
 * read by the screen painter each frame; `version` goes up on every change so
 * the screen repaints only when something moved.
 *
 * The Worker's address comes from VITE_NIGEL_URL (.env.local). Without it,
 * or when the line fails, N.I.G.E.L. answers from its card index
 * (nigelOffline) and says so.
 */

export interface ChatLine {
  who: "nigel" | "you" | "note";
  text: string;
  /** Characters shown so far: N.I.G.E.L.'s lines type out. */
  shown: number;
}

/** Characters per second N.I.G.E.L. types at. */
const TYPE_CPS = 70;
/** Longest question the terminal takes. */
export const MAX_INPUT = 160;
/** Turns of the conversation sent with each question (for follow-ups). */
const HISTORY = 6;
const ENDPOINT = import.meta.env.VITE_NIGEL_URL as string | undefined;

export const nigel = {
  lines: [] as ChatLine[],
  input: "",
  /** Waiting on an answer. */
  thinking: false,
  version: 0,
};

const touch = () => {
  nigel.version++;
};

/** Starts a fresh session: the greeting, typed out. */
export function nigelReset() {
  nigel.lines = NIGEL_GREETING.map((text) => ({ who: "nigel" as const, text, shown: 0 }));
  nigel.input = "";
  nigel.thinking = false;
  touch();
}

/** Advances the typing; true while anything is still being typed. */
export function nigelStep(dt: number) {
  const line = nigel.lines.find((l) => l.who === "nigel" && l.shown < l.text.length);
  if (!line) return false;
  line.shown = Math.min(line.text.length, line.shown + Math.max(1, Math.round(dt * TYPE_CPS)));
  touch();
  return true;
}

/** Shows every line in full (a key pressed while it types). */
export function nigelSkip() {
  for (const line of nigel.lines) line.shown = line.text.length;
  touch();
}

export function nigelType(text: string) {
  nigel.input = text.slice(0, MAX_INPUT);
  touch();
}

const say = (who: ChatLine["who"], text: string) => {
  nigel.lines.push({ who, text, shown: who === "nigel" ? 0 : text.length });
  // Only the tail fits on the tube; keep a little more for context.
  if (nigel.lines.length > 40) nigel.lines.splice(0, nigel.lines.length - 40);
  touch();
};

/** The conversation so far, as Gemini wants it (user and model turns). */
function history() {
  return nigel.lines
    .filter((l) => l.who !== "note")
    .slice(-HISTORY * 2)
    .map((l) => ({ role: l.who === "you" ? "user" : "model", text: l.text }));
}

/** How long the card index takes, so the thinking face and drive sound fit. */
const CARD_INDEX_MS = 800;

async function askLine(question: string) {
  if (!ENDPOINT) {
    await new Promise((r) => setTimeout(r, CARD_INDEX_MS));
    throw new Error("no line");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...history(), { role: "user", text: question }] }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`line ${res.status}`);
    const data = (await res.json()) as { answer?: string };
    if (!data.answer) throw new Error("empty");
    return data.answer.trim();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sends the typed question. Returns "exit" when the visitor asked to eject
 * the disk (the station takes it out), else nothing.
 */
export function nigelSubmit(): "exit" | void {
  const question = nigel.input.trim();
  if (!question || nigel.thinking) return;
  nigelType("");
  const word = question.toLowerCase();
  if (word === "exit" || word === "quit" || word === "eject") return "exit";
  if (word === "clear" || word === "cls") {
    nigel.lines = [];
    touch();
    return;
  }
  // History is read before this question joins it.
  const ask = askLine(question);
  say("you", question);
  nigel.thinking = true;
  touch();
  ask
    .then((answer) => say("nigel", answer))
    .catch(() => {
      say(
        "note",
        ENDPOINT
          ? "LINE ENGAGED. CONSULTING THE CARD INDEX INSTEAD."
          : "NO LINE CONNECTED. CONSULTING THE CARD INDEX.",
      );
      say("nigel", nigelOffline(question));
    })
    .finally(() => {
      nigel.thinking = false;
      touch();
    });
}
