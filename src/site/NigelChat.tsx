import { type FormEvent, useEffect, useRef, useState } from "react";
import { NIGEL_GREETING, NIGEL_UNKNOWN, nigelOffline } from "../data/nigelFile";
import { NigelFace, type NigelExpression } from "./NigelFace";
import styles from "./Site.module.css";

/** Longest question taken, and the turns of the talk sent with each one. */
const MAX_INPUT = 160;
const HISTORY = 6;
const ENDPOINT = import.meta.env.VITE_NIGEL_URL as string | undefined;

/** What N.I.G.E.L. adds when it has no answer. */
const WIP_NOTE =
  "N.I.G.E.L. is still a work in progress, so some questions have no answer yet. More is being filed.";

/** Replies from the model that mean "the file does not say". */
const DOES_NOT_KNOW =
  /(does not record|doesn't record|not on file|no record|not recorded|does not say|outside the file|not in the file|no mention|beyond the file|do not have|don't have|cannot say|can't say)/i;

const SUGGESTIONS = [
  "Who is the subject?",
  "What are their skills?",
  "Tell me about Lamoy Ordering",
  "Where did they study?",
];

interface Line {
  who: "nigel" | "you" | "note";
  text: string;
}

/** The answer from the Worker (worker/nigel), which asks Gemini. */
async function askLine(question: string, past: Line[]) {
  if (!ENDPOINT) throw new Error("no line");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const messages = past
      .filter((l) => l.who !== "note")
      .slice(-HISTORY * 2)
      .map((l) => ({ role: l.who === "you" ? "user" : "model", text: l.text }));
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...messages, { role: "user", text: question }] }),
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
 * N.I.G.E.L. on the website: the records terminal from the 3D office, as a
 * chat in the corner. It answers from the same case file (through the Worker
 * when one is set up, else from its offline card index), and whenever it has
 * no answer it says it is still a work in progress.
 */
export function NigelChat() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>(() =>
    NIGEL_GREETING.slice(0, 3).map((text) => ({ who: "nigel" as const, text })),
  );
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  // How much of N.I.G.E.L.'s newest reply is typed out so far (null: all of it).
  const [typed, setTyped] = useState<number | null>(null);
  const [blink, setBlink] = useState(false);
  const [tick, setTick] = useState(0);
  const log = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [lines, thinking, typed, open]);

  // A new reply types itself out, as on the terminal.
  const last = lines[lines.length - 1];
  const noteLast = last?.who === "note" ? lines[lines.length - 2] : last;
  const replyIndex = lines.indexOf(noteLast);
  const reply = noteLast?.who === "nigel" && replyIndex >= 3 ? noteLast : null;
  useEffect(() => {
    if (!reply) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let n = 0;
    const timer = window.setInterval(() => {
      n += 2;
      setTyped(n >= reply.text.length ? null : n);
      setTick((t) => t + 1);
      if (n >= reply.text.length) window.clearInterval(timer);
    }, 26);
    return () => window.clearInterval(timer);
  }, [reply]);

  // A blink every few seconds.
  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => {
      setBlink(true);
      window.setTimeout(() => setBlink(false), 140);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [open]);

  const expression: NigelExpression = thinking
    ? "think"
    : typed !== null
      ? tick % 2
        ? "talk"
        : "idle"
      : blink
        ? "blink"
        : "idle";

  const ask = async (raw: string) => {
    const question = raw.trim().slice(0, MAX_INPUT);
    if (!question || thinking) return;
    const past = lines;
    setLines((l) => [...l, { who: "you", text: question }]);
    setInput("");
    setThinking(true);
    let answer: string;
    let unknown = false;
    try {
      answer = await askLine(question, past);
      unknown = DOES_NOT_KNOW.test(answer);
    } catch {
      // The line is down or not set up: the card index answers.
      await new Promise((r) => setTimeout(r, 600));
      answer = nigelOffline(question);
      unknown = answer === NIGEL_UNKNOWN;
    }
    setLines((l) => [
      ...l,
      { who: "nigel", text: answer },
      ...(unknown ? [{ who: "note" as const, text: WIP_NOTE }] : []),
    ]);
    setTyped(0);
    setThinking(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void ask(input);
  };

  return (
    <>
      {open && (
        <section
          className={styles.nigel}
          aria-label="N.I.G.E.L., the records terminal"
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <header className={styles.nigelHead}>
            <NigelFace expression={expression} className={styles.nigelAvatar} />
            <span>
              <strong>N.I.G.E.L.</strong>
              <small>Networked Inquiry &amp; General Evidence Locator</small>
            </span>
            <button onClick={() => setOpen(false)} aria-label="Close N.I.G.E.L.">
              ✕
            </button>
          </header>

          <div className={styles.nigelLog} ref={log} aria-live="polite" data-lenis-prevent>
            {lines.map((l, i) => {
              const text = l === reply && typed !== null ? l.text.slice(0, typed) : l.text;
              if (l.who === "note")
                return (
                  <p key={i} data-who="note">
                    {text}
                  </p>
                );
              // The speaker is named at the start of each run of lines.
              const first = lines[i - 1]?.who !== l.who;
              return (
                <div key={i} className={styles.nigelRow} data-who={l.who} data-first={first}>
                  {l.who === "nigel" && (
                    <span className={styles.nigelBadge} aria-hidden>
                      {first && <NigelFace className={styles.nigelBadgeFace} />}
                    </span>
                  )}
                  <div className={styles.nigelBubble}>
                    {first && (
                      <span className={styles.nigelWho}>
                        {l.who === "you" ? "You" : "N.I.G.E.L."}
                      </span>
                    )}
                    <p>{text}</p>
                  </div>
                </div>
              );
            })}
            {thinking && (
              <p data-who="note" className={styles.nigelThinking}>
                Consulting the card index…
              </p>
            )}
            {lines.length <= 3 && !thinking && (
              <div className={styles.nigelChips}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => void ask(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form className={styles.nigelForm} onSubmit={submit}>
            <input
              ref={field}
              value={input}
              maxLength={MAX_INPUT}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the subject…"
              aria-label="Your question"
            />
            <button type="submit" disabled={thinking || !input.trim()}>
              Send
            </button>
          </form>
          <p className={styles.nigelFoot}>Work in progress · answers from the file only</p>
        </section>
      )}
      <button
        className={styles.nigelLauncher}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <NigelFace
          expression={open ? "idle" : blink ? "blink" : "idle"}
          className={styles.nigelMini}
        />
        {open ? "Close N.I.G.E.L." : "Ask N.I.G.E.L."}
      </button>
    </>
  );
}
