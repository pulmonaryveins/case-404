## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Performance guard

- After editing `src/experience/**`, `public/models/**`, lighting, materials or textures, run the `perf-guardian` agent (`.claude/agents/perf-guardian.md`) and `npm run perf:check` before committing.
- Never run thousands of canvas ops inside `ctx.clip()` (this once caused a ~109s load). Never use `gl.compileAsync`.
- Hero textures (desk, board, dossier, floor, wall) stay at 2048px; do not downscale them to chase load time.
