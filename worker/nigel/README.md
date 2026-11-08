# N.I.G.E.L. Worker

The line between the archive terminal's chatbot (N.I.G.E.L., the red disk by
the rack) and Google Gemini. It holds the Gemini key, adds N.I.G.E.L.'s
persona and the case file (built from `src/data/` by `src/data/nigelFile.ts`),
and returns short answers. Without it, the site still works: N.I.G.E.L.
answers from its offline card index.

## Set up (once)

1. Get a free Gemini API key at <https://aistudio.google.com/> ("Get API key").
2. Make a free Cloudflare account at <https://dash.cloudflare.com/sign-up>.
3. From the repo root:

   ```sh
   cd worker/nigel
   npx wrangler login
   npx wrangler secret put GEMINI_API_KEY   # paste the key when asked
   npx wrangler deploy
   ```

   `deploy` prints the Worker's address, e.g.
   `https://nigel.<your-subdomain>.workers.dev`.

4. In the repo root, create `.env.local` (git-ignored) with that address:

   ```sh
   VITE_NIGEL_URL=https://nigel.<your-subdomain>.workers.dev
   ```

   Restart `npm run dev`.

5. When the site is deployed, add its address to `ALLOWED_ORIGINS` in
   `wrangler.toml` (comma-separated, no trailing slash), set
   `VITE_NIGEL_URL` in the host's build settings, and `npx wrangler deploy`
   again.

## Settings (`wrangler.toml`)

- `GEMINI_MODEL`: the Gemini model asked. Check AI Studio for the current
  free-tier Flash model if this one is retired.
- `ALLOWED_ORIGINS`: the only sites allowed to call the Worker.

## Notes

- The case file is bundled into the Worker when it is deployed. After
  changing `src/data/` (new job, new certificate), run `npx wrangler deploy`
  again so N.I.G.E.L. knows.
- Free tiers have daily limits. When Gemini refuses (quota spent, outage),
  the site says "LINE ENGAGED" and answers from the card index instead.
- Requests are limited to the allowed origins, 13 turns of at most 600
  characters, and 300 tokens per answer. For stricter limits, add a
  Cloudflare rate-limiting rule on the Worker's route.
- Questions sent through the free tier may be used by Google to improve its
  models; N.I.G.E.L. only ever sends the public portfolio facts and the
  visitor's questions.
