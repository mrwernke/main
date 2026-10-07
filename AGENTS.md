# AGENTS.md

## Project Context

This repository is the home for Wernke's math resources site. It contains several
subprojects:

- `main-site/`: the homepage served at the site root.
- `math-applets/`: standalone static math applets (no build step).
- `sat-math-prep/`: the SAT Math Prep app, a Base44 project whose development is
  currently paused.

Treat it as user-owned application code, keep changes focused on the user's
request, and preserve existing project conventions.

Start with `readme.md` for local setup, environment variables, and publish workflow.

## Base44 References (sat-math-prep only)

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `main-site/index.html`: homepage with unit/skill dropdowns and applet directory.
- `math-applets/quadratic-graphing/`: shared stylesheet, number parser, and confetti module reused by several other applets.
- `.github/workflows/deploy-pages.yml`: assembles and deploys the whole site to GitHub Pages.
- `sat-math-prep/`: SAT Math Prep frontend project (Base44, paused).
- `sat-math-prep/src/api/base44Client.js`: frontend Base44 SDK client.
- `sat-math-prep/vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- The math applets and main site are plain static files; preview them by serving the repository root with any static HTTP server.
- Applet model tests run with `node --test math-applets/<applet>/model.test.mjs`.
- For `sat-math-prep`, use `base44 dev` as the default local development command when you need the local Base44 backend. It can run the backend and frontend together.
- When docs or code mention the frontend being started automatically, that usually means the Base44 project config includes `site.serveCommand`, for example `"serveCommand": "npm run dev"` in `base44/config.jsonc`.
- In `sat-math-prep`, use `npm run dev` only for frontend-only work against the hosted Base44 backend.
- Prefer the existing Base44 CLI workflow over adding new npm scripts for Base44-specific tasks.
- Reuse the existing SDK client and Vite plugin patterns before adding new Base44 integration paths.
- Run the relevant checks from `sat-math-prep/package.json` before finishing changes to that project.
