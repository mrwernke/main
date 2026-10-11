# AGENTS.md

## Project Context

This repository is the home for Wernke's math resources site. It contains several
subprojects:

- `main-site/`: the homepage served at the site root.
- `math-applets/`: standalone static math applets (no build step).
- `sat-math-prep/`: the SAT Math Prep app (development currently paused).

Treat it as user-owned application code, keep changes focused on the user's
request, and preserve existing project conventions.

Start with `readme.md` for local setup and publish workflow.

## Key Files

- `main-site/index.html`: homepage with unit/skill dropdowns and applet directory.
- `math-applets/quadratic-graphing/`: shared stylesheet, number parser, and confetti module reused by several other applets.
- `.github/workflows/deploy-pages.yml`: assembles and deploys the whole site to GitHub Pages.
- `sat-math-prep/`: SAT Math Prep frontend project (standalone Vite + React app, development paused).
- `sat-math-prep/src/api/apiClient.js`: frontend API/local data client.
- `sat-math-prep/vite.config.js`: Vite configuration.

## Working Notes

- The math applets and main site are plain static files; preview them by serving the repository root with any static HTTP server.
- Applet model tests run with `node --test math-applets/<applet>/model.test.mjs`.
- SAT Math Prep model tests run with `node --test sat-math-prep/src/api/localDataStore.test.js`.
- In `sat-math-prep`, run `npm run dev` to launch the local Vite development server.
- Run relevant checks from `sat-math-prep/package.json` before finishing changes to that project.
