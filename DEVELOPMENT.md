# Development Tooling

Dev/agent tools only. Not runtime deps of CASE 404 website.

## Ponytail

- Purpose: YAGNI enforcer — minimal architecture, reuse before invention, native before dependency, fewer abstractions, root-cause fixes.
- Installed: `claude plugin install ponytail@ponytail` (user scope). Enabled.
- Use at: FULL.
- Runtime impact: none. Does not override explicit CASE 404 requirements (a11y, reduced motion, asset optimization, responsive architecture, WebGL fallback, type safety, error handling, perf safeguards, licensing/attribution).
- When Claude should use it: every scaffolding/implementation decision, per skill precedence order in project instructions.

## Graphify

- Purpose: codebase knowledge graph — query relationships instead of raw grep/browse. Grows useful as CASE 404 gains R3F components, model manifests, world/camera anchors, StoryController, GSAP timelines, Zustand state.
- Installed: `pip install --user graphifyy` (Python 3.14, user site-packages). CLI: `graphify`.
- Configured: `graphify claude install` wrote a `## graphify` section to CLAUDE.md and registered PreToolUse hooks (Bash|Grep search + Read/Glob) in `.claude/settings.json`.
- Runtime impact: none (Python CLI, not in npm package.json, not bundled).
- No graph built yet (`graphify-out/` doesn't exist) — nothing to graph in an empty repo. Build after initial scaffold exists, or when doing a major refactor.

## Addy Osmani Agent Skills

- Status: **unavailable**, not installed.
- Reason: `/plugin install agent-skills@addy-agent-skills` requires `git@github.com` SSH clone of the plugin repo; no SSH key/credentials configured for this account. Marketplace add succeeded (HTTPS fallback), but plugin install itself has no HTTPS fallback and failed with `Permission denied (publickey)`.
- Not worked around — no credentials were created/requested per instructions.
- If the user configures a GitHub SSH key later, retry: `claude plugin install agent-skills@addy-agent-skills`, then select only frontend/React/TS/perf/a11y/debugging skills relevant to CASE 404 (smallest useful set), not all 25.

## OmniRoute

- Status: **intentionally skipped**, not installed.
- Reason: unnecessary for CASE 404 — it's a model-routing/AI-gateway proxy, not a web-dev tool, and would change Claude Code's model-routing infrastructure project-wide for no benefit to a React/R3F scaffold.
- Not configured: no API providers, no credentials, no model/provider config changes were made.
