import { NIGEL_PERSONA } from "../../../src/data/nigelFile";

/**
 * N.I.G.E.L.'s line to Gemini: a Cloudflare Worker that takes the visitor's
 * conversation from the site, adds the persona and the case file (built from
 * the site's own data, src/data/nigelFile.ts), asks Gemini, and returns the
 * answer. The Gemini key lives here as a secret and never reaches the browser.
 *
 * POST { messages: [{ role: "user" | "model", text }] }  ->  { answer }
 */

interface Env {
  /** Google AI Studio key: `npx wrangler secret put GEMINI_API_KEY`. */
  GEMINI_API_KEY: string;
  /** Gemini model id, e.g. gemini-2.5-flash (wrangler.toml [vars]). */
  GEMINI_MODEL: string;
  /** Comma-separated origins allowed to call this Worker (the site's own). */
  ALLOWED_ORIGINS: string;
}

interface Message {
  role: "user" | "model";
  text: string;
}

/** Most turns accepted per request, and longest text per turn. */
const MAX_MESSAGES = 13;
const MAX_TEXT = 600;

function cors(origin: string | null, env: Env) {
  const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  const ok = origin && (allowed.includes(origin) || allowed.includes("*"));
  return {
    "Access-Control-Allow-Origin": ok ? origin : (allowed[0] ?? ""),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });

/** Checks the conversation's shape: alternating short turns, ending with the visitor's question. */
function parse(body: unknown): Message[] | null {
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES)
    return null;
  const out: Message[] = [];
  for (const m of messages) {
    const role = (m as Message)?.role;
    const text = (m as Message)?.text;
    if ((role !== "user" && role !== "model") || typeof text !== "string") return null;
    if (!text.trim() || text.length > MAX_TEXT) return null;
    out.push({ role, text });
  }
  return out[out.length - 1].role === "user" ? out : null;
}

/** The model found to work, once the configured one turned out to be gone. */
let cachedModel: string | null = null;

const API = "https://generativelanguage.googleapis.com/v1beta";

function ask(env: Env, model: string, contents: unknown) {
  const generationConfig: Record<string, unknown> = { maxOutputTokens: 1024, temperature: 0.7 };
  // 2.5 Flash "thinks" by default, which spends the output budget; a records
  // terminal answering from one page does not need it. (Newer models are left
  // at their defaults, with room in the budget for their thinking.)
  if (model.includes("2.5-flash")) generationConfig.thinkingConfig = { thinkingBudget: 0 };
  return fetch(`${API}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: NIGEL_PERSONA }] },
      contents,
      generationConfig,
    }),
  });
}

/**
 * The newest plain Flash model this key may call (not lite, preview, image,
 * audio or live variants), by version number; null if none is listed.
 */
async function newestFlash(env: Env): Promise<string | null> {
  const res = await fetch(`${API}/models?pageSize=200`, {
    headers: { "x-goog-api-key": env.GEMINI_API_KEY },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    models?: { name: string; supportedGenerationMethods?: string[] }[];
  };
  const version = (id: string) => parseFloat(id.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] ?? "0");
  const candidates = (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => m.name.replace(/^models\//, ""))
    .filter((id) => /^gemini-[\d.]+-flash/.test(id))
    .filter((id) => !/lite|preview|exp|image|audio|tts|live|thinking/.test(id))
    .sort((a, b) => version(b) - version(a) || a.length - b.length);
  if (candidates[0]) return candidates[0];
  // Only previews on offer: take the newest of those rather than nothing.
  const previews = (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => m.name.replace(/^models\//, ""))
    .filter((id) => /^gemini-[\d.]+-flash/.test(id) && !/lite|image|audio|tts|live/.test(id))
    .sort((a, b) => version(b) - version(a));
  return previews[0] ?? null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const headers = cors(origin, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return json({ error: "POST only" }, 405, headers);
    const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
    if (!allowed.includes("*") && (!origin || !allowed.includes(origin)))
      return json({ error: "origin not allowed" }, 403, headers);

    let messages: Message[] | null;
    try {
      messages = parse(await request.json());
    } catch {
      messages = null;
    }
    if (!messages) return json({ error: "bad request" }, 400, headers);

    const contents = messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
    let model = cachedModel ?? env.GEMINI_MODEL;
    let res = await ask(env, model, contents);
    if (res.status === 503) {
      // Gemini briefly overloaded: one more try after a moment.
      await new Promise((r) => setTimeout(r, 1200));
      res = await ask(env, model, contents);
    }
    if (res.status === 404) {
      // The configured model has been retired or renamed: ask Google which
      // Flash models this key can use, take the newest, and remember it.
      const found = await newestFlash(env);
      if (found && found !== model) {
        model = cachedModel = found;
        res = await ask(env, model, contents);
      }
    }
    if (!res.ok) {
      // 429 when the free quota is spent: the site falls back to its card index.
      return json({ error: `gemini ${res.status}` }, res.status === 429 ? 429 : 502, headers);
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const answer = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!answer) return json({ error: "no answer" }, 502, headers);
    return json({ answer }, 200, headers);
  },
};
