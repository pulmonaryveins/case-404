import { NIGEL_PERSONA } from "../../../src/data/nigelFile";

/**
 * N.I.G.E.L.'s line to its model: a Cloudflare Worker that takes the visitor's
 * conversation from the site, adds the persona and the case file (built from
 * the site's own data, src/data/nigelFile.ts), asks Cloudflare Workers AI, and
 * returns the answer. No outside key: the model is reached through the `AI`
 * binding in wrangler.toml.
 *
 * POST { messages: [{ role: "user" | "model", text }] }  ->  { answer }
 */

interface Env {
  /** Workers AI binding (wrangler.toml [ai]). */
  AI: { run: (model: string, input: unknown) => Promise<{ response?: string }> };
  /** Workers AI model id (wrangler.toml [vars]). */
  AI_MODEL: string;
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

const TIMEOUT_MS = 12000;

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

    const chat = [
      { role: "system", content: NIGEL_PERSONA },
      ...messages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      })),
    ];
    try {
      const out = await Promise.race([
        env.AI.run(env.AI_MODEL, { messages: chat, max_tokens: 300, temperature: 0.7 }),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), TIMEOUT_MS)),
      ]);
      const answer = out.response?.trim();
      if (!answer) return json({ error: "no answer" }, 502, headers);
      return json({ answer }, 200, headers);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      console.log(`${env.AI_MODEL}: ${detail}`);
      return json({ error: "model unavailable", detail: detail.slice(0, 300) }, 502, headers);
    }
  },
};
